@echo off
cd /d "%~dp0"
title Ha Noi Xua - Cai Dat Ban Dau
color 0B

echo ===================================================
echo     CAI DAT PHAN MEM BAN HANG HA NOI XUA
echo ===================================================
echo.

echo [1/2] Dang cai dat Giao dien (Frontend)...
call npm install

echo.
echo [2/2] Dang cai dat May chu (Backend)...
cd server
call npm install
cd ..

echo.
echo ===================================================
echo HOAN TAT CAI DAT! Ban da co the chay start.bat.
echo ===================================================
pause
