# 🚀 Quick Start Guide

## Prerequisites

- ✅ Node.js installed
- ✅ Python 3.8+ installed
- ✅ Webcam/Camera connected
- ✅ Modern web browser

## ⚡ Fastest Setup (3 Steps)

### Step 1: Run Setup Script

```bash
setup.bat
```

This will install all dependencies for both frontend and backend.

### Step 2: Start Backend

```bash
cd backend
npm.cmd start
```

Wait for: `Smart Attendance Backend running on port 5000`

### Step 3: Start Frontend

In a new terminal:

```bash
cd frontend
npm.cmd start
```

Browser will automatically open at `http://localhost:3000`

---

## 🎯 Or Use One-Command Start

```bash
start-dev.bat
```

This opens both backend and frontend in separate windows automatically.

---

## 📝 First Time User Guide

### 1. Enter the System

- Click "Enter System" button
- You'll see the main dashboard

### 2. Register Your Face

- Navigate to "Register Face"
- Enter your full name
- Click "Start Camera"
- Capture 15-20 images (follow the instructions)
- Click "Complete Registration"

### 3. Mark Attendance

- Go to "Mark Attendance"
- Click "Start Camera"
- Position face in center circle
- Click "Capture & Mark Attendance"
- Done! ✅

### 4. View Records

- Dashboard shows all attendance
- Filter by student name
- See statistics and records

---

## 🛠️ Troubleshooting

### Camera Permission Issue

```
Solution: Check browser settings > Camera permissions > Allow
```

### Backend Won't Start

```
1. Check port 5000 is not in use:
   netstat -ano | findstr :5000
2. If in use, kill the process or change PORT in backend/.env
```

### Frontend Can't Connect to Backend

```
1. Verify backend is running on http://localhost:5000/api/health
2. Check REACT_APP_API_URL in frontend/.env
3. Restart frontend
```

### NPM Command Issues

```
Use npm.cmd instead of npm in PowerShell
Example: npm.cmd install instead of npm install
```

---

## 📂 Project Structure

```
smart_attendence_system_python/
├── frontend/          ← React UI (port 3000)
├── backend/           ← Express API (port 5000)
├── dataset/           ← Stored face images
├── attendance/        ← Attendance records
├── register.py        ← Face registration script
├── recognize.py       ← Face recognition script
└── README.md          ← Full documentation
```

---

## 🎨 Features Overview

✨ **Modern UI** - Clean, student-friendly interface
📸 **Face Recognition** - AI-powered attendance marking
📊 **Dashboard** - Real-time statistics and records
📱 **Responsive** - Works on all devices
🔒 **Secure** - CORS protected API
⚡ **Fast** - Optimized performance

---

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

## 💡 Tips

1. **Best Results**: Register in good lighting with different angles
2. **Fast Recognition**: Capture diverse expressions while registering
3. **Attendance**: Keep camera at eye level when marking attendance
4. **Multiple Devices**: Backend works on network (change localhost to IP)

---

## 🆘 Need Help?

1. Check browser console for errors (F12)
2. Check both terminal windows for error messages
3. Restart the application
4. Clear browser cache and try again
5. Check all prerequisites are installed

---

## ✅ Success Checklist

- [ ] Both terminal windows show "running" status
- [ ] Browser opens to http://localhost:3000
- [ ] Can see login screen
- [ ] Can access dashboard after clicking "Enter System"
- [ ] Camera permission is granted

Happy attendance tracking! 🎓
