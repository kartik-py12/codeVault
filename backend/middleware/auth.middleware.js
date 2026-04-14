import jwt from "jsonwebtoken";
import redisClient from "../utils/redis.js";

export const requireAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.codevault_jwt;
        
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: "Unauthorized: No token provided" 
            });
        }
        const isRevoked = await redisClient.get(`bl_${token}`);
 
        if (isRevoked){
            return res.status(401).json({ success: false, error: "Unauthorized: Token has been revoked. Please log in again." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = { id: decoded.userId };
        
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                success: false, 
                error: "Unauthorized: Token expired. Please log in again." 
            });
        }
        
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ 
            success: false, 
            error: "Unauthorized: Invalid token" 
        });
    }
};