import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Invoice from "../models/invoiceModel.js";
import { ThrowError } from "../utils/ErrorUtils.js";
import { sendSuccessResponse, sendErrorResponse, sendBadRequestResponse, sendCreatedResponse } from '../utils/ResponseUtils.js';
import { generateInvoicePDF } from '../utils/pdfUtils.js';

export const createInvoice = async (req, res) => {
    try {
        const { customerName, mobileNumber, services, date, paymentMethod } = req.body;

        if (!customerName || !mobileNumber || !services || services.length === 0 || !date) {
            return sendBadRequestResponse(res, "Customer Name, Mobile Number, Date, Payment Method and at least one Service are required");
        }

        let totalAmount = 0;
        services.forEach(item => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            totalAmount += (qty * price);
        });

        // Prevent Duplicate Invoices for the same appointment
        if (req.body.appointmentId) {
            const existing = await Invoice.findOne({ appointmentId: req.body.appointmentId });
            if (existing) {
                return sendSuccessResponse(res, "Invoice already exists for this appointment", existing);
            }
        }

        const invoiceCount = await Invoice.countDocuments();
        const nextInvoiceId = `${(invoiceCount + 1).toString().padStart(2, "0")}`;

        const newInvoice = await Invoice.create({
            customerName,
            mobileNumber,
            services,
            totalAmount,
            date,
            paymentMethod: paymentMethod || "Cash",
            invoiceId: nextInvoiceId,
            appointmentId: req.body.appointmentId || null
        });

        try {
            const invoicePdfUrl = await generateInvoicePDF(newInvoice);
            newInvoice.pdfUrl = invoicePdfUrl;
            await newInvoice.save();
        } catch (pdfError) {
            if (pdfError.code === 'EROFS' || pdfError.message.includes('read-only')) {
                console.warn("⚠️ PDF generation skipped due to read-only system.");
            } else {
                throw pdfError;
            }
        }

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
        if (req.body.paymentMethod) existingInvoice.paymentMethod = req.body.paymentMethod;
        existingInvoice.totalAmount = totalAmount;

        // 3. DIAMOND MASTER FALLBACK (PROPER)
        // doc.save(fileName); 
        // const masterMsg = `💎 *DH MAKEUP STUDIO*\n\nInvoice *INV-${displayId}* for *${invoice.customerName || "Customer"}* is ready!\n\n📥 **PDF SENT DIRECTLY:** (Local copy saved). \n⚠️ Please attach the PDF now to this chat.`;
        // window.open(`https://wa.me/${phone}?text=${encodeURIComponent(masterMsg)}`, '_blank');

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

export const uploadInvoice = async (req, res) => {
    try {
        const { pdfBase64, invoiceId } = req.body;
        if (!pdfBase64) return res.status(400).json({ success: false, message: "No PDF data provided" });

        const fileName = `Proper_Invoice_${invoiceId || Date.now()}.pdf`;
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const publicPath = path.join(__dirname, '..', 'public', 'invoices');

        try {
            if (!fs.existsSync(publicPath)) {
                fs.mkdirSync(publicPath, { recursive: true });
            }
            const filePath = path.join(publicPath, fileName);
            const buffer = Buffer.from(pdfBase64, 'base64');
            fs.writeFileSync(filePath, buffer);

            // Construct server URL
            const protocol = req.protocol;
            const host = req.get('host');
            const url = `${protocol}://${host}/public/invoices/${fileName}`;

            return res.json({ success: true, url });
        } catch (fsError) {
            if (fsError.code === 'EROFS') {
                console.warn("⚠️ System is read-only (Vercel). Skipping file write.");
                return res.json({ success: false, message: "Server is read-only. Using direct sharing fallback." });
            }
            throw fsError;
        }
    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
