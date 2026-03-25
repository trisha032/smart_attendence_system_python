# SmartAttend - Face Recognition Attendance System

A modern, student-friendly web application for managing attendance using face recognition technology.

## Features

✨ **Face Recognition Registration** - Register your face for the attendance system
📸 **Smart Attendance Marking** - Mark attendance with face recognition
📊 **Dashboard** - View attendance records and statistics
📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
🎨 **Modern UI/UX** - Clean and intuitive interface designed for students

## Architecture

```
smart_attendence_system_python/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API service layer
│   │   ├── pages/           # Page components
│   │   └── App.js           # Main app component
│   └── package.json
├── backend/                  # Express.js backend
│   ├── server.js            # Main server file
│   ├── package.json
│   └── .env
├── register.py              # Python face registration script
├── recognize.py             # Python face recognition script
├── dataset/                 # Stores registered face images
└── attendance/              # Stores attendance records
```

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- npm or yarn
- Webcam/Camera device
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Clone and Setup

```bash
cd "d:\MERN FULL STACK\HACKATHON(AIML)\smart_attendence_system_python"
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm.cmd install

# Start the server
npm.cmd start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm.cmd install

# Start the development server
npm.cmd start
```

The frontend will run on `http://localhost:3000`

## Usage

### For Students

1. **First Time Users:**
   - Click "Enter System" on the login page
   - Go to "Register Face" section
   - Enter your full name
   - Click "Start Camera"
   - Capture 15-20 face images from different angles
   - Click "Complete Registration"

2. **Mark Attendance:**
   - Go to "Mark Attendance" section
   - Click "Start Camera"
   - Position your face in the center circle
   - Click "Capture & Mark Attendance"
   - Your attendance will be marked automatically

3. **View Records:**
   - Dashboard shows all attendance records
   - Filter by student name
   - View attendance statistics

## API Endpoints

### Health Check

- `GET /api/health` - Check if API is running

### Face Registration

- `POST /api/register` - Register new student face
  - Body: FormData with `name` and `images` (array)
  - Response: Success message

### Attendance

- `POST /api/mark-attendance` - Mark attendance with face recognition
  - Body: FormData with `image` (single image)
  - Response: Student name, date, time

- `GET /api/attendance` - Get all attendance records
  - Query: `name` (optional) - Filter by student name
  - Response: Array of attendance records

- `GET /api/attendance/:name` - Get specific student's attendance
  - Response: Array of attendance records for that student

### Students

- `GET /api/students` - Get all registered students
  - Response: Array of student names

## Technology Stack

### Frontend

- **React.js** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client

### Backend

- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling
- **Node.js** - Runtime environment

### Python (Backend Support)

- **OpenCV** - Computer vision library
- **DeepFace** - Face recognition
- **Pandas** - Data processing

## Project Structure Details

### Components

#### Navigation

- Responsive navigation bar
- Page switching
- Logo and branding
- Mobile menu support

#### RegisterFace

- Face capture from webcam
- Multiple image handling
- Image preview grid
- Registration form
- Error and success handling

#### MarkAttendance

- Real-time face capture
- Recognition feedback
- Attendance confirmation
- Success/error messages
- Instructions for users

#### Dashboard

- Attendance statistics
- Records table
- Student filtering
- Date and time display
- Present count

## Configuration

### Environment Variables

**Frontend (.env)**

```
REACT_APP_API_URL=http://localhost:5000/api
```

**Backend (.env)**

```
PORT=5000
PYTHON_SCRIPT_PATH=../
```

## Styling Customization

The application uses Tailwind CSS with custom colors:

- Primary: Indigo (#4F46E5)
- Secondary: Purple (#7C3AED)
- Success: Green/Emerald
- Error: Red

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Optimization

- Image compression in registration
- Lazy loading of components
- Optimized API calls
- Responsive image loading
- Efficient state management

## Security Features

- CORS configuration
- File upload validation
- Input sanitization
- Environment variables for sensitive data
- Error message sanitization

## Troubleshooting

### Camera Not Working

- Check browser camera permissions
- Ensure HTTPS or localhost is used
- Try a different browser
- Restart the browser

### API Connection Error

- Verify backend is running on port 5000
- Check .env file has correct API URL
- Ensure CORS is properly configured
- Check network connectivity

### Registration Issues

- Capture at least 5 images (15-20 recommended)
- Ensure good lighting
- Face should be clearly visible
- Avoid blurry images

### Attendance Recognition Issues

- Register with diverse angles/lighting
- Use good quality images
- Ensure face is clearly visible in frame
- Try with different expressions

## Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication system
- [ ] Admin panel for attendance management
- [ ] Automated email notifications
- [ ] QR code verification
- [ ] Multi-factor authentication
- [ ] Analytics and reporting
- [ ] Attendance history export
- [ ] Mobile app version
- [ ] Real-time live tracking

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please create an issue on the GitHub repository.

---

Made with ❤️ for students | SmartAttend © 2024
