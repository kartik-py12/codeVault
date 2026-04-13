import crypto from "crypto";

const algorithm = "aes-256-cbc";

const key  = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

export const encryptToken = (token) => {
    if(!token) return null;

    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(token, "utf-8", "hex");
    encrypted += cipher.final("hex");

    return `${iv.toString("hex")}:${encrypted}`;
};

export const decryptToken = (encryptedData) => {
    if (!encryptedData) return null;
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};