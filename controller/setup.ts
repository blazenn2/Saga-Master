import { Request, Response, NextFunction } from "express"

let tempData: any = [];

const setSetup = async (req: Request, res:Response, next:NextFunction) => {
    if (Array.isArray(req.body) && req.body.length) {
        tempData = req.body;
    } 
    console.log("🚀 ~ file: setup.ts:7 ~ setSetup ~ req.body:", req.body)
    res.json("Done boss :D")
};

const getSetup = async (req: Request, res:Response, next:NextFunction) => {
    return res.json(tempData);
};

export { tempData, setSetup, getSetup }