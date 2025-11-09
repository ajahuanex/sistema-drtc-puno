# E2E Tests - Mesa de Partes Module

This directory contains End-to-End (E2E) tests for the Mesa de Partes module using Playwright.

## Overview

The E2E tests cover the complete user flows for the Mesa de Partes system:

1. **Registro de Documento** - Document registration flow
2. **Derivación de Documento** - Document derivation flow
3. **Búsqueda y Consulta** - Document search and query flow
4. **Configuración de Integración** - Integration configuration flow

## Prerequisites

Before running the tests, ensure you have:

1. Node.js installed (v18 or higher)
2. Playwright installed
3. The frontend application running on `http://localhost:4200`
4. The backend API running and accessible

## Installation

Install Playwright and its dependencies:

```bash
npm install -D @playwright/test
npx playwright install
```

## Running Tests

### Run all E2E tests

```bash
npx playwright test
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run specific test file

```bash
npx playwright test e2e/tests/registro-documento.e2e.spec.ts
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

## Test Structure

### Test Files

- `registro-documento.e2e.spec.ts` - Tests for document registration
  - Form validation
  - Document creation
  - File attachments
  - QR code generation
  - Priority marking

- `derivacion-documento.e2e.spec.ts` - Tests for document derivation
  - Derivation modal
  - Area selection
  - Urgent marking
  - Deadline setting
  - Derivation history

- `busqueda-consulta.e2e.spec.ts` - Tests for search and query
  - Search by expediente number
  - Search by sender
  - Search by subject
  - Filtering by type, status, date, priority
  - Pagination and sorting
  - Export functionality

- `configuracion-integracion.e2e.spec.ts` - Tests for integration configuration
  - Creating integrations
  - Testing connections
  - Field mapping
  - Webhook configuration
  - Sync logs

## Test Data Attributes

The tests use `data-cy` attributes for element selection. Ensure your components include these attributes:

```html
<!-- Example -->
<input data-cy="input-remitente" formControlName="remitente" />
<button data-cy="btn-guardar" type="submit">Guardar</button>
```

### Common Data-Cy Attributes

**Forms:**
- `input-remitente` - Sender input
- `input-asunto` - Subject input
- `select-tipo` - Document type selector
- `input-folios` - Number of folios input
- `select-prioridad` - Priority selector
- `btn-guardar` - Save button

**Navigation:**
- `tab-registro` - Registration tab
- `tab-documentos` - Documents tab
- `tab-busqueda` - Search tab
- `tab-configuracion` - Configuration tab

**Actions:**
- `btn-derivar` - Derive button
- `btn-ver-detalle` - View detail button
- `btn-exportar-excel` - Export to Excel button
- `btn-nueva-integracion` - New integration button

## Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:4200`
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Best Practices

1. **Use data-cy attributes** for element selection instead of classes or IDs
2. **Wait for network idle** before interacting with elements
3. **Use explicit waits** with timeouts for dynamic content
4. **Clean up test data** after each test if needed
5. **Keep tests independent** - each test should work in isolation
6. **Use descriptive test names** that explain what is being tested

## Troubleshooting

### Tests fail with "Element not found"

- Ensure the application is running on `http://localhost:4200`
- Check that `data-cy` attributes are present in the components
- Increase timeout values if the application is slow to load

### Tests fail intermittently

- Add explicit waits for dynamic content
- Use `page.waitForLoadState('networkidle')` after navigation
- Check for race conditions in the application

### Browser doesn't close after tests

- Ensure you're not using `--debug` mode
- Check that all test files properly close pages
- Use `npx playwright test --workers=1` to run tests sequentially

## CI/CD Integration

To run tests in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test
  env:
    CI: true

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Coverage

The E2E tests cover:

- ✅ Document registration with all fields
- ✅ File upload functionality
- ✅ Document derivation to areas
- ✅ Search and filtering
- ✅ Document detail view
- ✅ Integration configuration
- ✅ Field mapping
- ✅ Webhook setup
- ✅ Sync logs
- ✅ Export functionality

## Requirements Coverage

These tests verify the following requirements from the spec:

- **Requirement 1**: Registro y Recepción de Documentos
- **Requirement 2**: Clasificación y Categorización
- **Requirement 3**: Derivación y Seguimiento
- **Requirement 4**: Integración con Otras Mesas de Partes
- **Requirement 5**: Búsqueda y Consulta
- **Requirement 6**: Reportes y Estadísticas (partial)

## Future Enhancements

- Add visual regression testing
- Add performance testing
- Add accessibility testing
- Add mobile viewport testing
- Add API mocking for isolated tests
- Add test data factories
