import Invoice from '../models/invoiceModel.js';
import { ThrowError } from '../utils/ErrorUtils.js';
import { sendSuccessResponse } from '../utils/ResponseUtils.js';

export const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchQuery = {};

        // Use the new 'date' field (string YYYY-MM-DD) for filtering
        if (startDate && endDate) {
            matchQuery.date = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            matchQuery.date = { $gte: startDate };
        } else if (endDate) {
            matchQuery.date = { $lte: endDate };
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

/**
 * Monthly revenue growth for the current year
 */
export const getRevenueGrowth = async (req, res) => {
    try {
        const year = new Date().getFullYear().toString();

        const growth = await Invoice.aggregate([
            {
                $match: {
                    date: { $regex: `^${year}-` }
                }
            },
            {
                $group: {
                    _id: { $month: { $dateFromString: { dateString: "$date" } } },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Initialize 12 months with 0
        const monthlyData = new Array(12).fill(0);
        growth.forEach(item => {
            if (item._id >= 1 && item._id <= 12) {
                monthlyData[item._id - 1] = item.revenue;
            }
        });

        return sendSuccessResponse(res, "Revenue growth data fetched successfully", monthlyData);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

/**
 * Top performing services based on usage count
 */
export const getTopServices = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchQuery = {};
        if (startDate && endDate) matchQuery.date = { $gte: startDate, $lte: endDate };

        const stats = await Invoice.aggregate([
            { $match: matchQuery },
            { $unwind: "$services" },
            {
                $group: {
                    _id: "$services.name",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const totalItems = stats.reduce((acc, item) => acc + item.count, 0);

        const result = stats.map(s => ({
            name: s._id,
            val: totalItems > 0 ? Math.round((s.count / totalItems) * 100) : 0
        }));

        return sendSuccessResponse(res, "Top services fetched successfully", result);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
