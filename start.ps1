# PixelProof Startup Script (PowerShell)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   PixelProof Startup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "code\backend"
$frontendPath = Join-Path $projectRoot "code\frontend"
$pythonCandidates = @(
    (Join-Path $backendPath "venv310\Scripts\python.exe"),
    (Join-Path $backendPath "venv\Scripts\python.exe")
)
$pythonExe = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not (Test-Path $pythonExe)) {
    Write-Host "Python environment not found. Checked:" -ForegroundColor Red
    $pythonCandidates | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

# Build Frontend
Write-Host "Building Frontend Bundle..." -ForegroundColor Green
Push-Location $frontendPath
npm run build
$buildExitCode = $LASTEXITCODE
Pop-Location

if ($buildExitCode -ne 0) {
    Write-Host "Frontend build failed. Startup stopped." -ForegroundColor Red
    exit $buildExitCode
}

# Start Merged App
Write-Host "Starting Merged Backend + Frontend Server..." -ForegroundColor Green

Start-Process -FilePath $pythonExe -ArgumentList "main.py" -WorkingDirectory $backendPath -WindowStyle Normal

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   App Starting..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "App:      http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Cyan
Read-Host
