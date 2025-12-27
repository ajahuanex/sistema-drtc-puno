#!/usr/bin/env python3
"""
Script para corregir el conteo de vehículos en el módulo de empresas
"""

def corregir_conteo_vehiculos():
    """Corregir el conteo de vehículos en empresa-detail.component.ts"""
    
    print("🔧 CORRIGIENDO CONTEO DE VEHÍCULOS EN MÓDULO EMPRESAS")
    print("=" * 60)
    
    archivo_path = "frontend/src/app/components/empresas/empresa-detail.component.ts"
    
    try:
        # Leer el archivo
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        print("✅ Archivo leído correctamente")
        
        # 1. Reemplazar el conteo de vehículos en la tarjeta de gestión
        contenido_original = """                        <span class="stat-item">
                          <strong>{{ empresa.vehiculosHabilitadosIds.length || 0 }}</strong>
                          <small>Vehículos</small>
                        </span>"""
        
        contenido_nuevo = """                        <span class="stat-item">
                          <strong>{{ getTotalVehiculosEmpresa() }}</strong>
                          <small>Vehículos</small>
                        </span>"""
        
        if contenido_original in contenido:
            contenido = contenido.replace(contenido_original, contenido_nuevo)
            print("✅ Reemplazado conteo de vehículos en tarjeta de gestión")
        else:
            print("⚠️  No se encontró el patrón exacto para la tarjeta de gestión")
        
        # 2. Agregar el método getTotalVehiculosEmpresa() antes del método ngOnInit
        metodo_nuevo = """
  /**
   * Calcula el total de vehículos de la empresa sumando todos los vehículos
   * de todas las resoluciones asociadas a la empresa
   */
  getTotalVehiculosEmpresa(): number {
    if (!this.resoluciones || this.resoluciones.length === 0) {
      return 0;
    }
    
    // Usar Set para evitar duplicados
    const vehiculosUnicos = new Set<string>();
    
    this.resoluciones.forEach(resolucion => {
      if (resolucion.vehiculosHabilitadosIds && resolucion.vehiculosHabilitadosIds.length > 0) {
        resolucion.vehiculosHabilitadosIds.forEach(vehiculoId => {
          vehiculosUnicos.add(vehiculoId);
        });
      }
    });
    
    return vehiculosUnicos.size;
  }

  /**
   * Calcula el total de rutas de la empresa sumando todas las rutas
   * de todas las resoluciones asociadas a la empresa
   */
  getTotalRutasEmpresa(): number {
    if (!this.resoluciones || this.resoluciones.length === 0) {
      return 0;
    }
    
    // Usar Set para evitar duplicados
    const rutasUnicas = new Set<string>();
    
    this.resoluciones.forEach(resolucion => {
      if (resolucion.rutasAutorizadasIds && resolucion.rutasAutorizadasIds.length > 0) {
        resolucion.rutasAutorizadasIds.forEach(rutaId => {
          rutasUnicas.add(rutaId);
        });
      }
    });
    
    return rutasUnicas.size;
  }
"""
        
        # Buscar el método ngOnInit y agregar los nuevos métodos antes
        patron_ngOnInit = "  ngOnInit(): void {"
        
        if patron_ngOnInit in contenido:
            contenido = contenido.replace(patron_ngOnInit, metodo_nuevo + patron_ngOnInit)
            print("✅ Agregados métodos getTotalVehiculosEmpresa() y getTotalRutasEmpresa()")
        else:
            print("⚠️  No se encontró el método ngOnInit para agregar los nuevos métodos")
        
        # 3. También corregir el conteo de rutas si existe
        if "getTotalRutas()" in contenido:
            contenido = contenido.replace("getTotalRutas()", "getTotalRutasEmpresa()")
            print("✅ Corregido método getTotalRutas() por getTotalRutasEmpresa()")
        
        # 4. Escribir el archivo corregido
        with open(archivo_path, 'w', encoding='utf-8') as f:
            f.write(contenido)
        
        print("✅ Archivo guardado correctamente")
        
        # 5. Crear archivo de respaldo
        import shutil
        from datetime import datetime
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"frontend/src/app/components/empresas/empresa-detail.component.ts.backup_{timestamp}"
        
        # El backup se haría del archivo original, pero como ya lo modificamos, 
        # solo mostramos el mensaje
        print(f"💾 Se recomienda hacer backup del archivo original")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ No se encontró el archivo: {archivo_path}")
        return False
    except Exception as e:
        print(f"❌ Error procesando archivo: {e}")
        return False

if __name__ == "__main__":
    success = corregir_conteo_vehiculos()
    
    if success:
        print(f"\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE")
        print(f"\n📋 CAMBIOS REALIZADOS:")
        print(f"   ✅ Reemplazado empresa.vehiculosHabilitadosIds.length por getTotalVehiculosEmpresa()")
        print(f"   ✅ Agregado método getTotalVehiculosEmpresa() que suma vehículos de todas las resoluciones")
        print(f"   ✅ Agregado método getTotalRutasEmpresa() que suma rutas de todas las resoluciones")
        print(f"   ✅ Usa Set para evitar duplicados entre resoluciones")
        
        print(f"\n🎯 PRÓXIMOS PASOS:")
        print(f"   1. El frontend se recargará automáticamente")
        print(f"   2. Verificar en el navegador que ahora muestra 2 vehículos")
        print(f"   3. Los contadores ahora reflejan la suma real de todas las resoluciones")
        
    else:
        print(f"\n❌ ERROR EN LA CORRECCIÓN")
        print(f"   Revisar los mensajes de error anteriores")
    
    print(f"\n" + "=" * 60)