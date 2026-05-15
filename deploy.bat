@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo   DEPLOY QUY HOACH SONG HONG TO GITHUB
echo ======================================================

:: Check if .git directory exists
if not exist ".git" (
    echo [*] Initializing Git...
    git init
)

:: Add all files
echo [*] Adding files...
git add .

:: Commit changes
set /p commit_msg="Enter commit message (default: Update data): "
if "!commit_msg!"=="" set commit_msg=Update data
git commit -m "!commit_msg!"

:: Set branch to main
git branch -M main

:: Check if remote 'origin' exists
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Adding remote origin...
    git remote add origin https://github.com/9dpi/quyhoachsonghong.git
)

:: Push to GitHub
echo [*] Pushing to GitHub...
git push -u origin main

echo ======================================================
echo   DONE! Your app should be live soon.
echo ======================================================
pause
