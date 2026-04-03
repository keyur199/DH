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
                    totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
                    cashRevenue: {
                        $sum: {
                            $cond: [
                                { $ne: ["$paymentMethod", "Online"] },
                                { $ifNull: ["$totalAmount", 0] },
                                0
                            ]
                        }
                    },
                    onlineRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentMethod", "Online"] },
                                { $ifNull: ["$totalAmount", 0] },
                                0
                            ]
                        }
                    },
                    totalInvoices: { $sum: 1 },
                    uniqueCustomers: { $addToSet: "$mobileNumber" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalRevenue: { $ifNull: ["$totalRevenue", 0] },
                    cashRevenue: { $ifNull: ["$cashRevenue", 0] },
                    onlineRevenue: { $ifNull: ["$onlineRevenue", 0] },
                    totalInvoices: 1,
                    totalCustomers: { $size: { $ifNull: ["$uniqueCustomers", []] } }
                }
            }
        ]);

        const defaultStats = {
            totalRevenue: 0,
            cashRevenue: 0,
            onlineRevenue: 0,
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
        const { startDate, endDate } = req.query;

        // CHECK IF DAILY OR MONTHLY (based on range)
        let isDaily = false;
        let dayDiff = 0;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            dayDiff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
            if (dayDiff <= 45) isDaily = true; // Use daily if <= 45 days
        }

        if (isDaily) {
            // DAILY AGGREGATION
            const growth = await Invoice.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: "$date",
                        revenue: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            // Fill all dates in range with 0 if missing
            const resultData = [];
            const labels = [];
            let curr = new Date(startDate);
            const end = new Date(endDate);

            while (curr <= end) {
                const dateStr = curr.toISOString().split('T')[0];
                const found = growth.find(g => g._id === dateStr);

                // Friendly label (DD/MM)
                const d = curr.getDate();
                const m = curr.getMonth() + 1;
                labels.push(`${d}/${m}`);
                resultData.push(found ? found.revenue : 0);

                curr.setDate(curr.getDate() + 1);
            }

            return sendSuccessResponse(res, "Daily growth data fetched", { data: resultData, labels, type: 'daily' });

        } else {
            // MONTHLY AGGREGATION (Default/Long Range)
            let year = new Date().getFullYear().toString();
            // Same year logic as before...
            if (startDate) {
                year = startDate.split(/[-/]/)[0];
                if (year.length !== 4) year = startDate.split(/[-/]/)[2];
            }

            const growth = await Invoice.aggregate([
                {
                    $match: {
                        $or: [
                            { date: { $regex: `^${year}-` } },
                            { date: { $regex: `-${year}$` } }
                        ]
                    }
                },
                {
                    $addFields: {
                        monthValue: {
                            $cond: {
                                if: { $regexMatch: { input: "$date", regex: "^\\d{4}-" } },
                                then: { $toInt: { $substr: ["$date", 5, 2] } },
                                else: { $toInt: { $substr: ["$date", 3, 2] } }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$monthValue",
                        revenue: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            const monthlyData = new Array(12).fill(0);
            growth.forEach(item => {
                if (item._id >= 1 && item._id <= 12) {
                    monthlyData[item._id - 1] = item.revenue;
                }
            });

            const monthsLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return sendSuccessResponse(res, "Monthly growth data fetched", { data: monthlyData, labels: monthsLabels, type: 'monthly', year });
        }
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
