const jwt = require("jsonwebtoken");

function generateToken(userId, role) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign({ sub: userId.toString(), userId: userId.toString(), role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

module.exports = generateToken;
