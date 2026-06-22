import mongoose from "mongoose";

/**
 * Connects to MongoDB using MONGODB_URI or MONGO_URI from backend/.env.
 * @returns {Promise<boolean>} true if connected, false if no URI configured
 */
export const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
        console.warn(
            "MONGODB_URI is not set in backend/.env — saves (Create product, orders, etc.) will not work."
        );
        return false;
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
        });
        console.log("DB CONNECTED");
        return true;
    } catch (error) {
        console.error("DB CONNECTION ERROR:", error.message);
        throw error;
    }
};
