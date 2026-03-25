@echo off
REM SmartAttend Development Start Script

echo.
echo ========================================
echo   Starting SmartAttend...
echo ========================================
echo.

REM Start Python backend in a new window
echo [INFO] Starting Python backend server...
start "SmartAttend - Python Backend" cmd /k "cd /d %~dp0python_backend && if not exist .venv\Scripts\activate (echo [ERROR] Python backend venv not found. Run setup.bat first. && pause) else (call .venv\Scripts\activate && python run.py)"

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
echo Backend API (Python): http://localhost:5000
echo.
echo Two windows will open for backend and frontend
echo Make sure your camera is connected!
echo.
echo To stop the application, close both windows
echo.
pause
