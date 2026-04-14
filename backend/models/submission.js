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
    status: {
        type: String,
        enum: ["PENDING", "COMPLETED", "FAILED"],
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