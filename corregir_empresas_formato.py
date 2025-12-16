"""
Script para corregir el formato de las empresas en la base de datos
"""
from pymongo import MongoClient
from datetime import datetime

def corregir_empresas():
    print("=" * 80)
    print("🔧 CORRIGIENDO FORMATO DE EMPRESAS")
    print("=" * 80)
    
    # Conectar a MongoDB
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    
    # Obtener todas las empresas
    empresas = list(db.empresas.find({}))
    print(f"📊 Total empresas a corregir: {len(empresas)}")
    
    for i, empresa in enumerate(empresas, 1):
        print(f"\n{i}️⃣ Corrigiendo empresa: {empresa.get('ruc', 'SIN_RUC')}")
        
        # Preparar datos corregidos
        update_data = {}
        
        # 1. Corregir estado
        if empresa.get('estado') == 'ACTIVO':
            update_data['estado'] = 'HABILITADA'
            print(f"   ✅ Estado: ACTIVO → HABILITADA")
        
        # 2. Corregir representanteLegal
        rep_legal = empresa.get('representanteLegal')
        if isinstance(rep_legal, str):
            # Convertir string a objeto
            nombres_completos = rep_legal.split(' ')
            if len(nombres_completos) >= 2:
                nombres = ' '.join(nombres_completos[:-1])
                apellidos = nombres_completos[-1]
            else:
                nombres = rep_legal
                apellidos = "Sin Apellido"
            
            update_data['representanteLegal'] = {
                "dni": "12345678",  # DNI por defecto
                "nombres": nombres,
                "apellidos": apellidos
            }
            print(f"   ✅ Representante: '{rep_legal}' → Objeto estructurado")
        
        # 3. Asegurar razonSocial como objeto
        razon_social = empresa.get('razonSocial')
        if isinstance(razon_social, str):
            update_data['razonSocial'] = {
                "principal": razon_social,
                "sunat": razon_social,
                "minimo": razon_social
            }
            print(f"   ✅ Razón Social: String → Objeto")
        
        # 4. Agregar campos faltantes
        if not empresa.get('codigoEmpresa'):
            codigo = f"{i:04d}EMP"
            update_data['codigoEmpresa'] = codigo
            print(f"   ✅ Código Empresa: {codigo}")
        
        if not empresa.get('direccionFiscal'):
            update_data['direccionFiscal'] = "Dirección por definir"
            print(f"   ✅ Dirección Fiscal: Agregada")
        
        # 5. Agregar campos de auditoría
        update_data['fechaActualizacion'] = datetime.utcnow()
        
        # 6. Asegurar arrays vacíos para relaciones
        arrays_vacios = [
            'documentos', 'auditoria', 'resolucionesPrimigeniasIds',
            'vehiculosHabilitadosIds', 'conductoresHabilitadosIds', 'rutasAutorizadasIds'
        ]
        
        for array_field in arrays_vacios:
            if array_field not in empresa:
                update_data[array_field] = []
        
        # Aplicar actualización
        if update_data:
            result = db.empresas.update_one(
                {"_id": empresa["_id"]},
                {"$set": update_data}
            )
            print(f"   ✅ Empresa actualizada (modificados: {result.modified_count})")
        else:
            print(f"   ℹ️  Empresa ya está en formato correcto")
    
    print(f"\n🎉 CORRECCIÓN COMPLETADA")
    print(f"   • {len(empresas)} empresas procesadas")
    print(f"   • Formato compatible con backend")
    
    client.close()
    print("=" * 80)

if __name__ == "__main__":
    corregir_empresas()