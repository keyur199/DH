import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Serve static resources like generated PDFs
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
import userRoutes from './routes/indexRoutes.js';
app.use('/api/', userRoutes);

// Root endpoint just to verify the system is running
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Database connection & Server start
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/DH')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
