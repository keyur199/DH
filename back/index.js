import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const port = process.env.PORT || 5000;

// Middleware configuration
app.use(express.json());

// Robust CORS configuration
app.use(cors({
  origin: true, // Auto-reflect request origin
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Serve static resources like generated PDFs
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/public', express.static(path.join(__dirname, 'public')));

// Database connection middleware for Serverless environment
const connectDB = async (req, res, next) => {
  if (mongoose.connection.readyState >= 1) {
    return next();
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://keyurd846_db_user:Keyur%401905@dh.po1nnaw.mongodb.net/DH', {
      bufferCommands: false
    });
    console.log('✅ Successfully connected to MongoDB Atlas');
    next();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    res.status(503).json({
      success: false,
      message: "Database connection failed. Please try again in a few seconds.",
      error: error.message
    });
  }
};

// Apply connection check to all API routes
app.use(connectDB);

// Routes
import userRoutes from './routes/indexRoutes.js';
app.use('/api/', userRoutes);

// Root endpoint just to verify the system is running
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Conditionally start the server for local development
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running locally on port ${port}`);
  });
}

export default app;
