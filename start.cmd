@echo off
title AcademiaHub
echo ========================================
echo   AcademiaHub - Starting Services
echo ========================================

echo.
echo [1/2] Starting Backend...
start "AcademiaHub Backend" cmd /k "cd backend && npm run dev"

echo [2/2] Starting Frontend...
start "AcademiaHub Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting in separate windows.
echo   Backend  - http://localhost:4000
echo   Frontend - http://localhost:3001
echo.
echo Close this window or press any key to exit.
pause >nul
