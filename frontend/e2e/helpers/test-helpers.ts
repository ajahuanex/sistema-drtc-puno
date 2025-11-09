import { Page, expect } from '@playwright/test';

/**
 * Test Helper Functions for Mesa de Partes E2E Tests
 */

/**
 * Login helper - logs in a user
 */
export async function login(page: Page, username: string = 'testuser', password: string = 'testpass') {
  await page.goto('/login');
  await page.locator('[data-cy=input-username], input[name="username"]').fill(username);
  await page.locator('[data-cy=input-password], input[name="password"]').fill(password);
  await page.locator('[data-cy=btn-login], button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to Mesa de Partes module
 */
export async function navigateToMesaPartes(page: Page) {
  await page.goto('/mesa-partes');
  await page.waitForLoadState('networkidle');
}

/**
 * Create a test document
 */
export async function createTestDocument(
  page: Page,
  data: {
    remitente: string;
    asunto: string;
    tipoIndex?: number;
    prioridad?: 'NORMAL' | 'ALTA' | 'URGENTE';
  }
) {
  // Navigate to registro tab
  const registroTab = page.locator('[data-cy=tab-registro], text=Registro');
  if (await registroTab.isVisible({ timeout: 3000 })) {
    await registroTab.click();
  }

  // Fill form
  await page.locator('[data-cy=input-remitente], input[formControlName="remitente"]').fill(data.remitente);
  await page.locator('[data-cy=input-asunto], textarea[formControlName="asunto"]').fill(data.asunto);

  // Select document type
  const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
  await tipoSelect.selectOption({ index: data.tipoIndex || 1 });

  // Set priority if specified
  if (data.prioridad) {
    const prioridadSelect = page.locator('[data-cy=select-prioridad], select[formControlName="prioridad"]');
    if (await prioridadSelect.isVisible({ timeout: 2000 })) {
      await prioridadSelect.selectOption(data.prioridad);
    }
  }

  // Submit
  await page.locator('[data-cy=btn-guardar], button[type="submit"]').click();

  // Wait for success
  await page.waitForSelector('.mat-snack-bar-container, .success-message', { timeout: 10000 });

  // Extract expediente number if visible
  const expedienteText = await page.locator('text=/EXP-\\d{4}-\\d{4}/').first().textContent({ timeout: 5000 }).catch(() => null);
  
  return expedienteText;
}

/**
 * Derive a document
 */
export async function deriveDocument(
  page: Page,
  options: {
    areaIndex?: number;
    instrucciones: string;
    esUrgente?: boolean;
    fechaLimite?: string;
  }
) {
  // Click derive button
  const derivarButton = page.locator('[data-cy=btn-derivar], button:has-text("Derivar")').first();
  await derivarButton.click();

  await page.waitForSelector('[data-cy=modal-derivar], .mat-dialog-container', { timeout: 5000 });

  // Select area
  const areaSelect = page.locator('[data-cy=select-area-destino], select[formControlName="areaDestinoId"]');
  await areaSelect.selectOption({ index: options.areaIndex || 1 });

  // Add instructions
  await page.locator('[data-cy=textarea-instrucciones], textarea[formControlName="instrucciones"]').fill(options.instrucciones);

  // Mark as urgent if specified
  if (options.esUrgente) {
    const urgenteCheckbox = page.locator('[data-cy=checkbox-urgente], input[formControlName="esUrgente"]');
    if (await urgenteCheckbox.isVisible({ timeout: 2000 })) {
      await urgenteCheckbox.check();
    }
  }

  // Set deadline if specified
  if (options.fechaLimite) {
    const fechaLimiteInput = page.locator('[data-cy=input-fecha-limite], input[formControlName="fechaLimite"]');
    if (await fechaLimiteInput.isVisible({ timeout: 2000 })) {
      await fechaLimiteInput.fill(options.fechaLimite);
    }
  }

  // Submit
  const confirmarButton = page.locator('[data-cy=btn-confirmar-derivacion], button:has-text("Confirmar"), button:has-text("Derivar")');
  await confirmarButton.click();

  // Wait for success
  await page.waitForSelector('.mat-snack-bar-container, .success-message', { timeout: 10000 });
}

/**
 * Search for documents
 */
export async function searchDocuments(
  page: Page,
  filters: {
    numeroExpediente?: string;
    remitente?: string;
    asunto?: string;
    tipo?: string;
    estado?: string;
    prioridad?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }
) {
  // Navigate to search/documents tab
  const busquedaTab = page.locator('[data-cy=tab-busqueda], text=Búsqueda');
  if (await busquedaTab.isVisible({ timeout: 3000 })) {
    await busquedaTab.click();
  } else {
    const documentosTab = page.locator('[data-cy=tab-documentos], text=Documentos');
    await documentosTab.click();
  }

  await page.waitForLoadState('networkidle');

  // Apply filters
  if (filters.numeroExpediente) {
    const input = page.locator('[data-cy=input-expediente], input[formControlName="numeroExpediente"]');
    if (await input.isVisible({ timeout: 2000 })) {
      await input.fill(filters.numeroExpediente);
    }
  }

  if (filters.remitente) {
    const input = page.locator('[data-cy=input-remitente], input[formControlName="remitente"]');
    if (await input.isVisible({ timeout: 2000 })) {
      await input.fill(filters.remitente);
    }
  }

  if (filters.asunto) {
    const input = page.locator('[data-cy=input-asunto], input[formControlName="asunto"]');
    if (await input.isVisible({ timeout: 2000 })) {
      await input.fill(filters.asunto);
    }
  }

  if (filters.tipo) {
    const select = page.locator('[data-cy=select-tipo], select[formControlName="tipoDocumentoId"]');
    if (await select.isVisible({ timeout: 2000 })) {
      await select.selectOption(filters.tipo);
    }
  }

  if (filters.estado) {
    const select = page.locator('[data-cy=select-estado], select[formControlName="estado"]');
    if (await select.isVisible({ timeout: 2000 })) {
      await select.selectOption(filters.estado);
    }
  }

  if (filters.prioridad) {
    const select = page.locator('[data-cy=select-prioridad], select[formControlName="prioridad"]');
    if (await select.isVisible({ timeout: 2000 })) {
      await select.selectOption(filters.prioridad);
    }
  }

  if (filters.fechaDesde) {
    const input = page.locator('[data-cy=input-fecha-desde], input[formControlName="fechaDesde"]');
    if (await input.isVisible({ timeout: 2000 })) {
      await input.fill(filters.fechaDesde);
    }
  }

  if (filters.fechaHasta) {
    const input = page.locator('[data-cy=input-fecha-hasta], input[formControlName="fechaHasta"]');
    if (await input.isVisible({ timeout: 2000 })) {
      await input.fill(filters.fechaHasta);
    }
  }

  // Click search button
  const searchButton = page.locator('[data-cy=btn-buscar], button:has-text("Buscar")');
  if (await searchButton.isVisible({ timeout: 2000 })) {
    await searchButton.click();
  }

  await page.waitForLoadState('networkidle');
}

/**
 * Create an integration
 */
export async function createIntegration(
  page: Page,
  data: {
    nombre: string;
    descripcion: string;
    tipo: 'API_REST' | 'WEBHOOK' | 'SOAP';
    urlBase: string;
    tipoAutenticacion?: 'API_KEY' | 'BEARER' | 'BASIC';
    credenciales?: string;
  }
) {
  // Navigate to configuration
  const configuracionTab = page.locator('[data-cy=tab-configuracion], text=Configuración, text=Integraciones');
  if (await configuracionTab.isVisible({ timeout: 3000 })) {
    await configuracionTab.click();
  }

  await page.waitForLoadState('networkidle');

  // Click new integration button
  const nuevaButton = page.locator('[data-cy=btn-nueva-integracion], button:has-text("Nueva"), button:has-text("Agregar")');
  await nuevaButton.click();

  await page.waitForSelector('[data-cy=modal-integracion], .mat-dialog-container', { timeout: 5000 });

  // Fill form
  await page.locator('[data-cy=input-nombre], input[formControlName="nombre"]').fill(data.nombre);
  await page.locator('[data-cy=textarea-descripcion], textarea[formControlName="descripcion"]').fill(data.descripcion);

  const tipoSelect = page.locator('[data-cy=select-tipo], select[formControlName="tipo"]');
  await tipoSelect.selectOption(data.tipo);

  await page.locator('[data-cy=input-url], input[formControlName="urlBase"]').fill(data.urlBase);

  if (data.tipoAutenticacion) {
    const authSelect = page.locator('[data-cy=select-autenticacion], select[formControlName="tipoAutenticacion"]');
    if (await authSelect.isVisible({ timeout: 2000 })) {
      await authSelect.selectOption(data.tipoAutenticacion);
    }
  }

  if (data.credenciales) {
    const credencialesInput = page.locator('[data-cy=input-credenciales], input[formControlName="credenciales"]');
    if (await credencialesInput.isVisible({ timeout: 2000 })) {
      await credencialesInput.fill(data.credenciales);
    }
  }

  // Submit
  const guardarButton = page.locator('[data-cy=btn-guardar-integracion], button:has-text("Guardar")');
  await guardarButton.click();

  // Wait for success
  await page.waitForSelector('.mat-snack-bar-container, .success-message', { timeout: 10000 });
}

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForElement(page: Page, selector: string, timeout: number = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).count() > 0;
}

/**
 * Get text content of element
 */
export async function getTextContent(page: Page, selector: string): Promise<string | null> {
  return await page.locator(selector).textContent();
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp, timeout: number = 10000) {
  return await page.waitForResponse(
    response => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Clear all form fields
 */
export async function clearForm(page: Page) {
  const inputs = await page.locator('input[type="text"], input[type="email"], textarea').all();
  for (const input of inputs) {
    await input.clear();
  }
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    remitente: `Test User ${timestamp}`,
    asunto: `Test Subject ${timestamp}`,
    email: `test${timestamp}@example.com`,
    nombre: `Test Integration ${timestamp}`,
  };
}

/**
 * Format date for input fields
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get future date
 */
export function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDateForInput(date);
}

/**
 * Get past date
 */
export function getPastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateForInput(date);
}
