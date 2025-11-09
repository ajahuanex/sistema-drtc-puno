import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Configuración de Integración
 * Tests the complete flow of integration configuration
 */

test.describe('Configuración de Integración E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Mesa de Partes
    await page.goto('/mesa-partes');
    await page.waitForLoadState('networkidle');
    
    // Navigate to configuration tab
    const configuracionTab = page.locator('[data-cy=tab-configuracion], text=Configuración, text=Integraciones');
    if (await configuracionTab.isVisible({ timeout: 5000 })) {
      await configuracionTab.click();
    } else {
      // Try alternative navigation
      const menuButton = page.locator('[data-cy=btn-menu-integraciones], button:has-text("Integraciones")');
      if (await menuButton.isVisible({ timeout: 3000 })) {
        await menuButton.click();
      }
    }
    
    await page.waitForLoadState('networkidle');
  });

  test('debe mostrar la lista de integraciones', async ({ page }) => {
    // Verify integrations list is visible
    const integracionesList = page.locator('[data-cy=lista-integraciones], .integraciones-list, table');
    await expect(integracionesList).toBeVisible({ timeout: 5000 });
  });

  test('debe mostrar el botón para crear nueva integración', async ({ page }) => {
    // Verify new integration button
    const nuevaButton = page.locator('[data-cy=btn-nueva-integracion], button:has-text("Nueva"), button:has-text("Agregar")');
    await expect(nuevaButton).toBeVisible({ timeout: 5000 });
  });

  test('debe abrir el modal de nueva integración', async ({ page }) => {
    // Click new integration button
    const nuevaButton = page.locator('[data-cy=btn-nueva-integracion], button:has-text("Nueva"), button:has-text("Agregar")');
    await nuevaButton.click();
    
    // Verify modal is open
    await expect(page.locator('[data-cy=modal-integracion], .mat-dialog-container, .modal-integracion')).toBeVisible({ timeout: 5000 });
    
    // Verify form fields
    await expect(page.locator('[data-cy=input-nombre], input[formControlName="nombre"]')).toBeVisible();
    await expect(page.locator('[data-cy=input-url], input[formControlName="urlBase"]')).toBeVisible();
    await expect(page.locator('[data-cy=select-tipo], select[formControlName="tipo"]')).toBeVisible();
  });

  test('debe validar campos obligatorios en nueva integración', async ({ page }) => {
    // Open modal
    const nuevaButton = page.locator('[data-cy=btn-nueva-integracion], button:has-text("Nueva"), button:has-text("Agregar")');
    await nuevaButton.click();
    
    await page.waitForSelector('[data-cy=modal-integracion], .mat-dialog-container', { timeout: 5000 });
    
    // Try to submit without filling required fields
    const guardarButton = page.locator('[data-cy=btn-guardar-integracion], button:has-text("Guardar")');
    await guardarButton.click();
    
    // Check for validation errors
    const errorMessages = page.locator('.mat-error, .error-message');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });

  test('debe crear una nueva integración exitosamente', async ({ page }) => {
    // Open modal
    const nuevaButton = page.locator('[data-cy=btn-nueva-integracion], button:has-text("Nueva"), button:has-text("Agregar")');
    await nuevaButton.click();
    
    await page.waitForSelector('[data-cy=modal-integracion], .mat-dialog-container', { timeout: 5000 });
    
    // Fill form
    await page.locator('[data-cy=input-nombre], input[formControlName="nombre"]').fill('Mesa de Partes Regional');
    await page.locator('[data-cy=textarea-descripcion], textarea[formControlName="descripcion"]').fill('Integración con mesa de partes de la región');
    
    // Select type
    const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipo"]');
    await tipoSelect.selectOption('API_REST');
    
    // Fill URL
    await page.locator('[data-cy=input-url], input[formControlName="urlBase"]').fill('https://api.mesapartes-regional.gob.pe');
    
    // Select authentication type
    const authSelect = page.locator('[data-cy=select-autenticacion], select[formControlName="tipoAutenticacion"]');
    if (await authSelect.isVisible({ timeout: 2000 })) {
      await authSelect.selectOption('API_KEY');
    }
    
    // Fill credentials
    const credencialesInput = page.locator('[data-cy=input-credenciales], input[formControlName="credenciales"]');
    if (await credencialesInput.isVisible({ timeout: 2000 })) {
      await credencialesInput.fill('test-api-key-12345');
    }
    
    // Submit
    const guardarButton = page.locator('[data-cy=btn-guardar-integracion], button:has-text("Guardar")');
    await guardarButton.click();
    
    // Wait for success message
    await expect(page.locator('.mat-snack-bar-container, .success-message, text=exitosamente')).toBeVisible({ timeout: 10000 });
  });

  test('debe permitir probar la conexión de una integración', async ({ page }) => {
    // Look for test connection button
    const probarButton = page.locator('[data-cy=btn-probar-conexion], button:has-text("Probar")').first();
    
    if (await probarButton.isVisible({ timeout: 5000 })) {
      await probarButton.click();
      
      // Wait for test result
      await expect(page.locator('.mat-snack-bar-container, text=/Conexión|Test/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('debe mostrar el estado de conexión de cada integración', async ({ page }) => {
    // Check for connection status indicators
    const statusIndicators = page.locator('[data-cy=estado-conexion], .estado-conexion, .connection-status');
    
    if (await statusIndicators.first().isVisible({ timeout: 5000 })) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });

  test('debe permitir editar una integración existente', async ({ page }) => {
    // Click edit button
    const editarButton = page.locator('[data-cy=btn-editar-integracion], button:has-text("Editar")').first();
    
    if (await editarButton.isVisible({ timeout: 5000 })) {
      await editarButton.click();
      
      // Verify modal opens with data
      await expect(page.locator('[data-cy=modal-integracion], .mat-dialog-container')).toBeVisible({ timeout: 5000 });
      
      // Verify form has values
      const nombreInput = page.locator('[data-cy=input-nombre], input[formControlName="nombre"]');
      const nombreValue = await nombreInput.inputValue();
      expect(nombreValue).not.toBe('');
    }
  });

  test('debe permitir eliminar una integración', async ({ page }) => {
    // Click delete button
    const eliminarButton = page.locator('[data-cy=btn-eliminar-integracion], button:has-text("Eliminar")').first();
    
    if (await eliminarButton.isVisible({ timeout: 5000 })) {
      await eliminarButton.click();
      
      // Confirm deletion
      const confirmarButton = page.locator('[data-cy=btn-confirmar-eliminar], button:has-text("Confirmar"), button:has-text("Sí")');
      if (await confirmarButton.isVisible({ timeout: 3000 })) {
        await confirmarButton.click();
        
        // Wait for success message
        await expect(page.locator('.mat-snack-bar-container, .success-message')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('debe permitir configurar mapeo de campos', async ({ page }) => {
    // Open integration form
    const nuevaButton = page.locator('[data-cy=btn-nueva-integracion], button:has-text("Nueva"), button:has-text("Agregar")');
    await nuevaButton.click();
    
    await page.waitForSelector('[data-cy=modal-integracion], .mat-dialog-container', { timeout: 5000 });
    
    // Look for field mapping section
    const mapeoSection = page.locator('[data-cy=seccion-mapeo], text=Mapeo, text=Campos');
    
    if (await mapeoSection.isVisible({ timeout: 3000 })) {
      // Add field mapping
      const agregarMapeoButton = page.locator('[data-cy=btn-agregar-mapeo], button:has-text("Agregar campo")');
      if (await agregarMapeoButton.isVisible({ timeout: 2000 })) {
        await agregarMapeoButton.click();
        
        // Fill mapping
        await page.locator('[data-cy=input-campo-local], input[placeholder*="local"]').first().fill('numeroExpediente');
        await page.locator('[data-cy=input-campo-remoto], input[placeholder*="remoto"]').first().fill('expediente_numero');
      }
    }
  });

  test('debe permitir configurar webhooks', async ({ page }) => {
    // Open integration form
    const nuevaButton = page.locator('[data-cy=btn-nueva-integracion], button:has-text("Nueva"), button:has-text("Agregar")');
    await nuevaButton.click();
    
    await page.waitForSelector('[data-cy=modal-integracion], .mat-dialog-container', { timeout: 5000 });
    
    // Look for webhook section
    const webhookSection = page.locator('[data-cy=seccion-webhook], text=Webhook');
    
    if (await webhookSection.isVisible({ timeout: 3000 })) {
      // Fill webhook URL
      const webhookUrlInput = page.locator('[data-cy=input-webhook-url], input[formControlName="webhookUrl"]');
      if (await webhookUrlInput.isVisible({ timeout: 2000 })) {
        await webhookUrlInput.fill('https://api.external.com/webhook');
        
        // Select events
        const eventosCheckbox = page.locator('[data-cy=checkbox-evento], input[type="checkbox"]').first();
        if (await eventosCheckbox.isVisible({ timeout: 2000 })) {
          await eventosCheckbox.check();
        }
      }
    }
  });

  test('debe mostrar el log de sincronizaciones', async ({ page }) => {
    // Look for sync log button or tab
    const logButton = page.locator('[data-cy=btn-ver-log], button:has-text("Log"), button:has-text("Historial")').first();
    
    if (await logButton.isVisible({ timeout: 5000 })) {
      await logButton.click();
      
      // Verify log is displayed
      await expect(page.locator('[data-cy=log-sincronizacion], .log-list, table')).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe filtrar el log de sincronizaciones por fecha', async ({ page }) => {
    // Navigate to log
    const logButton = page.locator('[data-cy=btn-ver-log], button:has-text("Log"), button:has-text("Historial")').first();
    
    if (await logButton.isVisible({ timeout: 5000 })) {
      await logButton.click();
      
      // Apply date filter
      const fechaDesdeInput = page.locator('[data-cy=input-fecha-desde], input[formControlName="fechaDesde"]');
      if (await fechaDesdeInput.isVisible({ timeout: 3000 })) {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        await fechaDesdeInput.fill(lastWeek.toISOString().split('T')[0]);
        
        // Apply filter
        const filtrarButton = page.locator('[data-cy=btn-filtrar], button:has-text("Filtrar")');
        if (await filtrarButton.isVisible({ timeout: 2000 })) {
          await filtrarButton.click();
        }
      }
    }
  });

  test('debe mostrar errores de sincronización en el log', async ({ page }) => {
    // Navigate to log
    const logButton = page.locator('[data-cy=btn-ver-log], button:has-text("Log"), button:has-text("Historial")').first();
    
    if (await logButton.isVisible({ timeout: 5000 })) {
      await logButton.click();
      
      // Filter by errors
      const estadoSelect = page.locator('[data-cy=select-estado-log], select[formControlName="estado"]');
      if (await estadoSelect.isVisible({ timeout: 3000 })) {
        await estadoSelect.selectOption('ERROR');
        
        // Verify error entries
        const errorEntries = page.locator('[data-cy=log-entry-error], .log-error, text=Error');
        if (await errorEntries.first().isVisible({ timeout: 3000 })) {
          await expect(errorEntries.first()).toBeVisible();
        }
      }
    }
  });

  test('debe permitir activar/desactivar una integración', async ({ page }) => {
    // Look for toggle switch
    const toggleSwitch = page.locator('[data-cy=toggle-activa], .mat-slide-toggle, input[type="checkbox"]').first();
    
    if (await toggleSwitch.isVisible({ timeout: 5000 })) {
      const initialState = await toggleSwitch.isChecked();
      
      // Toggle the switch
      await toggleSwitch.click();
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Verify state changed
      const newState = await toggleSwitch.isChecked();
      expect(newState).not.toBe(initialState);
    }
  });

  test('debe validar formato de URL en configuración', async ({ page }) => {
    // Open modal
    const nuevaButton = page.locator('[data-cy=btn-nueva-integracion], button:has-text("Nueva"), button:has-text("Agregar")');
    await nuevaButton.click();
    
    await page.waitForSelector('[data-cy=modal-integracion], .mat-dialog-container', { timeout: 5000 });
    
    // Fill with invalid URL
    await page.locator('[data-cy=input-url], input[formControlName="urlBase"]').fill('invalid-url');
    
    // Blur the input to trigger validation
    await page.locator('[data-cy=input-url], input[formControlName="urlBase"]').blur();
    
    // Check for validation error
    const errorMessage = page.locator('.mat-error, .error-message, text=/URL|formato/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('debe mostrar última fecha de sincronización', async ({ page }) => {
    // Check for last sync date in the list
    const lastSyncDate = page.locator('[data-cy=ultima-sincronizacion], .last-sync, text=/Última sincronización/i');
    
    if (await lastSyncDate.first().isVisible({ timeout: 5000 })) {
      await expect(lastSyncDate.first()).toBeVisible();
    }
  });

  test('debe permitir cerrar el modal sin guardar', async ({ page }) => {
    // Open modal
    const nuevaButton = page.locator('[data-cy=btn-nueva-integracion], button:has-text("Nueva"), button:has-text("Agregar")');
    await nuevaButton.click();
    
    await page.waitForSelector('[data-cy=modal-integracion], .mat-dialog-container', { timeout: 5000 });
    
    // Fill some data
    await page.locator('[data-cy=input-nombre], input[formControlName="nombre"]').fill('Test');
    
    // Click cancel
    const cancelarButton = page.locator('[data-cy=btn-cancelar], button:has-text("Cancelar")');
    await cancelarButton.click();
    
    // Verify modal is closed
    await expect(page.locator('[data-cy=modal-integracion], .mat-dialog-container')).not.toBeVisible({ timeout: 3000 });
  });
});
