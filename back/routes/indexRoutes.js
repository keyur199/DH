import express from "express";
import { isAdmin, isUser, UserAuth } from "../middlewares/auth.js";
import {
    createRegister,
    getRegisterById,
    getAllUsers,
    updateProfileUser,
    updateProfileAdmin,
    deleteRegister
} from "../controllers/register.controller.js";
import {
    changePassword,
    forgotPassword,
    loginUser,
    resetPassword,
    VerifyEmail,
} from '../controllers/loginController.js';
import {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
    revertToPending
} from '../controllers/appointmentController.js';
import {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    searchInvoices
} from '../controllers/invoiceController.js';
import { getCustomersDashboard } from '../controllers/customerController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService
} from '../controllers/servicesController.js';

const indexRoutes = express.Router();

// =======================
// Register (User) Routes
// =======================
indexRoutes.post("/createRegister", createRegister);
indexRoutes.get("/getRegisterById/:id", UserAuth, getRegisterById);
indexRoutes.get("/getAllUsers", UserAuth, getAllUsers);
indexRoutes.put("/updateProfileUser/:id", UserAuth, isUser, updateProfileUser);
indexRoutes.put("/updateProfileAdmin/:id", UserAuth, isAdmin, updateProfileAdmin);
indexRoutes.delete("/deleteRegister/:id", UserAuth, isAdmin, deleteRegister);

// =======================
// Login / Auth Routes
// =======================
indexRoutes.post('/loginUser', loginUser);
indexRoutes.post('/forgotPassword', forgotPassword);
indexRoutes.post('/VerifyEmail', VerifyEmail);
indexRoutes.post('/resetPassword', resetPassword);
indexRoutes.post('/changePassword', UserAuth, changePassword);

// =======================
// Appointment Routes
// =======================
indexRoutes.post('/createAppointment', UserAuth, createAppointment);
indexRoutes.get('/getAllAppointments', UserAuth, getAllAppointments);
indexRoutes.get('/getAppointmentById/:id', UserAuth, getAppointmentById);
indexRoutes.put('/updateAppointment/:id', UserAuth, updateAppointment);
indexRoutes.delete('/deleteAppointment/:id', UserAuth, deleteAppointment);
indexRoutes.put('/revertToPending/:id', UserAuth, revertToPending);

// =======================
// Invoice Routes
// =======================
indexRoutes.post('/createInvoice', UserAuth, createInvoice);
indexRoutes.get('/getAllInvoices', UserAuth, getAllInvoices);
indexRoutes.get('/searchInvoices', UserAuth, searchInvoices);
indexRoutes.get('/getInvoiceById/:id', UserAuth, getInvoiceById);
indexRoutes.put('/updateInvoice/:id', UserAuth, updateInvoice);
indexRoutes.delete('/deleteInvoice/:id', UserAuth, deleteInvoice);

// =======================
// Customers / Stats Routes
// =======================
indexRoutes.get('/getCustomersDashboard', UserAuth, getCustomersDashboard);

// =======================
// Dashboard Routes
// =======================
indexRoutes.get('/getDashboardStats', UserAuth, getDashboardStats);

// =======================
// Service Routes
// =======================
indexRoutes.post('/createService', UserAuth, createService);
indexRoutes.get('/getAllServices', UserAuth, getAllServices);
indexRoutes.get('/getServiceById/:id', UserAuth, getServiceById);
indexRoutes.put('/updateService/:id', UserAuth, updateService);
indexRoutes.delete('/deleteService/:id', UserAuth, deleteService);

export default indexRoutes;