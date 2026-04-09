@echo off
cd /d "%~dp0"
color 0E
title Ha Noi Xua POS

echo ===================================================
echo     PHAN MEM QUAN LY BAN HANG - HA NOI XUA
echo ===================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] May tinh cua ban chua cai dat Node.js.
    echo Vui long tai va cai dat tai: https://nodejs.org/
    pause
    exit /b
)

if not exist node_modules\ (
    echo [INFO] Dang cai dat thu vien...
    call npm install
)

echo [INFO] He thong san sang! Trinh duyet se tu dong mo...
start http://localhost:5173

call npm run dev
pause
