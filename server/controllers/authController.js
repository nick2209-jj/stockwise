const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    address: user.address,
  };
}

const authController = {
  async register(req, res) {
    try {
      const { name, email, address, password } = req.body;
      if (!name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ message: "Name, email, and password are required." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ message: "A user with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        address: address?.trim() || "",
        passwordHash,
      });

      return res.status(201).json({
        message: "User registered successfully.",
        token: generateToken(user._id),
        user: publicUser(user),
      });
    } catch (error) {
      console.error("User registration failed.", error);
      return res.status(500).json({ message: "Unable to register user." });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email?.trim() || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      return res.status(200).json({
        message: "Login successful.",
        token: generateToken(user._id),
        user: publicUser(user),
      });
    } catch (error) {
      console.error("User login failed.", error);
      return res.status(500).json({ message: "Unable to log in." });
    }
  },
};

module.exports = authController;
