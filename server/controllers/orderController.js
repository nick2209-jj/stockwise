const InventoryMovement = require("../models/InventoryMovement");
const Order = require("../models/Order");
const Product = require("../models/Product");

async function restoreReservedStock(order, actorId) {
  if (!order.stockReserved) return;
  for (const item of order.items) {
    const product = await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity } });
    if (product) {
      await InventoryMovement.create({
        productId: item.productId,
        userId: actorId,
        quantityChange: item.quantity,
        reason: "ORDER_CANCELLED",
        orderId: order._id,
      });
    }
  }
  order.stockReserved = false;
}

async function createOrder(req, res, next) {
  const { customerName, customerContact, shippingAddress, items } = req.body;
  const orderCustomerName = req.user.role === "Customer" ? req.user.name : customerName;
  const orderCustomerContact = req.user.role === "Customer" ? req.user.email : customerContact;
  if (!orderCustomerName?.trim() || !orderCustomerContact?.trim() || !shippingAddress?.trim() || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: "Customer details, shipping address, and at least one order item are required." });
  }

  const requested = new Map();
  for (const item of items) {
    if (!item.productId || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({ message: "Each item must have a product and positive whole quantity." });
    }
    requested.set(item.productId, (requested.get(item.productId) || 0) + item.quantity);
  }

  const reserved = [];
  let createdOrder;
  try {
    const productIds = [...requested.keys()];
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) return res.status(400).json({ message: "One or more selected products do not exist." });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    for (const [productId, quantity] of requested) {
      const product = productMap.get(productId);
      const updated = await Product.findOneAndUpdate(
        { _id: productId, stockQuantity: { $gte: quantity } },
        { $inc: { stockQuantity: -quantity } },
        { new: true }
      );
      if (!updated) {
        await Promise.all(reserved.map((reservation) => Product.findByIdAndUpdate(reservation.productId, { $inc: { stockQuantity: reservation.quantity } })));
        return res.status(409).json({ message: `Insufficient stock for ${product.name}.` });
      }
      reserved.push({ productId, quantity });
    }

    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId);
      return { productId: product._id, productName: product.name, quantity: item.quantity, unitPrice: product.price };
    });
    createdOrder = await Order.create({
      userId: req.user._id,
      customerName: orderCustomerName.trim(),
      customerContact: orderCustomerContact.trim(),
      shippingAddress: shippingAddress.trim(),
      items: orderItems,
      total: orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      status: "Pending",
      stockReserved: true,
    });
    await InventoryMovement.insertMany(reserved.map((item) => ({
      productId: item.productId,
      userId: req.user._id,
      quantityChange: -item.quantity,
      reason: "CUSTOMER_ORDER",
      orderId: createdOrder._id,
    })));
    return res.status(201).json(createdOrder);
  } catch (error) {
    if (createdOrder) {
      await InventoryMovement.deleteMany({ orderId: createdOrder._id });
      await Order.findByIdAndDelete(createdOrder._id);
    }
    await Promise.all(reserved.map((item) => Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity } })));
    return next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const filter = req.user.role === "Admin" ? {} : { userId: req.user._id };
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  const { status } = req.body;
  if (!["Confirmed", "Shipped", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid order status transition." });
  }
  try {
    const current = await Order.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Order not found." });
    const transitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Shipped", "Cancelled"],
    };
    if (!transitions[current.status]?.includes(status)) {
      return res.status(409).json({ message: `Cannot change an order from ${current.status} to ${status}.` });
    }
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: current.status },
      { $set: { status } },
      { new: true }
    );
    if (!order) return res.status(409).json({ message: "Order status changed in another request. Refresh and try again." });
    if (status === "Cancelled") {
      await restoreReservedStock(order, req.user._id);
      order.stockReserved = false;
      await order.save();
    }
    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

async function cancelMyOrder(req, res, next) {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: "Pending" },
      { $set: { status: "Cancelled" } },
      { new: true }
    );
    if (!order) {
      const exists = await Order.exists({ _id: req.params.id, userId: req.user._id });
      return exists
        ? res.status(409).json({ message: "Only pending orders can be cancelled." })
        : res.status(404).json({ message: "Order not found." });
    }
    await restoreReservedStock(order, req.user._id);
    order.stockReserved = false;
    await order.save();
    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

module.exports = { createOrder, listOrders, updateOrderStatus, cancelMyOrder };
