@echo off
title StepSense - Mobile Application (Expo)
echo ========================================================
echo         Starting StepSense Mobile App (Expo)
echo ========================================================
echo.
cd /d "%~dp0apps\mobile"
call npm start
pause
