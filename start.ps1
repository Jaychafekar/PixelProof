# PixelProof Startup Script (PowerShell)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   PixelProof Startup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Green
$backendPath = Join-Path $projectRoot "code\backend"
$pythonExe = "C:\Users\JAY\Desktop\PixelProof\venv\Scripts\python.exe"

Start-Process powershell -ArgumentList @"
cd '$backendPath'
& '$pythonExe' main.py
"@ -WindowTitle "PixelProof Backend"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Green
$frontendPath = Join-Path $projectRoot "code\frontend"

Start-Process powershell -ArgumentList @"
cd '$frontendPath'
npm run dev
"@ -WindowTitle "PixelProof Frontend"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Servers Starting..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Cyan
Read-Host
