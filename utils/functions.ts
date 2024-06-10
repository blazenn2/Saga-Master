import { Request, Response } from "express"
import { KafkaPayload, KafkaProducerUtilFunction, SagaKafkaSetupData, SagaRestSetupData } from "../types";
import { LOGGING_EVENT_TYPE } from "./enum";
import { Kafka } from "kafkajs";


export function extractToken (req: Request) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } 
    // else if (req.query && req.query.token) {
    //     return req.query.token;
    // }
    return null;
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



// !TBD: This function needs to a bit more work ... it is a bit complicated atm 

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

export const kafkaConsumer = async (loopData: SagaKafkaSetupData, producerData: KafkaProducerUtilFunction | null, res: Response, responseQueue: any, lengthOfPayload: number, isCompensation?: boolean) => {
    try {
        const { clientId, brokers, consumer : { topic, groupId } } = loopData;
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
                const isSuccess = Boolean(parsedMessage?.success);
                console.log("Is response successfull? ===>", isSuccess);
                if (Number(message.offset) >= Number(latestOffset) + 1) {
                    if (isSuccess) {
                        const response = { [parsedKey]: parsedMessage };
                        console.log("Joined response of the consumer ->", response);
                        responseQueue.push(response);
                    } else {
                        console.error("Exception caught while processing on topic [{" + topic + "}], starting the compensation process!");
                        kafkaConsumerCompensation(res, loopData, responseQueue);
                        consumer.disconnect();
                    }
                    if (producerData !== null) kafkaProducer(producerData?.clientId, producerData?.brokers, producerData?.topic, producerData?.payload);
                    if (responseQueue.length === lengthOfPayload) res.status(200).json(responseQueue);
                }
            }
        });
    } catch (err) {
        console.error("An exception encountered in the Kafka consumer:", err);
        throw new Error("An exception encountered in the Kafka consumer. Please refer to logs for more details.");
    }
}

const kafkaConsumerCompensation = async (res: Response, loopData: SagaKafkaSetupData, responseQueue: any) => {
    try {
        const noOfCompensations = responseQueue.length;
        for (let i = 0; i < noOfCompensations; i++) {
            
        }
    } catch (err) {

    }
}