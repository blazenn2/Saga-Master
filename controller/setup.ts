import { Request, Response, NextFunction } from "express";
import { SagaRestSetupData, Setup } from "../types";
// import { SagaRestSetupData } from "../types"; // Remove this too
import { logging } from "../utils/functions";
import { LOGGING_EVENT_TYPE } from "../utils/enum";

let tempData: Setup[] = []; // Hard coding for now
// let tempData: any = [{
//   url: "create-payment-intend",
//   setup: [
//     {
//       communicateType: "KAFKA",
//       clientId: "my-app",
//       brokers: ["localhost:9092"],
//       producers: [  {
//           topic: "orchestration",
//           messages: [{
//             key: "create-order",
//             value: [{
//               id: 1,
//               name: "order",
//               classValue: "Just order :D"
//             },
//             {
//               id: 2,
//               name: "order",
//               classValue: "Just another order :D"
//             }]
//           }]
//         }],
//       consumers: [{
//         topic: "orchestration",
//         fromBeginning: true
//       }]
//     },
//   ]
// }]

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
  if (Array.isArray(req.body?.setup) && req.body?.setup?.length) {
    const setup = req.body?.setup?.map((v: SagaRestSetupData) => ({ ...v, isSuccess: false, response: {}, triggerCompensate: v?.triggerCompensate ?? true }));
    tempData.unshift({
      url: req.body?.url,
      setup: setup,
    })
  } else
    return res.json({
      message: "Invalid request.",
      example: exampleObject,
    });
  logging(LOGGING_EVENT_TYPE.SETUP, req.body);
  return res.json({
    message: "Setup done successfully!",
    response: tempData,
  });
};

const getSetup = async (req: Request, res: Response, next: NextFunction) => {
  return res.json(tempData);
};

const updateSetup = async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.params;
  const indexOfSetupToBeUpdated = tempData.findIndex((t: any) => t?.url === url); // Remove any when done
  if (indexOfSetupToBeUpdated === -1) return res.status(404).json("The url provided doesn't exist in the system");
  tempData[indexOfSetupToBeUpdated].setup = req.body?.setup?.map((v: SagaRestSetupData) => ({ ...v, isSuccess: false, response: {}, triggerCompensate: v?.triggerCompensate ?? true }));
  return res.status(200).json({
    message: `/${url} setup is updated successfully. Below is the updated setup.`,
    setup: tempData
  })
}

const deleteSetup = async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.params;
  const indexOfDeleteSetup = tempData.findIndex((t: any) => t?.url === url); // Remove any when done
  if (indexOfDeleteSetup === -1) return res.status(404).json("The url provided doesn't exist in the system");
  tempData.splice(indexOfDeleteSetup, 1);
  return res.status(202).json({
    message: `/${url} setup is deleted successfully. Below is the updated setup.`,
    setup: tempData
  })
}

export { tempData, setSetup, getSetup, updateSetup, deleteSetup };
