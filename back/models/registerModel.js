import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const registerSchema = mongoose.Schema({
    name: { type: String },
    phone: { type: Number },
    email: { type: String },
    password: { type: String },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    otp: { type: Number },
    otpExpiry: { type: Date }
}, { timestamps: true });

registerSchema.pre('save', function () {
    this.isAdmin = this.role === 'admin';
});

registerSchema.methods.getJWT = async function () {
    const user = this;
    const token = jwt.sign({
        _id: user._id,
        role: user.role || 'user',
        isAdmin: user.role === 'admin'
    }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return token;
};

registerSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    return await bcrypt.compare(passwordInputByUser, user.password);
};

export default mongoose.model("register", registerSchema);