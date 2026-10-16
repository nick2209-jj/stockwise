const path = require("node:path");
const envPath = path.resolve(__dirname, "../.env");
require("dotenv").config({ path: envPath });
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const InventoryMovement = require("../models/InventoryMovement");

const sampleProducts = [
  { name: "Ceramic Pour-over Set", sku: "KT-2048", description: "Hand-finished ceramic coffee set.", category: "Kitchen", price: 42, stockQuantity: 18 },
  { name: "Linen Table Runner", sku: "HM-1092", description: "Natural linen table runner.", category: "Home", price: 36, stockQuantity: 6 },
  { name: "Everyday Tote Bag", sku: "AC-3301", description: "Reusable canvas tote bag.", category: "Accessories", price: 28, stockQuantity: 42 },
  { name: "Wildflower Candle", sku: "HM-1056", description: "Soy wax candle with a floral scent.", category: "Home", price: 24, stockQuantity: 4 },
  { name: "Stoneware Mug", sku: "KT-2077", description: "Wheel-thrown stoneware mug.", category: "Kitchen", price: 19, stockQuantity: 31 },
  { name: "Botanical Print Set", sku: "AR-7810", description: "Set of two botanical art prints.", category: "Art & Prints", price: 32, stockQuantity: 0 },
  { name: "Woven Market Basket", sku: "AC-3388", description: "Handwoven everyday market basket.", category: "Accessories", price: 54, stockQuantity: 8 },
  { name: "Glass Water Bottle", sku: "KT-2014", description: "Glass bottle with a protective sleeve.", category: "Kitchen", price: 22, stockQuantity: 25 },
];

const sampleCustomerData = [
  { name: "Olivia Rhye", email: "olivia@example.com", address: "14 Market Street" },
  { name: "Phoenix Baker", email: "phoenix@example.com", address: "82 Garden Lane" },
  { name: "Lana Steiner", email: "lana@example.com", address: "5 Oak Avenue" },
];

async function seed() {
  const requiredVariables = [
    "MONGODB_URI",
    "ADMIN_NAME",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "SAMPLE_CUSTOMER_PASSWORD",
  ];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());
  if (missingVariables.length) {
    throw new Error(
      `Missing required environment variable(s): ${missingVariables.join(", ")}. ` +
      `Create and fill in ${envPath} (copy server\\.env.example to server\\.env from the project root).`
    );
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(`JWT_SECRET must contain at least 32 characters. Configure it in ${envPath}.`);
  }
  if (process.env.ADMIN_PASSWORD.length < 8 || process.env.SAMPLE_CUSTOMER_PASSWORD.length < 8) {
    throw new Error(`ADMIN_PASSWORD and SAMPLE_CUSTOMER_PASSWORD must be at least 8 characters. Configure them in ${envPath}.`);
  }
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $setOnInsert: {
        name: process.env.ADMIN_NAME.trim(),
        email: adminEmail,
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
        role: "Admin",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const customerPassword = process.env.SAMPLE_CUSTOMER_PASSWORD;
  const customerHash = await bcrypt.hash(customerPassword, 12);
  const customers = [];
  for (const entry of sampleCustomerData) {
    const customer = await User.findOneAndUpdate(
      { email: entry.email },
      { $setOnInsert: { ...entry, passwordHash: customerHash, role: "Customer" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    customers.push(customer);
  }

  const products = [];
  for (const entry of sampleProducts) {
    const product = await Product.findOneAndUpdate(
      { userId: admin._id, sku: entry.sku },
      { $setOnInsert: { ...entry, userId: admin._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    products.push(product);
  }

  const samples = [
    { key: "seed-olivia-pending", customer: customers[0], product: products[0], quantity: 1, status: "Pending" },
    { key: "seed-phoenix-confirmed", customer: customers[1], product: products[2], quantity: 2, status: "Confirmed" },
    { key: "seed-lana-shipped", customer: customers[2], product: products[4], quantity: 3, status: "Shipped" },
    { key: "seed-olivia-cancelled", customer: customers[0], product: products[1], quantity: 1, status: "Cancelled" },
  ];
  for (const sample of samples) {
    const total = sample.product.price * sample.quantity;
    await Order.findOneAndUpdate(
      { seedKey: sample.key },
      {
        $setOnInsert: {
          seedKey: sample.key,
          userId: sample.customer._id,
          customerName: sample.customer.name,
          customerContact: sample.customer.email,
          shippingAddress: sample.customer.address,
          items: [{ productId: sample.product._id, productName: sample.product.name, quantity: sample.quantity, unitPrice: sample.product.price }],
          total,
          status: sample.status,
          stockReserved: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const seededMovementCount = await InventoryMovement.countDocuments({ reason: "Audit", userId: admin._id });
  if (!seededMovementCount) {
    await InventoryMovement.insertMany([
      { productId: products[0]._id, userId: admin._id, quantityChange: 8, reason: "Restock" },
      { productId: products[1]._id, userId: admin._id, quantityChange: -2, reason: "Damaged" },
      { productId: products[3]._id, userId: admin._id, quantityChange: 12, reason: "Audit" },
      { productId: products[6]._id, userId: admin._id, quantityChange: -1, reason: "CUSTOMER_ORDER" },
    ]);
  }

  console.log(`Seed complete. Admin: ${admin.email}. Sample customer accounts use SAMPLE_CUSTOMER_PASSWORD.`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Database seeding failed.", error);
    process.exit(1);
  });
