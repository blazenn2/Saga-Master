import { Request, Response } from "express"
import { KafkaPayload, KafkaProducerUtilFunction, SagaKafkaSetupData, SagaRestSetupData } from "../types";
import { API_TYPE, COMMUNICATION_TYPE, LOGGING_EVENT_TYPE } from "./enum";
import { Kafka } from "kafkajs";
import { setupData } from "../controller/setup";


export function extractToken (req: Request) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } 
    // else if (req.query && req.query.token) {
    //     return req.query.token;
    // }
    return null;
}

export function validateSetupBody(setupBody: SagaRestSetupData[] | SagaKafkaSetupData[], url: string): string {
    const { KAFKA, REST } = COMMUNICATION_TYPE;
    // Check if url is not dublicated
    if (setupData.some(setup => setup.url === url)) return "A setup has already been created with this url. Please use a unique url for this setup.";
    if (Array.isArray(setupBody) && setupBody.length > 0) {
        let errorMessage = "";
        let communicationType: undefined | COMMUNICATION_TYPE = undefined;
        for (let i = 0; i < setupBody.length; i++) {
            const setupBodyItem = setupBody[i];
            if (!communicationType) communicationType = setupBodyItem.communicateType; 
            // Validate the communication type in the setup to ensure communication type consistency.
            if (communicationType !== setupBodyItem.communicateType || !communicationType) {
                errorMessage = "Communicate type mismatched or missing! Saga Master currently doesn't support multiple communication type for a single orchestration process.";
                break;
            }
            // Setup validation for KAFKA communication type
            if (communicationType === KAFKA) {
                const { clientId = '', brokers = [], producer: { topic: producerTopic = '' } = {}, serviceName = '', consumer: { topic: consumerTopic = '', groupId = '' } = {}, compensateProducer: { topic: compensateProducerTopic = '' } = {}, compensateConsumer: { topic: compensateConsumerTopic = '', groupId: compensateConsumerGroupId = '' } = {}  } = setupBodyItem as SagaKafkaSetupData || {};                const objectMapper: {[key: string]: string | string[]} = { clientId, brokers, serviceName, producerTopic, consumerTopic, groupId, compensateProducerTopic, compensateConsumerGroupId, compensateConsumerTopic };
                const errorKeys = Object.keys(objectMapper).filter((item) => objectMapper[item] === undefined || objectMapper[item] === "");
                if (Array.isArray(errorKeys) && errorKeys.length > 0) {
                  errorMessage = `${errorKeys.toLocaleString()} value/values are invalid on setup index ${i}`;
                  break;
                }
            }
            // Setup validation for REST communication type
            else if (communicationType === REST) {
                const { apiType = '', apiUrl = '', compensateApiUrl = '', compensateApiType = '', serviceName = '', triggerCompensate = ''  } = setupBodyItem as SagaRestSetupData;
                const objectMapper: {[key: string]: string | API_TYPE | Boolean } = { apiType, apiUrl, serviceName, triggerCompensate, ...(triggerCompensate ? { compensateApiUrl, compensateApiType } : {}) };
                const errorKeys = Object.keys(objectMapper).filter((item) => objectMapper[item] === undefined || objectMapper[item] === '');
                if (Array.isArray(errorKeys) && errorKeys.length > 0) {
                  errorMessage = `${errorKeys.toLocaleString()} value/values are invalid on setup index ${i}`;
                  break;
                }
            }
        };
        return errorMessage;
    } else {
        return "Invalid request.";
    }
}

export function addPathAndQueryToUrlFromResponse (loopData: SagaRestSetupData) {
    if (!loopData.compensateApiUrl) return "";
    const originalUrl = loopData.compensateApiUrl;
    if (!loopData?.compensatePathVariable) return originalUrl;
    let getPathVariable = "";
    if (Array.isArray(loopData?.response)) {
        const findPathVariableInArray = loopData?.response?.find(r => Object.keys(r).includes(loopData?.compensatePathVariable as string));
        if (findPathVariableInArray?.length) getPathVariable = findPathVariableInArray[loopData?.compensatePathVariable];
    } else {
        getPathVariable = loopData?.response[loopData?.compensatePathVariable];
    }
    if (!getPathVariable?.toString()?.length) return originalUrl;
    return `${originalUrl}/${getPathVariable}`; // Creates URL with the path variable
    //     let newUrl = `${originalUrl}/${getPathVariable}`; // Creates URL with the path variable
    //     if (loopData?.compensateQueryParameter?.length) newUrl = addQueryParamsToUrlFromResponse(loopData, newUrl);
    //     return newUrl;
}

const destructureConsumerConfig = (loopData: SagaKafkaSetupData, isCompensation?: Boolean) => {
    if (isCompensation) {
        const { clientId, brokers, compensateConsumer : { topic, groupId } } = loopData
        return { clientId, brokers, topic, groupId };
    } else {
        const { clientId, brokers, consumer : { topic, groupId } } = loopData
        return { clientId, brokers, topic, groupId };
    }
}


// TODO: This function needs to a bit more work ... it is a bit complicated atm 

// export function addQueryParamsToUrlFromResponse(loopData: SagaRestSetupData, url: string) {
//     if (!loopData.compensateApiUrl) return "";
//     const originalUrl = url;
//     if (!loopData?.compensateQueryParameter?.length) return originalUrl;
//     let newUrl = originalUrl;
//     loopData?.compensateQueryParameter?.forEach((p: QueryParameter, i: number) => {
//         const response = loopData?.response;
//         let queryKey = loopData?.response?.find((r: any) => Object.keys(r).includes(p?.key as string));
//         let queryValue = undefined;
//         if (Array.isArray(loopData?.response)) {
//             const findQueryKeyInArray = loopData?.response?.find((r: any) => Object.keys(r).includes(p?.key as string));
//             if (findQueryKeyInArray?.length) queryKey = findQueryKeyInArray[loopData?.compensateQueryParameter];
//         } else {
//             getPathVariable = loopData?.response[loopData?.compensatePathVariable];
//         }


//         if (i === 0) newUrl = `${originalUrl}?${queryKey}=${p.value}`;
//         else newUrl = newUrl + `&${queryKey}=${p.value}`;
//     });
//     return newUrl;
// }

export const logging = (event: LOGGING_EVENT_TYPE, data?: any, loopCounter?: number) => {
    if (event === LOGGING_EVENT_TYPE.SETUP) console.log("🚀 ~ Setting up orchestrate data:", data);
    if (event === LOGGING_EVENT_TYPE.START) console.log(`🚀 ~ Orchestration process started at ${(new Date()).toLocaleDateString()}`);
    if (event === LOGGING_EVENT_TYPE.REST_LOOP_IN_PROCESS && loopCounter !== undefined) {
       console.log(`====================================================`);
       console.log(`🚀 ~ Orchestration in progress ======> Starting transaction on ${data.serviceName} >>> Accessing ${loopCounter + 1} in queue <<<`);
       console.log("🚀 ~ Accessing data from setup:", data);
    };
    if (event === LOGGING_EVENT_TYPE.REST_LOOP_SUCCESSFUL && loopCounter !== undefined) console.log(`🚀 ~ Transaction No.${loopCounter + 1} was successfull`);
    if (event === LOGGING_EVENT_TYPE.REST_SUCCESSFUL) console.log(`🚀 ~ Orchestration process has been successful and ended at ${(new Date()).toLocaleDateString()}`);
    if (event === LOGGING_EVENT_TYPE.REST_LOOP_COMPENSATION_START) {
       console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
       console.log(`🚀 ~ ${data?.err}, orchestration of rollbacks in progress. Commence rollback against this data =====>`, data?.sagaManagerData)
       console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    }
    if (event === LOGGING_EVENT_TYPE.REST_LOOP_COMPENSATION_IN_PROGRESS) {
       console.log("🚀 ~ Commencing rollback on service -|", data?.serviceName, " |");
       console.log("🚀 ~ Rollback Data =====> ", data?.response);
    }
    if (event === LOGGING_EVENT_TYPE.REST_FAILED) {
       console.log("🚀 ~ Recieved error on commencing rollback");
       console.log(`🚀 ~ Orchestration process has been failed and ended at ${(new Date()).toLocaleDateString()}`);
    }
};

const connectKafka = (clientId: string, brokers: string[]) => new Kafka({
    clientId: clientId,
    brokers: brokers,
});

export const kafkaProducer = async (clientId: string, brokers: string[], topic: string, payload: KafkaPayload | KafkaPayload[]) => {
    try {
        const kafka = connectKafka(clientId, brokers);
        const producer = kafka.producer();
        await producer.connect();
        const kafkaMessage = Array.isArray(payload) ? payload : [payload];
        await producer.send({
            topic: topic,
            messages: kafkaMessage.map(p => ({...p, value: JSON.stringify(p)}))
        });
        console.log(`Message sent successfully to the ${topic}`);
        producer.disconnect();
    } catch (err) {
        console.error("An exception encountered in the kafka producer:", err);
        throw new Error("An exception encountered in the Kafka producer. Please refer to logs for more details.");
    }
};

export const kafkaConsumer = async (loopData: SagaKafkaSetupData, producerData: KafkaProducerUtilFunction | null, res: Response, responseQueue: any, lengthOfPayload: number, orchestrateData:SagaKafkaSetupData[], bodyData: any, isCompensation?: boolean) => {
    try {
        if (isCompensation) console.log("🚀 ~ kafkaConsumer ~ isCompensation:", isCompensation)
        const { clientId, brokers, topic, groupId } = destructureConsumerConfig(loopData, isCompensation);
        console.log("🚀 ~ kafkaConsumer ~ clientId, brokers, topic, groupId:", clientId, brokers, topic, groupId)
        const kafka = connectKafka(clientId, brokers);
        const admin = kafka.admin();
        const consumer = kafka.consumer({ groupId: groupId });
        const recentOffset = await admin.fetchTopicOffsets(topic);
        const latestOffset = recentOffset?.[0]?.offset;
        await consumer.connect();
        await consumer.subscribe({ topic: topic, fromBeginning: false });
        await consumer.run({
            eachMessage: async ({ partition, message }) => {
                const parsedMessage = await JSON.parse(message?.value?.toString() as string);
                const parsedKey =  message?.key?.toString() ?? 'unparsableKey';
                console.log(`Message received from ${topic}`);
                console.log("Message key -> ", parsedKey);
                console.log("Message value ->", parsedMessage);
                const isSuccess = parsedMessage?.success;
                console.log(`Is response successfull? ${isCompensation} ===>`, isSuccess);
                if (Number(message.offset) >= Number(latestOffset) + 1) {
                    if (isSuccess === true) {
                        const response = { [parsedKey]: parsedMessage };
                        console.log("Joined response of the consumer ->", response);
                        responseQueue.push(response);
                        console.log("🚀 ~ kafkaConsumer ~ producerData:", producerData)
                        if (producerData) {
                            const { clientId, brokers, topic, payload } = producerData;
                            await kafkaProducer(clientId, brokers, topic, payload);
                        }
                        if (responseQueue.length === lengthOfPayload) res.status(200).json(responseQueue);
                    } else if (isSuccess === false && !isCompensation) {
                        console.error("Exception caught while processing on topic [{" + topic + "}], starting the compensation process!");
                        kafkaConsumerCompensation(res, responseQueue, orchestrateData, bodyData);
                    } else if (isSuccess !== undefined) {
                        res.status(500).json({ error: "Failed to compensate, please refer to logs."})
                    }
                }
            }
        });
    } catch (err) {
        console.error("An exception encountered in the Kafka consumer:", err);
        throw new Error("An exception encountered in the Kafka consumer. Please refer to logs for more details.");
    }
}

const kafkaConsumerCompensation = async (res: Response, responseQueue: any, orchestrateData:SagaKafkaSetupData[], bodyData: KafkaPayload[]) => {
    try {
        const noOfCompensations = responseQueue.length;
        const responseArray: boolean[] = [];
        for (let i = 0; i < noOfCompensations; i++) {
            const compensateLoopData = orchestrateData[i];
            let nextProducerData: KafkaProducerUtilFunction | null = null;
            const isLastOfArray = i === noOfCompensations - 1;
            if (!isLastOfArray) {
               const nextProducerDataInOrchestrateData = (orchestrateData[i + 1] as SagaKafkaSetupData);
               nextProducerData = {
                  clientId: nextProducerDataInOrchestrateData?.clientId,
                  brokers: nextProducerDataInOrchestrateData?.brokers,
                  topic: nextProducerDataInOrchestrateData?.producer?.topic,
                  payload: bodyData
               }
            }
            console.log("Attaching compensation kafka event with topic: ", compensateLoopData?.compensateConsumer?.topic);
            console.log("🚀 ~~~ kafkaConsumerCompensation ~ compensateLoopData:", compensateLoopData)
            await kafkaConsumer(compensateLoopData, nextProducerData, res, responseArray, noOfCompensations, orchestrateData, bodyData, true);
            if (isLastOfArray) {
                await kafkaProducer(compensateLoopData?.clientId, compensateLoopData?.brokers, compensateLoopData?.compensateConsumer?.topic, bodyData);
            }
        }
    } catch (err) {
        console.error(err);
    }
}


