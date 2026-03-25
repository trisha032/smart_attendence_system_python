const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload folder configuration
const uploadDir = path.join(__dirname, "../dataset");
const attendanceDir = path.join(__dirname, "../attendance");

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(attendanceDir)) {
  fs.mkdirSync(attendanceDir, { recursive: true });
}

// Multer configuration
const upload = multer({
  dest: path.join(__dirname, "temp"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Smart Attendance API is running" });
});

// Register Face
app.post("/api/register", upload.array("images", 20), async (req, res) => {
  try {
    const { name } = req.body;
    const images = req.files;

    if (!name || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name and at least one image are required",
      });
    }

    // Create student directory
    const studentDir = path.join(uploadDir, name);
    if (!fs.existsSync(studentDir)) {
      fs.mkdirSync(studentDir, { recursive: true });
    }

    // Move images to student directory
    images.forEach((image, index) => {
      const newPath = path.join(studentDir, `${index}.jpg`);
      fs.renameSync(image.path, newPath);
    });

    res.json({
      success: true,
      message: `Face registered successfully for ${name}`,
      studentsRegistered: name,
      imagesCount: images.length,
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
app.post("/api/mark-attendance", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    // In production, you would call the Python recognition script here
    // For now, we'll simulate the response

    // Read attendance.csv if exists
    const attendanceFile = path.join(attendanceDir, "attendance.csv");
    let attendanceData = [];

    if (fs.existsSync(attendanceFile)) {
      const csvData = fs.readFileSync(attendanceFile, "utf-8");
      const lines = csvData.split("\n");
      attendanceData = lines.slice(1); // Skip header
    }

    // Simulate recognition (in production, integrate with Python deepface)
    const recognizedName = "Student " + Math.floor(Math.random() * 100); // Placeholder
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    res.json({
      success: true,
      message: "Attendance marked successfully",
      student_name: recognizedName,
      date: date,
      time: time,
      timestamp: now.toLocaleString(),
    });

    // Clean up temp file
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } catch (error) {
    console.error("Attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Error marking attendance: " + error.message,
    });
  }
});

// Get Attendance Records
app.get("/api/attendance", async (req, res) => {
  try {
    const attendanceFile = path.join(attendanceDir, "attendance.csv");
    const records = [];

    if (fs.existsSync(attendanceFile)) {
      const csvData = fs.readFileSync(attendanceFile, "utf-8");
      const lines = csvData.split("\n");

      // Skip header and process records
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(",");
          if (parts.length >= 3) {
            records.push({
              name: parts[0],
              date: parts[1],
              time: parts[2],
            });
          }
        }
      }
    }

    // Filter by name if provided
    const { name } = req.query;
    const filtered = name ? records.filter((r) => r.name === name) : records;

    res.json(filtered);
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
    const students = [];

    if (fs.existsSync(uploadDir)) {
      const folders = fs.readdirSync(uploadDir);
      folders.forEach((folder) => {
        const folderPath = path.join(uploadDir, folder);
        if (fs.statSync(folderPath).isDirectory()) {
          students.push(folder);
        }
      });
    }

    res.json(students.sort());
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
    const attendanceFile = path.join(attendanceDir, "attendance.csv");
    const records = [];

    if (fs.existsSync(attendanceFile)) {
      const csvData = fs.readFileSync(attendanceFile, "utf-8");
      const lines = csvData.split("\n");

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(",");
          if (parts.length >= 3 && parts[0] === name) {
            records.push({
              name: parts[0],
              date: parts[1],
              time: parts[2],
            });
          }
        }
      }
    }

    res.json(records);
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
app.listen(PORT, () => {
  console.log(`Smart Attendance Backend running on port ${PORT}`);
  console.log(`Server started at http://localhost:${PORT}`);
});
