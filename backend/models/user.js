import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    avatarUrl: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    githubId: {
        type: String,
        required: true,
    },
    accessToken: {
        type: String,
        required: true
    }
},{timestamps: true});

const User = mongoose.model("User",userSchema);
export default User;