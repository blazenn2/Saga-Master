import { Request, Response, NextFunction } from "express"

const compensate = async (req: Request, res:Response, next:NextFunction) => {
    console.log("🚀 ~ file: compensate.ts:4 ~ compensate ~ req:", req.body)
    return res.json("Compensation Triggered!");
};

export { compensate };