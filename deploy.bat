@echo off

echo ======================================================
echo   GITHUB DEPLOYMENT - DON GIAN
echo ======================================================

:: 1. Kiem tra Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [!] LOI: Git chua duoc cai dat.
    pause
    exit /b 1
)

:: 2. Khoi tao repo + remote (neu chua co)
if not exist ".git" git init
git remote get-url origin >nul 2>&1
if errorlevel 1 git remote add origin https://github.com/9dpi/quyhoachsonghong.git

:: 3. Cau hinh user commit
git config user.email "admin@dulieuquyhoach.com"
git config user.name "9dpi-Admin"

:: 4. Nhap ghi chu commit
set "msg="
set /p msg="Ghi chu commit (Enter de dung mac dinh): "
if "%msg%"=="" set "msg=Update Dashboard and Data"

:: 5. Commit
echo [*] Dang commit...
git add .
git commit -m "%msg%"

:: 6. Push
echo [*] Dang day len GitHub...
git push origin HEAD:main

echo ======================================================
echo   XONG! Website se live sau vai phut.
echo ======================================================
pause
