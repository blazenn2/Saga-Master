import { API_TYPE, COMMUNICATION_TYPE } from "../utils/enum";

export interface QueryParameter {
  key: string;
  value: string;
}

export type KafkaProducerUtilFunction = {
  clientId: string;
  brokers: string[];
  topic: string;
  payload: KafkaPayload[];
};

export type KakfaProducer = {
  topic: string;
  messages: KafkaPayload[];
};

export type KafkaConsumer = {
  topic: string;
  fromBeginning: boolean;
  triggerCompensate: any;
  groupId: string;
};

export interface SagaKafkaSetupData {
  communicateType: COMMUNICATION_TYPE.KAFKA;
  clientId: string;
  brokers: string[];
  serviceName: string;
  producer: KakfaProducer;
  consumer: KafkaConsumer;
  compensateProducer: KakfaProducer;
  compensateConsumer: KafkaConsumer;
  successResponse: any;
}

export interface SagaRestSetupData {
  communicateType: COMMUNICATION_TYPE.REST;
  apiType: API_TYPE;
  apiUrl: string;
  compensateApiUrl?: string;
  compensateApiType?: API_TYPE;
  compensatePathVariable?: string;
  compensateQueryParameter?: QueryParameter[];
  serviceName: string;
  sendResponseToAPI: Boolean;
  triggerCompensate: Boolean;
  response: any;
  isSuccess?: boolean;
}

export interface Setup {
  url: string;
  setup: SagaRestSetupData[] | SagaKafkaSetupData[];
}

export interface SearchParamOptions {
  categories: string;
  code: string;
  type: string;
  name: string;
  shop_id: string;
  is_approved: boolean;
  tracking_number: string;
  notice: string;
}

export interface KafkaPayload {
  key: string;
  value: any;
}
