import crypto from "crypto";
import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import twilio from "twilio";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
const TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";
const OTP_EXPIRES_MS = 5 * 60 * 1000;
const OTP_RESEND_INTERVAL_MS = 60 * 1000;
const OTP_MAX_RESENDS = 3;
const OTP_MAX_VERIFY_ATTEMPTS = 5;

const frontendBase = () =>
    (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const createToken = (userId) =>
    jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

const normalizeEmail = (email) => (email || "").toLowerCase().trim();
const normalizePhone = (phone) => (phone || "").trim();
const isValidPhone = (phone) => /^\+[1-9]\d{7,14}$/.test(phone);

const hashOtpCode = (code) =>
    crypto.createHash("sha256").update(code).digest("hex");

const generateOtpCode = () =>
    `${Math.floor(100000 + Math.random() * 900000)}`;

function createGmailTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
        throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD");
    }
    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });
}

async function sendOtpEmail(toEmail, code) {
    const transporter = createGmailTransporter();
    await transporter.sendMail({
        from: process.env.GMAIL_FROM || process.env.GMAIL_USER,
        to: toEmail,
        subject: "RushBasket 2FA OTP Code",
        text: `Your RushBasket OTP is ${code}. It expires in 5 minutes.`,
        html: `<p>Your RushBasket OTP is <strong>${code}</strong>.</p><p>This code expires in 5 minutes.</p>`,
    });
}

async function sendOtpSms(toPhone, code) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) {
        throw new Error(
            "Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN or TWILIO_PHONE_NUMBER"
        );
    }
    const client = twilio(sid, token);
    await client.messages.create({
        body: `RushBasket OTP: ${code}. Valid for 5 minutes.`,
        from,
        to: toPhone,
    });
}

async function sendOtpThroughAllChannels(user, code) {
    await sendOtpEmail(user.email, code);
    await sendOtpSms(user.phone, code);
}

function otpResponsePayload(otpDoc, message = "OTP sent to your email and phone.") {
    return {
        success: true,
        requires2FA: true,
        message,
        otpRequestId: otpDoc._id,
        expiresAt: otpDoc.expiresAt,
        resendAfterSeconds: Math.ceil(OTP_RESEND_INTERVAL_MS / 1000),
    };
}

// REGISTER (email + password)
export async function registerUser(req, res) {
    const { name, email, password, phone } = req.body;
    console.log("[register] Incoming request", {
        namePresent: Boolean(name),
        email,
        phone,
        passwordLength: password?.length || 0,
    });
    if (!name || !email || !password || !phone) {
        console.log("[register] Missing required fields");
        return res
            .status(400)
            .json({ success: false, message: "Name, email, phone, and password are required." });
    }
    const normEmail = normalizeEmail(email);
    const normPhone = normalizePhone(phone);
    if (!validator.isEmail(normEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email." });
    }
    if (!isValidPhone(normPhone)) {
        return res.status(400).json({
            success: false,
            message: "Phone must be in international format, e.g. +2547XXXXXXXX.",
        });
    }
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters.",
        });
    }

    try {
        const existing = await User.findOne({ email: normEmail });
        if (existing) {
            console.log("[register] User already exists", { email: normEmail });
            if (existing.googleId && !existing.password) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email is already registered with Google. Sign in with Google instead.",
                });
            }
            return res
                .status(409)
                .json({ success: false, message: "User already exists." });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: normEmail,
            phone: normPhone,
            password: hashed,
            authProvider: "local",
        });
        const token = createToken(user._id);
        console.log("[register] Registration successful", { userId: String(user._id) });
        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
        });
    } catch (err) {
        console.error("[register] Server error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
}

// LOGIN (email + password)
export async function loginUser(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(400)
            .json({ success: false, message: "Email and password required." });
    }

    const normEmail = normalizeEmail(email);

    try {
        const user = await User.findOne({ email: normEmail });
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid email or password." });
        }
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message:
                    "This account uses Google. Please sign in with Google.",
            });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid email or password." });
        }

        if (!user.phone) {
            return res.status(400).json({
                success: false,
                message:
                    "This account has no phone number for SMS 2FA. Update your profile with an E.164 phone number.",
            });
        }

        const otpCode = generateOtpCode();
        const now = Date.now();
        const otpPayload = {
            userId: user._id,
            email: user.email,
            phone: user.phone,
            otpCodeHash: hashOtpCode(otpCode),
            expiresAt: new Date(now + OTP_EXPIRES_MS),
            nextResendAllowedAt: new Date(now + OTP_RESEND_INTERVAL_MS),
            emailSent: false,
            smsSent: false,
        };

        // Keep only one active OTP challenge per user.
        await Otp.deleteMany({ userId: user._id, isUsed: false });
        const otpDoc = await Otp.create(otpPayload);

        try {
            await sendOtpThroughAllChannels(user, otpCode);
            otpDoc.emailSent = true;
            otpDoc.smsSent = true;
            await otpDoc.save();
        } catch (sendErr) {
            await Otp.deleteOne({ _id: otpDoc._id });
            console.error("OTP dispatch error:", sendErr);
            return res.status(500).json({
                success: false,
                message:
                    "Could not send OTP via email and SMS. Check Gmail/Twilio env settings.",
            });
        }

        return res.json(otpResponsePayload(otpDoc));
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error." });
    }
}

const googleClient = new OAuth2Client();

// GOOGLE (One Tap / button credential JWT)
export async function googleAuth(req, res) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
        return res.status(500).json({
            success: false,
            message: "Google sign-in is not configured (missing GOOGLE_CLIENT_ID).",
        });
    }

    const { credential } = req.body;
    if (!credential) {
        return res
            .status(400)
            .json({ success: false, message: "Missing Google credential." });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: googleClientId,
        });
        const p = ticket.getPayload();
        if (!p?.email) {
            return res.status(400).json({
                success: false,
                message: "Google did not return an email for this account.",
            });
        }

        const email = normalizeEmail(p.email);
        const googleId = p.sub;
        const name = (p.name || email.split("@")[0]).trim();

        let user = await User.findOne({
            $or: [{ googleId }, { email }],
        });

        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                authProvider: "google",
            });
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (!user.name && name) user.name = name;
            await user.save();
        }

        const token = createToken(user._id);
        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
        });
    } catch (err) {
        console.error("googleAuth", err);
        res.status(401).json({
            success: false,
            message: "Google sign-in failed. Check GOOGLE_CLIENT_ID matches your web client.",
        });
    }
}

export async function sendOtp(req, res) {
    const { otpRequestId } = req.body;
    if (!otpRequestId) {
        return res.status(400).json({
            success: false,
            message: "otpRequestId is required.",
        });
    }

    try {
        const otpDoc = await Otp.findById(otpRequestId);
        if (!otpDoc || otpDoc.isUsed || otpDoc.expiresAt <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP request is invalid or expired. Please login again.",
            });
        }

        if (otpDoc.resendCount >= OTP_MAX_RESENDS) {
            return res.status(429).json({
                success: false,
                message: "Resend limit reached. Please login again.",
            });
        }

        const now = new Date();
        if (otpDoc.nextResendAllowedAt > now) {
            const waitSeconds = Math.ceil(
                (otpDoc.nextResendAllowedAt.getTime() - now.getTime()) / 1000
            );
            return res.status(429).json({
                success: false,
                message: `Please wait ${waitSeconds}s before resending OTP.`,
            });
        }

        const user = await User.findById(otpDoc.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User no longer exists.",
            });
        }

        const otpCode = generateOtpCode();
        otpDoc.otpCodeHash = hashOtpCode(otpCode);
        otpDoc.expiresAt = new Date(Date.now() + OTP_EXPIRES_MS);
        otpDoc.resendCount += 1;
        otpDoc.nextResendAllowedAt = new Date(Date.now() + OTP_RESEND_INTERVAL_MS);
        otpDoc.attempts = 0;

        try {
            await sendOtpThroughAllChannels(user, otpCode);
            otpDoc.emailSent = true;
            otpDoc.smsSent = true;
            await otpDoc.save();
        } catch (sendErr) {
            console.error("OTP resend dispatch error:", sendErr);
            return res.status(500).json({
                success: false,
                message: "Failed to resend OTP via both channels.",
            });
        }

        return res.json(otpResponsePayload(otpDoc, "A new OTP was sent."));
    } catch (err) {
        console.error("sendOtp", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
}

export async function verifyOtp(req, res) {
    const { otpRequestId, otpCode } = req.body;
    if (!otpRequestId || !otpCode) {
        return res.status(400).json({
            success: false,
            message: "otpRequestId and otpCode are required.",
        });
    }
    if (!/^\d{6}$/.test(String(otpCode))) {
        return res.status(400).json({
            success: false,
            message: "OTP must be a 6 digit code.",
        });
    }

    try {
        const otpDoc = await Otp.findById(otpRequestId);
        if (!otpDoc || otpDoc.isUsed || otpDoc.expiresAt <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired. Please login again.",
            });
        }

        const providedHash = hashOtpCode(String(otpCode));
        if (otpDoc.otpCodeHash !== providedHash) {
            otpDoc.attempts += 1;
            if (otpDoc.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
                otpDoc.isUsed = true;
                otpDoc.usedAt = new Date();
            }
            await otpDoc.save();
            return res.status(400).json({
                success: false,
                message:
                    otpDoc.attempts >= OTP_MAX_VERIFY_ATTEMPTS
                        ? "Too many invalid attempts. Please login again."
                        : "Invalid OTP code.",
            });
        }

        const user = await User.findById(otpDoc.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        otpDoc.isUsed = true;
        otpDoc.usedAt = new Date();
        await otpDoc.save();

        user.twoFactorVerifiedAt = new Date();
        await user.save();

        const token = createToken(user._id);
        return res.json({
            success: true,
            message: "OTP verified successfully.",
            token,
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
        });
    } catch (err) {
        console.error("verifyOtp", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
}

// FORGOT PASSWORD — issues reset token (email link logged in dev if no SMTP)
export async function forgotPassword(req, res) {
    const normEmail = normalizeEmail(req.body?.email);
    if (!normEmail || !validator.isEmail(normEmail)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address.",
        });
    }

    const generic = {
        success: true,
        message:
            "If an account exists for that email, password reset instructions have been sent.",
    };

    try {
        const user = await User.findOne({ email: normEmail });
        if (!user || !user.password) {
            return res.json(generic);
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hash = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.passwordResetToken = hash;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        const resetUrl = `${frontendBase()}/reset-password?token=${resetToken}`;

        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT || 587),
                    secure: process.env.SMTP_SECURE === "true",
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: normEmail,
                    subject: "Reset your RushBasket password",
                    text: `Open this link to reset your password (valid 1 hour):\n\n${resetUrl}\n`,
                    html: `<p>Reset your password (link valid 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
                });
            } catch (mailErr) {
                console.error("forgotPassword mail error:", mailErr);
            }
        } else if (process.env.NODE_ENV !== "production") {
            console.log("[forgot-password] Dev reset link (configure SMTP for email):", resetUrl);
        }

        return res.json(generic);
    } catch (err) {
        console.error("forgotPassword", err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Try again later.",
        });
    }
}

// RESET PASSWORD — consume token
export async function resetPassword(req, res) {
    const { token, password } = req.body;
    if (!token || typeof token !== "string") {
        return res.status(400).json({
            success: false,
            message: "Reset token is required.",
        });
    }
    if (!password || password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters.",
        });
    }

    try {
        const hash = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            passwordResetToken: hash,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset link. Request a new one.",
            });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: "Password updated. You can sign in now.",
        });
    } catch (err) {
        console.error("resetPassword", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
}
