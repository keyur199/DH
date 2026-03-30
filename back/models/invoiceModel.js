import mongoose from "mongoose";

const invoiceItemSchema = mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true, default: 0 }
}, { _id: false });

const invoiceSchema = mongoose.Schema({
    customerName: { type: String, required: true },
    mobileNumber: { type: Number, required: true },
    services: [invoiceItemSchema],
    totalAmount: { type: Number, default: 0 },
    invoiceId: { type: String, unique: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    pdfUrl: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);