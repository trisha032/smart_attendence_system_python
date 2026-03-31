@echo off
REM SmartAttend Development Start Script

echo.
echo ========================================
echo   Starting SmartAttend...
echo ========================================
echo.

REM Free required ports to prevent EADDRINUSE failures
echo [INFO] Checking and freeing ports 5000 and 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
	taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
	taskkill /F /PID %%a >nul 2>&1
)

REM Start Python backend in a new window
echo [INFO] Starting Python backend server...
start "SmartAttend - Python Backend" cmd /k "cd /d %~dp0python_backend && if not exist .venv\Scripts\activate (echo [ERROR] Python backend venv not found. Run setup.bat first. && pause) else (call .venv\Scripts\activate && python run.py)"

REM Wait a moment for FastAPI startup
timeout /t 2 /nobreak

REM Start Node backend in a new window
echo [INFO] Starting Node backend...
start "SmartAttend - Node Backend" cmd /k "cd /d %~dp0backend && npm.cmd start"

REM Wait a moment for Node backend to start
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
echo Backend API (Node): http://localhost:5000
echo Embedding Service (FastAPI): http://localhost:8000
echo.
echo Three windows will open for FastAPI, Node backend and frontend
echo Make sure your camera is connected!
echo.
echo To stop the application, close all opened windows
echo.
pause
