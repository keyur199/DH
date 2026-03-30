import Invoice from "../models/invoiceModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import { sendSuccessResponse, sendErrorResponse, sendBadRequestResponse, sendCreatedResponse } from '../utils/ResponseUtils.js';
import { generateInvoicePDF } from '../utils/pdfUtils.js';

export const createInvoice = async (req, res) => {
    try {
        const { customerName, mobileNumber, services } = req.body;

        if (!customerName || !mobileNumber || !services || services.length === 0) {
            return sendBadRequestResponse(res, "Customer Name, Mobile Number, and at least one Service are required");
        }

        let totalAmount = 0;
        services.forEach(item => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            totalAmount += (qty * price);
        });

        const invoiceCount = await Invoice.countDocuments();
        const nextInvoiceId = `${(invoiceCount + 1).toString().padStart(2, "0")}`;

        const newInvoice = await Invoice.create({
            customerName,
            mobileNumber,
            services,
            totalAmount,
            invoiceId: nextInvoiceId,
            appointmentId: req.body.appointmentId || null
        });

        const invoicePdfUrl = await generateInvoicePDF(newInvoice);
        newInvoice.pdfUrl = invoicePdfUrl;
        await newInvoice.save();

        return sendCreatedResponse(res, "Invoice created successfully", newInvoice);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 });

        if (!invoices || invoices.length === 0) {
            return sendSuccessResponse(res, "No invoices found", []);
        }

        return sendSuccessResponse(res, "Invoices fetched successfully", invoices);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const searchInvoices = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query.customerName = { $regex: search, $options: 'i' };
        }

        const invoices = await Invoice.find(query).sort({ createdAt: -1 });

        return sendSuccessResponse(res, "Search results fetched successfully", invoices);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findById(id);
        if (!invoice) {
            return sendErrorResponse(res, 404, "Invoice not found");
        }

        return sendSuccessResponse(res, "Invoice retrieved successfully", invoice);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, mobileNumber, services } = req.body;

        const existingInvoice = await Invoice.findById(id);
        if (!existingInvoice) {
            return sendErrorResponse(res, 404, "Invoice not found");
        }

        let totalAmount = existingInvoice.totalAmount;
        if (services) {
            totalAmount = 0;
            services.forEach(item => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.price) || 0;
                totalAmount += (qty * price);
            });
            existingInvoice.services = services;
        }

        if (customerName) existingInvoice.customerName = customerName;
        if (mobileNumber) existingInvoice.mobileNumber = mobileNumber;
        existingInvoice.totalAmount = totalAmount;

        await existingInvoice.save();

        return sendSuccessResponse(res, "Invoice updated successfully", existingInvoice);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const existingInvoice = await Invoice.findById(id);
        if (!existingInvoice) {
            return sendErrorResponse(res, 404, "Invoice not found");
        }

        await Invoice.findByIdAndDelete(id);

        return sendSuccessResponse(res, "Invoice deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
