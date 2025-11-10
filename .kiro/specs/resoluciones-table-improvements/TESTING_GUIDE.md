# Testing Guide - Resoluciones Table Improvements

## Quick Start

### Prerequisites
- Node.js and npm installed
- Angular CLI installed
- Project dependencies installed (`npm install`)

### Running Tests

#### Run All Tests
```bash
cd frontend
npm test
```

This will:
- Start Karma test runner
- Open Chrome browser
- Run all test suites
- Display results in terminal and browser
- Watch for file changes (continuous mode)

#### Run Tests Once (CI Mode)
```bash
cd frontend
npm test -- --watch=false --browsers=ChromeHeadless
```

#### Run with Coverage Report
```bash
cd frontend
npm test -- --code-coverage
```

Coverage report will be generated in `frontend/coverage/` directory.

## Test Files Location

### Filter Components
- `frontend/src/app/shared/date-range-picker.component.spec.ts`
- `frontend/src/app/shared/resoluciones-filters.component.spec.ts`

### Table Components
- `frontend/src/app/shared/column-selector.component.spec.ts`
- `frontend/src/app/shared/sortable-header.component.spec.ts`
- `frontend/src/app/shared/resoluciones-table.component.spec.ts`

### Services
- `frontend/src/app/services/resoluciones-table.service.spec.ts`
- `frontend/src/app/services/resolucion.service.spec.ts`

## Test Structure

### Component Tests
```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName, /* dependencies */],
      providers: [/* mocked services */]
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // More tests...
});
```

### Service Tests
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ServiceName]
    });

    service = TestBed.inject(ServiceName);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // More tests...
});
```

## Common Test Patterns

### Testing Component Inputs
```typescript
it('should accept input values', () => {
  component.inputProperty = 'test value';
  fixture.detectChanges();
  
  expect(component.inputProperty).toBe('test value');
});
```

### Testing Component Outputs
```typescript
it('should emit output events', () => {
  spyOn(component.outputEvent, 'emit');
  
  component.triggerEvent();
  
  expect(component.outputEvent.emit).toHaveBeenCalledWith(expectedValue);
});
```

### Testing HTTP Requests
```typescript
it('should make HTTP request', (done) => {
  service.getData().subscribe(data => {
    expect(data).toEqual(expectedData);
    done();
  });

  const req = httpMock.expectOne('api/endpoint');
  expect(req.request.method).toBe('GET');
  req.flush(expectedData);
});
```

### Testing Async Operations
```typescript
it('should handle async operations', fakeAsync(() => {
  component.asyncMethod();
  
  tick(300); // Advance time by 300ms
  
  expect(component.result).toBe(expectedResult);
}));
```

### Testing Error Handling
```typescript
it('should handle errors', (done) => {
  service.getData().subscribe({
    next: () => fail('Should have failed'),
    error: (error) => {
      expect(error).toBeTruthy();
      done();
    }
  });

  const req = httpMock.expectOne('api/endpoint');
  req.error(new ErrorEvent('Network error'));
});
```

## Debugging Tests

### Run Specific Test File
```bash
npm test -- --include="**/component-name.spec.ts"
```

### Run Specific Test Suite
Add `.only` to the describe block:
```typescript
describe.only('ComponentName', () => {
  // Only this suite will run
});
```

### Run Specific Test Case
Add `.only` to the it block:
```typescript
it.only('should do something', () => {
  // Only this test will run
});
```

### Skip Tests
Add `.skip` to skip tests:
```typescript
describe.skip('ComponentName', () => {
  // This suite will be skipped
});

it.skip('should do something', () => {
  // This test will be skipped
});
```

### Debug in Browser
1. Run `npm test`
2. Click "DEBUG" button in Karma browser window
3. Open browser DevTools
4. Set breakpoints in test code
5. Refresh page to re-run tests

## Coverage Reports

### View Coverage Report
After running tests with coverage:
```bash
npm test -- --code-coverage
```

Open `frontend/coverage/index.html` in browser to view detailed coverage report.

### Coverage Thresholds
Current thresholds (can be configured in `karma.conf.js`):
- Statements: 85%
- Branches: 80%
- Functions: 85%
- Lines: 85%

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run tests
        run: |
          cd frontend
          npm test -- --watch=false --browsers=ChromeHeadless --code-coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          directory: ./frontend/coverage
```

## Best Practices

### 1. Test Naming
- Use descriptive test names
- Follow pattern: "should [expected behavior] when [condition]"
- Group related tests with describe blocks

### 2. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up after each test

### 3. Mocking
- Mock external dependencies
- Use spies for method calls
- Mock HTTP requests
- Mock localStorage/sessionStorage

### 4. Assertions
- Use specific assertions
- Test both success and failure cases
- Verify expected behavior
- Check error messages

### 5. Async Testing
- Use done() callback for async tests
- Use fakeAsync/tick for time-based tests
- Handle Observables properly
- Test debounce/throttle behavior

## Troubleshooting

### Tests Not Running
1. Check if Karma is installed: `npm list karma`
2. Reinstall dependencies: `npm install`
3. Clear cache: `npm cache clean --force`

### Browser Not Opening
1. Check Chrome installation
2. Try ChromeHeadless: `npm test -- --browsers=ChromeHeadless`
3. Check Karma configuration

### Tests Failing
1. Check test output for error messages
2. Verify mock data matches expectations
3. Check async operations are handled correctly
4. Verify component initialization

### Coverage Not Generated
1. Run with coverage flag: `npm test -- --code-coverage`
2. Check karma.conf.js configuration
3. Verify coverage directory exists

## Additional Resources

### Angular Testing Documentation
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Documentation](https://karma-runner.github.io/)

### Testing Tools
- **Jasmine**: Testing framework
- **Karma**: Test runner
- **Angular TestBed**: Testing utilities
- **HttpClientTestingModule**: HTTP testing

### Useful Commands
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests once
npm test -- --watch=false

# Run with coverage
npm test -- --code-coverage

# Run specific file
npm test -- --include="**/file.spec.ts"

# Run in headless mode
npm test -- --browsers=ChromeHeadless
```

## Summary

This testing guide provides everything needed to run, debug, and maintain the unit tests for the resoluciones table improvements feature. Follow the best practices and patterns outlined here to ensure high-quality, maintainable tests.

For questions or issues, refer to the Angular testing documentation or consult with the development team.
