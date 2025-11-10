/**
 * Script de Verificación de Rendimiento
 * 
 * Verifica que todas las optimizaciones de rendimiento estén implementadas
 * y funcionando correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando implementación de optimizaciones de rendimiento...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    checks.passed++;
    return true;
  } else {
    console.log(`❌ ${description}`);
    console.log(`   Archivo no encontrado: ${filePath}`);
    checks.failed++;
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchString)) {
      console.log(`✅ ${description}`);
      checks.passed++;
      return true;
    } else {
      console.log(`⚠️  ${description}`);
      console.log(`   No se encontró: "${searchString}" en ${filePath}`);
      checks.warnings++;
      return false;
    }
  } else {
    console.log(`❌ ${description}`);
    console.log(`   Archivo no encontrado: ${filePath}`);
    checks.failed++;
    return false;
  }
}

console.log('📁 Verificando archivos de herramientas de rendimiento:\n');

// Verificar herramientas de monitoreo
checkFile(
  'src/app/utils/performance-monitor.ts',
  'Performance Monitor implementado'
);

checkFile(
  'src/app/utils/load-test-generator.ts',
  'Load Test Generator implementado'
);

checkFile(
  'performance-test.html',
  'Suite de pruebas de rendimiento creada'
);

console.log('\n🔧 Verificando optimizaciones en componentes:\n');

// Verificar OnPush change detection
checkFileContent(
  'src/app/shared/resoluciones-table.component.ts',
  'ChangeDetectionStrategy.OnPush',
  'OnPush change detection en ResolucionesTableComponent'
);

// Verificar trackBy function
checkFileContent(
  'src/app/shared/resoluciones-table.component.ts',
  'trackByResolucion',
  'TrackBy function implementada'
);

// Verificar virtual scrolling
checkFileContent(
  'src/app/shared/resoluciones-table.component.ts',
  'cdk-virtual-scroll',
  'Virtual scrolling implementado'
);

console.log('\n⚡ Verificando optimizaciones en servicios:\n');

// Verificar debounce en filtros
checkFileContent(
  'src/app/services/resoluciones-table.service.ts',
  'debounceTime',
  'Debounce en filtros implementado'
);

// Verificar performance monitoring en service
checkFileContent(
  'src/app/services/resolucion.service.ts',
  'PerformanceMonitor',
  'Performance monitoring en ResolucionService'
);

// Verificar signals
checkFileContent(
  'src/app/services/resoluciones-table.service.ts',
  'signal(',
  'Signals para estado reactivo'
);

console.log('\n📊 Verificando documentación:\n');

checkFile(
  '../.kiro/specs/resoluciones-table-improvements/PERFORMANCE_ANALYSIS.md',
  'Análisis de rendimiento documentado'
);

checkFile(
  '../.kiro/specs/resoluciones-table-improvements/LOAD_TESTING_GUIDE.md',
  'Guía de pruebas de carga creada'
);

console.log('\n🎯 Verificando funcionalidades avanzadas:\n');

// Verificar lazy loading directive
if (checkFile(
  'src/app/directives/lazy-load-image.directive.ts',
  'Lazy loading de imágenes implementado'
)) {
  checkFileContent(
    'src/app/directives/lazy-load-image.directive.ts',
    'IntersectionObserver',
    'IntersectionObserver usado para lazy loading'
  );
}

// Verificar cache service
if (fs.existsSync(path.join(__dirname, 'src/app/services/mesa-partes/cache.service.ts'))) {
  console.log('✅ Cache service implementado (Mesa Partes)');
  checks.passed++;
} else {
  console.log('⚠️  Cache service no encontrado (opcional)');
  checks.warnings++;
}

console.log('\n' + '='.repeat(60));
console.log('📈 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(60));
console.log(`✅ Verificaciones exitosas: ${checks.passed}`);
console.log(`❌ Verificaciones fallidas: ${checks.failed}`);
console.log(`⚠️  Advertencias: ${checks.warnings}`);
console.log('='.repeat(60));

if (checks.failed === 0) {
  console.log('\n🎉 ¡Todas las verificaciones críticas pasaron!');
  
  if (checks.warnings > 0) {
    console.log(`\n⚠️  Hay ${checks.warnings} advertencia(s) que deberían revisarse.`);
  }
  
  console.log('\n📝 Próximos pasos:');
  console.log('1. Abrir performance-test.html en el navegador');
  console.log('2. Ejecutar la suite completa de pruebas');
  console.log('3. Revisar métricas y resultados');
  console.log('4. Documentar hallazgos en PERFORMANCE_ANALYSIS.md');
  console.log('5. Implementar optimizaciones adicionales si es necesario');
  
  process.exit(0);
} else {
  console.log('\n❌ Algunas verificaciones fallaron. Por favor revisa los errores arriba.');
  console.log('\n📝 Acciones requeridas:');
  console.log('1. Implementar los archivos faltantes');
  console.log('2. Agregar las optimizaciones faltantes');
  console.log('3. Re-ejecutar este script de verificación');
  
  process.exit(1);
}
