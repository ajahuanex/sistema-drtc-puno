#!/usr/bin/env python3
"""Script to fix the empresa-form.component.ts validation issues"""

import re

file_path = r'frontend\src\app\components\empresas\empresa-form.component.ts'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Replace validarRuc method
old_validar_ruc = r'''  validarRuc\(ruc: string\): void \{
    if \(ruc && ruc\.length === 11\) \{
      this\.empresaService\.validarRuc\(ruc\)\.subscribe\(\{
        next: \(result\) => \{
          if \(!result\.valido\) \{
            this\.empresaForm\.get\('ruc'\)\?\.setErrors\(\{ invalidRuc: true \}\);
            this\.snackBar\.open\('RUC NO VÁLIDO O YA EXISTE', 'CERRAR', \{ duration: 3000 \}\);
          \}
        \},
        error: \(error\) => \{
          console\.error\('ERROR VALIDANDO RUC:', error\);
        \}
      \}\);
    \}
  \}'''

new_validar_ruc = '''  validarRuc(ruc: string): void {
    if (ruc && ruc.length === 11) {
      this.empresaService.validarRuc(ruc).subscribe({
        next: (result) => {
          const rucControl = this.empresaForm.get('ruc');
          if (!result.valido) {
            rucControl?.setErrors({ invalidRuc: true });
            this.snackBar.open('RUC NO VÁLIDO O YA EXISTE', 'CERRAR', { duration: 3000 });
          } else {
            // Limpiar el error de invalidRuc si existe
            if (rucControl?.hasError('invalidRuc')) {
              const errors = rucControl.errors;
              delete errors?.['invalidRuc'];
              rucControl.setErrors(Object.keys(errors || {}).length > 0 ? errors : null);
            }
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          console.error('ERROR VALIDANDO RUC:', error);
          // No establecer error si falla la conexión
          this.cdr.markForCheck();
        }
      });
    }
  }'''

content = re.sub(old_validar_ruc, new_validar_ruc, content, flags=re.MULTILINE | re.DOTALL)

# Fix 2: Replace isBasicInfoValid method
old_basic_info = r'''  isBasicInfoValid\(\): boolean \{
    const basicControls = \['ruc', 'razonSocialPrincipal', 'direccionFiscal', 'estado'\];
    return basicControls\.every\(control => this\.empresaForm\.get\(control\)\?\.valid\);
  \}'''

new_basic_info = '''  isBasicInfoValid(): boolean {
    const basicControls = ['ruc', 'razonSocialPrincipal', 'direccionFiscal', 'estado'];
    const validationResults = basicControls.map(controlName => {
      const control = this.empresaForm.get(controlName);
      return {
        field: controlName,
        valid: control?.valid,
        value: control?.value,
        errors: control?.errors
      };
    });
    
    console.log('🔍 Validación de campos básicos:', validationResults);
    const allValid = basicControls.every(control => this.empresaForm.get(control)?.valid);
    console.log(allValid ? '✅ Todos los campos son válidos' : '❌ Hay campos inválidos');
    
    return allValid;
  }'''

content = re.sub(old_basic_info, new_basic_info, content, flags=re.MULTILINE | re.DOTALL)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ File fixed successfully!")
print("- validarRuc method updated")
print("- isBasicInfoValid method updated")
