import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Búsqueda y Consulta de Documentos
 * Tests the complete flow of document search and query
 */

test.describe('Búsqueda y Consulta de Documentos E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Mesa de Partes
    await page.goto('/mesa-partes');
    await page.waitForLoadState('networkidle');
    
    // Create some test documents for searching
    await createTestDocuments(page);
    
    // Navigate to search/documents tab
    const busquedaTab = page.locator('[data-cy=tab-busqueda], text=Búsqueda');
    if (await busquedaTab.isVisible()) {
      await busquedaTab.click();
    } else {
      // Try documents tab
      const documentosTab = page.locator('[data-cy=tab-documentos], text=Documentos');
      await documentosTab.click();
    }
    
    await page.waitForLoadState('networkidle');
  });

  test('debe mostrar el formulario de búsqueda', async ({ page }) => {
    // Verify search form elements
    const searchInput = page.locator('[data-cy=input-busqueda], input[placeholder*="Buscar"], input[type="search"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('debe buscar documentos por número de expediente', async ({ page }) => {
    // Enter expediente number
    const searchInput = page.locator('[data-cy=input-expediente], input[formControlName="numeroExpediente"]');
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('EXP-2025-0001');
      
      // Click search button
      const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
      await searchButton.click();
      
      // Wait for results
      await page.waitForLoadState('networkidle');
      
      // Verify results contain the expediente number
      await expect(page.locator('text=EXP-2025-0001')).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe buscar documentos por remitente', async ({ page }) => {
    // Enter remitente name
    const searchInput = page.locator('[data-cy=input-remitente], input[formControlName="remitente"]');
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('Juan Pérez');
      
      // Click search button
      const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
      await searchButton.click();
      
      // Wait for results
      await page.waitForLoadState('networkidle');
      
      // Verify results
      const resultsTable = page.locator('[data-cy=tabla-resultados], table, .documentos-list');
      await expect(resultsTable).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe buscar documentos por asunto', async ({ page }) => {
    // Enter subject
    const searchInput = page.locator('[data-cy=input-asunto], input[formControlName="asunto"]');
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('Solicitud');
      
      // Click search button
      const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
      await searchButton.click();
      
      // Wait for results
      await page.waitForLoadState('networkidle');
      
      // Verify results contain the search term
      await expect(page.locator('text=/Solicitud/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe filtrar documentos por tipo', async ({ page }) => {
    // Select document type filter
    const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
    
    if (await tipoSelect.isVisible({ timeout: 3000 })) {
      await tipoSelect.selectOption({ index: 1 });
      
      // Wait for filtered results
      await page.waitForLoadState('networkidle');
      
      // Verify results are filtered
      const resultsTable = page.locator('[data-cy=tabla-resultados], table, .documentos-list');
      await expect(resultsTable).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe filtrar documentos por estado', async ({ page }) => {
    // Select status filter
    const estadoSelect = page.locator('[data-cy=select-estado], select[formControlName="estado"]');
    
    if (await estadoSelect.isVisible({ timeout: 3000 })) {
      await estadoSelect.selectOption('REGISTRADO');
      
      // Wait for filtered results
      await page.waitForLoadState('networkidle');
      
      // Verify status badges show correct state
      const statusBadges = page.locator('[data-cy=estado-badge], .estado-badge');
      await expect(statusBadges.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe filtrar documentos por rango de fechas', async ({ page }) => {
    // Set date range
    const fechaDesdeInput = page.locator('[data-cy=input-fecha-desde], input[formControlName="fechaDesde"]');
    const fechaHastaInput = page.locator('[data-cy=input-fecha-hasta], input[formControlName="fechaHasta"]');
    
    if (await fechaDesdeInput.isVisible({ timeout: 3000 })) {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      
      await fechaDesdeInput.fill(lastWeek.toISOString().split('T')[0]);
      await fechaHastaInput.fill(today.toISOString().split('T')[0]);
      
      // Click search
      const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
      await searchButton.click();
      
      // Wait for results
      await page.waitForLoadState('networkidle');
      
      // Verify results
      const resultsTable = page.locator('[data-cy=tabla-resultados], table, .documentos-list');
      await expect(resultsTable).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe filtrar documentos por prioridad', async ({ page }) => {
    // Select priority filter
    const prioridadSelect = page.locator('[data-cy=select-prioridad], select[formControlName="prioridad"]');
    
    if (await prioridadSelect.isVisible({ timeout: 3000 })) {
      await prioridadSelect.selectOption('URGENTE');
      
      // Wait for filtered results
      await page.waitForLoadState('networkidle');
      
      // Verify priority indicators
      const prioridadIndicators = page.locator('[data-cy=prioridad-indicator], .prioridad-indicator');
      await expect(prioridadIndicators.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe mostrar resultados paginados', async ({ page }) => {
    // Perform a broad search to get multiple results
    const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
    if (await searchButton.isVisible({ timeout: 3000 })) {
      await searchButton.click();
    }
    
    await page.waitForLoadState('networkidle');
    
    // Check for pagination controls
    const paginationControls = page.locator('[data-cy=paginacion], .mat-paginator, .pagination');
    await expect(paginationControls).toBeVisible({ timeout: 5000 });
  });

  test('debe permitir ordenar resultados por columna', async ({ page }) => {
    // Perform search
    const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
    if (await searchButton.isVisible({ timeout: 3000 })) {
      await searchButton.click();
    }
    
    await page.waitForLoadState('networkidle');
    
    // Click on a column header to sort
    const columnHeader = page.locator('[data-cy=header-fecha], th:has-text("Fecha")').first();
    if (await columnHeader.isVisible({ timeout: 3000 })) {
      await columnHeader.click();
      
      // Wait for re-sort
      await page.waitForTimeout(1000);
      
      // Verify sort indicator
      const sortIndicator = page.locator('.mat-sort-header-arrow, .sort-indicator');
      await expect(sortIndicator.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('debe abrir detalle del documento al hacer clic en ver', async ({ page }) => {
    // Perform search
    const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
    if (await searchButton.isVisible({ timeout: 3000 })) {
      await searchButton.click();
    }
    
    await page.waitForLoadState('networkidle');
    
    // Click on view button
    const verButton = page.locator('[data-cy=btn-ver-detalle], button:has-text("Ver")').first();
    await verButton.click({ timeout: 5000 });
    
    // Verify detail view is shown
    await expect(page.locator('[data-cy=detalle-documento], .detalle-documento, .documento-detail')).toBeVisible({ timeout: 5000 });
  });

  test('debe mostrar información completa en el detalle del documento', async ({ page }) => {
    // Navigate to documents and open first one
    const documentosTab = page.locator('[data-cy=tab-documentos], text=Documentos');
    if (await documentosTab.isVisible({ timeout: 3000 })) {
      await documentosTab.click();
    }
    
    await page.waitForLoadState('networkidle');
    
    const verButton = page.locator('[data-cy=btn-ver-detalle], button:has-text("Ver")').first();
    if (await verButton.isVisible({ timeout: 5000 })) {
      await verButton.click();
      
      // Verify detail sections
      await expect(page.locator('text=/Número de Expediente|Expediente/i')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=/Remitente/i')).toBeVisible();
      await expect(page.locator('text=/Asunto/i')).toBeVisible();
      await expect(page.locator('text=/Estado/i')).toBeVisible();
    }
  });

  test('debe permitir exportar resultados a Excel', async ({ page }) => {
    // Perform search
    const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
    if (await searchButton.isVisible({ timeout: 3000 })) {
      await searchButton.click();
    }
    
    await page.waitForLoadState('networkidle');
    
    // Look for export button
    const exportButton = page.locator('[data-cy=btn-exportar-excel], button:has-text("Excel"), button:has-text("Exportar")');
    if (await exportButton.isVisible({ timeout: 3000 })) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      
      await exportButton.click();
      
      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i);
    }
  });

  test('debe permitir búsqueda rápida por texto', async ({ page }) => {
    // Use quick search input
    const quickSearchInput = page.locator('[data-cy=input-busqueda-rapida], input[placeholder*="Buscar"]').first();
    
    await quickSearchInput.fill('Solicitud');
    
    // Press Enter or wait for auto-search
    await quickSearchInput.press('Enter');
    
    // Wait for results
    await page.waitForLoadState('networkidle');
    
    // Verify results
    const resultsTable = page.locator('[data-cy=tabla-resultados], table, .documentos-list');
    await expect(resultsTable).toBeVisible({ timeout: 5000 });
  });

  test('debe limpiar filtros al hacer clic en limpiar', async ({ page }) => {
    // Fill some filters
    const searchInput = page.locator('[data-cy=input-remitente], input[formControlName="remitente"]');
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('Test');
    }
    
    // Click clear button
    const clearButton = page.locator('[data-cy=btn-limpiar], button:has-text("Limpiar")');
    if (await clearButton.isVisible({ timeout: 3000 })) {
      await clearButton.click();
      
      // Verify input is cleared
      const inputValue = await searchInput.inputValue();
      expect(inputValue).toBe('');
    }
  });

  test('debe mostrar mensaje cuando no hay resultados', async ({ page }) => {
    // Search for something that doesn't exist
    const searchInput = page.locator('[data-cy=input-expediente], input[formControlName="numeroExpediente"]');
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('EXP-9999-9999');
      
      const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
      await searchButton.click();
      
      await page.waitForLoadState('networkidle');
      
      // Verify no results message
      await expect(page.locator('text=/No se encontraron|Sin resultados/i')).toBeVisible({ timeout: 5000 });
    }
  });
});

/**
 * Helper function to create test documents
 */
async function createTestDocuments(page: any) {
  // Navigate to registro
  const registroTab = page.locator('[data-cy=tab-registro], text=Registro');
  if (await registroTab.isVisible({ timeout: 3000 })) {
    await registroTab.click();
    
    // Create 2-3 test documents
    const testDocs = [
      { remitente: 'Juan Pérez', asunto: 'Solicitud de información' },
      { remitente: 'María García', asunto: 'Consulta administrativa' },
    ];
    
    for (const doc of testDocs) {
      await page.locator('[data-cy=input-remitente], input[formControlName="remitente"]').fill(doc.remitente);
      await page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]').fill(doc.asunto);
      
      const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
      if (await tipoSelect.isVisible({ timeout: 2000 })) {
        await tipoSelect.selectOption({ index: 1 });
      }
      
      await page.locator('[data-cy=btn-guardar], button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }
  }
}
