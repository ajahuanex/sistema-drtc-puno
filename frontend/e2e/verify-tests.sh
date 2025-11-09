#!/bin/bash

# Verification script for E2E tests
# This script checks that all test files are present and valid

echo "=========================================="
echo "E2E Tests Verification Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "e2e" ]; then
    echo -e "${RED}Error: e2e directory not found${NC}"
    echo "Please run this script from the frontend directory"
    exit 1
fi

echo "Checking test files..."
echo ""

# Test files to check
test_files=(
    "e2e/tests/registro-documento.e2e.spec.ts"
    "e2e/tests/derivacion-documento.e2e.spec.ts"
    "e2e/tests/busqueda-consulta.e2e.spec.ts"
    "e2e/tests/configuracion-integracion.e2e.spec.ts"
)

# Configuration files
config_files=(
    "e2e/playwright.config.ts"
    "e2e/README.md"
    "e2e/INSTALLATION.md"
    "e2e/TASK_24_COMPLETION_SUMMARY.md"
    "e2e/helpers/test-helpers.ts"
)

all_files=("${test_files[@]}" "${config_files[@]}")

missing_files=0
found_files=0

for file in "${all_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
        found_files=$((found_files + 1))
    else
        echo -e "${RED}✗${NC} $file (missing)"
        missing_files=$((missing_files + 1))
    fi
done

echo ""
echo "=========================================="
echo "Summary:"
echo "  Found: $found_files files"
echo "  Missing: $missing_files files"
echo "=========================================="
echo ""

# Check if Playwright is installed
if [ -d "node_modules/@playwright/test" ]; then
    echo -e "${GREEN}✓${NC} Playwright is installed"
else
    echo -e "${YELLOW}⚠${NC} Playwright is not installed"
    echo "  Run: npm install -D @playwright/test"
fi

echo ""

# Count test cases
if [ -f "e2e/tests/registro-documento.e2e.spec.ts" ]; then
    registro_tests=$(grep -c "test(" e2e/tests/registro-documento.e2e.spec.ts)
    echo "Registro de Documento: $registro_tests tests"
fi

if [ -f "e2e/tests/derivacion-documento.e2e.spec.ts" ]; then
    derivacion_tests=$(grep -c "test(" e2e/tests/derivacion-documento.e2e.spec.ts)
    echo "Derivación de Documento: $derivacion_tests tests"
fi

if [ -f "e2e/tests/busqueda-consulta.e2e.spec.ts" ]; then
    busqueda_tests=$(grep -c "test(" e2e/tests/busqueda-consulta.e2e.spec.ts)
    echo "Búsqueda y Consulta: $busqueda_tests tests"
fi

if [ -f "e2e/tests/configuracion-integracion.e2e.spec.ts" ]; then
    config_tests=$(grep -c "test(" e2e/tests/configuracion-integracion.e2e.spec.ts)
    echo "Configuración de Integración: $config_tests tests"
fi

echo ""

if [ $missing_files -eq 0 ]; then
    echo -e "${GREEN}All files are present!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Install Playwright: npm install -D @playwright/test"
    echo "  2. Install browsers: npx playwright install"
    echo "  3. Start the app: npm run start"
    echo "  4. Run tests: npx playwright test"
    exit 0
else
    echo -e "${RED}Some files are missing!${NC}"
    exit 1
fi
