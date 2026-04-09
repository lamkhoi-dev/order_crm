@echo off
chcp 65001 >nul
title Ha Noi Xua POS - He Thong Quan Ly
color 0E

echo ===================================================
echo     PHAN MEM QUAN LY BAN HANG - HA NOI XUA
echo ===================================================
echo.

:: 1. Kiểm tra môi trường Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] May tinh cua ban chua cai dat Node.js.
    echo Vui long tai va cai dat tai: https://nodejs.org/ (Chon ban LTS)
    echo Sau khi cai dat xong, hay mo lai file nay.
    pause
    exit
)

:: 2. Tự động cài đặt thư viện nếu chạy lần đầu
if not exist "node_modules\" (
    echo [INFO] Phat hien chay lan dau. Dang tai thu vien...
    echo Vui long doi khoang vai phut...
    call npm install
    echo.
    echo [SUCCESS] Cai dat thu vien thanh cong!
) else (
    echo [INFO] He thong da san sang.
)

:: 3. Chạy lên trình duyệt
echo [INFO] Dang khoi dong May Chu. Trinh duyet se tu dong mo...
echo ===================================================
echo VUI LONG KHONG TAT CUA SO NAY TRONG QUAN TRINH BAN HANG!
echo ===================================================

:: Dùng start để mở web trễ 2 giây chờ server bật xong
start "" "http://localhost:5173"

:: Chạy server (lệnh này sẽ treo cửa sổ console)
call npm run dev

pause
