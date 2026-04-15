@echo off
REM Build and start the merged PixelProof app

echo.
echo ================================
echo   PixelProof Startup Script
echo ================================
echo.

REM Get the project directory
cd /d "%~dp0"

set "PYTHON_EXE=%CD%\code\backend\venv310\Scripts\python.exe"
if not exist "%PYTHON_EXE%" (
  set "PYTHON_EXE=%CD%\code\backend\venv\Scripts\python.exe"
)

if not exist "%PYTHON_EXE%" (
  echo Python environment not found under code\backend\venv310 or code\backend\venv
  pause
  exit /b 1
)

echo Building Frontend Bundle...
cd code\frontend
call npm run build
if errorlevel 1 (
  echo.
  echo Frontend build failed. Startup stopped.
  pause
  exit /b 1
)
cd /d "%~dp0"

echo Starting Merged Backend + Frontend Server...
start "PixelProof App" cmd /k "cd code\backend && ""%PYTHON_EXE%"" main.py"

echo.
echo ================================
echo   App Starting...
echo ================================
echo.
echo App: http://127.0.0.1:8000
echo API Docs: http://127.0.0.1:8000/docs
echo.
pause
