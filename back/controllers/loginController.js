import Register from "../models/registerModel.js";
import { ThrowError } from "../utils/ErrorUtils.js"
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"
import jwt from "jsonwebtoken";
import { sendSuccessResponse, sendErrorResponse, sendBadRequestResponse, sendUnauthorizedResponse } from '../utils/ResponseUtils.js';
import dotenv from "dotenv";
dotenv.config();

const generateOTP = () => Math.floor(1000 + Math.random() * 9000);

export const loginUser = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return sendBadRequestResponse(res, "Email/Phone and password are required");
        }

        // Search by email or phone
        const user = await Register.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { phone: !isNaN(identifier) ? Number(identifier) : -1 }
            ]
        });

        if (!user) {
            return sendErrorResponse(res, 404, "User not found with this Email or Mobile");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return sendUnauthorizedResponse(res, "Invalid password");
        }

        const token = await user.getJWT();
        if (!token) {
            return sendErrorResponse(res, 500, "Failed to generate token");
        }

        return sendSuccessResponse(res, "Login successful", {
            id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
            bio: user.bio,
            role: user.role || 'user',
            isAdmin: user.role === 'admin',
            token: token
        });
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return sendBadRequestResponse(res, "Provide Email Id");
        }

        const user = await Register.findOne({ email: email })
        if (!user) {
            return sendErrorResponse(res, 400, "User Not Found");
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MY_GMAIL,
                pass: process.env.MY_PASSWORD,
            },
            tls: { rejectUnauthorized: false },
        });

        const mailOptions = {
            from: process.env.MY_GMAIL,
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        return sendSuccessResponse(res, "OTP sent successfully to your email");

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const VerifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return sendBadRequestResponse(res, "Please provide email and OTP.");
        }

        const user = await Register.findOne({ email: email });
        if (!user) {
            return sendErrorResponse(res, 404, "User not found.");
        }

        if (!user.otp || !user.otpExpiry) {
            return sendBadRequestResponse(res, "No OTP found. Please request a new OTP.");
        }

        if (user.otp !== Number(otp)) {
            return sendBadRequestResponse(res, "Invalid OTP.");
        }

        if (user.otpExpiry < Date.now()) {
            return sendBadRequestResponse(res, "OTP has expired. Please request a new OTP.");
        }

        user.otp = undefined;
        user.otpExpiry = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully."
        });

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;
        if (!newPassword || !confirmPassword) {
            return sendBadRequestResponse(res, "Please provide email, newpassword and confirmpassword.");
        }

        const user = await Register.findOne({ email: email });
        if (!user) {
            return sendErrorResponse(res, 400, "User Not Found");
        }

        if (!(newPassword === confirmPassword)) {
            return sendBadRequestResponse(res, "Please check newpassword and confirmpassword.");
        }

        await Register.findOne({ password: newPassword });
        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return sendSuccessResponse(res, "Password reset successfully.", { id: user._id, email: user.email });
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return sendBadRequestResponse(res, "oldPassword, newPassword, and confirmPassword are required.");
        }

        const user = await Register.findById(req.user._id);
        if (!user) {
            return sendErrorResponse(res, 404, "User not found");
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return sendBadRequestResponse(res, "Current password is incorrect.");
        }

        if (newPassword === oldPassword) {
            return sendBadRequestResponse(res, "New password cannot be the same as current password.");
        }

        if (newPassword !== confirmPassword) {
            return sendBadRequestResponse(res, "New password and confirm password do not match.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return sendSuccessResponse(res, "Password changed successfully.");

    } catch (error) {
        return sendErrorResponse(res, 500, error.message);
    }
};