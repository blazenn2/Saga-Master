import { Router } from 'express';
import { example, throwException } from "../controller/example";

const router = Router();

router.post('/post-api', example);
router.get('/get-api', example);
router.put('/put-api', example);
router.post('/fail-api', throwException);

export { router as exampleRouter };