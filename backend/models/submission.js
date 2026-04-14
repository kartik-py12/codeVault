import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    problemTitle: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        default: "LeetCode"
    },
    difficulty: {
        type: String,
        default: "Unknown"
    },
    problemContent: {
        type: String,
        default: ""
    },
    topicTags: {
        type: [String],
        default: []
    },
    externalUrl: {
        type: String,
        default: ""
    },
    syncType: {
        type: String,
        enum: ["GITHUB_SYNC", "TODO"],
        default: "GITHUB_SYNC"
    },
    status: {
        type: String,
        enum: ["TODO", "PENDING", "COMPLETED", "FAILED"],
        default: "PENDING"
    },
    aiNotes: {
        intuition: {type: String},
        timeComplexity: {type: String},
        spaceComplexity: {type: String},
        followUps: [{
            question: {type: String},
            hint: {type: String}
        }],
        howToAnswer: {type: String}
    }
},{timestamps:true});

export default mongoose.model('Submission', submissionSchema);