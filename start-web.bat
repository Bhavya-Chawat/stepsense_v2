@echo off
title StepSense - Web Application Dashboard
echo ========================================================
echo         Starting StepSense Web Dashboard (Vite)
echo ========================================================
echo.
cd /d "%~dp0apps\web"
call npm run dev
pause
