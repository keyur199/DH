import mongoose from "mongoose";

const servicesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
}, {
    timestamps: true
});

export default mongoose.model("services", servicesSchema);