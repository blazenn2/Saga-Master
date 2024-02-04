import { Request, Response } from "express"
import { tempData } from "./setup";
import { addPathToUrlFromResponse, extractToken } from "../utils/functions";
import { API_TYPE, COMMUNICATION_TYPE } from "../utils/enum";
import { HttpClient } from "../utils/http-client";
import { SagaSetupData } from "../types";

const orchestrate = async (req: Request, res: Response) => {
   if (tempData?.length <= 0) return res.status(404).json("You setup the orchestrate in order to trigger a transaction.")
   console.log(`🚀 ~ Orchestration process started at ${(new Date()).toLocaleDateString()}`);
   const token = extractToken(req);
   const bodyData = req.body;
   const sagaManagerData = [];
   try {
      for (let i = 0; i < tempData.length; i++) {
         const loopData = tempData[i];
         console.log(`====================================================`);
         console.log(`🚀 ~ Orchestration in progress ======> Starting transaction on ${loopData.serviceName} >>> Accessing ${i + 1} in queue <<<`);
         console.log("🚀 ~ Accessing data from setup:", loopData);
         if (loopData?.communicateType?.toUpperCase() === COMMUNICATION_TYPE.REST) {
            let responseData = {};
            try {
               if (loopData.apiType.toUpperCase() === API_TYPE.POST) responseData = await HttpClient.post(loopData.apiUrl, token, bodyData);
               if (loopData.apiType.toUpperCase() === API_TYPE.GET) responseData = await HttpClient.get(loopData.apiUrl, token);
               if (loopData.apiType.toUpperCase() === API_TYPE.PUT) responseData = await HttpClient.put(loopData.apiUrl, token, bodyData);
               if (loopData.apiType.toUpperCase() === API_TYPE.DELETE) responseData = await HttpClient.delete(loopData.apiUrl, token);
               const finalData = { ...loopData, response: responseData, isSuccess: true };
               sagaManagerData.push(finalData);
               console.log(`🚀 ~ Transaction No.${i + 1} was successfull`);
            } catch (e) {
               if (!loopData?.triggerCompensate) {
                  const finalData = { ...loopData, response: e, isSuccess: false };
                  sagaManagerData.push(finalData);
               } else {
                  throw new Error("Exception caught while processing on service " + loopData?.serviceName);
               }
            }
         }
      }
      console.log(`🚀 ~ Orchestration process has been successful and ended at ${(new Date()).toLocaleDateString()}`);
      const responseMessage = sagaManagerData.find(s => !s?.isSuccess) ? "Not all transactions were successful but no rollbacks were made." : "All transactions were successful";
      return res.json({ message: responseMessage, responses: sagaManagerData });
   } catch (err) {
      try {
         const rollbackResponses = [];
         console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
         console.log(`🚀 ~ ${err}, orchestration of rollbacks in progress. Commence rollback against this data =====>`, sagaManagerData)
         console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
         for (let i = 0; i < sagaManagerData.length; i++) {
            console.log(`------------------------------------------------`);
            const successService: SagaSetupData = sagaManagerData[sagaManagerData.length - 1 - i];
            if (successService?.compensateApiUrl) {
               console.log("🚀 ~ Commencing rollback on service -|", successService?.serviceName, " |");
               console.log("🚀 ~ Rollback Data =====> ", successService?.response);
               let responseOfRollbackService;
               // let responseOfRollbackService = await HttpClient.post(successService?.compensateApiUrl, token, successService?.response);
               if (successService?.compensateApiType?.toUpperCase() === API_TYPE.POST) responseOfRollbackService = await HttpClient.post(successService?.compensateApiUrl, token, bodyData);
               if (successService?.compensateApiType?.toUpperCase() === API_TYPE.GET) responseOfRollbackService = await HttpClient.get(successService?.compensateApiUrl, token);
               if (successService?.compensateApiType?.toUpperCase() === API_TYPE.PUT) responseOfRollbackService = await HttpClient.put(addPathToUrlFromResponse(successService), token, bodyData);
               if (successService?.compensateApiType?.toUpperCase() === API_TYPE.DELETE) responseOfRollbackService = await HttpClient.delete(addPathToUrlFromResponse(successService), token);
               rollbackResponses.push({ ...successService, isRollbackSuccessful: true, rollbackResponse: responseOfRollbackService });
            }
         };
         console.log(`🚀 ~ Orchestration process has been successful and ended at ${(new Date()).toLocaleDateString()}`);
         return res.json({ message: `${tempData[rollbackResponses.length]?.serviceName?.toUpperCase()} service failed. Rollbacks on successfull transactions went successfull.`, responses: [...rollbackResponses, ...tempData.slice(rollbackResponses.length)] });
      } catch (err) {
         console.log("🚀 ~ Recieved error on commencing rollback");
         console.log(`🚀 ~ Orchestration process has been failed and ended at ${(new Date()).toLocaleDateString()}`);
         return res.json({ message: "Recieved error on commencing rollback.", error: err });
      }
   }
}

export { orchestrate };