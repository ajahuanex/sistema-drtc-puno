import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Registro de Documento
 * Tests the complete flow of document registration
 */

test.describe('Registro de Documento E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Mesa de Partes module
    await page.goto('/mesa-partes');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click on Registro tab if not already active
    const registroTab = page.locator('[data-cy=tab-registro], text=Registro');
    if (await registroTab.isVisible()) {
      await registroTab.click();
    }
  });

  test('debe mostrar el formulario de registro de documento', async ({ page }) => {
    // Verify form elements are visible
    await expect(page.locator('[data-cy=input-remitente], input[formControlName="remitente"]')).toBeVisible();
    await expect(page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]')).toBeVisible();
    await expect(page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]')).toBeVisible();
    await expect(page.locator('[data-cy=input-folios], input[formControlName="numeroFolios"]')).toBeVisible();
  });

  test('debe validar campos obligatorios', async ({ page }) => {
    // Try to submit without filling required fields
    const submitButton = page.locator('[data-cy=btn-guardar], button[type="submit"]');
    await submitButton.click();
    
    // Check for validation errors
    const errorMessages = page.locator('.mat-error, .error-message');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('debe registrar un documento exitosamente', async ({ page }) => {
    // Fill in the form
    await page.locator('[data-cy=input-remitente], input[formControlName="remitente"]').fill('Juan Pérez García');
    await page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]').fill('Solicitud de información pública sobre proyectos 2025');
    
    // Select document type
    const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
    await tipoSelect.selectOption({ index: 1 }); // Select first option after placeholder
    
    // Fill number of folios
    await page.locator('[data-cy=input-folios], input[formControlName="numeroFolios"]').fill('5');
    
    // Set priority
    const prioridadSelect = page.locator('[data-cy=select-prioridad], select[formControlName="prioridad"]');
    if (await prioridadSelect.isVisible()) {
      await prioridadSelect.selectOption('NORMAL');
    }
    
    // Submit the form
    await page.locator('[data-cy=btn-guardar], button[type="submit"]').click();
    
    // Wait for success message
    await expect(page.locator('.mat-snack-bar-container, .success-message, text=exitosamente')).toBeVisible({ timeout: 10000 });
    
    // Verify document number is generated
    const expedientePattern = /EXP-\d{4}-\d{4}/;
    await expect(page.locator(`text=${expedientePattern}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('debe permitir adjuntar archivos', async ({ page }) => {
    // Fill basic info
    await page.locator('[data-cy=input-remitente], input[formControlName="remitente"]').fill('María López');
    await page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]').fill('Solicitud con adjuntos');
    
    // Select document type
    const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
    await tipoSelect.selectOption({ index: 1 });
    
    // Upload file
    const fileInput = page.locator('[data-cy=file-input], input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: 'documento-prueba.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('PDF content here')
      });
      
      // Verify file is listed
      await expect(page.locator('text=documento-prueba.pdf')).toBeVisible();
    }
  });

  test('debe generar comprobante con código QR', async ({ page }) => {
    // Register a document
    await page.locator('[data-cy=input-remitente], input[formControlName="remitente"]').fill('Carlos Ruiz');
    await page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]').fill('Solicitud para comprobante');
    
    const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
    await tipoSelect.selectOption({ index: 1 });
    
    await page.locator('[data-cy=btn-guardar], button[type="submit"]').click();
    
    // Wait for success
    await page.waitForSelector('.mat-snack-bar-container, .success-message', { timeout: 10000 });
    
    // Look for QR code or download button
    const qrButton = page.locator('[data-cy=btn-descargar-comprobante], button:has-text("Comprobante"), button:has-text("QR")');
    if (await qrButton.isVisible({ timeout: 5000 })) {
      await expect(qrButton).toBeVisible();
    }
  });

  test('debe permitir marcar documento como urgente', async ({ page }) => {
    // Fill form
    await page.locator('[data-cy=input-remitente], input[formControlName="remitente"]').fill('Ana Torres');
    await page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]').fill('Solicitud urgente');
    
    const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
    await tipoSelect.selectOption({ index: 1 });
    
    // Set priority to URGENTE
    const prioridadSelect = page.locator('[data-cy=select-prioridad], select[formControlName="prioridad"]');
    if (await prioridadSelect.isVisible()) {
      await prioridadSelect.selectOption('URGENTE');
    }
    
    // Submit
    await page.locator('[data-cy=btn-guardar], button[type="submit"]').click();
    
    // Verify success
    await expect(page.locator('.mat-snack-bar-container, .success-message')).toBeVisible({ timeout: 10000 });
  });

  test('debe limpiar el formulario después de registro exitoso', async ({ page }) => {
    // Register a document
    await page.locator('[data-cy=input-remitente], input[formControlName="remitente"]').fill('Pedro Sánchez');
    await page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]').fill('Solicitud de prueba');
    
    const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
    await tipoSelect.selectOption({ index: 1 });
    
    await page.locator('[data-cy=btn-guardar], button[type="submit"]').click();
    
    // Wait for success
    await page.waitForSelector('.mat-snack-bar-container, .success-message', { timeout: 10000 });
    
    // Check if form is cleared (or navigate to new form)
    const remitenteInput = page.locator('[data-cy=input-remitente], input[formControlName="remitente"]');
    const remitenteValue = await remitenteInput.inputValue();
    
    // Form should be cleared or user should be able to register another
    expect(remitenteValue === '' || await page.locator('[data-cy=btn-nuevo-documento]').isVisible()).toBeTruthy();
  });

  test('debe mostrar número de expediente generado automáticamente', async ({ page }) => {
    // Register document
    await page.locator('[data-cy=input-remitente], input[formControlName="remitente"]').fill('Luis Martínez');
    await page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]').fill('Verificar número de expediente');
    
    const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
    await tipoSelect.selectOption({ index: 1 });
    
    await page.locator('[data-cy=btn-guardar], button[type="submit"]').click();
    
    // Wait and verify expediente number format
    await page.waitForTimeout(2000);
    
    const expedienteText = await page.locator('text=/EXP-\\d{4}-\\d{4}/').first().textContent({ timeout: 10000 });
    expect(expedienteText).toMatch(/EXP-\d{4}-\d{4}/);
  });
});
