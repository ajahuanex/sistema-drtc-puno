/**
 * Script de Verificación de Accesibilidad - Módulo de Vehículos
 * 
 * Este script verifica que todas las mejoras de accesibilidad y responsive design
 * estén correctamente implementadas en el módulo de vehículos.
 * 
 * Uso:
 *   node verify-vehiculos-accessibility.js
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Contadores
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;

/**
 * Imprime un mensaje con color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Imprime el resultado de un check
 */
function checkResult(name, passed, details = '') {
  totalChecks++;
  if (passed) {
    passedChecks++;
    log(`✅ ${name}`, colors.green);
  } else {
    failedChecks++;
    log(`❌ ${name}`, colors.red);
  }
  if (details) {
    log(`   ${details}`, colors.cyan);
  }
}

/**
 * Imprime una advertencia
 */
function warning(message) {
  warnings++;
  log(`⚠️  ${message}`, colors.yellow);
}

/**
 * Lee un archivo
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Verifica si un archivo existe
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ============================================================================
// VERIFICACIONES
// ============================================================================

log('\n🔍 Verificando Accesibilidad y Responsive Design - Módulo de Vehículos\n', colors.blue);

// ----------------------------------------------------------------------------
// 1. VERIFICAR ARCHIVOS PRINCIPALES
// ----------------------------------------------------------------------------

log('📁 1. Verificando archivos principales...', colors.cyan);

const mainFiles = [
  'src/app/components/vehiculos/vehiculos.component.ts',
  'src/app/components/vehiculos/vehiculos.component.scss',
  'src/app/components/vehiculos/vehiculos-dashboard.component.ts',
  'src/app/services/vehiculo-keyboard-navigation.service.ts',
  'src/app/services/user-preferences.service.ts'
];

mainFiles.forEach(file => {
  const exists = fileExists(file);
  checkResult(
    `Archivo ${path.basename(file)}`,
    exists,
    exists ? 'Archivo encontrado' : 'Archivo no encontrado'
  );
});

// ----------------------------------------------------------------------------
// 2. VERIFICAR BREAKPOINTS RESPONSIVE
// ----------------------------------------------------------------------------

log('\n📱 2. Verificando breakpoints responsive...', colors.cyan);

const scssFile = readFile('src/app/components/vehiculos/vehiculos.component.scss');

if (scssFile) {
  const breakpoints = [
    { name: 'Desktop Grande (1024px)', pattern: /@media.*max-width.*1024px/ },
    { name: 'Tablet (768px)', pattern: /@media.*max-width.*768px/ },
    { name: 'Móvil (480px)', pattern: /@media.*max-width.*480px/ },
    { name: 'Móvil Pequeño (360px)', pattern: /@media.*max-width.*360px/ }
  ];

  breakpoints.forEach(bp => {
    const found = bp.pattern.test(scssFile);
    checkResult(
      `Breakpoint ${bp.name}`,
      found,
      found ? 'Implementado correctamente' : 'No encontrado'
    );
  });

  // Verificar grid responsive
  const hasResponsiveGrid = /\.stats-grid[\s\S]*?grid-template-columns[\s\S]*?repeat\(auto-fit/.test(scssFile);
  checkResult(
    'Grid responsive con auto-fit',
    hasResponsiveGrid,
    hasResponsiveGrid ? 'Grid adaptativo implementado' : 'Grid no es adaptativo'
  );

  // Verificar columnas ocultas en móvil
  const hidesColumnsOnMobile = /@media.*max-width.*480px[\s\S]*?\.mat-column-.*display:\s*none/.test(scssFile);
  checkResult(
    'Columnas ocultas en móvil',
    hidesColumnsOnMobile,
    hidesColumnsOnMobile ? 'Columnas se ocultan correctamente' : 'Columnas no se ocultan'
  );
} else {
  warning('No se pudo leer el archivo SCSS');
}

// ----------------------------------------------------------------------------
// 3. VERIFICAR ATRIBUTOS ARIA
// ----------------------------------------------------------------------------

log('\n♿ 3. Verificando atributos ARIA...', colors.cyan);

const tsFile = readFile('src/app/components/vehiculos/vehiculos.component.ts');

if (tsFile) {
  const ariaChecks = [
    { name: 'role="main"', pattern: /role="main"/ },
    { name: 'role="banner"', pattern: /role="banner"/ },
    { name: 'role="toolbar"', pattern: /role="toolbar"/ },
    { name: 'role="search"', pattern: /role="search"/ },
    { name: 'role="form"', pattern: /role="form"/ },
    { name: 'role="region"', pattern: /role="region"/ },
    { name: 'role="status"', pattern: /role="status"/ },
    { name: 'role="table"', pattern: /role="table"/ },
    { name: 'aria-label', pattern: /aria-label="[^"]+"/g },
    { name: 'aria-describedby', pattern: /aria-describedby="[^"]+"/g },
    { name: 'aria-live', pattern: /aria-live="[^"]+"/g },
    { name: 'aria-hidden', pattern: /aria-hidden="true"/g }
  ];

  ariaChecks.forEach(check => {
    const matches = tsFile.match(check.pattern);
    const found = matches && matches.length > 0;
    checkResult(
      `Atributo ${check.name}`,
      found,
      found ? `Encontrado ${matches.length} veces` : 'No encontrado'
    );
  });

  // Verificar clase sr-only
  const hasSrOnly = /class="sr-only"/.test(tsFile);
  checkResult(
    'Clase sr-only para screen readers',
    hasSrOnly,
    hasSrOnly ? 'Implementada correctamente' : 'No encontrada'
  );
} else {
  warning('No se pudo leer el archivo TypeScript');
}

// ----------------------------------------------------------------------------
// 4. VERIFICAR FOCUS VISIBLE
// ----------------------------------------------------------------------------

log('\n🎯 4. Verificando estilos de focus...', colors.cyan);

if (scssFile) {
  const focusChecks = [
    { name: '*:focus-visible', pattern: /\*:focus-visible/ },
    { name: 'button:focus-visible', pattern: /button:focus-visible/ },
    { name: 'input:focus-visible', pattern: /input:focus-visible/ },
    { name: '.mat-row:focus-visible', pattern: /\.mat-row:focus-visible/ },
    { name: '.stat-card:focus-visible', pattern: /\.stat-card:focus-visible/ }
  ];

  focusChecks.forEach(check => {
    const found = check.pattern.test(scssFile);
    checkResult(
      `Estilo ${check.name}`,
      found,
      found ? 'Implementado' : 'No encontrado'
    );
  });

  // Verificar que no haya outline: none sin alternativa
  const hasOutlineNone = /outline:\s*none(?!\s*;?\s*\/\/\s*alternativa)/gi.test(scssFile);
  if (hasOutlineNone) {
    warning('Se encontró "outline: none" - verificar que haya alternativa');
  } else {
    checkResult(
      'Sin outline: none problemático',
      true,
      'No se encontró outline: none sin alternativa'
    );
  }
} else {
  warning('No se pudo verificar estilos de focus');
}

// ----------------------------------------------------------------------------
// 5. VERIFICAR PREFERENCIAS DE USUARIO
// ----------------------------------------------------------------------------

log('\n⚙️  5. Verificando soporte de preferencias...', colors.cyan);

if (scssFile) {
  const preferenceChecks = [
    { name: 'prefers-reduced-motion', pattern: /@media.*prefers-reduced-motion:\s*reduce/ },
    { name: 'prefers-contrast: high', pattern: /@media.*prefers-contrast:\s*(high|more)/ },
    { name: 'prefers-color-scheme: dark', pattern: /@media.*prefers-color-scheme:\s*dark/ }
  ];

  preferenceChecks.forEach(check => {
    const found = check.pattern.test(scssFile);
    checkResult(
      `Media query ${check.name}`,
      found,
      found ? 'Implementada' : 'No encontrada'
    );
  });

  // Verificar que reduced-motion desactive animaciones
  const reducedMotionDisablesAnimations = /@media.*prefers-reduced-motion[\s\S]*?animation:\s*none/.test(scssFile);
  checkResult(
    'Reduced motion desactiva animaciones',
    reducedMotionDisablesAnimations,
    reducedMotionDisablesAnimations ? 'Correctamente implementado' : 'No implementado'
  );
} else {
  warning('No se pudo verificar preferencias de usuario');
}

// ----------------------------------------------------------------------------
// 6. VERIFICAR NAVEGACIÓN POR TECLADO
// ----------------------------------------------------------------------------

log('\n⌨️  6. Verificando navegación por teclado...', colors.cyan);

if (tsFile) {
  const keyboardChecks = [
    { name: 'tabindex="0"', pattern: /tabindex="0"/ },
    { name: 'keydown.enter', pattern: /\(keydown\.enter\)/ },
    { name: 'keydown.space', pattern: /\(keydown\.space\)/ },
    { name: 'keydown.escape', pattern: /\(keydown\.escape\)/ }
  ];

  keyboardChecks.forEach(check => {
    const found = check.pattern.test(tsFile);
    checkResult(
      `Evento ${check.name}`,
      found,
      found ? 'Implementado' : 'No encontrado'
    );
  });

  // Verificar servicio de navegación por teclado
  const hasKeyboardService = /VehiculoKeyboardNavigationService/.test(tsFile);
  checkResult(
    'Servicio de navegación por teclado',
    hasKeyboardService,
    hasKeyboardService ? 'Integrado' : 'No integrado'
  );
} else {
  warning('No se pudo verificar navegación por teclado');
}

// ----------------------------------------------------------------------------
// 7. VERIFICAR DOCUMENTACIÓN
// ----------------------------------------------------------------------------

log('\n📚 7. Verificando documentación...', colors.cyan);

const docFiles = [
  '../.kiro/specs/vehiculos-module-improvements/TASK_10_ACCESSIBILITY_GUIDE.md',
  '../.kiro/specs/vehiculos-module-improvements/TASK_10_COMPLETION_SUMMARY.md',
  '../.kiro/specs/vehiculos-module-improvements/TASK_10_QUICK_START.md'
];

docFiles.forEach(file => {
  const exists = fileExists(file);
  checkResult(
    `Documentación ${path.basename(file)}`,
    exists,
    exists ? 'Documento creado' : 'Documento no encontrado'
  );
});

// ----------------------------------------------------------------------------
// 8. VERIFICAR COMPONENTES RELACIONADOS
// ----------------------------------------------------------------------------

log('\n🧩 8. Verificando componentes relacionados...', colors.cyan);

const relatedComponents = [
  'src/app/components/vehiculos/vehiculo-busqueda-global.component.ts',
  'src/app/components/vehiculos/transferir-vehiculo-modal.component.ts',
  'src/app/components/vehiculos/solicitar-baja-vehiculo-modal.component.ts',
  'src/app/components/vehiculos/vehiculo-form.component.ts'
];

relatedComponents.forEach(file => {
  const content = readFile(file);
  if (content) {
    const hasAria = /aria-label|aria-describedby|role=/.test(content);
    checkResult(
      `Accesibilidad en ${path.basename(file)}`,
      hasAria,
      hasAria ? 'Atributos ARIA presentes' : 'Sin atributos ARIA'
    );
  } else {
    warning(`No se pudo leer ${path.basename(file)}`);
  }
});

// ============================================================================
// RESUMEN
// ============================================================================

log('\n' + '='.repeat(80), colors.blue);
log('📊 RESUMEN DE VERIFICACIÓN', colors.blue);
log('='.repeat(80), colors.blue);

log(`\nTotal de verificaciones: ${totalChecks}`);
log(`✅ Pasadas: ${passedChecks}`, colors.green);
log(`❌ Fallidas: ${failedChecks}`, colors.red);
log(`⚠️  Advertencias: ${warnings}`, colors.yellow);

const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
log(`\n📈 Tasa de éxito: ${successRate}%`, 
  successRate >= 90 ? colors.green : successRate >= 70 ? colors.yellow : colors.red
);

// Evaluación final
log('\n' + '='.repeat(80), colors.blue);
if (failedChecks === 0 && warnings === 0) {
  log('🎉 ¡EXCELENTE! Todas las verificaciones pasaron sin problemas.', colors.green);
  log('El módulo de vehículos cumple con todos los estándares de accesibilidad.', colors.green);
} else if (failedChecks === 0) {
  log('✅ BUENO. Todas las verificaciones pasaron, pero hay algunas advertencias.', colors.yellow);
  log('Revisa las advertencias para mejorar la implementación.', colors.yellow);
} else if (failedChecks <= 3) {
  log('⚠️  ACEPTABLE. La mayoría de verificaciones pasaron.', colors.yellow);
  log('Corrige los problemas encontrados para mejorar la accesibilidad.', colors.yellow);
} else {
  log('❌ NECESITA MEJORAS. Varias verificaciones fallaron.', colors.red);
  log('Revisa y corrige los problemas antes de continuar.', colors.red);
}
log('='.repeat(80) + '\n', colors.blue);

// Recomendaciones
if (failedChecks > 0 || warnings > 0) {
  log('💡 RECOMENDACIONES:', colors.cyan);
  log('');
  log('1. Revisa los elementos que fallaron en las verificaciones');
  log('2. Consulta la documentación en TASK_10_ACCESSIBILITY_GUIDE.md');
  log('3. Ejecuta las herramientas de testing recomendadas:');
  log('   - Lighthouse (Chrome DevTools)');
  log('   - axe DevTools');
  log('   - WAVE');
  log('4. Prueba la navegación por teclado manualmente');
  log('5. Verifica con lectores de pantalla (NVDA, JAWS, VoiceOver)');
  log('');
}

// Código de salida
process.exit(failedChecks > 0 ? 1 : 0);
