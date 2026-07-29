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

echo.
echo Dang kiem tra database engine...
node -e "new (require('better-sqlite3'))(':memory:'); console.log('OK')" >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ===================================================
    echo [CANH BAO] Database engine chua san sang!
    echo Neu ban thay loi Python/node-gyp o tren, hay cai:
    echo   - Python 3: https://www.python.org/downloads/
    echo   - Visual Studio Build Tools ^(chon "Desktop development with C++"^)
    echo Sau do chay lai setup.bat.
    echo ===================================================
    cd ..
    pause
    exit /b 1
)
echo Database engine OK.
cd ..

echo.
echo ===================================================
echo HOAN TAT CAI DAT! Ban da co the chay start.bat.
echo ^(Neu thay dong loi mau do ve Python/node-gyp o tren, bo qua binh
echo  thuong - chi la canh bao, khong anh huong toi phan mem.^)
echo ===================================================
pause
