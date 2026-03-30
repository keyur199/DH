import servicesModel from "../models/servicesModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import { sendSuccessResponse, sendErrorResponse, sendBadRequestResponse, sendCreatedResponse } from '../utils/ResponseUtils.js';

// Create a new service
export const createService = async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || !price) {
            return sendBadRequestResponse(res, "Service name and price are required");
        }

        const newService = new servicesModel({
            name,
            price
        });

        await newService.save();
        return sendCreatedResponse(res, "Service created successfully", newService);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get all services
export const getAllServices = async (req, res) => {
    try {
        const services = await servicesModel.find().sort({ createdAt: -1 });

        if (!services || services.length === 0) {
            return sendSuccessResponse(res, "No services found", []);
        }

        return sendSuccessResponse(res, "Services fetched successfully", services);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get service by ID
export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await servicesModel.findById(id);

        if (!service) {
            return sendErrorResponse(res, 404, "Service not found");
        }

        return sendSuccessResponse(res, "Service retrieved successfully", service);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update service
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        const updatedService = await servicesModel.findByIdAndUpdate(
            id,
            { name, price },
            { new: true, runValidators: true }
        );

        if (!updatedService) {
            return sendErrorResponse(res, 404, "Service not found");
        }

        return sendSuccessResponse(res, "Service updated successfully", updatedService);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Delete service
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedService = await servicesModel.findByIdAndDelete(id);

        if (!deletedService) {
            return sendErrorResponse(res, 404, "Service not found");
        }

        return sendSuccessResponse(res, "Service deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
