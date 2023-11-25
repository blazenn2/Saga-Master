import { Request, Response, NextFunction } from "express"

let tempData: any = [];

const setSetup = async (req: Request, res:Response, next:NextFunction) => {
    if (Array.isArray(req.body) && req.body.length) {
        tempData = req.body?.map(v => ({...v, isSuccess: false, response: {} }));
    } else return res.json("It should be an array of objects boss! D:");
    console.log("🚀 ~ file: setup.ts:7 ~ setSetup ~ req.body:", req.body)
    return res.json("Done boss :D")
};

const getSetup = async (req: Request, res:Response, next:NextFunction) => {
    return res.json(tempData);
};

export { tempData, setSetup, getSetup }