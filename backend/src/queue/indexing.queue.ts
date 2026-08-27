import { Queue } from "bullmq";
import { redisConnection } from "./connection.js";

export const indexingQueue = new Queue(
    "repository-indexing",
    {
        connection: redisConnection,
    }
);