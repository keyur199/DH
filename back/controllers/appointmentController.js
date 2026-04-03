import Appointment from "../models/appointmentModel.js";
import Invoice from "../models/invoiceModel.js";
import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import { sendSuccessResponse, sendErrorResponse, sendBadRequestResponse, sendCreatedResponse } from '../utils/ResponseUtils.js';

export const createAppointment = async (req, res) => {
    try {
        const { customerName, mobileNumber, date, time, services, status, paymentMethod } = req.body;

        if (!customerName || !mobileNumber || !date || !time || !services || services.length === 0) {
            return sendBadRequestResponse(res, "Customer Name, Mobile Number, Date, Time, and at least one Service are required");
        }

        let totalAmount = 0;
        services.forEach(service => {
            totalAmount += Number(service.price) || 0;
        });

        const newAppointment = await Appointment.create({
            customerName,
            mobileNumber,
            date,
            time,
            services,
            totalAmount,
            status: status || 'Pending',
            paymentMethod: paymentMethod || 'Cash'
        });

        return sendCreatedResponse(res, "Appointment created successfully", newAppointment);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ createdAt: -1 });

        if (!appointments || appointments.length === 0) {
            return sendSuccessResponse(res, "No appointments found", []);
        }

        return sendSuccessResponse(res, "Appointments fetched successfully", appointments);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return sendErrorResponse(res, 404, "Appointment not found");
        }

        return sendSuccessResponse(res, "Appointment retrieved successfully", appointment);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, mobileNumber, date, time, services, status, paymentMethod } = req.body;

        const existingAppointment = await Appointment.findById(id);
        if (!existingAppointment) {
            return sendErrorResponse(res, 404, "Appointment not found");
        }

        let totalAmount = existingAppointment.totalAmount;
        if (services) {
            totalAmount = 0;
            services.forEach(service => {
                totalAmount += Number(service.price) || 0;
            });
            existingAppointment.services = services;
        }

        if (customerName) existingAppointment.customerName = customerName;
        if (mobileNumber) existingAppointment.mobileNumber = mobileNumber;
        if (date) existingAppointment.date = date;
        if (time) existingAppointment.time = time;
        if (status) existingAppointment.status = status;
        if (paymentMethod) existingAppointment.paymentMethod = paymentMethod;
        existingAppointment.totalAmount = totalAmount;

        await existingAppointment.save();

        // Sync with matching invoices (robust check)
        const updateFields = {};
        if (customerName) updateFields.customerName = customerName;
        if (mobileNumber) updateFields.mobileNumber = mobileNumber;
        if (date) updateFields.date = date;
        if (services) {
            updateFields.services = services;
            updateFields.totalAmount = totalAmount;
        }
        if (paymentMethod) updateFields.paymentMethod = paymentMethod;

        if (Object.keys(updateFields).length > 0) {
            // Use both the raw string ID and the ObjectId for safety in matching
            await Invoice.updateMany(
                { 
                    $or: [
                        { appointmentId: id },
                        { appointmentId: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null }
                    ].filter(q => q.appointmentId !== null)
                },
                { $set: updateFields }
            );
        }

        return sendSuccessResponse(res, "Appointment updated successfully", existingAppointment);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const existingAppointment = await Appointment.findById(id);
        if (!existingAppointment) {
            return sendErrorResponse(res, 404, "Appointment not found");
        }

        await Appointment.findByIdAndDelete(id);
        return sendSuccessResponse(res, "Appointment deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const revertToPending = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id);
        if (!appointment) return sendErrorResponse(res, 404, "Appointment not found");

        // 1. Delete associated invoice
        await Invoice.findOneAndDelete({ appointmentId: id });

        // 2. Revert status
        appointment.status = "Pending";
        await appointment.save();

        return sendSuccessResponse(res, "Appointment reverted to Pending and Invoice removed", appointment);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
