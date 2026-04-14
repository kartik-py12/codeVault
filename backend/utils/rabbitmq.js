import amqp from "amqplib";

let channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URI);
        channel = await connection.createChannel();

        const dlx = "dlx_exchange";
        const dlq = "dead_letter_queue";

        await channel.assertExchange(dlx, "direct", { durable: true });
        await channel.assertQueue(dlq, { durable: true });
        await channel.bindQueue(dlq,dlx,"failed_jobs");

        const queueOptions = {
            durable: true,
            deadLetterExchange: dlx,
            deadLetterRoutingKey: "failed_jobs"
        }

        await channel.assertQueue("github_sync_queue",queueOptions);
        await channel.assertQueue("gemini_notes_queue",queueOptions);

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
}