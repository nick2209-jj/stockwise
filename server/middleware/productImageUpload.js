const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const multer = require("multer");

const uploadDirectory = path.resolve(__dirname, "../uploads");
const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await fs.mkdir(uploadDirectory, { recursive: true });
      callback(null, uploadDirectory);
    } catch (error) {
      callback(error);
    }
  },
  filename: (_req, file, callback) => {
    const extension = allowedTypes.get(file.mimetype);
    if (!extension) return callback(new Error("Only JPEG, PNG, WebP, and GIF images are supported."));
    return callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize, files: 1, fields: 10, fieldSize: 16 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error("Only JPEG, PNG, WebP, and GIF images are supported."));
    }
    return callback(null, true);
  },
});

function hasValidSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/gif") return buffer.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/) !== null;
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

async function verifyImageSignature(req, res, next) {
  req.body = req.body || {};
  if (!req.file) return next();
  try {
    const image = await fs.open(req.file.path, "r");
    const header = Buffer.alloc(12);
    let bytesRead;
    try {
      ({ bytesRead } = await image.read(header, 0, header.length, 0));
    } finally {
      await image.close();
    }
    if (hasValidSignature(header.subarray(0, bytesRead), req.file.mimetype)) return next();
    await fs.unlink(req.file.path);
    return res.status(400).json({ message: "The uploaded file is not a valid supported image." });
  } catch (error) {
    await fs.unlink(req.file.path).catch((cleanupError) => {
      if (cleanupError.code !== "ENOENT") console.error("Unable to clean up unreadable product image.", cleanupError);
    });
    return next(error);
  }
}

const uploadProductImage = [upload.single("image"), verifyImageSignature];

module.exports = { uploadDirectory, uploadProductImage };
