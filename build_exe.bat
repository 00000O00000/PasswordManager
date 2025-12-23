@echo off
echo ========================================
echo Password Manager - Build EXE
echo ========================================
echo.

echo [1/4] Checking PyInstaller...
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo PyInstaller not found, installing...
    pip install pyinstaller
    if errorlevel 1 (
        echo Failed to install PyInstaller!
        pause
        exit /b 1
    )
) else (
    echo PyInstaller is installed
)
echo.

echo [2/4] Cleaning old build files...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
echo Cleanup complete
echo.

echo [3/4] Building executable...
pyinstaller --clean PasswordManager.spec
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)
echo.

echo [4/4] Build complete!
echo.
echo Executable location: dist\PasswordManager.exe
echo.
echo Usage:
echo 1. Run PasswordManager.exe to start
echo 2. Opens at http://127.0.0.1:5000
echo 3. Browser will auto-open
echo 4. Database file will be created in same directory
echo.
echo ========================================
pause
