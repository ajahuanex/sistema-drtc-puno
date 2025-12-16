"""
Script para corregir el formato de las resoluciones en la base de datos
"""
from pymongo import MongoClient
from datetime import datetime

def corregir_resoluciones():
    print("=" * 80)
    print("🔧 CORRIGIENDO FORMATO DE RESOLUCIONES")
    print("=" * 80)
    
    # Conectar a MongoDB
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    
    # Obtener todas las resoluciones
    resoluciones = list(db.resoluciones.find({}))
    print(f"📊 Total resoluciones a corregir: {len(resoluciones)}")
    
    for i, resolucion in enumerate(resoluciones, 1):
        print(f"\n{i}️⃣ Corrigiendo resolución: {resolucion.get('nroResolucion', 'SIN_NUMERO')}")
        
        # Preparar datos corregidos
        update_data = {}
        
        # 1. Corregir tipoResolucion
        tipo_resolucion = resolucion.get('tipoResolucion')
        if tipo_resolucion == 'AUTORIZACION_NUEVA':
            update_data['tipoResolucion'] = 'PADRE'
            print(f"   ✅ Tipo Resolución: AUTORIZACION_NUEVA → PADRE")
        elif tipo_resolucion not in ['PADRE', 'HIJO']:
            update_data['tipoResolucion'] = 'PADRE'  # Por defecto PADRE
            print(f"   ✅ Tipo Resolución: {tipo_resolucion} → PADRE")
        
        # 2. Agregar tipoTramite si no existe
        if 'tipoTramite' not in resolucion or not resolucion.get('tipoTramite'):
            update_data['tipoTramite'] = 'AUTORIZACION_NUEVA'
            print(f"   ✅ Tipo Trámite: Agregado AUTORIZACION_NUEVA")
        
        # 3. Asegurar campos requeridos
        campos_requeridos = {
            'descripcion': 'Resolución de autorización',
            'expedienteId': f'EXP-{i:04d}',
            'usuarioEmisionId': 'admin',
            'estado': 'VIGENTE',
            'estaActivo': True
        }
        
        for campo, valor_default in campos_requeridos.items():
            if campo not in resolucion or not resolucion.get(campo):
                update_data[campo] = valor_default
                print(f"   ✅ {campo}: Agregado ({valor_default})")
        
        # 4. Asegurar arrays vacíos para relaciones
        arrays_vacios = [
            'resolucionesHijasIds', 'vehiculosHabilitadosIds', 'rutasAutorizadasIds'
        ]
        
        for array_field in arrays_vacios:
            if array_field not in resolucion:
                update_data[array_field] = []
                print(f"   ✅ {array_field}: Array vacío agregado")
        
        # 5. Corregir fechas
        if 'fechaEmision' in resolucion:
            fecha_emision = resolucion['fechaEmision']
            if isinstance(fecha_emision, str):
                try:
                    update_data['fechaEmision'] = datetime.fromisoformat(fecha_emision.replace('Z', '+00:00'))
                    print(f"   ✅ Fecha Emisión: Convertida a datetime")
                except:
                    update_data['fechaEmision'] = datetime.utcnow()
                    print(f"   ✅ Fecha Emisión: Fecha actual por error de conversión")
        else:
            update_data['fechaEmision'] = datetime.utcnow()
            print(f"   ✅ Fecha Emisión: Agregada fecha actual")
        
        # 6. Agregar campos de auditoría
        if 'fechaRegistro' not in resolucion:
            update_data['fechaRegistro'] = datetime.utcnow()
        
        update_data['fechaActualizacion'] = datetime.utcnow()
        
        # Aplicar actualización
        if update_data:
            result = db.resoluciones.update_one(
                {"_id": resolucion["_id"]},
                {"$set": update_data}
            )
            print(f"   ✅ Resolución actualizada (modificados: {result.modified_count})")
        else:
            print(f"   ℹ️  Resolución ya está en formato correcto")
    
    print(f"\n🎉 CORRECCIÓN COMPLETADA")
    print(f"   • {len(resoluciones)} resoluciones procesadas")
    print(f"   • Formato compatible con backend")
    
    client.close()
    print("=" * 80)

if __name__ == "__main__":
    corregir_resoluciones()