import Invoice from '../models/invoiceModel.js';
import { ThrowError } from '../utils/ErrorUtils.js';
import { sendSuccessResponse } from '../utils/ResponseUtils.js';

export const getCustomersDashboard = async (req, res) => {
    try {
        const { search } = req.query;
        let matchQuery = {};

        if (search) {
            matchQuery.customerName = { $regex: search, $options: 'i' };
        }

        const customers = await Invoice.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$mobileNumber",
                    customerName: { $first: "$customerName" },
                    mobileNumber: { $first: "$mobileNumber" },
                    totalVisits: { $sum: 1 },
                    totalSpent: { $sum: "$totalAmount" },
                    lastVisit: { $max: "$createdAt" }
                }
            },
            {
                $project: {
                    _id: 0,
                    customerName: 1,
                    mobileNumber: 1,
                    totalVisits: 1,
                    totalSpent: 1,
                    lastVisit: 1
                }
            },
            {
                $sort: { lastVisit: -1 }
            }
        ]);

        return sendSuccessResponse(res, "Customers fetched successfully", customers);

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};
