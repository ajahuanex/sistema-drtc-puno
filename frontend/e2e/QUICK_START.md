# E2E Tests - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Playwright (1 minute)

```bash
cd frontend
npm install -D @playwright/test
```

### Step 2: Install Browsers (2 minutes)

```bash
npx playwright install chromium
```

Or install all browsers:

```bash
npx playwright install
```

### Step 3: Start Your Application (30 seconds)

Open a new terminal and start the frontend:

```bash
cd frontend
npm run start
```

Wait for the application to be available at `http://localhost:4200`

### Step 4: Run the Tests (1 minute)

In another terminal:

```bash
cd frontend
npx playwright test
```

### Step 5: View the Report (30 seconds)

```bash
npx playwright show-report
```

## 🎯 What Gets Tested?

### ✅ Document Registration (8 tests)
- Form validation
- Document creation
- File uploads
- QR code generation

### ✅ Document Derivation (10 tests)
- Derivation workflow
- Area selection
- Urgent marking
- History tracking

### ✅ Search & Query (15 tests)
- Search by multiple criteria
- Filtering and sorting
- Pagination
- Export functionality

### ✅ Integration Configuration (15 tests)
- Integration CRUD
- Connection testing
- Field mapping
- Webhook setup

**Total: 48 test cases**

## 🎨 Run Tests Your Way

### See the Browser (Headed Mode)
```bash
npx playwright test --headed
```

### Debug a Test
```bash
npx playwright test --debug
```

### Interactive UI Mode
```bash
npx playwright test --ui
```

### Run Specific Test
```bash
npx playwright test registro-documento
```

### Run on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 📊 Understanding Results

### ✅ All Tests Pass
```
Running 48 tests using 4 workers
  48 passed (2m)
```

### ❌ Some Tests Fail
- Check the HTML report: `npx playwright show-report`
- View screenshots in `test-results/`
- Watch videos of failures
- Review traces for debugging

## 🔧 Troubleshooting

### "Cannot find module '@playwright/test'"
```bash
npm install -D @playwright/test
```

### "Executable doesn't exist"
```bash
npx playwright install
```

### "Timeout waiting for http://localhost:4200"
Make sure your app is running:
```bash
npm run start
```

### Tests are slow
Run fewer browsers:
```bash
npx playwright test --project=chromium
```

## 📝 Adding data-cy Attributes

For best results, add `data-cy` attributes to your components:

```html
<!-- Before -->
<input formControlName="remitente" />

<!-- After -->
<input data-cy="input-remitente" formControlName="remitente" />
```

See `README.md` for complete list of required attributes.

## 🚀 CI/CD Integration

### GitHub Actions

Add to `.github/workflows/e2e.yml`:

```yaml
- name: Install Playwright
  run: |
    cd frontend
    npm install -D @playwright/test
    npx playwright install --with-deps

- name: Run E2E tests
  run: |
    cd frontend
    npm run start &
    npx wait-on http://localhost:4200
    npx playwright test
```

## 📚 Learn More

- **Full Documentation**: See `README.md`
- **Installation Guide**: See `INSTALLATION.md`
- **Completion Summary**: See `TASK_24_COMPLETION_SUMMARY.md`
- **Verification**: See `VERIFICATION_CHECKLIST.md`

## 🎉 You're Ready!

Your E2E tests are now set up and ready to run. Happy testing! 🧪

---

**Need Help?**
- Check the [Playwright Documentation](https://playwright.dev/)
- Review test files in `e2e/tests/`
- Use helper functions in `e2e/helpers/test-helpers.ts`
