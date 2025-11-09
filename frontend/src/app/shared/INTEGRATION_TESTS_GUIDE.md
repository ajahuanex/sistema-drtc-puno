# Integration Tests Guide - Resoluciones Table Improvements

## Overview

This document describes the integration tests implemented for the Resoluciones Table Improvements feature. These tests verify the complete integration of filtering, column configuration, and sorting functionality.

## Test File Location

```
frontend/src/app/shared/resoluciones-table-integration.spec.ts
```

## Test Structure

The integration tests are organized into three main test suites corresponding to the implementation tasks:

### 13.1 Tests de flujo completo de filtrado

Tests that verify the complete filtering workflow including:

- **Multiple filter application** (Requirements: 1.1, 1.2, 1.3, 1.4, 1.7)
  - Combines text, selection, and date filters
  - Verifies correct data filtering
  
- **Date range filtering** (Requirements: 1.5, 1.7)
  - Tests date range selection
  - Verifies results within date boundaries
  
- **Clear all filters** (Requirements: 1.8)
  - Tests filter reset functionality
  - Verifies all data is shown after clearing
  
- **Filter state persistence** (Requirements: 1.7, 5.3)
  - Tests localStorage persistence
  - Verifies filters are restored on component reload
  
- **Combined filter types** (Requirements: 1.2, 1.3, 1.4, 1.7)
  - Tests text + selection filter combinations
  - Verifies AND logic between filters
  
- **Active filter chips** (Requirements: 1.8, 5.3)
  - Tests filter chip display
  - Verifies individual filter removal

### 13.2 Tests de configuración de tabla

Tests that verify table configuration functionality including:

- **Change visible columns** (Requirements: 2.1, 2.2)
  - Tests column show/hide functionality
  - Verifies table updates immediately
  
- **Reorder columns** (Requirements: 2.3)
  - Tests drag-and-drop column reordering
  - Verifies display order updates
  
- **Persist configuration** (Requirements: 2.4, 2.5)
  - Tests localStorage persistence
  - Verifies configuration restoration
  
- **Restore default configuration** (Requirements: 2.6)
  - Tests reset to default settings
  - Verifies all columns are restored
  
- **Load saved configuration** (Requirements: 2.5)
  - Tests initialization with saved config
  - Verifies correct state on component load
  
- **Required columns** (Requirements: 2.2)
  - Tests that required columns cannot be hidden
  - Verifies numeroResolucion is always visible

### 13.3 Tests de ordenamiento

Tests that verify sorting functionality including:

- **Ascending sort** (Requirements: 3.1)
  - Tests first click sorts ascending
  - Verifies correct sort order
  
- **Descending sort** (Requirements: 3.2)
  - Tests second click sorts descending
  - Verifies reverse sort order
  
- **Remove sort** (Requirements: 3.3)
  - Tests third click removes sorting
  - Verifies return to default order
  
- **Sort by empresa** (Requirements: 3.1, 4.4)
  - Tests alphabetical sorting by company name
  - Verifies empresa column sorting
  
- **Multiple column sorting** (Requirements: 3.4)
  - Tests sorting by multiple columns
  - Verifies sort priority is maintained
  
- **Maintain sort with filters** (Requirements: 3.5)
  - Tests that sorting persists when filtering
  - Verifies sort + filter combination
  
- **Clear all sorting** (Requirements: 3.6)
  - Tests removing all sort criteria
  - Verifies return to default date order
  
- **Visual sort indicators** (Requirements: 3.1, 3.2, 3.3)
  - Tests sort direction indicators
  - Verifies UI feedback for sort state
  
- **Persist sort configuration** (Requirements: 3.5, 5.1)
  - Tests localStorage persistence of sort state
  - Verifies sort restoration across sessions

## Running the Tests

### Run all tests
```bash
cd frontend
npm test
```

### Run specific test file (if supported by your test runner)
```bash
npm test -- --include="**/resoluciones-table-integration.spec.ts"
```

### Run in watch mode
```bash
npm test -- --watch
```

## Test Data

The tests use mock data that includes:

- **Mock Resoluciones**: 3 sample resolutions with different properties
- **Mock Empresas**: 3 sample companies with different names
- **Mock Configurations**: Default and custom table configurations

### Sample Mock Data Structure

```typescript
const mockResoluciones: ResolucionConEmpresa[] = [
  {
    id: '1',
    numeroResolucion: 'RES-001-2024',
    fechaEmision: new Date('2024-01-15'),
    tipoTramite: 'ALTA',
    estado: 'APROBADA',
    empresaId: 'emp1',
    empresa: {
      id: 'emp1',
      razonSocial: { principal: 'Empresa Test 1' },
      ruc: '20123456789'
    }
  },
  // ... more mock data
];
```

## Test Coverage

The integration tests cover:

- ✅ All filtering requirements (1.1-1.8)
- ✅ All column configuration requirements (2.1-2.6)
- ✅ All sorting requirements (3.1-3.6)
- ✅ Empresa column requirements (4.1-4.4)
- ✅ UX and persistence requirements (5.1-5.6)

## Requirements Traceability

Each test includes comments indicating which requirements it verifies:

```typescript
it('should apply multiple filters correctly', fakeAsync(() => {
  // Requirements: 1.1, 1.2, 1.3, 1.4, 1.7
  // ... test implementation
}));
```

## Test Utilities

The tests use the following Angular testing utilities:

- `TestBed`: For configuring the testing module
- `ComponentFixture`: For component testing
- `fakeAsync` / `tick` / `flush`: For async operation testing
- `jasmine.createSpyObj`: For service mocking
- `BrowserAnimationsModule`: For Material component animations
- `HttpClientTestingModule`: For HTTP testing

## Mocking Strategy

### Services Mocked

1. **ResolucionService**
   - `getResoluciones()`
   - `getResolucionesFiltradas()`
   - `getResolucionesConEmpresa()`

2. **ResolucionesTableService**
   - `aplicarFiltros()`
   - `limpiarFiltros()`
   - `getFiltrosActivos()`
   - `guardarConfiguracion()`
   - `cargarConfiguracion()`
   - `getConfiguracionPorDefecto()`
   - `aplicarOrdenamiento()`
   - `limpiarOrdenamiento()`

3. **EmpresaService**
   - `getEmpresas()`

4. **NotificationService**
   - `showSuccess()`
   - `showError()`

## Best Practices

1. **Use fakeAsync for timing control**: All async operations use `fakeAsync`, `tick`, and `flush` for deterministic testing

2. **Mock external dependencies**: All services are mocked to isolate component behavior

3. **Test user workflows**: Tests simulate complete user interactions, not just individual methods

4. **Verify requirements**: Each test explicitly references the requirements it verifies

5. **Clean up after tests**: Tests use `flush()` to ensure all async operations complete

## Troubleshooting

### Common Issues

1. **Timing issues**: If tests fail intermittently, check that all `tick()` calls have appropriate delays

2. **Mock not called**: Verify that the component is using the mocked service correctly

3. **Configuration not persisting**: Check that localStorage is properly mocked or cleared between tests

4. **Component not updating**: Ensure `fixture.detectChanges()` is called after state changes

## Future Enhancements

Potential additions to the integration test suite:

1. **E2E tests**: Add Playwright/Cypress tests for full browser testing
2. **Performance tests**: Add tests to verify performance with large datasets
3. **Accessibility tests**: Add tests to verify ARIA attributes and keyboard navigation
4. **Visual regression tests**: Add screenshot comparison tests

## Related Documentation

- [Requirements Document](../../../.kiro/specs/resoluciones-table-improvements/requirements.md)
- [Design Document](../../../.kiro/specs/resoluciones-table-improvements/design.md)
- [Tasks Document](../../../.kiro/specs/resoluciones-table-improvements/tasks.md)
- [Testing Guide](../../../.kiro/specs/resoluciones-table-improvements/TESTING_GUIDE.md)
