@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo   GITHUB DEPLOYMENT ENGINE v2.2
echo ======================================================

:: 1. Kiểm tra Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] LOI: Git chua duoc cai dat.
    pause
    exit /b
)

:: 2. Khởi tạo và cấu hình (nếu cần)
if not exist ".git" (
    echo [*] Khoi tao kho Git moi...
    git init
    git remote add origin https://github.com/9dpi/quyhoachsonghong.git
)

:: Đảm bảo đã có email/name để commit không lỗi
git config user.email "admin@dulieuquyhoach.com"
git config user.name "9dpi-Admin"

:: 3. Đồng bộ dữ liệu cũ từ GitHub về trước
echo [*] Dang dong bo du lieu tu GitHub...
git fetch origin main
git merge origin/main --allow-unrelated-histories -m "Sync from remote"

:: 4. Chuẩn bị bản cập nhật mới
echo [*] Dang chuan bi ban cap nhat...
:: Xóa Code.gs khỏi cache của Git (nếu lỡ bị track)
git rm --cached Code.gs >nul 2>&1
:: Thêm tất cả ngoại trừ các file trong .gitignore
git add .

set /p msg="Nhap ghi chu cap nhat (Enter de bo qua): "
if "%msg%"=="" set msg="Update Dashboard and Data"

git commit -m "%msg%"

:: 5. Đẩy lên GitHub
echo [*] Dang day len GitHub...
git push origin HEAD:main

if %errorlevel% neq 0 (
    echo [!] Push bi tu choi. Dang thu giai phap ep buoc...
    git push origin HEAD:main --force
)

echo ======================================================
echo   XONG! Website se live sau vai phut.
echo ======================================================
pause
