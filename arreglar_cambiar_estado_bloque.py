#!/usr/bin/env python3
"""
Script para arreglar específicamente el archivo cambiar-estado-bloque-modal.component.ts
"""

import re

def arreglar_cambiar_estado_bloque():
    """Arreglar el archivo cambiar-estado-bloque-modal.component.ts"""
    
    archivo_path = "frontend/src/app/components/vehiculos/cambiar-estado-bloque-modal.component.ts"
    
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Correcciones específicas de imports
        correcciones_imports = {
            "from '../../shared/smart-(icon as any).component'": "from '../../shared/smart-icon.component'",
            "from '../../models/(vehiculo as any).model'": "from '../../models/vehiculo.model'",
            "from '../../services/(vehiculo as any).service'": "from '../../services/vehiculo.service'",
            "from '../../services/(configuracion as any).service'": "from '../../services/configuracion.service'",
        }
        
        for buscar, reemplazar in correcciones_imports.items():
            contenido = contenido.replace(buscar, reemplazar)
        
        # Correcciones de template (HTML)
        correcciones_template = {
            "{{ (vehiculos as any).length }}": "{{ vehiculos.length }}",
            "track (vehiculo as any).id": "track vehiculo.id",
            "{{ (vehiculo as any).placa }}": "{{ vehiculo.placa }}",
            "{{ (vehiculo as any).marca }} {{ (vehiculo as any).modelo }}": "{{ vehiculo.marca }} {{ vehiculo.modelo }}",
            "[(style as any).background-color]": "[style.background-color]",
            "[(style as any).color]": "[style.color]",
            "getColorEstado((vehiculo as any).estado)": "getColorEstado(vehiculo.estado)",
            "getColorTexto(getColorEstado((vehiculo as any).estado))": "getColorTexto(getColorEstado(vehiculo.estado))",
            "getLabelEstado((vehiculo as any).estado)": "getLabelEstado(vehiculo.estado)",
            "track (estado as any).value": "track estado.value",
            "[(class as any).selected]": "[class.selected]",
            "(estadoForm as any).get('nuevoEstado')?.value === (estado as any).value": "estadoForm.get('nuevoEstado')?.value === estado.value",
            "seleccionarEstado((estado as any).value)": "seleccionarEstado(estado.value)",
            "[iconName]=\"(estado as any).icon\"": "[iconName]=\"estado.icon\"",
            "{{ (estado as any).label }}": "{{ estado.label }}",
            "@if ((estadoForm as any).get('nuevoEstado')?.value)": "@if (estadoForm.get('nuevoEstado')?.value)",
            "track (estadoInfo as any).estado": "track estadoInfo.estado",
            "[class]=\"'estado-' + (estadoInfo as any).estado.toLowerCase()\"": "[class]=\"'estado-' + estadoInfo.estado.toLowerCase()\"",
            "{{ (estadoInfo as any).label }} ({{ (estadoInfo as any).cantidad }})": "{{ estadoInfo.label }} ({{ estadoInfo.cantidad }})",
            "{{ progreso() }}/{{ (vehiculos as any).length }}": "{{ progreso() }}/{{ vehiculos.length }}",
            "{{ (vehiculos as any).length }} vehículos": "{{ vehiculos.length }} vehículos",
        }
        
        for buscar, reemplazar in correcciones_template.items():
            contenido = contenido.replace(buscar, reemplazar)
        
        # Correcciones de CSS
        correcciones_css = {
            "transition: all (0 as any).2s ease": "transition: all 0.2s ease",
            "box-shadow: 0 2px 8px rgba(25, 118, 210, (0 as any).1)": "box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1)",
            ".estado-(option as any).selected": ".estado-option.selected",
            "box-shadow: 0 2px 8px rgba(25, 118, 210, (0 as any).2)": "box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2)",
            ".estado-(option as any).selected .estado-icon": ".estado-option.selected .estado-icon",
        }
        
        for buscar, reemplazar in correcciones_css.items():
            contenido = contenido.replace(buscar, reemplazar)
        
        # Correcciones de TypeScript
        correcciones_typescript = {
            "return (this as any).data?.vehiculos || ((this as any).data?.vehiculo ? [(this as any).data.vehiculo] : [])": "return this.data?.vehiculos || (this.data?.vehiculo ? [this.data.vehiculo] : [])",
            "estadosDisponibles = (this as any).configuracionService.estadosVehiculosConfig().map((estado: unknown) =>": "estadosDisponibles = this.configuracionService.estadosVehiculosConfig().map((estado: any) =>",
            "value: (estado as any).codigo": "value: estado.codigo",
            "label: (estado as any).nombre": "label: estado.nombre",
            "icon: (this as any).getIconoParaEstado((estado as any).codigo)": "icon: this.getIconoParaEstado(estado.codigo)",
            "color: (estado as any).color": "color: estado.color",
            "descripcion: (estado as any).descripcion": "descripcion: estado.descripcion",
            "estadoForm = (this as any).fb.group({": "estadoForm = this.fb.group({",
            "nuevoEstado: ['', (Validators as any).required]": "nuevoEstado: ['', Validators.required]",
            "(this as any).estadoForm.patchValue({ nuevoEstado: estado })": "this.estadoForm.patchValue({ nuevoEstado: estado })",
            "const nuevoEstado = (this as any).estadoForm.get('nuevoEstado')?.value": "const nuevoEstado = this.estadoForm.get('nuevoEstado')?.value",
            "const estadoConfig = (this as any).estadosDisponibles.find((e: any) => (e as any).value === estado)": "const estadoConfig = this.estadosDisponibles.find((e: any) => e.value === estado)",
            "(this as any).vehiculos.forEach(vehiculo =>": "this.vehiculos.forEach(vehiculo =>",
            "const estado = (vehiculo as any).estado": "const estado = vehiculo.estado",
            "(estadosMap as any).set(estado, ((estadosMap as any).get(estado) || 0) + 1)": "estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1)",
            "return (Array as any).from((estadosMap as any).entries()).map(([estado, cantidad]: any[]) =>": "return Array.from(estadosMap.entries()).map(([estado, cantidad]: [string, number]) =>",
            "label: (this as any).getLabelEstado(estado)": "label: this.getLabelEstado(estado)",
        }
        
        for buscar, reemplazar in correcciones_typescript.items():
            contenido = contenido.replace(buscar, reemplazar)
        
        # Correcciones adicionales de style binding
        contenido = re.sub(
            r'getColorEstado\(\(estadoForm as any\)\.get\(\'nuevoEstado\'\)\?\.value \|\| \'\'\)',
            'getColorEstado(estadoForm.get(\'nuevoEstado\')?.value || \'\')',
            contenido
        )
        
        contenido = re.sub(
            r'getColorTexto\(getColorEstado\(\(estadoForm as any\)\.get\(\'nuevoEstado\'\)\?\.value \|\| \'\'\)\)',
            'getColorTexto(getColorEstado(estadoForm.get(\'nuevoEstado\')?.value || \'\'))',
            contenido
        )
        
        contenido = re.sub(
            r'getLabelEstado\(\(estadoForm as any\)\.get\(\'nuevoEstado\'\)\?\.value \|\| \'\'\)',
            'getLabelEstado(estadoForm.get(\'nuevoEstado\')?.value || \'\')',
            contenido
        )
        
        with open(archivo_path, 'w', encoding='utf-8') as f:
            f.write(contenido)
        
        print("✅ Archivo cambiar-estado-bloque-modal.component.ts corregido exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error corrigiendo el archivo: {e}")
        return False

def main():
    """Función principal"""
    
    print("🔧 ARREGLANDO CAMBIAR-ESTADO-BLOQUE-MODAL")
    print("=" * 50)
    
    if arreglar_cambiar_estado_bloque():
        print("\n✅ Corrección completada exitosamente")
        print("💡 El archivo debería compilar correctamente ahora")
    else:
        print("\n❌ No se pudo completar la corrección")

if __name__ == "__main__":
    main()