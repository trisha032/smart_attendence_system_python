import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authentication & Registration
export const registerFace = async (studentName, images) => {
  const formData = new FormData();
  formData.append("name", studentName);
  images.forEach((image, index) => {
    formData.append("images", image, `face_${index}.jpg`);
  });

  const response = await api.post("/register", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Mark Attendance
export const markAttendance = async (imageData) => {
  const formData = new FormData();
  formData.append("image", imageData);

  const response = await api.post("/mark-attendance", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Get Attendance Records
export const getAttendanceRecords = async (studentName = null) => {
  const params = studentName ? { name: studentName } : {};
  const response = await api.get("/attendance", { params });
  return response.data;
};

// Get All Students
export const getAllStudents = async () => {
  const response = await api.get("/students");
  return response.data;
};

// Get Student Attendance
export const getStudentAttendance = async (studentName) => {
  const response = await api.get(`/attendance/${studentName}`);
  return response.data;
};

export default api;
