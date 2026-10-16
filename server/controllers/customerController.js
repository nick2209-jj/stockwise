const Order = require("../models/Order");
const User = require("../models/User");

async function listCustomers(_req, res, next) {
  try {
    const [users, orderSummaries] = await Promise.all([
      User.find({ role: "Customer" }).select("name email createdAt").sort({ name: 1 }).lean(),
      Order.aggregate([
        {
          $group: {
            _id: "$userId",
            totalOrders: { $sum: 1 },
            lifetimeSpent: {
              $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, "$total", 0] },
            },
            lastOrderDate: { $max: "$createdAt" },
          },
        },
      ]),
    ]);
    const summariesByUser = new Map(orderSummaries.map((summary) => [summary._id.toString(), summary]));
    return res.json(users.map((user) => {
      const summary = summariesByUser.get(user._id.toString());
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        totalOrders: summary?.totalOrders || 0,
        lifetimeSpent: summary?.lifetimeSpent || 0,
        lastOrderDate: summary?.lastOrderDate || null,
      };
    }));
  } catch (error) {
    return next(error);
  }
}

async function customerOrderHistory(req, res, next) {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: "Customer" }).select("_id");
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    const orders = await Order.find({ userId: customer._id }).sort({ createdAt: -1 }).lean();
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
}

module.exports = { customerOrderHistory, listCustomers };
