@echo off
REM SmartAttend Startup Script

echo.
echo ========================================
echo   SmartAttend - Setup & Launch Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://www.python.org
    pause
    exit /b 1
)

echo [INFO] Setting up Python backend virtual environment...
cd python_backend
python -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python backend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [INFO] Installing frontend dependencies...
cd frontend
call npm.cmd install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the application:
echo.
echo OPTION 1 - Manual Start (Two terminals):
echo   Terminal 1 (Python Backend):
echo     cd python_backend
echo     call .venv\Scripts\activate
echo     python run.py
echo.
echo   Terminal 2 (Frontend):
echo     cd frontend
echo     npm.cmd start
echo.
echo OPTION 2 - Use start script:
echo   Run: start-dev.bat
echo.
echo ========================================
echo.
echo Frontend will open at: http://localhost:3000
echo Backend API (Python) at: http://localhost:5000
echo.
echo Make sure your camera is connected!
echo.
pause
