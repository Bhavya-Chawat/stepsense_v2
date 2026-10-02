@echo off
title StepSense Control Panel
:menu
cls
echo ========================================================
echo               STEPSENSE PROJECT LAUNCHER
echo ========================================================
echo.
echo   1. Start Web Dashboard  (Vite + React)
echo   2. Start Mobile App     (Expo + React Native)
echo   3. Start Both (Web & Mobile in separate windows)
echo   4. Install All Monorepo Dependencies
echo   5. Exit
echo.
echo ========================================================
set /p choice="Select an option (1-5): "

if "%choice%"=="1" goto web
if "%choice%"=="2" goto mobile
if "%choice%"=="3" goto both
if "%choice%"=="4" goto install
if "%choice%"=="5" goto end

echo Invalid selection, try again.
ping 127.0.0.1 -n 2 > nul
goto menu

:web
echo Starting Web Dashboard...
start "StepSense Web" cmd /k "%~dp0start-web.bat"
goto menu

:mobile
echo Starting Mobile App...
start "StepSense Mobile" cmd /k "%~dp0start-mobile.bat"
goto menu

:both
echo Starting Web Dashboard and Mobile App...
start "StepSense Web" cmd /k "%~dp0start-web.bat"
start "StepSense Mobile" cmd /k "%~dp0start-mobile.bat"
goto menu

:install
echo Installing Monorepo Dependencies...
call "%~dp0install-deps.bat"
goto menu

:end
echo Goodbye!
