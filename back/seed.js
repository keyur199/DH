import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Register from "./models/registerModel.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://keyurd846_db_user:Keyur%401905@dh.po1nnaw.mongodb.net/DH')
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      const existingAdmin = await Register.findOne({ email: 'admin@gmail.com' });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin@123', 10);
        await Register.create({
          name: 'Master Admin',
          phone: '9999999999',
          email: 'admin@gmail.com',
          password: hashedPassword,
          role: 'admin',
          isAdmin: true
        });
        console.log('Master Admin created successfully.');
      } else {
        console.log('Master Admin already exists.');
      }
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });
