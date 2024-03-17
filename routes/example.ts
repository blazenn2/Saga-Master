import { Router } from 'express';
import { example, kafkaConsumerExample, kafkaProducerExample, throwException } from "../controller/example";

const router = Router();

router.post('/post-api', example);
router.get('/get-api', example);
router.put('/put-api', example);
router.post('/fail-api', throwException);
router.get('/kafka-producer-example', kafkaProducerExample)
router.get('/kafka-consumer-example', kafkaConsumerExample)

export { router as exampleRouter };