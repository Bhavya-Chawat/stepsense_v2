@echo off
title StepSense - Install Dependencies
echo ========================================================
echo         StepSense Monorepo - Installing Dependencies
echo ========================================================
echo.
cd /d "%~dp0"
call npm install
echo.
echo ========================================================
echo         Dependencies installed successfully!
echo ========================================================
pause
