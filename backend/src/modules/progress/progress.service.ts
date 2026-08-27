import {
    redisPublisher,
    redisSubscriber,
} from "../../queue/redisPubSub.js";

export interface ProgressEvent {
    id: number;
    step: string;
    message: string;
}

const getChannel = (repositoryId: string) =>
    `repository-progress:${repositoryId}`;

const getKey = (repositoryId: string) =>
    `repository-progress:${repositoryId}:events`;

export const publishProgress = async (
    repositoryId: string,
    step: string,
    message: string
) => {
    const key = getKey(repositoryId);

    // Generate an ordered event id
    const id = await redisPublisher.incr(
        `${key}:sequence`
    );

    const event: ProgressEvent = {
        id,
        step,
        message,
    };

    const data = JSON.stringify(event);

    // Store event
    await redisPublisher.rpush(key, data);

    // Keep progress only for 1 hour
    await redisPublisher.expire(key, 3600);
    await redisPublisher.expire(
        `${key}:sequence`,
        3600
    );

    // Publish event for currently connected SSE clients
    await redisPublisher.publish(
        getChannel(repositoryId),
        data
    );
};

export const getProgressHistory = async (
    repositoryId: string
): Promise<ProgressEvent[]> => {
    const events = await redisPublisher.lrange(
        getKey(repositoryId),
        0,
        -1
    );

    return events.map(
        (event) => JSON.parse(event) as ProgressEvent
    );
};

export const subscribeToProgress = async (
    repositoryId: string,
    callback: (event: ProgressEvent) => void
) => {
    const subscriber = redisSubscriber.duplicate();

    const channel = getChannel(repositoryId);

    await subscriber.subscribe(channel);

    subscriber.on("message", (_, message) => {
        const event = JSON.parse(message) as ProgressEvent;

        callback(event);
    });

    return {
        close: async () => {
            await subscriber.unsubscribe(channel);
            await subscriber.quit();
        },
    };
};