import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Derivación de Documento
 * Tests the complete flow of document derivation
 */

test.describe('Derivación de Documento E2E', () => {
  let documentoId: string;
  let numeroExpediente: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to Mesa de Partes
    await page.goto('/mesa-partes');
    await page.waitForLoadState('networkidle');
    
    // First, create a document to derive
    const registroTab = page.locator('[data-cy=tab-registro], text=Registro');
    if (await registroTab.isVisible()) {
      await registroTab.click();
    }
    
    // Fill and submit document
    await page.locator('[data-cy=input-remitente], input[formControlName="remitente"]').fill('Remitente Test');
    await page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]').fill('Documento para derivar');
    
    const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
    await tipoSelect.selectOption({ index: 1 });
    
    await page.locator('[data-cy=btn-guardar], button[type="submit"]').click();
    
    // Wait for success and capture expediente number
    await page.waitForSelector('.mat-snack-bar-container, .success-message', { timeout: 10000 });
    
    // Navigate to documents list
    const documentosTab = page.locator('[data-cy=tab-documentos], text=Documentos');
    await documentosTab.click();
    await page.waitForLoadState('networkidle');
  });

  test('debe mostrar el botón de derivar en la lista de documentos', async ({ page }) => {
    // Check if derive button exists
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await expect(derivarButton).toBeVisible({ timeout: 5000 });
  });

  test('debe abrir el modal de derivación al hacer clic en derivar', async ({ page }) => {
    // Click derive button
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await derivarButton.click();
    
    // Verify modal is open
    await expect(page.locator('[data-cy=modal-derivar], .mat-dialog-container, .modal-derivacion')).toBeVisible({ timeout: 5000 });
    
    // Verify modal has required fields
    await expect(page.locator('[data-cy=select-area-destino], select[formControlName="areaDestinoId"]')).toBeVisible();
    await expect(page.locator('[data-cy=textarea-instrucciones], textarea[formControlName="instrucciones"]')).toBeVisible();
  });

  test('debe validar campos obligatorios en derivación', async ({ page }) => {
    // Open derivation modal
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await derivarButton.click();
    
    await page.waitForSelector('[data-cy=modal-derivar], .mat-dialog-container', { timeout: 5000 });
    
    // Try to submit without filling required fields
    const confirmarButton = page.locator('[data-cy=btn-confirmar-derivacion], button:has-text("Confirmar"), button:has-text("Derivar")');
    await confirmarButton.click();
    
    // Check for validation errors
    const errorMessages = page.locator('.mat-error, .error-message');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });

  test('debe derivar un documento exitosamente', async ({ page }) => {
    // Click derive button
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await derivarButton.click();
    
    await page.waitForSelector('[data-cy=modal-derivar], .mat-dialog-container', { timeout: 5000 });
    
    // Select destination area
    const areaSelect = page.locator('[data-cy=select-area-destino], select[formControlName="areaDestinoId"]');
    await areaSelect.selectOption({ index: 1 }); // Select first area
    
    // Add instructions
    await page.locator('[data-cy=textarea-instrucciones], textarea[formControlName="instrucciones"]').fill('Por favor revisar y dar respuesta en 5 días hábiles');
    
    // Submit derivation
    const confirmarButton = page.locator('[data-cy=btn-confirmar-derivacion], button:has-text("Confirmar"), button:has-text("Derivar")');
    await confirmarButton.click();
    
    // Wait for success message
    await expect(page.locator('.mat-snack-bar-container, .success-message, text=derivado')).toBeVisible({ timeout: 10000 });
  });

  test('debe permitir marcar derivación como urgente', async ({ page }) => {
    // Open derivation modal
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await derivarButton.click();
    
    await page.waitForSelector('[data-cy=modal-derivar], .mat-dialog-container', { timeout: 5000 });
    
    // Select area
    const areaSelect = page.locator('[data-cy=select-area-destino], select[formControlName="areaDestinoId"]');
    await areaSelect.selectOption({ index: 1 });
    
    // Add instructions
    await page.locator('[data-cy=textarea-instrucciones], textarea[formControlName="instrucciones"]').fill('Atención urgente requerida');
    
    // Mark as urgent
    const urgenteCheckbox = page.locator('[data-cy=checkbox-urgente], input[formControlName="esUrgente"]');
    if (await urgenteCheckbox.isVisible()) {
      await urgenteCheckbox.check();
    }
    
    // Submit
    const confirmarButton = page.locator('[data-cy=btn-confirmar-derivacion], button:has-text("Confirmar"), button:has-text("Derivar")');
    await confirmarButton.click();
    
    // Verify success
    await expect(page.locator('.mat-snack-bar-container, .success-message')).toBeVisible({ timeout: 10000 });
  });

  test('debe permitir establecer fecha límite de atención', async ({ page }) => {
    // Open derivation modal
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await derivarButton.click();
    
    await page.waitForSelector('[data-cy=modal-derivar], .mat-dialog-container', { timeout: 5000 });
    
    // Select area
    const areaSelect = page.locator('[data-cy=select-area-destino], select[formControlName="areaDestinoId"]');
    await areaSelect.selectOption({ index: 1 });
    
    // Add instructions
    await page.locator('[data-cy=textarea-instrucciones], textarea[formControlName="instrucciones"]').fill('Responder antes de la fecha límite');
    
    // Set deadline
    const fechaLimiteInput = page.locator('[data-cy=input-fecha-limite], input[formControlName="fechaLimite"]');
    if (await fechaLimiteInput.isVisible()) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      await fechaLimiteInput.fill(dateString);
    }
    
    // Submit
    const confirmarButton = page.locator('[data-cy=btn-confirmar-derivacion], button:has-text("Confirmar"), button:has-text("Derivar")');
    await confirmarButton.click();
    
    // Verify success
    await expect(page.locator('.mat-snack-bar-container, .success-message')).toBeVisible({ timeout: 10000 });
  });

  test('debe mostrar historial de derivaciones en detalle del documento', async ({ page }) => {
    // First derive a document
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await derivarButton.click();
    
    await page.waitForSelector('[data-cy=modal-derivar], .mat-dialog-container', { timeout: 5000 });
    
    const areaSelect = page.locator('[data-cy=select-area-destino], select[formControlName="areaDestinoId"]');
    await areaSelect.selectOption({ index: 1 });
    
    await page.locator('[data-cy=textarea-instrucciones], textarea[formControlName="instrucciones"]').fill('Instrucciones de prueba');
    
    const confirmarButton = page.locator('[data-cy=btn-confirmar-derivacion], button:has-text("Confirmar"), button:has-text("Derivar")');
    await confirmarButton.click();
    
    await page.waitForSelector('.mat-snack-bar-container, .success-message', { timeout: 10000 });
    
    // Now view document details
    const verButton = page.locator('[data-cy=btn-ver-detalle], button:has-text("Ver")').first();
    if (await verButton.isVisible({ timeout: 3000 })) {
      await verButton.click();
      
      // Check for derivation history
      await expect(page.locator('[data-cy=historial-derivaciones], .historial, text=Historial')).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe permitir derivar a múltiples áreas', async ({ page }) => {
    // Open derivation modal
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await derivarButton.click();
    
    await page.waitForSelector('[data-cy=modal-derivar], .mat-dialog-container', { timeout: 5000 });
    
    // Check if multiple selection is available
    const areaSelect = page.locator('[data-cy=select-area-destino], select[formControlName="areaDestinoId"]');
    const isMultiple = await areaSelect.getAttribute('multiple');
    
    if (isMultiple !== null) {
      // Select multiple areas
      await areaSelect.selectOption([{ index: 1 }, { index: 2 }]);
    } else {
      // Select single area
      await areaSelect.selectOption({ index: 1 });
    }
    
    // Add instructions
    await page.locator('[data-cy=textarea-instrucciones], textarea[formControlName="instrucciones"]').fill('Derivación múltiple');
    
    // Submit
    const confirmarButton = page.locator('[data-cy=btn-confirmar-derivacion], button:has-text("Confirmar"), button:has-text("Derivar")');
    await confirmarButton.click();
    
    // Verify success
    await expect(page.locator('.mat-snack-bar-container, .success-message')).toBeVisible({ timeout: 10000 });
  });

  test('debe cerrar el modal al cancelar derivación', async ({ page }) => {
    // Open derivation modal
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await derivarButton.click();
    
    await page.waitForSelector('[data-cy=modal-derivar], .mat-dialog-container', { timeout: 5000 });
    
    // Click cancel button
    const cancelarButton = page.locator('[data-cy=btn-cancelar], button:has-text("Cancelar")');
    await cancelarButton.click();
    
    // Verify modal is closed
    await expect(page.locator('[data-cy=modal-derivar], .mat-dialog-container')).not.toBeVisible({ timeout: 3000 });
  });

  test('debe actualizar el estado del documento después de derivar', async ({ page }) => {
    // Derive document
    const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
    await derivarButton.click();
    
    await page.waitForSelector('[data-cy=modal-derivar], .mat-dialog-container', { timeout: 5000 });
    
    const areaSelect = page.locator('[data-cy=select-area-destino], select[formControlName="areaDestinoId"]');
    await areaSelect.selectOption({ index: 1 });
    
    await page.locator('[data-cy=textarea-instrucciones], textarea[formControlName="instrucciones"]').fill('Actualizar estado');
    
    const confirmarButton = page.locator('[data-cy=btn-confirmar-derivacion], button:has-text("Confirmar"), button:has-text("Derivar")');
    await confirmarButton.click();
    
    await page.waitForSelector('.mat-snack-bar-container, .success-message', { timeout: 10000 });
    
    // Refresh or check status
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Look for status indicator showing "EN_PROCESO" or similar
    const statusBadge = page.locator('[data-cy=estado-badge], .estado-badge, text=/EN_PROCESO|En Proceso/i').first();
    await expect(statusBadge).toBeVisible({ timeout: 5000 });
  });
});
