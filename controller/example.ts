import { Request, Response, NextFunction } from "express"

const example = async (req: Request, res:Response, next:NextFunction) => {
    console.log("🚀 ~ file: example.ts:4 ~ example ~ req:", req.body)
    return res.json("It works")
};

const throwException = async (req: Request, res:Response) => {
    throw new Error("This is a test error exception for saga orchestration.");
}

export { example, throwException };