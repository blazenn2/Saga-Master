import { Router } from 'express';
import { orchestrate } from "../controller/orchestrate";
import { deleteSetup, getSetup, setSetup, updateSetup } from "../controller/setup"

const router = Router();


// Routes of performing orchestrator
router.post('/trigger/:url', orchestrate);

// Routes of setup of orchestrator
router.post("/setup", setSetup);
router.put("/setup/:url", updateSetup);
router.delete("/setup/:url", deleteSetup);
router.get("/setup", getSetup);


export { router as orchestrateRouter };