# E2E Testing Installation Guide

## Step 1: Install Playwright

Add Playwright to your project:

```bash
cd frontend
npm install -D @playwright/test
```

## Step 2: Install Playwright Browsers

Install the required browsers:

```bash
npx playwright install
```

Or install specific browsers:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

## Step 3: Update package.json

Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed",
    "e2e:ui": "playwright test --ui",
    "e2e:debug": "playwright test --debug",
    "e2e:report": "playwright show-report"
  }
}
```

## Step 4: Verify Installation

Run a test to verify everything is working:

```bash
npm run e2e
```

## Step 5: Configure CI/CD (Optional)

### GitHub Actions

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Install Playwright Browsers
        run: |
          cd frontend
          npx playwright install --with-deps
          
      - name: Start application
        run: |
          cd frontend
          npm run start &
          npx wait-on http://localhost:4200
          
      - name: Run E2E tests
        run: |
          cd frontend
          npm run e2e
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30
```

## Troubleshooting

### Issue: Browsers not installing

**Solution**: Install system dependencies:

```bash
# Ubuntu/Debian
sudo npx playwright install-deps

# Or manually
sudo apt-get install libgbm1 libgtk-3-0 libnotify4 libnss3 libxss1 libasound2
```

### Issue: Tests timeout

**Solution**: Increase timeout in `playwright.config.ts`:

```typescript
use: {
  timeout: 60000, // 60 seconds
}
```

### Issue: Application not starting

**Solution**: Ensure the application is running before tests:

```bash
# Terminal 1
npm run start

# Terminal 2 (wait for app to start)
npm run e2e
```

### Issue: Port already in use

**Solution**: Change the port in `playwright.config.ts`:

```typescript
webServer: {
  command: 'npm run start -- --port 4201',
  url: 'http://localhost:4201',
}
```

## Additional Configuration

### Visual Regression Testing

Install Playwright's visual comparison tools:

```bash
npm install -D @playwright/test
```

Add to your tests:

```typescript
await expect(page).toHaveScreenshot('homepage.png');
```

### Code Coverage

Install coverage tools:

```bash
npm install -D @playwright/test nyc
```

### Parallel Execution

Configure in `playwright.config.ts`:

```typescript
workers: process.env.CI ? 2 : 4,
```

## Next Steps

1. Review the test files in `e2e/tests/`
2. Add `data-cy` attributes to your components
3. Run the tests: `npm run e2e`
4. View the report: `npm run e2e:report`
5. Customize tests for your specific needs

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)
