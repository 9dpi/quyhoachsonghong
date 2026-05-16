@echo off
echo ======================================================
echo   FIX SUBMODULE ERROR v1.0
echo ======================================================

:: 1. Kiểm tra nếu thư mục .git tồn tại trong v1
if exist "v1\.git" (
    echo [*] Phat hien thu muc .git trong v1. Dang xoa...
    rd /s /q "v1\.git"
    echo [*] Da xoa thu muc .git trong v1.
) else (
    echo [!] Khong tim thay thu muc .git trong v1.
)

:: 2. Xóa v1 khỏi cache của Git (nếu đang bị track dạng submodule)
echo [*] Dang xoa v1 khoi cache cua Git...
git rm --cached v1 >nul 2>&1

:: 3. Thêm lại v1 như một thư mục bình thường
echo [*] Dang them lai v1 nhu thu muc binh thuong...
git add v1

echo ======================================================
echo   XONG! Ban hay chay lai file deploy.bat de day len.
echo ======================================================
pause
