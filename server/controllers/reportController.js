const Order = require("../models/Order");
const Product = require("../models/Product");

function parseDateRange(query) {
  const { startDate, endDate } = query;
  if (!startDate && !endDate) return { start: null, end: null };
  if (!startDate || !endDate) throw new Error("Both startDate and endDate are required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error("Dates must use YYYY-MM-DD format.");
  }
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
      start.toISOString().slice(0, 10) !== startDate || end.toISOString().slice(0, 10) !== endDate || start > end) {
    throw new Error("Provide a valid date range where the start is on or before the end.");
  }
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function getReports(req, res, next) {
  try {
    let range;
    try {
      range = parseDateRange(req.query);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    const match = range.start ? { createdAt: { $gte: range.start, $lt: range.end } } : {};
    const seriesFormat = req.query.granularity === "month" ? "%Y-%m" : "%Y-%m-%d";

    const [orders, statuses, trend, topProducts, inventoryByCategory] = await Promise.all([
      Order.find(match).select("userId customerName customerContact createdAt items total status").sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...match, status: { $ne: "Cancelled" } } },
        { $group: { _id: { $dateToString: { format: seriesFormat, date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { ...match, status: { $ne: "Cancelled" } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.productId", productName: { $first: "$items.productName" }, quantity: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } } } },
        { $sort: { quantity: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
      Product.aggregate([
        { $group: { _id: "$category", productCount: { $sum: 1 }, unitsInStock: { $sum: "$stockQuantity" }, inventoryValue: { $sum: { $multiply: ["$price", "$stockQuantity"] } } } },
        { $sort: { inventoryValue: -1 } },
      ]),
    ]);

    const summary = orders.reduce((result, order) => {
      result.totalOrders += 1;
      if (order.status !== "Cancelled") {
        result.totalQuantitySold += order.items.reduce((sum, item) => sum + item.quantity, 0);
        result.totalRevenue += order.total;
      }
      return result;
    }, { totalOrders: 0, totalQuantitySold: 0, totalRevenue: 0 });
    const statusCounts = Object.fromEntries(["Pending", "Confirmed", "Shipped", "Cancelled"].map((status) => [status, 0]));
    for (const status of statuses) statusCounts[status._id] = status.count;

    return res.json({
      summary,
      statusCounts,
      trend,
      topProducts,
      inventoryByCategory,
      orders: orders.map((order) => ({
        id: order._id,
        customerName: order.customerName,
        contactEmail: order.customerContact,
        orderDate: order.createdAt,
        totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: order.total,
        status: order.status,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getReports };
