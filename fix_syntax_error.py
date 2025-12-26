#!/usr/bin/env python3
"""
Script para arreglar errores de sintaxis en el archivo vehiculo-modal.component.ts
"""
import re

def fix_syntax_errors():
    """Arreglar errores de sintaxis específicos"""
    file_path = "frontend/src/app/components/vehiculos/vehiculo-modal.component.ts"
    
    try:
        # Leer el archivo
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"📄 Archivo leído: {len(content)} caracteres")
        
        # Buscar y arreglar errores específicos
        fixes_applied = 0
        
        # 1. Arreglar "const:" -> "const"
        if "const:" in content:
            content = content.replace("const:", "const")
            fixes_applied += 1
            print("✅ Arreglado: const: -> const")
        
        # 2. Arreglar "if(," -> "if("
        if "if(," in content:
            content = re.sub(r'if\(,\s*', 'if(', content)
            fixes_applied += 1
            print("✅ Arreglado: if(, -> if(")
        
        # 3. Arreglar líneas rotas con "} ||"
        if "} ||" in content:
            content = re.sub(r'\}\s*\|\|\s*([^;{]+);', r'|| \1) {', content)
            fixes_applied += 1
            print("✅ Arreglado: } || -> ||")
        
        # 4. Buscar otros patrones problemáticos
        problematic_patterns = [
            (r'const\s+([^=]+)=\s*([^,]+),\s*const', r'const \1= \2;\n    const'),
            (r'if\s*\(\s*,\s*([^)]+)\)', r'if(!\1)'),
            (r'\}\s*\|\|\s*!([^;]+);', r'|| !\1) {')
        ]
        
        for pattern, replacement in problematic_patterns:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                fixes_applied += 1
                print(f"✅ Arreglado patrón: {pattern}")
        
        # Escribir el archivo arreglado
        if fixes_applied > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Archivo arreglado con {fixes_applied} correcciones")
        else:
            print("ℹ️ No se encontraron errores de sintaxis para arreglar")
        
        return fixes_applied > 0
        
    except Exception as e:
        print(f"❌ Error procesando archivo: {e}")
        return False

def verify_syntax():
    """Verificar que no haya errores de sintaxis obvios"""
    file_path = "frontend/src/app/components/vehiculos/vehiculo-modal.component.ts"
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        errors_found = []
        
        for i, line in enumerate(lines, 1):
            # Buscar patrones problemáticos
            if "const:" in line:
                errors_found.append(f"Línea {i}: 'const:' debería ser 'const'")
            if "if(," in line:
                errors_found.append(f"Línea {i}: 'if(,' tiene coma extra")
            if re.search(r'\}\s*\|\|.*[^{];$', line.strip()):
                errors_found.append(f"Línea {i}: Estructura if incompleta")
        
        if errors_found:
            print("❌ Errores de sintaxis encontrados:")
            for error in errors_found:
                print(f"   {error}")
            return False
        else:
            print("✅ No se encontraron errores de sintaxis obvios")
            return True
            
    except Exception as e:
        print(f"❌ Error verificando sintaxis: {e}")
        return False

def main():
    """Función principal"""
    print("🔧 Arreglando errores de sintaxis en vehiculo-modal.component.ts...\n")
    
    # Verificar errores antes
    print("1. Verificando errores actuales...")
    verify_syntax()
    
    # Aplicar correcciones
    print("\n2. Aplicando correcciones...")
    fixed = fix_syntax_errors()
    
    # Verificar después
    print("\n3. Verificando resultado...")
    clean = verify_syntax()
    
    print("\n" + "="*50)
    if clean:
        print("🎉 ¡Archivo arreglado exitosamente!")
        print("💡 Ahora el frontend debería compilar sin errores")
    else:
        print("⚠️ Pueden quedar algunos errores por revisar manualmente")

if __name__ == "__main__":
    main()