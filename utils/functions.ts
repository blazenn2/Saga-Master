import { Request } from "express"
import { SagaSetupData } from "../types";
import { LOGGING_EVENT_TYPE } from "./enum";


export function extractToken (req: Request) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } 
    // else if (req.query && req.query.token) {
    //     return req.query.token;
    // }
    return null;
}

export function addPathAndQueryToUrlFromResponse (loopData: SagaSetupData) {
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

// export function addQueryParamsToUrlFromResponse(loopData: SagaSetupData, url: string) {
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