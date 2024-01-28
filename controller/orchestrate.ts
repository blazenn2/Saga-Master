import { Request, Response } from "express"
import { tempData } from "./setup";
import { extractToken } from "../utils/functions";
import { API_TYPE, COMMUNICATION_TYPE } from "../utils/enum";
import { HttpClient } from "../utils/http-client";

const orchestrate = async (req: Request, res:Response) => {
   if (tempData?.length <= 0) return res.status(404).json("You setup the orchestrate in order to trigger a transaction.")
   const token = extractToken(req);
   const bodyData = req.body;
   const sagaManagerData = [];
   try {
      for (let i = 0; i < tempData.length; i++) {
         const loopData = tempData[i];
         console.log("🚀 ~ Accessing data from setup:", loopData)
         if (loopData?.communicateType?.toUpperCase() === COMMUNICATION_TYPE.REST) {
            let responseData = {};
            try {
               if (loopData.apiType.toUpperCase() === API_TYPE.POST) responseData = await HttpClient.post(loopData.apiUrl, token, bodyData);
               if (loopData.apiType.toUpperCase() === API_TYPE.GET) responseData = await HttpClient.get(loopData.apiUrl, token);
               if (loopData.apiType.toUpperCase() === API_TYPE.PUT) responseData = await HttpClient.put(loopData.apiUrl, token, bodyData);
               if (loopData.apiType.toUpperCase() === API_TYPE.DELETE) responseData = await HttpClient.delete(loopData.apiUrl, token);
               const finalData = { ...loopData, response: responseData, isSuccess: true };
               sagaManagerData.push(finalData);
            } catch (e) {
               if (!loopData?.triggerCompensate) {
                  const finalData = { ...loopData, response: e, isSuccess: false };
                  sagaManagerData.push(finalData);
               } else {
                  throw new Error("Exception caught while processing on service" + loopData?.serviceName);
               }
            }
         }
      }
      const responseMessage = sagaManagerData.find(s => !s?.isSuccess) ? "Not all transactions were successful but no rollbacks were made." : "All transactions were successful";
      return res.json({ message: responseMessage, responses: sagaManagerData });
   } catch (err) {
      try {
         const rollbackResponses = [];
         for (let i = 0; i < sagaManagerData.length; i++) {
            const successService: any = sagaManagerData[i];
            if (successService?.compensateApiUrl) {
               console.log("🚀 ~ Commencing rollback on service: ", successService?.serviceName);
               const responseOfRollbackService = await HttpClient.post(successService?.compensateApiUrl, token, successService?.responseData);
               rollbackResponses.push({...successService, isRollbackSuccessful: true, rollbackResponse: responseOfRollbackService });
            }
         };

         return res.json({ message: `${tempData[rollbackResponses.length]?.serviceName?.toUpperCase()} service failed. Rollbacks on successfull transactions went successfull.`, responses: [...rollbackResponses, ...tempData.slice(rollbackResponses.length) ] });
      } catch (err) {
         console.log("🚀 ~ Recieved error on commencing rollback");
         return res.json({ message: "Recieved error on commencing rollback.", error: err });
      }
   }
}

export { orchestrate };