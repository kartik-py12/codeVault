import amqp from "amqplib";

let channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URI);
        channel = await connection.createChannel();

        await channel.assertQueue("github_sync_queue",{durable:true});

        console.log("Connected to RabbitMQ and channel created.");

    } catch (error) {
        console.error(`RabbitMQ connection error: ${error}`);
        process.exit(1);
    }
};

export const publistToQueue = async (queueName, data) => {
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