#!/usr/bin/env python3
"""
Script para corregir imports específicos que fueron rotos
"""

import os

def corregir_archivo_especifico(archivo_path, correcciones):
    """Corregir un archivo específico con las correcciones dadas"""
    
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        contenido_original = contenido
        
        for buscar, reemplazar in correcciones.items():
            contenido = contenido.replace(buscar, reemplazar)
        
        if contenido != contenido_original:
            with open(archivo_path, 'w', encoding='utf-8') as f:
                f.write(contenido)
            
            print(f"✅ Corregido {os.path.basename(archivo_path)}")
            return True
        else:
            print(f"ℹ️ No se necesitaron cambios en {os.path.basename(archivo_path)}")
            return False
            
    except Exception as e:
        print(f"❌ Error corrigiendo {archivo_path}: {e}")
        return False

def main():
    """Función principal"""
    
    print("🔧 CORRIGIENDO IMPORTS ESPECÍFICOS")
    print("=" * 50)
    
    # Correcciones para vehiculos-resolucion-modal.component.ts
    correcciones_resolucion_modal = {
        "from '../../services/(vehiculo as any).service'": "from '../../services/vehiculo.service'",
        "from '../../models/(vehiculo as any).model'": "from '../../models/vehiculo.model'",
        "from '../../models/(resolucion as any).model'": "from '../../models/resolucion.model'",
        "from '../../models/(empresa as any).model'": "from '../../models/empresa.model'",
        "from '../../validators/(vehiculo as any).validators'": "from '../../validators/vehiculo.validators'",
        "(this as any).data.(resolucion as any).id": "this.data.resolucion.id",
        "(this as any).data.(empresa as any).id": "this.data.empresa.id",
    }
    
    # Correcciones para vehiculos.component.ts
    correcciones_vehiculos = {
        "from '../../services/(vehiculo as any).service'": "from '../../services/vehiculo.service'",
        "from '../../services/(empresa as any).service'": "from '../../services/empresa.service'",
        "from '../../services/(ruta as any).service'": "from '../../services/ruta.service'",
        "from '../../services/solicitud-(baja as any).service'": "from '../../services/solicitud-baja.service'",
        "from '../../models/(vehiculo as any).model'": "from '../../models/vehiculo.model'",
        "from '../../models/(empresa as any).model'": "from '../../models/empresa.model'",
        "from '../../models/(ruta as any).model'": "from '../../models/ruta.model'",
        "from '../../models/solicitud-(baja as any).model'": "from '../../models/solicitud-baja.model'",
        "from './vehiculo-(modal as any).component'": "from './vehiculo-modal.component'",
        "from './historial-(vehicular as any).component'": "from './historial-vehicular.component'",
        "from './vehiculos-eliminados-(modal as any).component'": "from './vehiculos-eliminados-modal.component'",
        "from './vehiculo-(detalle as any).component'": "from './vehiculo-detalle.component'",
        "from './cambiar-estado-bloque-(modal as any).component'": "from './cambiar-estado-bloque-modal.component'",
        "from './carga-masiva-(vehiculos as any).component'": "from './carga-masiva-vehiculos.component'",
        "from './gestionar-rutas-especificas-(modal as any).component'": "from './gestionar-rutas-especificas-modal.component'",
        "from './transferir-empresa-(modal as any).component'": "from './transferir-empresa-modal.component'",
        "from './solicitar-baja-vehiculo-(unified as any).component'": "from './solicitar-baja-vehiculo-unified.component'",
        "from './vehiculo-estado-(selector as any).component'": "from './vehiculo-estado-selector.component'",
        "templateUrl: './(vehiculos as any).component.html'": "templateUrl: './vehiculos.component.html'",
        "(this as any).filtrosForm.(valueChanges as any).subscribe": "this.filtrosForm.valueChanges.subscribe",
    }
    
    archivos_corregidos = 0
    
    # Corregir vehiculos-resolucion-modal.component.ts
    if corregir_archivo_especifico(
        "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts",
        correcciones_resolucion_modal
    ):
        archivos_corregidos += 1
    
    # Corregir vehiculos.component.ts
    if corregir_archivo_especifico(
        "frontend/src/app/components/vehiculos/vehiculos.component.ts",
        correcciones_vehiculos
    ):
        archivos_corregidos += 1
    
    # Correcciones adicionales para otros archivos problemáticos
    archivos_adicionales = [
        "frontend/src/app/components/vehiculos/vehiculo-form.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts",
    ]
    
    correcciones_generales = {
        "(this as any).": "this.",
        "(error as any).": "error.",
        "(result as any).": "result.",
        "(event as any).": "event.",
        "(values as any).": "values.",
    }
    
    for archivo in archivos_adicionales:
        if os.path.exists(archivo):
            if corregir_archivo_especifico(archivo, correcciones_generales):
                archivos_corregidos += 1
    
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE CORRECCIONES")
    print("=" * 50)
    print(f"🔧 Archivos corregidos: {archivos_corregidos}")
    
    if archivos_corregidos > 0:
        print("\n✅ Correcciones aplicadas exitosamente")
        print("💡 Recomendación: Intentar compilar nuevamente")
    else:
        print("\nℹ️ No se realizaron correcciones")

if __name__ == "__main__":
    main()