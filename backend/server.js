const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload folder configuration
const uploadsDir = path.join(__dirname, "uploads");
const datasetDir = path.join(__dirname, "../dataset");
const attendanceDir = path.join(__dirname, "../attendance");
const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000";
const FASTAPI_API_KEY = process.env.FASTAPI_API_KEY || "";

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(datasetDir)) {
  fs.mkdirSync(datasetDir, { recursive: true });
}
if (!fs.existsSync(attendanceDir)) {
  fs.mkdirSync(attendanceDir, { recursive: true });
}

// Multer configuration
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const extension =
      path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only jpeg, png and webp images are allowed"));
    }
    cb(null, true);
  },
});

function getUploadErrorMessage(err) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return "Image size must be 5MB or less";
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return "Unexpected upload field. Please upload image files only.";
    }
    return err.message;
  }
  return err.message || "Upload error";
}

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Smart Attendance API is running" });
});

// Register Face
app.post("/api/register", upload.any(), async (req, res) => {
  try {
    const { name, latitude, longitude, location_label } = req.body;
    const images = (req.files || []).filter((file) =>
      ALLOWED_MIME_TYPES.has(file.mimetype),
    );
    const normalizedName = String(name || "").trim();

    if (!normalizedName || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name and at least one image are required",
      });
    }

    const ingestResults = [];
    const ingestErrors = [];
    const latitudeNum =
      latitude !== undefined &&
      latitude !== null &&
      String(latitude).trim() !== ""
        ? Number(latitude)
        : null;
    const longitudeNum =
      longitude !== undefined &&
      longitude !== null &&
      String(longitude).trim() !== ""
        ? Number(longitude)
        : null;

    for (const image of images) {
      try {
        const payload = {
          name: normalizedName,
          image_path: path.resolve(image.path),
          latitude: Number.isFinite(latitudeNum) ? latitudeNum : null,
          longitude: Number.isFinite(longitudeNum) ? longitudeNum : null,
          location_label:
            location_label && String(location_label).trim().length > 0
              ? String(location_label).trim()
              : null,
        };

        const response = await axios.post(
          `${FASTAPI_BASE_URL}/api/embeddings/register`,
          payload,
          {
            timeout: 30000,
            headers: {
              ...(FASTAPI_API_KEY ? { "x-api-key": FASTAPI_API_KEY } : {}),
            },
          },
        );
        ingestResults.push(response.data);
      } catch (error) {
        ingestErrors.push({
          file: image.filename,
          message:
            (error.response &&
              error.response.data &&
              error.response.data.detail) ||
            error.message,
        });
      }
    }

    if (ingestResults.length === 0) {
      return res.status(502).json({
        success: false,
        message: "FastAPI embedding processing failed for all images",
        errors: ingestErrors,
      });
    }

    res.json({
      success: true,
      message: `Face registered successfully for ${normalizedName}`,
      studentsRegistered: normalizedName,
      imagesCount: images.length,
      processedCount: ingestResults.length,
      failedCount: ingestErrors.length,
      errors: ingestErrors,
      results: ingestResults,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error during registration: " + error.message,
    });
  }
});

// Mark Attendance
app.post("/api/mark-attendance", upload.any(), async (req, res) => {
  try {
    const uploadedImage = (req.files || []).find((file) =>
      ALLOWED_MIME_TYPES.has(file.mimetype),
    );

    if (!uploadedImage) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const imagePath = path.resolve(uploadedImage.path);
    const latitudeNum =
      req.body.latitude !== undefined &&
      req.body.latitude !== null &&
      String(req.body.latitude).trim() !== ""
        ? Number(req.body.latitude)
        : null;
    const longitudeNum =
      req.body.longitude !== undefined &&
      req.body.longitude !== null &&
      String(req.body.longitude).trim() !== ""
        ? Number(req.body.longitude)
        : null;

    const payload = {
      image_path: imagePath,
      latitude: Number.isFinite(latitudeNum) ? latitudeNum : null,
      longitude: Number.isFinite(longitudeNum) ? longitudeNum : null,
      location_label:
        req.body.location_label &&
        String(req.body.location_label).trim().length > 0
          ? String(req.body.location_label).trim()
          : null,
    };

    const response = await axios.post(
      `${FASTAPI_BASE_URL}/api/mark-attendance-from-path`,
      payload,
      {
        timeout: 30000,
        headers: {
          ...(FASTAPI_API_KEY ? { "x-api-key": FASTAPI_API_KEY } : {}),
        },
      },
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Attendance error:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({
      success: false,
      message:
        (error.response && error.response.data && error.response.data.detail) ||
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        "Error marking attendance: " + error.message,
    });
  } finally {
    const cleanupFiles = req.files || [];
    for (const file of cleanupFiles) {
      const imagePath = file && file.path ? file.path : null;
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
  }
});

// Get Attendance Records
app.get("/api/attendance", async (req, res) => {
  try {
    const { name } = req.query;
    const response = await axios.get(`${FASTAPI_BASE_URL}/api/attendance`, {
      params: name ? { name } : {},
      timeout: 30000,
      headers: {
        ...(FASTAPI_API_KEY ? { "x-api-key": FASTAPI_API_KEY } : {}),
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Attendance fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance records: " + error.message,
    });
  }
});

// Get All Students
app.get("/api/students", async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_BASE_URL}/api/students`, {
      timeout: 30000,
      headers: {
        ...(FASTAPI_API_KEY ? { "x-api-key": FASTAPI_API_KEY } : {}),
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Students fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching students: " + error.message,
    });
  }
});

// Get Student Attendance
app.get("/api/attendance/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const response = await axios.get(
      `${FASTAPI_BASE_URL}/api/attendance/${encodeURIComponent(name)}`,
      {
        timeout: 30000,
        headers: {
          ...(FASTAPI_API_KEY ? { "x-api-key": FASTAPI_API_KEY } : {}),
        },
      },
    );
    res.json(response.data);
  } catch (error) {
    console.error("Student attendance fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student attendance: " + error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: getUploadErrorMessage(err),
    });
  }

  if (
    err &&
    err.message &&
    err.message.includes("Only jpeg, png and webp images are allowed")
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Server error: " + err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Smart Attendance Backend running on port ${PORT}`);
  console.log(`Server started at http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the running process or change PORT in backend/.env.`,
    );
    process.exit(1);
  }
  console.error("Server failed to start:", err);
  process.exit(1);
});
