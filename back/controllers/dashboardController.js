import Invoice from '../models/invoiceModel.js';
import { ThrowError } from '../utils/ErrorUtils.js';
import { sendSuccessResponse } from '../utils/ResponseUtils.js';

export const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchQuery = {};

        if (startDate && endDate) {
            matchQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            matchQuery.createdAt = {
                $gte: new Date(startDate)
            };
        } else if (endDate) {
            matchQuery.createdAt = {
                $lte: new Date(endDate)
            };
        }

        const stats = await Invoice.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    totalInvoices: { $sum: 1 },
                    uniqueCustomers: { $addToSet: "$mobileNumber" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalRevenue: 1,
                    totalInvoices: 1,
                    totalCustomers: { $size: "$uniqueCustomers" }
                }
            }
        ]);

        const defaultStats = {
            totalRevenue: 0,
            totalInvoices: 0,
            totalCustomers: 0
        };

        const result = stats.length > 0 ? stats[0] : defaultStats;

        return sendSuccessResponse(res, "Dashboard stats fetched successfully", result);

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
