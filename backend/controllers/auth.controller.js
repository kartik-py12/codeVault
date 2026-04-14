import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/user.js";
import crypto from "node:crypto";
import redisClient from "../utils/redis.js";
import { encryptToken } from "../utils/encryption.js";

const Required_Scopes = ["read:user", "user:email", "repo"];

export const githubLogin =  async (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");

    res.cookie("oauth_state",state,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000
    })

    const scopes = Required_Scopes.join(" ");

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=${scopes}&state=${state}`;
    
    res.redirect(githubAuthUrl);
}

export const githubCallback = async (req, res) => {
    const {code, state} = req.query;
    const storedState = req.cookies.oauth_state;

    if(!state || !storedState || state !== storedState){
        res.clearCookie("oauth_state");
        console.error("CSRF state mismatch:", {receivedState: state, storedState});
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=csrf_failed`);
    }
    
    res.clearCookie("oauth_state");
    
    if(!code){
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code_provided`);
    };

    try {
        const tokenResponse = await axios.post("https://github.com/login/oauth/access_token",{
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code
        },{
            headers: {
                Accept: "application/json"
            }
        });

        const accessToken = tokenResponse.data.access_token;
        
        if(!accessToken){
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_access_token`);
        }
        
        const grantedScopes = tokenResponse.data.scope ? tokenResponse.data.scope.split(",") : [];
        const hasAllRequiredScopes = Required_Scopes.every(scope => grantedScopes.includes(scope));

        if(!hasAllRequiredScopes){
            return res.redirect(`${process.env.FRONTEND_URL}/settings?error=missing_permissions`);
        }


        const userResponse = await axios.get("https://api.github.com/user",{
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })

        const profile = userResponse.data;

        const encryptedToken = encryptToken(accessToken);

        const user = await User.findOneAndUpdate(
            {githubId: profile.id.toString()},
            {
                username: profile.login,
                email: profile.email || "",
                avatarUrl: profile.avatar_url,
                accessToken: encryptedToken
            },
            {upsert: true, new: true}
        );

        const token = jwt.sign(
            {userId: user._id},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );

        res.cookie("codevault_jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?login=success`);
    
    } catch (error) {
        console.error("GitHub OAuth error:", error.response ? error.response : error.message);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
}

export const logout = async (req, res) => {
    try {
        let token = req.cookies?.codevault_jwt;

        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
        
        if (token) {
            await redisClient.setEx(`bl_${token}`, 7 * 24 * 60 * 60, 'revoked');
            const checkRedis = await redisClient.get(`bl_${token}`);
        }

        res.clearCookie("codevault_jwt", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};