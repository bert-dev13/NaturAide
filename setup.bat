@echo off
setlocal
cd /d "%~dp0"
title NatureAide Automated Installer

echo ===============================================================================
echo                NatureAide Windows Automated Setup
echo ===============================================================================
echo.
echo  Starting automated environment installer...
echo  If prompted by Windows UAC, please allow permission.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

echo.
echo Setup process finished. Press any key to close this window.
pause >nul

