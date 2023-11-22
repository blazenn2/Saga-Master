import { Request, Response, NextFunction } from "express"
// import axios from "axios";

const servicesState = [
   { service: "order", isSuccess: true, response: { customerId: 36051260, paymentAmount: 97.01 }}, 
   { service: "inventory", isSuccess: true, response: { customerId: 36051260, paymentAmount: 97.01 }}, 
   { service: "payment", isSuccess: false, response: null }
]

const temp: any = [];

const orchestrate = async (req: Request, res:Response, next:NextFunction) => {
   try {
      // API fetching request
      temp.push(1);
      throw new Error("Failed API call! Compensate rollback")
   } catch (err) {
      console.log("🚀 ~ file: orchestrate.ts:15 ~ orchestrate ~ err:", err)
      try {
         const rollbackService = servicesState.filter(service => service?.isSuccess);
         for (let i = 0; i < rollbackService.length; i++) {
            const successService: any = rollbackService[i];
            console.log("rollback for service: ", successService?.service);
            throw new Error("Compensate rollback also failed")
         };
      } catch (err) {
      console.log("🚀 ~ file: orchestrate.ts:24 ~ orchestrate ~ err:", err)

      }
   }
   console.log("🚀 ~ file: orchestrate.ts:11 ~ temp:", temp)
   res.status(200).json("Done")

}

export { orchestrate };