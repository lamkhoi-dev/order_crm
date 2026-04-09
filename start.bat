@echo off
cd /d "%~dp0"
title Ha Noi Xua POS
color 0E

echo ===================================================
echo     PHAN MEM QUAN LY BAN HANG - HA NOI XUA
echo ===================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [Loi] Chua cai dat Node.js tren may tinh nay.
    echo Vui long truy cap https://nodejs.org/ de tai va cai dat.
    pause
    exit /b
)

echo [1/3] Dang khoi dong May chu du lieu (Backend)...
start "Backend Server (Khong tat cua so nay)" cmd /k "cd server && node index.js"

echo [2/3] Dang khoi dong Giao dien (Frontend)...
start "Frontend Server (Khong tat cua so nay)" cmd /k "npm run dev"

echo [3/3] Dang ket noi may in va mo trinh duyet...
:: Cho vai giay de server khoi dong
ping 127.0.0.1 -n 4 >nul
start http://localhost:5173

echo.
echo =========================================================
echo   HE THONG DA KHOI DONG THANH CONG!
echo   VUI LONG KHONG TAT 2 CUA SO DEN VUA CHAY LEN.
echo =========================================================
pause
