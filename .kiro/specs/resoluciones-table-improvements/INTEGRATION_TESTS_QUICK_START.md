# Integration Tests Quick Start Guide

## Quick Overview

This guide provides a quick reference for running and understanding the integration tests for the Resoluciones Table Improvements feature.

## Running Tests

### Run All Tests
```bash
cd frontend
npm test
```

### Run in Watch Mode
```bash
cd frontend
npm test -- --watch
```

### Run with Coverage
```bash
cd frontend
npm test -- --code-coverage
```

## Test File Location

```
frontend/src/app/shared/resoluciones-table-integration.spec.ts
```

## What's Tested

### 🔍 Filtering (6 tests)
- Multiple filter combinations
- Date range filtering
- Clear all filters
- Filter persistence
- Combined text + selection filters
- Active filter chips

### ⚙️ Configuration (6 tests)
- Show/hide columns
- Reorder columns
- Persist configuration
- Restore defaults
- Load saved config
- Required columns enforcement

### 🔄 Sorting (9 tests)
- Ascending/descending sort
- Remove sort
- Sort by empresa
- Multiple column sorting
- Sort + filter combination
- Clear all sorting
- Visual indicators
- Sort persistence

## Test Results

### Expected Output
```
✓ 21 tests passed
✓ All requirements covered
✓ No console errors
```

### If Tests Fail

1. **Check dependencies**
   ```bash
   npm install
   ```

2. **Clear cache**
   ```bash
   npm run ng cache clean
   ```

3. **Check for TypeScript errors**
   ```bash
   npm run ng build
   ```

## Test Structure

```typescript
describe('Resoluciones Table Integration Tests', () => {
  describe('13.1 Filtering', () => { /* 6 tests */ });
  describe('13.2 Configuration', () => { /* 6 tests */ });
  describe('13.3 Sorting', () => { /* 9 tests */ });
});
```

## Requirements Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Filtering | 6 | ✅ 100% |
| Configuration | 6 | ✅ 100% |
| Sorting | 9 | ✅ 100% |
| **Total** | **21** | **✅ 100%** |

## Key Features Tested

### ✅ User Workflows
- Complete filter → sort → configure workflows
- State persistence across sessions
- Multiple filter combinations

### ✅ Component Integration
- ResolucionesComponent + ResolucionesTableComponent
- ResolucionesFiltersComponent integration
- Service layer integration

### ✅ State Management
- localStorage persistence
- Configuration restoration
- Filter state management

## Mock Data

Tests use realistic mock data:
- 3 sample resolutions
- 3 sample companies
- Various dates, types, and states

## Common Issues

### Issue: Tests timeout
**Solution**: Increase Karma timeout in `karma.conf.js`

### Issue: localStorage errors
**Solution**: Tests automatically mock localStorage

### Issue: Animation errors
**Solution**: BrowserAnimationsModule is imported

## Documentation

- **Full Guide**: `frontend/src/app/shared/INTEGRATION_TESTS_GUIDE.md`
- **Completion Summary**: `.kiro/specs/resoluciones-table-improvements/TASK_13_COMPLETION_SUMMARY.md`
- **Requirements**: `.kiro/specs/resoluciones-table-improvements/requirements.md`
- **Design**: `.kiro/specs/resoluciones-table-improvements/design.md`

## Next Steps

1. ✅ Run tests to verify they pass
2. ✅ Review coverage reports
3. ⏭️ Consider E2E tests for complete workflows
4. ⏭️ Integrate into CI/CD pipeline

## Quick Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm test -- --code-coverage

# Build project
npm run build

# Lint code
npm run lint
```

## Support

For issues or questions:
1. Check the full integration tests guide
2. Review the completion summary
3. Check the requirements and design documents
4. Review existing unit tests for examples

---

**Last Updated**: 2025-11-09
**Status**: ✅ All tests implemented and documented
