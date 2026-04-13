import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";

configDotenv();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
    origin: ["https://leetcode.com"],
    methods: ["POST","OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.post("/api/sync",(req,res) => {
    try {
        const {stats,userCode,problemDetails} = req.body;
    
        console.log("Received data from extension:");
        console.log("Stats:", stats);
        console.log("User Code:", userCode);
        console.log("Problem Details:", problemDetails);
    
        return res.status(200).json({success:true});
        
    } catch (error) {
        console.error("Error processing sync request:", error);
        return res.status(500).json({success:false, error: error.message});
    }
})

app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
})