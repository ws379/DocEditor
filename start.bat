@echo off
chcp 65001 >nul 2>&1
title DocEditor Startup

echo ============================================
echo   DocEditor 一键启动
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

:: Check and install backend dependencies
echo [1/4] Checking backend dependencies...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo       Installing backend dependencies...
    pip install -r backend\requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo       Backend dependencies OK
)

:: Check and install frontend dependencies
echo [2/4] Checking frontend dependencies...
if not exist node_modules (
    echo       Installing frontend dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo       Frontend dependencies OK
)

:: Check .env file
echo [3/4] Checking backend config...
if not exist backend\.env (
    if exist backend\.env.example (
        echo       Creating backend\.env from example (edit to add API keys)
        copy backend\.env.example backend\.env >nul
    )
)

:: Start backend in new window
echo [4/4] Starting servers...
echo       Backend:  http://localhost:5000
echo       Frontend: http://localhost:5173
echo.

cd /d "%~dp0"
start "Backend" /D "%~dp0" cmd /k python backend\app.py

:: Wait a moment for backend to start
timeout /t 2 /nobreak >nul

:: Start frontend in new window
start "Frontend" /D "%~dp0" cmd /k npm run dev

:: Wait for Vite to start, then open browser
timeout /t 3 /nobreak >nul
start "" http://localhost:5173

echo ============================================
echo   Both servers started!
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:5173
echo.
echo   Close this window or press Ctrl+C to stop.
echo ============================================
pause
