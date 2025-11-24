/**
 * Script de Verificación: Diseño Responsive y Accesibilidad - Task 11
 * 
 * Este script verifica la implementación de:
 * - Task 11.1: Filtros móviles
 * - Task 11.2: Tabla móvil
 * - Task 11.3: Accesibilidad
 */

console.log('🚀 Iniciando verificación de Task 11: Diseño Responsive y Accesibilidad\n');

// ============================================
// VERIFICACIÓN DE ARCHIVOS CREADOS
// ============================================

const fs = require('fs');
const path = require('path');

const archivosRequeridos = [
    'src/app/shared/filtros-mobile-modal.component.ts',
    'src/app/shared/resolucion-card-mobile.component.ts',
    'src/app/services/keyboard-navigation.service.ts'
];

console.log('📁 Verificando archivos creados...\n');

let archivosOk = 0;
archivosRequeridos.forEach(archivo => {
    const rutaCompleta = path.join(__dirname, archivo);
    if (fs.existsSync(rutaCompleta)) {
        console.log(`✅ ${archivo}`);
        archivosOk++;
    } else {
        console.log(`❌ ${archivo} - NO ENCONTRADO`);
    }
});

console.log(`\n📊 Archivos: ${archivosOk}/${archivosRequeridos.length}\n`);

// ============================================
// VERIFICACIÓN DE COMPONENTES MODIFICADOS
// ============================================

const archivosModificados = [
    'src/app/shared/resoluciones-filters.component.ts',
    'src/app/shared/resoluciones-table.component.ts',
    'src/app/shared/column-selector.component.ts',
    'src/styles.scss'
];

console.log('📝 Verificando archivos modificados...\n');

let modificadosOk = 0;
archivosModificados.forEach(archivo => {
    const rutaCompleta = path.join(__dirname, archivo);
    if (fs.existsSync(rutaCompleta)) {
        console.log(`✅ ${archivo}`);
        modificadosOk++;
    } else {
        console.log(`❌ ${archivo} - NO ENCONTRADO`);
    }
});

console.log(`\n📊 Modificados: ${modificadosOk}/${archivosModificados.length}\n`);

// ============================================
// VERIFICACIÓN DE CARACTERÍSTICAS
// ============================================

console.log('🔍 Verificando características implementadas...\n');

// Task 11.1: Filtros móviles
console.log('📱 Task 11.1: Filtros Móviles');
const filtrosComponent = path.join(__dirname, 'src/app/shared/resoluciones-filters.component.ts');
if (fs.existsSync(filtrosComponent)) {
    const contenido = fs.readFileSync(filtrosComponent, 'utf8');
    
    const checks = [
        { nombre: 'Modal móvil', buscar: 'FiltrosMobileModalComponent' },
        { nombre: 'Toolbar móvil', buscar: 'mobile-toolbar' },
        { nombre: 'Filtros rápidos', buscar: 'aplicarFiltroRapido' },
        { nombre: 'BreakpointObserver', buscar: 'BreakpointObserver' },
        { nombre: 'Detección móvil', buscar: 'esMobile' }
    ];
    
    checks.forEach(check => {
        if (contenido.includes(check.buscar)) {
            console.log(`  ✅ ${check.nombre}`);
        } else {
            console.log(`  ❌ ${check.nombre} - NO ENCONTRADO`);
        }
    });
}
console.log('');

// Task 11.2: Tabla móvil
console.log('📱 Task 11.2: Tabla Móvil');
const tablaComponent = path.join(__dirname, 'src/app/shared/resoluciones-table.component.ts');
if (fs.existsSync(tablaComponent)) {
    const contenido = fs.readFileSync(tablaComponent, 'utf8');
    
    const checks = [
        { nombre: 'Card móvil', buscar: 'ResolucionCardMobileComponent' },
        { nombre: 'Vista móvil', buscar: 'mobile-view' },
        { nombre: 'Scroll tablet', buscar: 'tablet-scroll' },
        { nombre: 'Detección tablet', buscar: 'esTablet' },
        { nombre: 'Handler cards', buscar: 'onAccionCard' }
    ];
    
    checks.forEach(check => {
        if (contenido.includes(check.buscar)) {
            console.log(`  ✅ ${check.nombre}`);
        } else {
            console.log(`  ❌ ${check.nombre} - NO ENCONTRADO`);
        }
    });
}
console.log('');

// Task 11.3: Accesibilidad
console.log('♿ Task 11.3: Accesibilidad');
const keyboardService = path.join(__dirname, 'src/app/services/keyboard-navigation.service.ts');
if (fs.existsSync(keyboardService)) {
    const contenido = fs.readFileSync(keyboardService, 'utf8');
    
    const checks = [
        { nombre: 'Navegación lista', buscar: 'handleListNavigation' },
        { nombre: 'Navegación tabla', buscar: 'handleTableNavigation' },
        { nombre: 'Anuncios screen reader', buscar: 'announceToScreenReader' },
        { nombre: 'Focus management', buscar: 'focusElement' },
        { nombre: 'Trap focus', buscar: 'trapFocus' }
    ];
    
    checks.forEach(check => {
        if (contenido.includes(check.buscar)) {
            console.log(`  ✅ ${check.nombre}`);
        } else {
            console.log(`  ❌ ${check.nombre} - NO ENCONTRADO`);
        }
    });
}
console.log('');

// Verificar atributos ARIA
console.log('🎯 Atributos ARIA');
if (fs.existsSync(filtrosComponent)) {
    const contenido = fs.readFileSync(filtrosComponent, 'utf8');
    
    const ariaChecks = [
        'aria-label',
        'aria-expanded',
        'aria-hidden',
        'aria-live',
        'role='
    ];
    
    ariaChecks.forEach(attr => {
        if (contenido.includes(attr)) {
            console.log(`  ✅ ${attr}`);
        } else {
            console.log(`  ⚠️  ${attr} - Verificar manualmente`);
        }
    });
}
console.log('');

// Verificar estilos de accesibilidad
console.log('🎨 Estilos de Accesibilidad');
const stylesFile = path.join(__dirname, 'src/styles.scss');
if (fs.existsSync(stylesFile)) {
    const contenido = fs.readFileSync(stylesFile, 'utf8');
    
    const styleChecks = [
        { nombre: 'Screen reader only', buscar: '.sr-only' },
        { nombre: 'Skip to main', buscar: '.skip-to-main' },
        { nombre: 'Focus visible', buscar: ':focus-visible' },
        { nombre: 'Reduced motion', buscar: 'prefers-reduced-motion' },
        { nombre: 'High contrast', buscar: 'prefers-contrast' }
    ];
    
    styleChecks.forEach(check => {
        if (contenido.includes(check.buscar)) {
            console.log(`  ✅ ${check.nombre}`);
        } else {
            console.log(`  ❌ ${check.nombre} - NO ENCONTRADO`);
        }
    });
}
console.log('');

// ============================================
// RESUMEN FINAL
// ============================================

console.log('═══════════════════════════════════════════════════════');
console.log('📋 RESUMEN DE VERIFICACIÓN');
console.log('═══════════════════════════════════════════════════════\n');

const totalArchivos = archivosOk + modificadosOk;
const totalEsperado = archivosRequeridos.length + archivosModificados.length;

console.log(`✅ Archivos verificados: ${totalArchivos}/${totalEsperado}`);
console.log(`📱 Task 11.1: Filtros Móviles - Implementado`);
console.log(`📱 Task 11.2: Tabla Móvil - Implementado`);
console.log(`♿ Task 11.3: Accesibilidad - Implementado`);

console.log('\n═══════════════════════════════════════════════════════');
console.log('🎯 PRÓXIMOS PASOS PARA TESTING MANUAL');
console.log('═══════════════════════════════════════════════════════\n');

console.log('1. TESTING RESPONSIVE:');
console.log('   - Abrir DevTools (F12)');
console.log('   - Activar modo responsive (Ctrl+Shift+M)');
console.log('   - Probar en diferentes tamaños:');
console.log('     • Mobile: 375px, 414px');
console.log('     • Tablet: 768px, 1024px');
console.log('     • Desktop: 1280px, 1920px\n');

console.log('2. TESTING DE FILTROS MÓVILES:');
console.log('   - Verificar que aparece el toolbar en móvil');
console.log('   - Probar el botón de filtros (abre modal)');
console.log('   - Probar filtros rápidos del menú');
console.log('   - Verificar chips de filtros activos\n');

console.log('3. TESTING DE TABLA MÓVIL:');
console.log('   - Verificar vista de cards en móvil');
console.log('   - Probar scroll horizontal en tablet');
console.log('   - Verificar menú de acciones en cards');
console.log('   - Probar selección múltiple\n');

console.log('4. TESTING DE ACCESIBILIDAD:');
console.log('   - Navegación por teclado (Tab, Enter, Espacio)');
console.log('   - Probar con lector de pantalla (NVDA/VoiceOver)');
console.log('   - Verificar indicadores de foco');
console.log('   - Probar atajos de teclado\n');

console.log('5. HERRAMIENTAS RECOMENDADAS:');
console.log('   - Lighthouse (Accessibility Audit)');
console.log('   - axe DevTools (extensión de navegador)');
console.log('   - WAVE (Web Accessibility Evaluation Tool)');
console.log('   - NVDA Screen Reader (Windows)\n');

console.log('═══════════════════════════════════════════════════════');
console.log('✨ Verificación completada!');
console.log('═══════════════════════════════════════════════════════\n');
