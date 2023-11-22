import { Router } from 'express';
import { orchestrate } from "../controller/orchestrate";
import { getSetup, setSetup } from "../controller/setup"

const router = Router();


router.post('/trigger', orchestrate);
router.post("/setup", setSetup);
router.get("/setup", getSetup);


export { router as orchestrateRouter };