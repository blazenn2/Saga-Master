import { Request, Response, NextFunction } from "express"

const tempData: any = [];

const setSetup = async (req: Request, res:Response, next:NextFunction) => {
    
};

const getSetup = async (req: Request, res:Response, next:NextFunction) => {
    return res.json(tempData);
};

export { tempData, setSetup, getSetup }