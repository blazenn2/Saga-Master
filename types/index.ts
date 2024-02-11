import { API_TYPE, COMMUNICATION_TYPE } from "../utils/enum";

export interface QueryParameter {
    key: string;
    value: string;
}

export interface SagaSetupData {
    communicateType: COMMUNICATION_TYPE,
    apiType: API_TYPE,
    apiUrl: string,
    compensateApiUrl?: string,
    compensateApiType?: API_TYPE,
    compensatePathVariable?: string,
    compensateQueryParameter?: QueryParameter[],
    serviceName: string,
    sendResponseToAPI: Boolean,
    triggerCompensate: Boolean,
    response: any
}