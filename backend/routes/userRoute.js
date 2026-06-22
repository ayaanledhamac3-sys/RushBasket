import express from 'express';
import {
    registerUser,
    loginUser,
    sendOtp,
    verifyOtp,
    googleAuth,
    forgotPassword,
    resetPassword,
} from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/send-otp', sendOtp);
userRouter.post('/verify-otp', verifyOtp);
userRouter.post('/google', googleAuth);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password', resetPassword);

export default userRouter;
