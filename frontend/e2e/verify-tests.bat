@echo off
REM Verification script for E2E tests (Windows)
REM This script checks that all test files are present and valid

echo ==========================================
echo E2E Tests Verification Script
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "e2e" (
    echo Error: e2e directory not found
    echo Please run this script from the frontend directory
    exit /b 1
)

echo Checking test files...
echo.

set found=0
set missing=0

REM Check test files
call :checkfile "e2e\tests\registro-documento.e2e.spec.ts"
call :checkfile "e2e\tests\derivacion-documento.e2e.spec.ts"
call :checkfile "e2e\tests\busqueda-consulta.e2e.spec.ts"
call :checkfile "e2e\tests\configuracion-integracion.e2e.spec.ts"

REM Check configuration files
call :checkfile "e2e\playwright.config.ts"
call :checkfile "e2e\README.md"
call :checkfile "e2e\INSTALLATION.md"
call :checkfile "e2e\TASK_24_COMPLETION_SUMMARY.md"
call :checkfile "e2e\helpers\test-helpers.ts"

echo.
echo ==========================================
echo Summary:
echo   Found: %found% files
echo   Missing: %missing% files
echo ==========================================
echo.

REM Check if Playwright is installed
if exist "node_modules\@playwright\test" (
    echo [OK] Playwright is installed
) else (
    echo [WARNING] Playwright is not installed
    echo   Run: npm install -D @playwright/test
)

echo.

if %missing%==0 (
    echo All files are present!
    echo.
    echo Next steps:
    echo   1. Install Playwright: npm install -D @playwright/test
    echo   2. Install browsers: npx playwright install
    echo   3. Start the app: npm run start
    echo   4. Run tests: npx playwright test
    exit /b 0
) else (
    echo Some files are missing!
    exit /b 1
)

:checkfile
if exist "%~1" (
    echo [OK] %~1
    set /a found+=1
) else (
    echo [MISSING] %~1
    set /a missing+=1
)
goto :eof
