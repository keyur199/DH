import mongoose from "mongoose";

const serviceSchema = mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true }
}, { _id: false });

const appointmentSchema = mongoose.Schema({
    customerName: { type: String, required: true },
    mobileNumber: { type: Number, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    services: [serviceSchema],
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);
