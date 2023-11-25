import { Router } from 'express';
import { compensate } from "../controller/compensate";

const router = Router();

router.post('/trigger', compensate);

export { router as compensateRouter };