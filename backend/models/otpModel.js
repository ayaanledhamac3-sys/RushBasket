import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        phone: { type: String, required: true, trim: true },
        otpCodeHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        isUsed: { type: Boolean, default: false, index: true },
        usedAt: { type: Date, default: null },
        attempts: { type: Number, default: 0 },
        resendCount: { type: Number, default: 0 },
        nextResendAllowedAt: { type: Date, required: true },
        emailSent: { type: Boolean, default: false },
        smsSent: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Automatically purge expired OTP documents.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const otpModel = mongoose.models.otp || mongoose.model("otp", otpSchema);

export default otpModel;
