import { Request, Response, NextFunction } from "express";
import { Kafka } from "kafkajs";

const example = async (req: Request, res: Response, next: NextFunction) => {
  console.log("🚀 ~ file: example.ts:4 ~ example ~ req:", req.body);
  return res.json("It works");
};

const throwException = async (req: Request, res: Response) => {
  throw new Error("This is a test error exception for saga orchestration.");
};

const kafkaProducerExample = async (req: Request, res: Response) => {
  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9092"],
  });

  const producer = kafka.producer();
  await producer.connect();
  await producer.send({
    topic: "saga-events",
    messages: [
        { key: "order", value: JSON.stringify({
            id: 1,
            name: "order",
            classValue: "Just order :D"
        })}
    ]
  });
  console.log("message sent!");
  producer.disconnect();
  return res.json("It works");
};

const kafkaConsumerExample = async (req: Request, res: Response) => {
  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9092"],
  });
  const consumer = kafka.consumer({ groupId: "kafka" });

  await consumer.connect();
  await consumer.subscribe({ topic: "saga-events", fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ partition, message }) => {
        console.log("In eachMessage");
        console.log({partition, offset: message.offset, value: message?.value?.toString()});
    }
  })
//   await consumer.disconnect();
  return res.json("It works");
};

export { example, throwException, kafkaProducerExample, kafkaConsumerExample };