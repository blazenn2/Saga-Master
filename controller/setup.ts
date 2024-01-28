import { Request, Response, NextFunction } from "express";

let tempData: any = [];

const exampleObject = [
  {
    communicateType: "REST",
    apiType: "POST",
    apiUrl: "http://localhost:8888/api/examples/post-api",
    compensateApiUrl: "http://localhost:8888/api/compensate/trigger",
    serviceName: "order",
    sendResponseToAPI: false,
    triggerCompensate: true,
  },
  {
    communicateType: "REST",
    apiType: "GET",
    apiUrl: "http://localhost:8888/api/examples/get-api",
    compensateApiUrl: "http://localhost:8888/api/compensate/trigger",
    serviceName: "inventory",
    sendResponseToAPI: false,
    triggerCompensate: true,
  },
  {
    communicateType: "REST",
    apiType: "PUT",
    apiUrl: "http://localhost:8888/api/examples/put-api",
    compensateApiUrl: "http://localhost:8888/api/compensate/trigger",
    serviceName: "payment",
    sendResponseToAPI: false,
    triggerCompensate: true,
  },
  {
    communicateType: "REST",
    apiType: "PUT",
    apiUrl: "http://localhost:8888/api/examples/fail-api",
    compensateApiUrl: "http://localhost:8888/api/compensate/trigger",
    serviceName: "notify",
    sendResponseToAPI: false,
    triggerCompensate: true,
  },
];

const setSetup = async (req: Request, res: Response, next: NextFunction) => {
  if (Array.isArray(req.body) && req.body.length) {
    tempData = req.body?.map((v) => ({ ...v, isSuccess: false, response: {}, triggerCompensate: v?.triggerCompensate ?? true }));
  } else
    return res.json({
      message: "Invalid request. The request body must be an array of objects.",
      example: exampleObject,
    });
  console.log("🚀 ~ file: setup.ts:7 ~ setSetup ~ req.body:", req.body);
  return res.json({
    message: "Setup done successfully!",
    setup: tempData,
  });
};

const getSetup = async (req: Request, res: Response, next: NextFunction) => {
  return res.json(tempData);
};

export { tempData, setSetup, getSetup };
