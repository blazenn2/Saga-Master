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
        { key: "create-order", value: JSON.stringify({
            id: 1,
            name: "order",
            classValue: "Just order :D"
        })}
    ]
  });
  console.log("message sent!");
  producer.disconnect();
  console.log("producer disconnected!")
  return res.json("It works");
};

const kafkaConsumerExample = async (req: Request, res: Response) => {
  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9092"],
  });
  const admin = kafka.admin()
  const consumer = kafka.consumer({ groupId: "kafka" });

  await consumer.connect();
  await consumer.subscribe({ topic: "saga-events", fromBeginning: false });
  const recentOffset = await admin.fetchTopicOffsets("saga-events");
  console.log("🚀 ~ First time ~ recentOffset:", recentOffset)
  await consumer.run({
    eachMessage: async ({ partition, message }) => {
        console.log("In eachMessage");
        const parsedMessage = await JSON.parse(message?.value?.toString() as string);
        console.log({partition, offset: message.offset, key: message?.key?.toString(), value: parsedMessage});
        console.log("🚀 ~ eachMessage ~ recentOffset:", recentOffset)
        if (recentOffset[0].offset === message.offset) {
          console.log("Offsets are matched! This mean this is probably the latest message recorded!")
          console.log("disconnecting consumer");
          await consumer.disconnect();
          console.log("Consumer disconnected")
        }
    }
  })
  // await consumer.disconnect();
  return res.json("It works");
};

export { example, throwException, kafkaProducerExample, kafkaConsumerExample };