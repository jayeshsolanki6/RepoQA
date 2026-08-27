import { redisConnection } from "./connection.js";

export const redisPublisher = redisConnection.duplicate();
export const redisSubscriber = redisConnection.duplicate();