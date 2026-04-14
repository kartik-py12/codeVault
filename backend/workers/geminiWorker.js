import "dotenv/config";
import amqp from "amqplib";
import connectDB from "../db/connect.js";
import { GoogleGenAI } from "@google/genai";
import submission from "../models/submission.js";
import { RETRY_DELAYS_MS, WORK_QUEUES, assertQueueTopology, getRetryQueueName } from "../utils/rabbitmq.js";

const ai  = new GoogleGenAI({});
const MAX_RETRY_ATTEMPTS = RETRY_DELAYS_MS.length;

const generateNotes = async (problemTitle, problemDescription, code, language) => {
    
    const prompt = `
    You are an expert Senior Software Engineer acting as a 1-on-1 mentor.
    I (the user) just submitted the following ${language} solution for the LeetCode problem "${problemTitle}".
    
    Here is the exact Problem Description and constraints:
    ---
    ${problemDescription}
    ---
    
    My Code:
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Analyze my code against the problem description and return a JSON object with the following exact keys. You MUST speak directly to me in the second person (e.g., use "your code", "your approach", "you should").
    
    - "intuition": A markdown string explaining my approach, comparing it to the brute force or more optimized approaches. (e.g., "Your solution uses...").
    - "timeComplexity": A string like "O(n)" or "O(n^2)".
    - "spaceComplexity": A string like "O(1)" or "O(n)".
    - "followUps": An array of objects, each containing "question" (string) and "hint" (string). Ask these follow-ups directly to me.
    - "howToAnswer": A markdown string explaining how I should verbally communicate this solution to an interviewer.
    
    Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        },
    });

    return JSON.parse(response.text);
};
const processJob = async (jobData) => {
    const { submissionId, problemTitle, code, stats, problemDetails } = jobData;
    console.log(`Processing job for submission ${submissionId} - Problem: ${problemTitle}`);

    try {
        
        const problemDescription = problemDetails?.content ?? "Description not available.";
        const aiNotes = await generateNotes(problemTitle, problemDescription, code, stats.lang);

        await submission.findByIdAndUpdate(submissionId, {aiNotes});

        console.log(`AI notes generated and saved for submission ${submissionId}`);
        console.log(`AI Notes for ${problemTitle}:`, aiNotes);
        return { success: true, retryable: false };

    } catch (error) {
        console.error(`AI Generation Failed for ${submissionId}:`, error.message);
        return { success: false, retryable: true };
    }
}

const startWorker = async () => {
    await connectDB();
    try {
        
        const connection = await amqp.connect(process.env.RABBITMQ_URI);
        const channel =  await connection.createChannel();

        const queue = WORK_QUEUES.GEMINI_NOTES;
        await assertQueueTopology(channel);

        channel.prefetch(1);
        console.log("Gemini Worker is waiting for messages in queue:", queue);

        channel.consume(queue, async (msg) => {
            if(msg !== null){
                const jobData = JSON.parse(msg.content.toString());
                const { success, retryable } = await processJob(jobData);
                const currentRetryCount = Number(msg.properties?.headers?.["x-retry-count"] || 0);
                const nextRetryCount = currentRetryCount + 1;
                
                if(success){
                    channel.ack(msg);
                } else {
                    if (retryable && nextRetryCount <= MAX_RETRY_ATTEMPTS) {
                        channel.sendToQueue(getRetryQueueName(queue, nextRetryCount), Buffer.from(JSON.stringify(jobData)), {
                            persistent: true,
                            headers: {
                                ...(msg.properties?.headers || {}),
                                "x-retry-count": nextRetryCount
                            }
                        });
                        console.warn(`Retrying Gemini job ${jobData.submissionId}. Attempt ${nextRetryCount}/${MAX_RETRY_ATTEMPTS}`);
                        channel.ack(msg);
                    } else {
                        await submission.findByIdAndUpdate(jobData.submissionId, {status: "FAILED"});
                        channel.nack(msg, false, false);
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error occurred while starting Gemini Worker:", error.message);
    }
}

startWorker();