@echo off
title PredictaMaint — Full Stack Launcher
echo ========================================================
echo    PREDICTAMAINT — AI PREDICTIVE MAINTENANCE PLATFORM
echo ========================================================
echo.

set NODE_EXTRA_CA_CERTS=%~dp0avast_root.pem

echo [1/3] Starting Express Backend Server (Port 5000)...
start "PredictaMaint [Backend Server]" cmd /k "cd /d %~dp0server && set NODE_EXTRA_CA_CERTS=%~dp0avast_root.pem && npm start"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Vite Frontend Client (Port 5173)...
start "PredictaMaint [Frontend Client]" cmd /k "cd /d %~dp0client && set NODE_EXTRA_CA_CERTS=%~dp0avast_root.pem && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Python Analytics & Simulation Pipeline...
start "PredictaMaint [Analytics Pipeline]" cmd /k "cd /d %~dp0analytics && python run_pipeline.py"

echo.
echo ========================================================
echo  All services launched!
echo  - Frontend:  http://localhost:5173
echo  - Backend:   http://localhost:5000/api/health
echo  - Analytics: Streaming telemetry every 4s
echo ========================================================
echo.
pause
