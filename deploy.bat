@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo   GITHUB DEPLOYMENT ENGINE v2.3
echo ======================================================

:: 1. Kiem tra Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] LOI: Git chua duoc cai dat. Vui long cai Git truoc.
    pause
    exit /b 1
)

:: 2. Khoi tao kho Git va remote (neu can)
if not exist ".git" (
    echo [*] Khoi tao kho Git moi...
    git init
)
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Them remote origin...
    git remote add origin https://github.com/9dpi/quyhoachsonghong.git
)

:: 3. Cau hinh user commit (khong dung --global de khong anh huong may khac)
git config user.email "admin@dulieuquyhoach.com"
git config user.name "9dpi-Admin"

:: 4. Dam bao Code.gs khong bi track (da co trong .gitignore)
git rm --cached Code.gs >nul 2>&1

:: 5. Nhap ghi chu commit
set "msg="
set /p msg="Nhap ghi chu cap nhat (Enter de dung mac dinh): "
if "%msg%"=="" set "msg=Update Dashboard and Data"

:: 6. Commit thay doi cuc bo
echo [*] Dang commit thay doi...
git add .
git commit -m "%msg%"
if %errorlevel% neq 0 (
    echo [*] Khong co thay doi moi de commit (hoac da commit san).
)

:: 7. Dong bo voi remote bang pull --rebase (an toan, tranh merge conflict)
echo [*] Dang dong bo voi GitHub...
git pull --rebase origin main
if %errorlevel% neq 0 (
    echo [!] Loi khi dong bo voi remote.
    echo     Neu co conflict, hay giai quyet roi chay lai file nay.
    echo     KHONG dung force push de tranh mat du lieu tu CI/GitHub Actions.
    pause
    exit /b 1
)

:: 8. Day len GitHub
echo [*] Dang day len GitHub...
git push origin HEAD:main
if %errorlevel% neq 0 (
    echo [!] Push bi tu choi. Kiem tra:
    echo     - Dang nhap dung tai khoan GitHub (token co quyen push)
    echo     - Chay lai file nay 1 lan nua de dong bo
    pause
    exit /b 1
)

echo ======================================================
echo   XONG! Website se live sau vai phut.
echo ======================================================
pause
