# PredictaMaint — Full Stack PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   PREDICTAMAINT — AI PREDICTIVE MAINTENANCE PLATFORM   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot
$env:NODE_EXTRA_CA_CERTS = "$root\avast_root.pem"

Write-Host "[1/3] Starting Express Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:NODE_EXTRA_CA_CERTS='$root\avast_root.pem'; cd '$root\server'; npm start"

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting Vite Frontend Client (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:NODE_EXTRA_CA_CERTS='$root\avast_root.pem'; cd '$root\client'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "[3/3] Starting Python Analytics & Simulation Pipeline..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\analytics'; python run_pipeline.py"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host " All services launched successfully!" -ForegroundColor Green
Write-Host " - Frontend Client: http://localhost:5173" -ForegroundColor Green
Write-Host " - Backend API:     http://localhost:5000/api/health" -ForegroundColor Green
Write-Host " - Analytics:       Streaming telemetry & computing RUL" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
