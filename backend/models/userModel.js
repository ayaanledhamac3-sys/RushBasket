import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, default: null, trim: true },
        password: { type: String, default: null },
        googleId: { type: String, sparse: true, unique: true },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },
        passwordResetToken: { type: String },
        passwordResetExpires: { type: Date },
        twoFactorVerifiedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
