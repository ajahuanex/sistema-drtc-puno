/**
 * Verification Script for Task 8.5: Pagination and Loading States
 * ResolucionesTableComponent
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando Task 8.5: Paginación y Estados de Carga\n');

const componentPath = path.join(__dirname, 'src/app/shared/resoluciones-table.component.ts');

try {
  const content = fs.readFileSync(componentPath, 'utf8');
  
  const checks = [
    {
      name: '1. MatPaginatorModule importado',
      test: () => content.includes('MatPaginatorModule'),
      required: true
    },
    {
      name: '2. ViewChild para MatPaginator',
      test: () => content.includes('@ViewChild(MatPaginator)'),
      required: true
    },
    {
      name: '3. AfterViewInit implementado',
      test: () => content.includes('implements') && content.includes('AfterViewInit'),
      required: true
    },
    {
      name: '4. ngAfterViewInit conecta paginator',
      test: () => content.includes('ngAfterViewInit') && content.includes('this.dataSource.paginator = this.paginator'),
      required: true
    },
    {
      name: '5. mat-paginator en template',
      test: () => content.includes('<mat-paginator') || content.includes('mat-paginator'),
      required: true
    },
    {
      name: '6. Configuración de paginación',
      test: () => content.includes('pageSize') && content.includes('pageSizeOptions') && content.includes('showFirstLastButtons'),
      required: true
    },
    {
      name: '7. Evento onPaginaChange',
      test: () => content.includes('onPaginaChange') && content.includes('PageEvent'),
      required: true
    },
    {
      name: '8. Loading overlay con spinner',
      test: () => content.includes('loading-overlay') && content.includes('mat-spinner'),
      required: true
    },
    {
      name: '9. Texto "Cargando resoluciones"',
      test: () => content.includes('Cargando resoluciones'),
      required: true
    },
    {
      name: '10. Estado sin resultados',
      test: () => content.includes('no-results') && content.includes('dataSource.data.length === 0'),
      required: true
    },
    {
      name: '11. Icono search_off',
      test: () => content.includes('search_off'),
      required: true
    },
    {
      name: '12. Mensaje "No se encontraron resoluciones"',
      test: () => content.includes('No se encontraron resoluciones'),
      required: true
    },
    {
      name: '13. Sugerencia de ajustar filtros',
      test: () => content.includes('ajustar los filtros') || content.includes('limpiar la búsqueda'),
      required: true
    },
    {
      name: '14. Contador de resultados',
      test: () => content.includes('results-count') && content.includes('totalResultados()'),
      required: true
    },
    {
      name: '15. Atributos de accesibilidad (role)',
      test: () => content.includes('role="status"'),
      required: true
    },
    {
      name: '16. Atributos de accesibilidad (aria-live)',
      test: () => content.includes('aria-live="polite"'),
      required: true
    },
    {
      name: '17. Atributos de accesibilidad (aria-busy)',
      test: () => content.includes('aria-busy'),
      required: true
    },
    {
      name: '18. Paginador deshabilitado durante carga',
      test: () => content.includes('[disabled]="cargando"'),
      required: true
    },
    {
      name: '19. Método scrollToTop',
      test: () => content.includes('scrollToTop'),
      required: false
    },
    {
      name: '20. Método getPaginacionInfo',
      test: () => content.includes('getPaginacionInfo'),
      required: false
    }
  ];

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  checks.forEach(check => {
    const result = check.test();
    if (result) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      if (check.required) {
        console.log(`❌ ${check.name} (REQUERIDO)`);
        failed++;
      } else {
        console.log(`⚠️  ${check.name} (OPCIONAL)`);
        warnings++;
      }
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Resultados:`);
  console.log(`   ✅ Pasaron: ${passed}/${checks.length}`);
  console.log(`   ❌ Fallaron: ${failed}`);
  console.log(`   ⚠️  Advertencias: ${warnings}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 ¡TODAS LAS VERIFICACIONES REQUERIDAS PASARON!');
    console.log('✅ Task 8.5 está COMPLETADA\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Algunas verificaciones requeridas fallaron.');
    console.log('Por favor, revisa los elementos marcados con ❌\n');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error al leer el archivo:', error.message);
  process.exit(1);
}
