import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from '../models/invoiceModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/DH');
        console.log("Connected to MongoDB for migration...");

        const invoices = await Invoice.find().sort({ createdAt: 1 });
        console.log(`Found ${invoices.length} invoices to migrate.`);

        for (let i = 0; i < invoices.length; i++) {
            const inv = invoices[i];
            if (!inv.invoiceId) {
                inv.invoiceId = `INV-${(i + 1).toString().padStart(4, "0")}`;
                await inv.save();
                console.log(`Migrated invoice ${inv._id} -> ${inv.invoiceId}`);
            }
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
