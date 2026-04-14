import amqp from "amqplib";

let channel;

export const WORK_QUEUES = {
    GITHUB_SYNC: "github_sync_queue",
    GEMINI_NOTES: "gemini_notes_queue"
};

export const RETRY_DELAYS_MS = [5000, 30000, 120000, 600000];

const DLX_NAME = "dlx_exchange";
const DLQ_NAME = "dead_letter_queue";
const FAILED_ROUTING_KEY = "failed_jobs";

export const getRetryQueueName = (queueName, retryAttempt) => `${queueName}.retry.${retryAttempt}`;

export const assertQueueTopology = async (targetChannel) => {
    await targetChannel.assertExchange(DLX_NAME, "direct", { durable: true });
    await targetChannel.assertQueue(DLQ_NAME, { durable: true });
    await targetChannel.bindQueue(DLQ_NAME, DLX_NAME, FAILED_ROUTING_KEY);

    const baseQueueOptions = {
        durable: true,
        deadLetterExchange: DLX_NAME,
        deadLetterRoutingKey: FAILED_ROUTING_KEY
    };

    for (const queueName of Object.values(WORK_QUEUES)) {
        await targetChannel.assertQueue(queueName, baseQueueOptions);

        for (let index = 0; index < RETRY_DELAYS_MS.length; index++) {
            const retryAttempt = index + 1;
            const retryQueueName = getRetryQueueName(queueName, retryAttempt);

            await targetChannel.assertQueue(retryQueueName, {
                durable: true,
                messageTtl: RETRY_DELAYS_MS[index],
                deadLetterExchange: "",
                deadLetterRoutingKey: queueName
            });
        }
    }
};

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URI);
        channel = await connection.createChannel();

        await assertQueueTopology(channel);

        console.log("Connected to RabbitMQ. DLQ and Queues asserted successfully.");

    } catch (error) {
        console.error(`RabbitMQ connection error: ${error}`);
        process.exit(1);
    }
};

export const publishToQueue = async (queueName, data) => {
    try {
        if(!channel) throw new Error("RabbitMQ channel is not initialized.");

        const messageBuffer = Buffer.from(JSON.stringify(data));
        
        channel.sendToQueue(queueName,messageBuffer,{persistent:true});
        console.log(`Message published to ${queueName}:`, data);
    } catch (error) {
        console.error(`Error publishing message to ${queueName}: ${error}`);
        throw error;
    }
};

export const publishRetryMessage = async (queueName, data, retryAttempt, headers = {}) => {
    if (!channel) throw new Error("RabbitMQ channel is not initialized.");

    const retryQueueName = getRetryQueueName(queueName, retryAttempt);
    const messageBuffer = Buffer.from(JSON.stringify(data));

    channel.sendToQueue(retryQueueName, messageBuffer, {
        persistent: true,
        headers: {
            ...headers,
            "x-retry-count": retryAttempt
        }
    });
};