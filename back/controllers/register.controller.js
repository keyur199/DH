import Register from "../models/registerModel.js";
import { ThrowError } from "../utils/ErrorUtils.js"
import bcrypt from "bcryptjs";
import { sendSuccessResponse, sendErrorResponse, sendBadRequestResponse, sendForbiddenResponse, sendCreatedResponse, sendUnauthorizedResponse } from '../utils/ResponseUtils.js';

export const createRegister = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    if (!name || !phone || !email || !password) {
      return sendBadRequestResponse(res, "All fields are required");
    }

    const existingTrainer = await Register.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    });
    if (existingTrainer) {
      return sendBadRequestResponse(res, "Email or phone already registered");
    }

    if (role === 'admin') {
      const adminExists = await Register.findOne({ role: 'admin' });
      if (adminExists) {
        return sendBadRequestResponse(res, "Admin already exists. Only one admin account can be created.");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newRegister = await Register.create({
      name,
      phone,
      email,
      password: hashedPassword,
      role,
      isAdmin: role === 'admin'
    });

    const token = await newRegister.getJWT();
    if (!token) {
      return sendErrorResponse(res, 500, "Failed to generate token");
    }

    const userResponse = newRegister.toObject();
    delete userResponse.password;

    return sendCreatedResponse(res, "Registration successful", {
      user: userResponse,
      token
    });
  } catch (error) {
    return ThrowError(res, 500, error.message)
  }
};

export const getRegisterById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };
    if (!req.user) {
      return sendUnauthorizedResponse(res, "Authentication required");
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && req.user._id.toString() !== id) {
      return sendForbiddenResponse(res, "Access denied. You can only view your own profile.");
    }

    const register = await Register.findOne(query);
    if (!register) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const Wishlist = (await import('../models/wishlistModel.js')).default;
    const wishlistDoc = await Wishlist.findOne({ userId: id }).populate('courses');
    const wishlistCourses = wishlistDoc ? wishlistDoc.courses : [];

    const userResponse = register.toObject();
    delete userResponse.password;
    userResponse.wishlist = wishlistCourses;

    return sendSuccessResponse(res, "User retrieved successfully", userResponse);
  } catch (error) {
    return ThrowError(res, 500, error.message)
  }
};

export const updateProfileUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, role } = req.body;

    if (!req.user || (!req.user.isAdmin && req.user._id.toString() !== id)) {
      return sendForbiddenResponse(res, "Access denied. You can only update your own profile.");
    }

    const existingUser = await Register.findById(id);
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User not found");
    }

    if (name) existingUser.name = name;
    if (phone) existingUser.phone = phone;
    if (email) existingUser.email = email;

    if (role) {
      if (role === 'admin' && existingUser.role !== 'admin') {
        const adminExists = await Register.findOne({ role: 'admin' });
        if (adminExists) {
          return sendBadRequestResponse(res, "Admin already exists. Only one admin allowed.");
        }
      }
      existingUser.role = role;
      existingUser.isAdmin = role === 'admin';
    }

    await existingUser.save();

    const userResponse = existingUser.toObject();
    delete userResponse.password;

    return sendSuccessResponse(res, "User updated successfully", userResponse);
  } catch (error) {
    return ThrowError(res, 500, error.message)
  }
};

export const updateProfileAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, role } = req.body;

    if (!req.user || (!req.user.isAdmin && req.user._id.toString() !== id)) {
      return sendForbiddenResponse(res, "Access denied. You can only update your own profile.");
    }

    const existingAdmin = await Register.findById(id);
    if (!existingAdmin) {
      return sendErrorResponse(res, 404, "Admin not found");
    }

    if (name) existingAdmin.name = name;
    if (phone) existingAdmin.phone = phone;
    if (email) existingAdmin.email = email;

    if (role) {
      if (role === 'admin' && existingAdmin.role !== 'admin') {
        const adminExists = await Register.findOne({ role: 'admin' });
        if (adminExists) {
          return sendBadRequestResponse(res, "Admin already exists. Only one admin allowed.");
        }
      }
      existingAdmin.role = role;
      existingAdmin.isAdmin = role === 'admin';
    }

    await existingAdmin.save();

    const adminResponse = existingAdmin.toObject();
    delete adminResponse.password;

    return sendSuccessResponse(res, "Admin updated successfully", adminResponse);
  } catch (error) {
    return ThrowError(res, 500, error.message)
  }
};

export const deleteRegister = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTrainer = await Register.findById(id);
    if (!existingTrainer) {
      return sendErrorResponse(res, 404, "Member not found");
    }

    await Register.findByIdAndDelete(id);

    return sendSuccessResponse(res, "Member deleted successfully");
  } catch (error) {
    return ThrowError(res, 500, error.message)
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (!req.user) {
      return sendUnauthorizedResponse(res, "Authentication required");
    }

    if (!req.user.isAdmin) {
      return sendForbiddenResponse(res, "Access denied. Only admins can view all users.");
    }

    const users = await Register.find({ role: 'user' }).select('-password');

    if (!users || users.length === 0) {
      return sendSuccessResponse(res, "No users found", []);
    }

    return sendSuccessResponse(res, "Users fetched successfully", users);

  } catch (error) {
    return ThrowError(res, 500, error.message)
  }
};