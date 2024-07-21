import { Request, Response, NextFunction } from "express";
import { SagaRestSetupData, Setup } from "../types";
import { logging, validateSetupBody } from "../utils/functions";
import { LOGGING_EVENT_TYPE } from "../utils/enum";
import { exampleKafka, exampleRest } from "../utils/constants";

let setupData: Setup[] = [];

const setSetup = async (req: Request, res: Response, next: NextFunction) => {
  const errorMessage = validateSetupBody(req?.body?.setup, req?.body?.url);
  if (errorMessage) return res.status(400).json({
    message: errorMessage,
    exampleOfRest: exampleRest,
    exampleOfKafka: exampleKafka
  })
  const setup = req.body?.setup?.map((v: SagaRestSetupData) => ({ ...v, isSuccess: false, response: {}, triggerCompensate: v?.triggerCompensate ?? true }));
  setupData.unshift({
    url: req.body?.url,
    setup: setup,
  });
  logging(LOGGING_EVENT_TYPE.SETUP, req.body);
  return res.json({
    message: "Setup done successfully!",
    response: setupData,
  });
};

const getSetup = async (req: Request, res: Response, next: NextFunction) => {
  return res.json(setupData);
};

const updateSetup = async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.params;
  const indexOfSetupToBeUpdated = setupData.findIndex((t: any) => t?.url === url); // Remove any when done
  if (indexOfSetupToBeUpdated === -1) return res.status(404).json("The url provided doesn't exist in the system");
  setupData[indexOfSetupToBeUpdated].setup = req.body?.setup?.map((v: SagaRestSetupData) => ({ ...v, isSuccess: false, response: {}, triggerCompensate: v?.triggerCompensate ?? true }));
  return res.status(200).json({
    message: `/${url} setup is updated successfully. Below is the updated setup.`,
    setup: setupData
  })
}

const deleteSetup = async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.params;
  const indexOfDeleteSetup = setupData.findIndex((t: any) => t?.url === url); // Remove any when done
  if (indexOfDeleteSetup === -1) return res.status(404).json("The url provided doesn't exist in the system");
  setupData.splice(indexOfDeleteSetup, 1);
  return res.status(202).json({
    message: `/${url} setup is deleted successfully. Below is the updated setup.`,
    setup: setupData
  })
}

export { setupData, setSetup, getSetup, updateSetup, deleteSetup };
