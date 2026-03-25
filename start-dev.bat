@echo off
REM SmartAttend Development Start Script

echo.
echo ========================================
echo   Starting SmartAttend...
echo ========================================
echo.

REM Start backend in a new window
echo [INFO] Starting backend server...
cd backend
start "SmartAttend - Backend" cmd /k "npm.cmd start"
cd ..

REM Wait a moment for backend to start
timeout /t 2 /nobreak

REM Start frontend in a new window
echo [INFO] Starting frontend...
cd frontend
start "SmartAttend - Frontend" cmd /k "npm.cmd start"
cd ..

echo.
echo ========================================
echo   Application Starting...
echo ========================================
echo.
echo Frontend URL: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo Two windows will open for backend and frontend
echo Make sure your camera is connected!
echo.
echo To stop the application, close both windows
echo.
pause
