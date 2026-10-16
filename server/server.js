require("dotenv").config();
const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api/auth", authRoutes);

async function start() {
  await connectDB();
  app.listen(port, () => console.log(`API listening on port ${port}.`));
}

start().catch((error) => {
  console.error("API startup failed.", error);
  process.exitCode = 1;
});
