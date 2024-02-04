import { Request } from "express"
import { SagaSetupData } from "../types";


export function extractToken (req: Request) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } 
    // else if (req.query && req.query.token) {
    //     return req.query.token;
    // }
    return null;
}

export function addPathToUrlFromResponse (loopData: SagaSetupData) {
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
}
