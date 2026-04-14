import submission from "../models/submission.js";
import { publishToQueue } from "../utils/rabbitmq.js";

export const syncLeetCodeSubmission = async (req, res) => {
    try {
        const { stats, userCode, problemDetails } = req.body;
        const userId = req.user.id;
        
        console.log("Received sync request:", { userId, problemTitle: problemDetails.title, stats });
        
        const newSubmission = await submission.create({
            userId,
            problemTitle: problemDetails.title,
            code: userCode,
            language: stats.lang,
            status: "PENDING"
        });

        const jobPayload = {
            submissionId: newSubmission._id,
            userId,
            problemTitle: problemDetails.title,
            code: userCode,
            stats: stats,
            problemDetails
        };

        

        await publishToQueue("github_sync_queue", jobPayload);
        await publishToQueue("gemini_notes_queue", jobPayload);
    
        return res.status(200).json({
            success: true,
            message: "Submission received and queued for processing."
        });
        
    } catch (error) {
        console.error("❌ Error processing sync request:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};