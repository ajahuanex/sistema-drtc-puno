#!/usr/bin/env python3
"""
Script para corregir métodos duplicados en empresa-detail.component.ts
"""

def fix_metodos_duplicados():
    """Corregir métodos duplicados en el archivo"""
    
    print("🔧 CORRIGIENDO MÉTODOS DUPLICADOS")
    print("=" * 50)
    
    archivo_path = "frontend/src/app/components/empresas/empresa-detail.component.ts"
    
    try:
        # Leer el archivo
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        print("✅ Archivo leído correctamente")
        
        # Buscar y eliminar duplicados del método getTotalRutasEmpresa
        lineas = contenido.split('\n')
        lineas_filtradas = []
        dentro_metodo_duplicado = False
        contador_llaves = 0
        metodo_encontrado = False
        
        i = 0
        while i < len(lineas):
            linea = lineas[i]
            
            # Detectar el inicio del método getTotalRutasEmpresa
            if 'getTotalRutasEmpresa(): number {' in linea:
                if metodo_encontrado:
                    # Es un duplicado, saltarlo
                    print(f"   🗑️  Eliminando método duplicado en línea {i+1}")
                    dentro_metodo_duplicado = True
                    contador_llaves = 0
                    i += 1
                    continue
                else:
                    # Es el primer método, mantenerlo
                    metodo_encontrado = True
                    print(f"   ✅ Manteniendo primer método en línea {i+1}")
            
            if dentro_metodo_duplicado:
                # Contar llaves para saber cuándo termina el método
                contador_llaves += linea.count('{')
                contador_llaves -= linea.count('}')
                
                if contador_llaves <= 0:
                    # Terminó el método duplicado
                    dentro_metodo_duplicado = False
                    print(f"   ✅ Método duplicado eliminado hasta línea {i+1}")
                
                i += 1
                continue
            
            # Agregar línea normal
            lineas_filtradas.append(linea)
            i += 1
        
        # Reconstruir el contenido
        contenido_corregido = '\n'.join(lineas_filtradas)
        
        # Escribir el archivo corregido
        with open(archivo_path, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        
        print("✅ Archivo corregido y guardado")
        
        # Verificar que no hay más duplicados
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido_verificacion = f.read()
        
        count_getTotalRutasEmpresa = contenido_verificacion.count('getTotalRutasEmpresa(): number {')
        count_getTotalVehiculosEmpresa = contenido_verificacion.count('getTotalVehiculosEmpresa(): number {')
        
        print(f"\n📊 VERIFICACIÓN:")
        print(f"   getTotalVehiculosEmpresa(): {count_getTotalVehiculosEmpresa} ocurrencias")
        print(f"   getTotalRutasEmpresa(): {count_getTotalRutasEmpresa} ocurrencias")
        
        if count_getTotalRutasEmpresa == 1 and count_getTotalVehiculosEmpresa == 1:
            print("   ✅ No hay duplicados")
            return True
        else:
            print("   ⚠️  Aún hay duplicados")
            return False
        
    except FileNotFoundError:
        print(f"❌ No se encontró el archivo: {archivo_path}")
        return False
    except Exception as e:
        print(f"❌ Error procesando archivo: {e}")
        return False

if __name__ == "__main__":
    success = fix_metodos_duplicados()
    
    if success:
        print(f"\n🎉 CORRECCIÓN EXITOSA")
        print(f"   ✅ Métodos duplicados eliminados")
        print(f"   ✅ Archivo compilará correctamente")
        print(f"   ✅ Frontend se recargará automáticamente")
    else:
        print(f"\n❌ ERROR EN LA CORRECCIÓN")
        print(f"   Revisar manualmente el archivo")
    
    print(f"\n" + "=" * 50)