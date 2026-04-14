import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./db/connect.js";
import authRoutes from "./routes/auth.route.js";    
import cookieParser from "cookie-parser";
import { requireAuth } from "./middleware/auth.middleware.js";

import { connectRabbitMQ, publishToQueue } from "./utils/rabbitmq.js";
import submission from "./models/submission.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({limit: "10mb"}));
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: ["https://leetcode.com", "http://localhost:5173"],
    methods: ["POST","OPTIONS","GET"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use("/api/auth", authRoutes);

app.post("/api/sync",requireAuth, async (req,res) => {
    try {
        const {stats,userCode,problemDetails} = req.body;
        const userId = req.user.id;
        console.log("Received sync request:", {userId, problemTitle: problemDetails.title, stats});
        const newSubmission = await submission.create({
            userId,
            problemTitle: problemDetails.title,
            code: userCode,
            language: stats.lang,
            status: "PENDING"
        })

        const jobPayload = {
            submissionId: newSubmission._id,
            userId,
            problemTitle: problemDetails.title,
            code: userCode,
            stats:stats,
            problemDetails
        }

        await publishToQueue("github_sync_queue", jobPayload);
        await publishToQueue("gemini_notes_queue", jobPayload);
    
        return res.status(200).json({
            success:true,
            message: "Submission received and queued for processing."
        });
        
    } catch (error) {
        console.error("Error processing sync request:", error);
        return res.status(500).json({success:false, error: "Internal server error"});
    }
})

app.listen(PORT,async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    await connectRabbitMQ();

})