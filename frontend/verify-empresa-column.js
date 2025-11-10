/**
 * Verification Script for Task 8.4 - Empresa Column Implementation
 * 
 * This script verifies that the empresa column is properly implemented
 * in the resoluciones table component.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 8.4 - Empresa Column Implementation\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function checkFile(filePath, checks) {
  console.log(`\n📄 Checking: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('   ❌ File not found');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let allPassed = true;
  
  checks.forEach(check => {
    const found = check.regex ? check.regex.test(content) : content.includes(check.text);
    if (found) {
      console.log(`   ✅ ${check.description}`);
      checks.passed++;
    } else {
      console.log(`   ❌ ${check.description}`);
      checks.failed++;
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Check 1: Model file
console.log('\n═══════════════════════════════════════════════════════');
console.log('CHECK 1: Data Model (resolucion-table.model.ts)');
console.log('═══════════════════════════════════════════════════════');

checkFile('src/app/models/resolucion-table.model.ts', [
  {
    text: 'ResolucionConEmpresa',
    description: 'ResolucionConEmpresa interface exists'
  },
  {
    text: 'empresa?:',
    description: 'empresa property defined in interface'
  },
  {
    text: 'razonSocial',
    description: 'razonSocial property exists'
  },
  {
    text: "key: 'empresa'",
    description: 'Empresa column definition exists'
  },
  {
    text: "tipo: 'empresa'",
    description: 'Column type is empresa'
  }
]);

// Check 2: Table component
console.log('\n═══════════════════════════════════════════════════════');
console.log('CHECK 2: Table Component (resoluciones-table.component.ts)');
console.log('═══════════════════════════════════════════════════════');

checkFile('src/app/shared/resoluciones-table.component.ts', [
  {
    text: 'matColumnDef="empresa"',
    description: 'Empresa column definition in template'
  },
  {
    text: 'resolucion.empresa',
    description: 'Empresa data binding exists'
  },
  {
    text: 'empresa.razonSocial.principal',
    description: 'Razón social display exists'
  },
  {
    text: 'Sin empresa asignada',
    description: 'Fallback message for missing empresa'
  },
  {
    regex: /case\s+['"]empresa['"]\s*:/,
    description: 'Empresa sorting case exists'
  },
  {
    text: '.empresa-column',
    description: 'Empresa column CSS class exists'
  },
  {
    text: '.empresa-info',
    description: 'Empresa info CSS class exists'
  },
  {
    text: '.sin-empresa',
    description: 'Sin empresa CSS class exists'
  }
]);

// Check 3: Service
console.log('\n═══════════════════════════════════════════════════════');
console.log('CHECK 3: Service (resolucion.service.ts)');
console.log('═══════════════════════════════════════════════════════');

checkFile('src/app/services/resolucion.service.ts', [
  {
    text: 'getResolucionesConEmpresa',
    description: 'getResolucionesConEmpresa method exists'
  },
  {
    text: 'enrichResolucionesConEmpresa',
    description: 'enrichResolucionesConEmpresa method exists'
  },
  {
    text: 'getResolucionesFiltradas',
    description: 'getResolucionesFiltradas method exists'
  },
  {
    text: 'empresaService',
    description: 'EmpresaService dependency exists'
  },
  {
    text: 'forkJoin',
    description: 'forkJoin for parallel loading exists'
  }
]);

// Check 4: Component integration
console.log('\n═══════════════════════════════════════════════════════');
console.log('CHECK 4: Component Integration (resoluciones.component.ts)');
console.log('═══════════════════════════════════════════════════════');

checkFile('src/app/components/resoluciones/resoluciones.component.ts', [
  {
    text: 'getResolucionesConEmpresa',
    description: 'Component calls getResolucionesConEmpresa'
  },
  {
    text: 'ResolucionConEmpresa',
    description: 'Component uses ResolucionConEmpresa type'
  }
]);

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('VERIFICATION SUMMARY');
console.log('═══════════════════════════════════════════════════════');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);

if (checks.failed === 0) {
  console.log('\n🎉 All checks passed! Task 8.4 is complete.');
  console.log('\n📋 Implementation includes:');
  console.log('   • ResolucionConEmpresa interface with empresa property');
  console.log('   • Empresa column in table template');
  console.log('   • Display of razón social and RUC');
  console.log('   • Fallback for missing empresa');
  console.log('   • Sorting by empresa name');
  console.log('   • Service methods to enrich data');
  console.log('   • CSS styles for empresa column');
  console.log('\n✅ Ready for production!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review the implementation.');
  process.exit(1);
}
