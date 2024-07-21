export const exampleRest = [
  {
    communicateType: "REST",
    apiType: "POST",
    apiUrl: "http://localhost:8080/api/invoices",
    compensateApiUrl: "http://localhost:8080/api/invoices",
    compensateApiType: "DELETE",
    compensatePathVariable: "id",
    serviceName: "order",
    sendResponseToAPI: false,
    triggerCompensate: true,
  },
  {
    communicateType: "REST",
    apiType: "POST",
    apiUrl: "http://localhost:8000/api/products",
    compensateApiUrl: "http://localhost:8000/api/products",
    compensateApiType: "DELETE",
    compensatePathVariable: "id",
    serviceName: "inventory",
    sendResponseToAPI: true,
    triggerCompensate: true,
  },
  {
    communicateType: "REST",
    apiType: "POST",
    apiUrl: "http://localhost/payment-php/create-payment.php",
    compensateApiUrl:
      "http://localhost/payment-php/create-payment-rollback.php",
    compensateApiType: "POST",
    compensatePathVariable: "paymentId",
    serviceName: "payment",
    sendResponseToAPI: true,
    triggerCompensate: true,
  },
  {
    communicateType: "REST",
    apiType: "POST",
    apiUrl: "http://localhost:8089/notifications",
    compensateApiUrl: "",
    serviceName: "notify",
    sendResponseToAPI: true,
    triggerCompensate: false,
  },
];

export const exampleKafka = [
  {
    communicateType: "KAFKA",
    clientId: "my-app",
    brokers: ["localhost:9092"],
    serviceName: "order",
    producer: {
      topic: "saga-events",
    },
    consumer: {
      topic: "saga-events",
      fromBeginning: false,
      groupId: "my-group",
    },
    compensateProducer: {
      topic: "compensate-saga-events",
    },
    compensateConsumer: {
      topic: "compensate-saga-events",
      fromBeginning: false,
      groupId: "my-group-1",
    },
  },
  {
    communicateType: "KAFKA",
    clientId: "my-app",
    serviceName: "Inventory",
    brokers: ["localhost:9092"],
    producer: {
      topic: "saga-events",
    },
    consumer: {
      topic: "saga-events",
      fromBeginning: false,
      groupId: "my-group",
    },
    compensateProducer: {
      topic: "compensate-saga-events",
    },
    compensateConsumer: {
      topic: "compensate-saga-events",
      fromBeginning: false,
      groupId: "my-group-1",
    },
  },
];
