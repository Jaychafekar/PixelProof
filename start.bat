@echo off
REM Start PixelProof Backend and Frontend

echo.
echo ================================
echo   PixelProof Startup Script
echo ================================
echo.

REM Get the project directory
cd /d "%~dp0"

REM Start Backend in a new window
echo Starting Backend Server...
start "PixelProof Backend" cmd /k "cd code\backend && C:\Users\JAY\Desktop\PixelProof\venv\Scripts\python.exe main.py"

timeout /t 3 /nobreak

REM Start Frontend in a new window
echo Starting Frontend Server...
start "PixelProof Frontend" cmd /k "cd code\frontend && npm run dev"

echo.
echo ================================
echo   Servers Starting...
echo ================================
echo.
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo API Docs: http://127.0.0.1:8000/docs
echo.
pause
