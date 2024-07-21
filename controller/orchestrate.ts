import { Request, Response } from "express"
import { setupData } from "./setup";
import { addPathAndQueryToUrlFromResponse, extractToken, kafkaConsumer, kafkaProducer, logging } from "../utils/functions";
import { API_TYPE, COMMUNICATION_TYPE, LOGGING_EVENT_TYPE } from "../utils/enum";
import { HttpClient } from "../utils/http-client";
import { KafkaProducerUtilFunction, SagaKafkaSetupData, SagaRestSetupData } from "../types";

// @ts-ignore
const orchestrate = async (req: Request, res: Response) => {
   const orchestrateData: SagaRestSetupData[] | SagaKafkaSetupData[] = validateOrchestrationBody(req, res);
   logging(LOGGING_EVENT_TYPE.START);
   const token = extractToken(req);
   const bodyData = req.body;
   const sagaManagerData: SagaRestSetupData[] = [];
   const kafkaSuccess: boolean[] = [];
   try {
      for (let i = 0; i < orchestrateData.length; i++) {
         const loopData = orchestrateData[i];
         logging(LOGGING_EVENT_TYPE.REST_LOOP_IN_PROCESS, loopData, i);
         if (loopData?.communicateType?.toUpperCase() === COMMUNICATION_TYPE.REST) {
            await runRestOrchestration(loopData as SagaRestSetupData, token, bodyData, sagaManagerData, i);
         } else if (loopData?.communicateType?.toUpperCase() === COMMUNICATION_TYPE.KAFKA) {
            let nextProducerData: KafkaProducerUtilFunction | null = null;
            const isLastOfArray = i === orchestrateData?.length - 1;
            if (!isLastOfArray) {
               const nextProducerDataInOrchestrateData = (orchestrateData[i + 1] as SagaKafkaSetupData);
               nextProducerData = {
                  clientId: nextProducerDataInOrchestrateData?.clientId,
                  brokers: nextProducerDataInOrchestrateData?.brokers,
                  topic: nextProducerDataInOrchestrateData?.producer?.topic,
                  payload: bodyData
               }
               console.log("🚀 ~ orchestrate ~ nextProducerDataInOrchestrateData:", nextProducerDataInOrchestrateData)
               console.log("🚀 ~ orchestrate ~ nextProducerData:", nextProducerData)
            }
            await runKafkaConsumerOrchestration(loopData as SagaKafkaSetupData, nextProducerData, res, kafkaSuccess, orchestrateData as SagaKafkaSetupData[], bodyData);
            if (isLastOfArray) {
               await runKafkaProducerOrchestration(loopData as SagaKafkaSetupData, bodyData);
            }
         }
      }
      logging(LOGGING_EVENT_TYPE.REST_SUCCESSFUL);
      const responseMessage = sagaManagerData.find(s => !s?.isSuccess) ? "Not all transactions were successful but no rollbacks were made." : "All transactions were successful";
      const isKafka = orchestrateData.find(o => o.communicateType === COMMUNICATION_TYPE.KAFKA)
      if (!isKafka) return res.json({ message: responseMessage, responses: sagaManagerData });
   } catch (err) {
      // Place kafka compensate logic here
      try {
         const rollbackResponses: any[] = [];
         logging(LOGGING_EVENT_TYPE.REST_LOOP_COMPENSATION_START, { sagaManagerData: sagaManagerData, err: err });
         for (let i = 0; i < sagaManagerData.length; i++) {
            await runRestCompensationOrchestration(sagaManagerData, token, bodyData, rollbackResponses, i);
         };
         logging(LOGGING_EVENT_TYPE.REST_SUCCESSFUL);
         return res.json({ message: `${orchestrateData[rollbackResponses.length]?.serviceName?.toUpperCase()} service failed. Rollbacks on successfull transactions went successfull.`, responses: [...rollbackResponses, ...orchestrateData.slice(rollbackResponses.length)] });
      } catch (err) {
         logging(LOGGING_EVENT_TYPE.REST_FAILED);
         return res.json({ message: "Recieved error on commencing rollback.", error: err });
      }
   }
};

const validateOrchestrationBody = (req: Request, res: Response) => {
   const { url } = req.params;
   if (setupData?.length <= 0) {
      res.status(404).json("You need to setup the orchestrate in order to trigger a transaction.")
      return [];
   }
   else {
      let orchestrateData: SagaRestSetupData[] | SagaKafkaSetupData[] = setupData?.find((t: any) => t?.url === url)?.setup ?? [];
      if (!orchestrateData?.length) {
         res.status(404).json(`You need to setup the orchestrate for /${url} in order to trigger a transaction.`)
         return [];
      }
      else return orchestrateData;
   }
}

const runRestOrchestration = async (loopData: SagaRestSetupData, token: string | null, bodyData: any, sagaManagerData: SagaRestSetupData[], i: number) => {
   let responseData = {};
   try {
      if (loopData.apiType.toUpperCase() === API_TYPE.POST) responseData = await HttpClient.post(loopData.apiUrl, token, bodyData);
      if (loopData.apiType.toUpperCase() === API_TYPE.GET) responseData = await HttpClient.get(loopData.apiUrl, token);
      if (loopData.apiType.toUpperCase() === API_TYPE.PUT) responseData = await HttpClient.put(loopData.apiUrl, token, bodyData);
      if (loopData.apiType.toUpperCase() === API_TYPE.DELETE) responseData = await HttpClient.delete(loopData.apiUrl, token);
      const finalData = { ...loopData, response: responseData, isSuccess: true };
      sagaManagerData.push(finalData);
      logging(LOGGING_EVENT_TYPE.REST_LOOP_SUCCESSFUL, null, i);
   } catch (e) {
      if (!loopData?.triggerCompensate) {
         const finalData = { ...loopData, response: e, isSuccess: false };
         sagaManagerData.push(finalData);
      } else {
         throw new Error("Exception caught while processing on service " + loopData?.serviceName);
      }
   }
};

const runRestCompensationOrchestration = async (sagaManagerData: SagaRestSetupData[], token: string | null, bodyData: any, rollbackResponses: any[], i: number) => {
   console.log(`------------------------------------------------`);
   const successService: SagaRestSetupData = sagaManagerData[sagaManagerData.length - 1 - i];
   if (successService?.compensateApiUrl) {
      logging(LOGGING_EVENT_TYPE.REST_LOOP_COMPENSATION_IN_PROGRESS, successService);
      let responseOfRollbackService;
      if (successService?.compensateApiType?.toUpperCase() === API_TYPE.POST) responseOfRollbackService = await HttpClient.post(successService?.compensateApiUrl, token, bodyData);
      if (successService?.compensateApiType?.toUpperCase() === API_TYPE.GET) responseOfRollbackService = await HttpClient.get(successService?.compensateApiUrl, token);
      if (successService?.compensateApiType?.toUpperCase() === API_TYPE.PUT) responseOfRollbackService = await HttpClient.put(addPathAndQueryToUrlFromResponse(successService), token, bodyData);
      if (successService?.compensateApiType?.toUpperCase() === API_TYPE.DELETE) responseOfRollbackService = await HttpClient.delete(addPathAndQueryToUrlFromResponse(successService), token);
      rollbackResponses.push({ ...successService, isRollbackSuccessful: true, rollbackResponse: responseOfRollbackService });
   }
};

const runKafkaConsumerOrchestration = async (loopData: SagaKafkaSetupData, nextProducerData: KafkaProducerUtilFunction | null, res: any, responseArray: any, orchestrateData: SagaKafkaSetupData[], bodyData: any) => {
   const lengthOfPayload = orchestrateData.length;
   await kafkaConsumer(loopData, nextProducerData, res, responseArray, lengthOfPayload, orchestrateData, bodyData);
};

const runKafkaProducerOrchestration = async (loopData: SagaKafkaSetupData, payload: any) => {
   const producerData = loopData?.producer;
   await kafkaProducer(loopData?.clientId as string, loopData?.brokers as string[], producerData?.topic as string, payload);
};

export { orchestrate };