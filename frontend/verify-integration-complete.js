/**
 * Script de verificación automática para la integración de componentes no utilizados
 * 
 * Este script verifica que todos los componentes se han integrado correctamente
 * y que no hay archivos sin usar en el proyecto.
 * 
 * Uso: node verify-integration-complete.js
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Resultados de las verificaciones
const results = {
  passed: [],
  failed: [],
  warnings: []
};

/**
 * Imprime un mensaje con color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Imprime un encabezado de sección
 */
function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

/**
 * Verifica si un archivo existe
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(__dirname, filePath));
  } catch (error) {
    return false;
  }
}

/**
 * Lee el contenido de un archivo
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Verifica si un archivo contiene un texto específico
 */
function fileContains(filePath, searchText) {
  const content = readFile(filePath);
  if (!content) return false;
  return content.includes(searchText);
}

/**
 * Test 1: Verificar que CodigoEmpresaInfoComponent está integrado
 */
function testCodigoEmpresaInfoIntegration() {
  logSection('Test 1: CodigoEmpresaInfoComponent Integration');
  
  // 1.1: Verificar que el componente existe
  if (fileExists('src/app/components/shared/codigo-empresa-info.component.ts')) {
    log('✓ CodigoEmpresaInfoComponent existe', colors.green);
    results.passed.push('CodigoEmpresaInfoComponent file exists');
  } else {
    log('✗ CodigoEmpresaInfoComponent NO existe', colors.red);
    results.failed.push('CodigoEmpresaInfoComponent file missing');
    return;
  }
  
  // 1.2: Verificar que está importado en empresa-detail
  if (fileContains('src/app/components/empresas/empresa-detail.component.ts', 'CodigoEmpresaInfoComponent')) {
    log('✓ CodigoEmpresaInfoComponent está importado en empresa-detail', colors.green);
    results.passed.push('CodigoEmpresaInfoComponent imported in empresa-detail');
  } else {
    log('✗ CodigoEmpresaInfoComponent NO está importado en empresa-detail', colors.red);
    results.failed.push('CodigoEmpresaInfoComponent not imported in empresa-detail');
  }
  
  // 1.3: Verificar que está en el template de empresa-detail
  if (fileContains('src/app/components/empresas/empresa-detail.component.ts', 'app-codigo-empresa-info')) {
    log('✓ CodigoEmpresaInfoComponent está en el template de empresa-detail', colors.green);
    results.passed.push('CodigoEmpresaInfoComponent in empresa-detail template');
  } else {
    log('✗ CodigoEmpresaInfoComponent NO está en el template de empresa-detail', colors.red);
    results.failed.push('CodigoEmpresaInfoComponent not in empresa-detail template');
  }
  
  // 1.4: Verificar que tiene JSDoc
  const componentContent = readFile('src/app/components/shared/codigo-empresa-info.component.ts');
  if (componentContent && componentContent.includes('/**') && componentContent.includes('@example')) {
    log('✓ CodigoEmpresaInfoComponent tiene documentación JSDoc', colors.green);
    results.passed.push('CodigoEmpresaInfoComponent has JSDoc');
  } else {
    log('⚠ CodigoEmpresaInfoComponent podría necesitar más documentación JSDoc', colors.yellow);
    results.warnings.push('CodigoEmpresaInfoComponent JSDoc could be improved');
  }
}

/**
 * Test 2: Verificar que IconService está integrado
 */
function testIconServiceIntegration() {
  logSection('Test 2: IconService Integration');
  
  // 2.1: Verificar que el servicio existe
  if (fileExists('src/app/services/icon.service.ts')) {
    log('✓ IconService existe', colors.green);
    results.passed.push('IconService file exists');
  } else {
    log('✗ IconService NO existe', colors.red);
    results.failed.push('IconService file missing');
    return;
  }
  
  // 2.2: Verificar que está en providedIn: 'root'
  if (fileContains('src/app/services/icon.service.ts', "providedIn: 'root'")) {
    log('✓ IconService está configurado como providedIn: root', colors.green);
    results.passed.push('IconService is providedIn root');
  } else {
    log('✗ IconService NO está configurado como providedIn: root', colors.red);
    results.failed.push('IconService not providedIn root');
  }
  
  // 2.3: Verificar que tiene JSDoc
  const serviceContent = readFile('src/app/services/icon.service.ts');
  if (serviceContent && serviceContent.includes('/**') && serviceContent.includes('@example')) {
    log('✓ IconService tiene documentación JSDoc', colors.green);
    results.passed.push('IconService has JSDoc');
  } else {
    log('⚠ IconService podría necesitar más documentación JSDoc', colors.yellow);
    results.warnings.push('IconService JSDoc could be improved');
  }
}

/**
 * Test 3: Verificar que SmartIconComponent está integrado
 */
function testSmartIconComponentIntegration() {
  logSection('Test 3: SmartIconComponent Integration');
  
  // 3.1: Verificar que el componente existe
  if (fileExists('src/app/shared/smart-icon.component.ts')) {
    log('✓ SmartIconComponent existe', colors.green);
    results.passed.push('SmartIconComponent file exists');
  } else {
    log('✗ SmartIconComponent NO existe', colors.red);
    results.failed.push('SmartIconComponent file missing');
    return;
  }
  
  // 3.2: Verificar que usa IconService
  if (fileContains('src/app/shared/smart-icon.component.ts', 'IconService')) {
    log('✓ SmartIconComponent usa IconService', colors.green);
    results.passed.push('SmartIconComponent uses IconService');
  } else {
    log('✗ SmartIconComponent NO usa IconService', colors.red);
    results.failed.push('SmartIconComponent does not use IconService');
  }
  
  // 3.3: Verificar que tiene JSDoc
  const componentContent = readFile('src/app/shared/smart-icon.component.ts');
  if (componentContent && componentContent.includes('/**') && componentContent.includes('@example')) {
    log('✓ SmartIconComponent tiene documentación JSDoc', colors.green);
    results.passed.push('SmartIconComponent has JSDoc');
  } else {
    log('⚠ SmartIconComponent podría necesitar más documentación JSDoc', colors.yellow);
    results.warnings.push('SmartIconComponent JSDoc could be improved');
  }
  
  // 3.4: Verificar que está siendo usado en algún componente
  const mainLayoutContent = readFile('src/app/components/layout/main-layout.component.ts');
  const dashboardContent = readFile('src/app/components/dashboard/dashboard.component.ts');
  
  if ((mainLayoutContent && mainLayoutContent.includes('SmartIconComponent')) ||
      (dashboardContent && dashboardContent.includes('SmartIconComponent'))) {
    log('✓ SmartIconComponent está siendo usado en componentes', colors.green);
    results.passed.push('SmartIconComponent is being used');
  } else {
    log('⚠ SmartIconComponent podría no estar siendo usado en componentes principales', colors.yellow);
    results.warnings.push('SmartIconComponent usage could be expanded');
  }
}

/**
 * Test 4: Verificar que EmpresaSelectorComponent está mejorado
 */
function testEmpresaSelectorIntegration() {
  logSection('Test 4: EmpresaSelectorComponent Integration');
  
  // 4.1: Verificar que el componente existe
  if (fileExists('src/app/shared/empresa-selector.component.ts')) {
    log('✓ EmpresaSelectorComponent existe', colors.green);
    results.passed.push('EmpresaSelectorComponent file exists');
  } else {
    log('✗ EmpresaSelectorComponent NO existe', colors.red);
    results.failed.push('EmpresaSelectorComponent file missing');
    return;
  }
  
  // 4.2: Verificar que tiene búsqueda por código
  const selectorContent = readFile('src/app/shared/empresa-selector.component.ts');
  if (selectorContent && selectorContent.includes('codigoEmpresa')) {
    log('✓ EmpresaSelectorComponent tiene búsqueda por código', colors.green);
    results.passed.push('EmpresaSelectorComponent has codigo search');
  } else {
    log('⚠ EmpresaSelectorComponent podría no tener búsqueda por código', colors.yellow);
    results.warnings.push('EmpresaSelectorComponent codigo search not found');
  }
  
  // 4.3: Verificar que está siendo usado en crear-resolucion
  if (fileContains('src/app/components/resoluciones/crear-resolucion-modal.component.ts', 'EmpresaSelectorComponent') ||
      fileContains('src/app/components/resoluciones/crear-resolucion-modal.component.ts', 'app-empresa-selector')) {
    log('✓ EmpresaSelectorComponent está integrado en crear-resolucion', colors.green);
    results.passed.push('EmpresaSelectorComponent integrated in crear-resolucion');
  } else {
    log('✗ EmpresaSelectorComponent NO está integrado en crear-resolucion', colors.red);
    results.failed.push('EmpresaSelectorComponent not integrated in crear-resolucion');
  }
  
  // 4.4: Verificar que tiene JSDoc
  if (selectorContent && selectorContent.includes('/**') && selectorContent.includes('@example')) {
    log('✓ EmpresaSelectorComponent tiene documentación JSDoc', colors.green);
    results.passed.push('EmpresaSelectorComponent has JSDoc');
  } else {
    log('⚠ EmpresaSelectorComponent podría necesitar más documentación JSDoc', colors.yellow);
    results.warnings.push('EmpresaSelectorComponent JSDoc could be improved');
  }
}

/**
 * Test 5: Verificar que FlujoTrabajoService está preparado
 */
function testFlujoTrabajoServicePreparation() {
  logSection('Test 5: FlujoTrabajoService Preparation');
  
  // 5.1: Verificar que el servicio existe
  if (fileExists('src/app/services/flujo-trabajo.service.ts')) {
    log('✓ FlujoTrabajoService existe', colors.green);
    results.passed.push('FlujoTrabajoService file exists');
  } else {
    log('✗ FlujoTrabajoService NO existe', colors.red);
    results.failed.push('FlujoTrabajoService file missing');
    return;
  }
  
  // 5.2: Verificar que está en providedIn: 'root'
  if (fileContains('src/app/services/flujo-trabajo.service.ts', "providedIn: 'root'")) {
    log('✓ FlujoTrabajoService está configurado como providedIn: root', colors.green);
    results.passed.push('FlujoTrabajoService is providedIn root');
  } else {
    log('✗ FlujoTrabajoService NO está configurado como providedIn: root', colors.red);
    results.failed.push('FlujoTrabajoService not providedIn root');
  }
  
  // 5.3: Verificar que tiene documentación
  if (fileExists('src/app/services/flujo-trabajo-service.README.md')) {
    log('✓ FlujoTrabajoService tiene README', colors.green);
    results.passed.push('FlujoTrabajoService has README');
  } else {
    log('⚠ FlujoTrabajoService podría necesitar README', colors.yellow);
    results.warnings.push('FlujoTrabajoService README missing');
  }
  
  // 5.4: Verificar que tiene ejemplos
  if (fileExists('src/app/services/flujo-trabajo-examples.md')) {
    log('✓ FlujoTrabajoService tiene ejemplos de uso', colors.green);
    results.passed.push('FlujoTrabajoService has examples');
  } else {
    log('⚠ FlujoTrabajoService podría necesitar ejemplos de uso', colors.yellow);
    results.warnings.push('FlujoTrabajoService examples missing');
  }
}

/**
 * Test 6: Verificar que shared/index.ts está actualizado
 */
function testSharedIndexExports() {
  logSection('Test 6: Shared Index Exports');
  
  // 6.1: Verificar que el archivo existe
  if (fileExists('src/app/shared/index.ts')) {
    log('✓ shared/index.ts existe', colors.green);
    results.passed.push('shared/index.ts file exists');
  } else {
    log('⚠ shared/index.ts NO existe (opcional)', colors.yellow);
    results.warnings.push('shared/index.ts file missing');
    return;
  }
  
  // 6.2: Verificar que exporta CodigoEmpresaInfoComponent
  if (fileContains('src/app/shared/index.ts', 'codigo-empresa-info')) {
    log('✓ shared/index.ts exporta CodigoEmpresaInfoComponent', colors.green);
    results.passed.push('shared/index.ts exports CodigoEmpresaInfoComponent');
  } else {
    log('⚠ shared/index.ts podría no exportar CodigoEmpresaInfoComponent', colors.yellow);
    results.warnings.push('shared/index.ts missing CodigoEmpresaInfoComponent export');
  }
  
  // 6.3: Verificar que exporta SmartIconComponent
  if (fileContains('src/app/shared/index.ts', 'smart-icon')) {
    log('✓ shared/index.ts exporta SmartIconComponent', colors.green);
    results.passed.push('shared/index.ts exports SmartIconComponent');
  } else {
    log('⚠ shared/index.ts podría no exportar SmartIconComponent', colors.yellow);
    results.warnings.push('shared/index.ts missing SmartIconComponent export');
  }
}

/**
 * Test 7: Verificar que no hay archivos sin usar
 */
function testNoUnusedFiles() {
  logSection('Test 7: No Unused Files');
  
  log('ℹ Este test requiere ejecutar ng build para verificar warnings', colors.blue);
  log('ℹ Ejecuta: ng build --configuration production', colors.blue);
  results.warnings.push('Manual verification needed: run ng build to check for unused files');
}

/**
 * Test 8: Verificar documentación
 */
function testDocumentation() {
  logSection('Test 8: Documentation');
  
  // 8.1: Verificar que existe README actualizado
  if (fileExists('README.md')) {
    const readmeContent = readFile('README.md');
    if (readmeContent && (readmeContent.includes('CodigoEmpresaInfo') || 
                          readmeContent.includes('SmartIcon') ||
                          readmeContent.includes('IconService'))) {
      log('✓ README.md menciona los componentes integrados', colors.green);
      results.passed.push('README.md mentions integrated components');
    } else {
      log('⚠ README.md podría necesitar actualización con componentes integrados', colors.yellow);
      results.warnings.push('README.md could mention integrated components');
    }
  }
  
  // 8.2: Verificar que existe guía de testing manual
  if (fileExists('MANUAL_TESTING_GUIDE.md')) {
    log('✓ Existe guía de testing manual', colors.green);
    results.passed.push('Manual testing guide exists');
  } else {
    log('⚠ No existe guía de testing manual', colors.yellow);
    results.warnings.push('Manual testing guide missing');
  }
}

/**
 * Imprime el resumen de resultados
 */
function printSummary() {
  logSection('Resumen de Verificación');
  
  const total = results.passed.length + results.failed.length + results.warnings.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;
  
  log(`Total de verificaciones: ${total}`, colors.bright);
  log(`✓ Pasadas: ${results.passed.length}`, colors.green);
  log(`✗ Fallidas: ${results.failed.length}`, colors.red);
  log(`⚠ Advertencias: ${results.warnings.length}`, colors.yellow);
  log(`Tasa de éxito: ${passRate}%`, colors.bright);
  
  if (results.failed.length > 0) {
    console.log('\n' + '-'.repeat(80));
    log('Verificaciones Fallidas:', colors.red + colors.bright);
    console.log('-'.repeat(80));
    results.failed.forEach((failure, index) => {
      log(`${index + 1}. ${failure}`, colors.red);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n' + '-'.repeat(80));
    log('Advertencias:', colors.yellow + colors.bright);
    console.log('-'.repeat(80));
    results.warnings.forEach((warning, index) => {
      log(`${index + 1}. ${warning}`, colors.yellow);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  if (results.failed.length === 0) {
    log('✓ VERIFICACIÓN COMPLETADA EXITOSAMENTE', colors.green + colors.bright);
    log('Todos los componentes están integrados correctamente.', colors.green);
  } else {
    log('✗ VERIFICACIÓN COMPLETADA CON ERRORES', colors.red + colors.bright);
    log('Por favor, revisa los errores arriba y corrígelos.', colors.red);
  }
  console.log('='.repeat(80) + '\n');
}

/**
 * Función principal
 */
function main() {
  log('\n' + '█'.repeat(80), colors.cyan);
  log('█' + ' '.repeat(78) + '█', colors.cyan);
  log('█' + '  VERIFICACIÓN DE INTEGRACIÓN DE COMPONENTES NO UTILIZADOS'.padEnd(78) + '█', colors.cyan + colors.bright);
  log('█' + ' '.repeat(78) + '█', colors.cyan);
  log('█'.repeat(80) + '\n', colors.cyan);
  
  // Ejecutar todos los tests
  testCodigoEmpresaInfoIntegration();
  testIconServiceIntegration();
  testSmartIconComponentIntegration();
  testEmpresaSelectorIntegration();
  testFlujoTrabajoServicePreparation();
  testSharedIndexExports();
  testNoUnusedFiles();
  testDocumentation();
  
  // Imprimir resumen
  printSummary();
  
  // Exit code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Ejecutar
main();
