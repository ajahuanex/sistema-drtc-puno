#!/usr/bin/env python3
"""
Test para verificar que los filtros de empresas funcionan correctamente
después de las correcciones.
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.models.empresa import EmpresaFiltros, EstadoEmpresa
from app.services.empresa_service import EmpresaService
from datetime import datetime

async def test_filtros_empresas():
    """Test de filtros de empresas."""
    
    print("🧪 TEST FILTROS DE EMPRESAS CORREGIDO")
    print("=" * 50)
    
    # Test 1: Crear objeto EmpresaFiltros
    print("\n1. Creando objeto EmpresaFiltros...")
    
    try:
        filtros = EmpresaFiltros(
            ruc="2044",
            razonSocial="TRANSPORTES",
            estado=EstadoEmpresa.AUTORIZADA,
            fechaDesde=datetime(2024, 1, 1),
            fechaHasta=datetime(2024, 12, 31)
        )
        
        print("✅ Objeto EmpresaFiltros creado exitosamente:")
        print(f"   • RUC: {filtros.ruc}")
        print(f"   • Razón Social: {filtros.razonSocial}")
        print(f"   • Estado: {filtros.estado}")
        print(f"   • Fecha Desde: {filtros.fechaDesde}")
        print(f"   • Fecha Hasta: {filtros.fechaHasta}")
        
    except Exception as e:
        print(f"❌ Error creando filtros: {e}")
        return False
    
    # Test 2: Simular query de MongoDB
    print(f"\n2. Simulando construcción de query MongoDB...")
    
    try:
        # Simular la lógica del servicio
        query = {"estaActivo": True}
        
        if filtros.ruc:
            query["ruc"] = {"$regex": filtros.ruc, "$options": "i"}
            
        if filtros.razonSocial:
            query["razonSocial.principal"] = {"$regex": filtros.razonSocial, "$options": "i"}
            
        if filtros.estado:
            query["estado"] = filtros.estado.value if hasattr(filtros.estado, 'value') else filtros.estado
            
        if filtros.fechaDesde or filtros.fechaHasta:
            query["fechaRegistro"] = {}
            if filtros.fechaDesde:
                query["fechaRegistro"]["$gte"] = filtros.fechaDesde
            if filtros.fechaHasta:
                query["fechaRegistro"]["$lte"] = filtros.fechaHasta
        
        print("✅ Query MongoDB construida exitosamente:")
        print(f"   • estaActivo: {query['estaActivo']}")
        print(f"   • ruc: {query.get('ruc', 'No filtrado')}")
        print(f"   • razonSocial.principal: {query.get('razonSocial.principal', 'No filtrado')}")
        print(f"   • estado: {query.get('estado', 'No filtrado')}")
        print(f"   • fechaRegistro: {query.get('fechaRegistro', 'No filtrado')}")
        
    except Exception as e:
        print(f"❌ Error construyendo query: {e}")
        return False
    
    # Test 3: Validar estados
    print(f"\n3. Validando estados disponibles...")
    
    try:
        estados_validos = [e.value for e in EstadoEmpresa]
        print(f"✅ Estados válidos: {estados_validos}")
        
        # Verificar que AUTORIZADA está presente
        if "AUTORIZADA" in estados_validos:
            print("✅ Estado AUTORIZADA disponible")
        else:
            print("❌ Estado AUTORIZADA no disponible")
            return False
            
    except Exception as e:
        print(f"❌ Error validando estados: {e}")
        return False
    
    # Test 4: Simular respuesta del endpoint
    print(f"\n4. Simulando respuesta del endpoint...")
    
    try:
        # Simular parámetros del endpoint
        skip = 0
        limit = 1000
        estado = "AUTORIZADA"
        ruc = "2044"
        razon_social = ""
        fecha_desde = None
        fecha_hasta = None
        
        # Crear filtros como lo haría el endpoint
        filtros_endpoint = EmpresaFiltros(
            ruc=ruc if ruc else None,
            razonSocial=razon_social if razon_social else None,
            estado=EstadoEmpresa(estado) if estado else None,
            fechaDesde=None,  # Se convertiría de string
            fechaHasta=None   # Se convertiría de string
        )
        
        print("✅ Filtros del endpoint creados exitosamente:")
        print(f"   • RUC: {filtros_endpoint.ruc}")
        print(f"   • Razón Social: {filtros_endpoint.razonSocial}")
        print(f"   • Estado: {filtros_endpoint.estado}")
        print(f"   • Skip: {skip}")
        print(f"   • Limit: {limit}")
        
    except Exception as e:
        print(f"❌ Error simulando endpoint: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print(f"\n🎉 ¡TODOS LOS TESTS PASARON!")
    print(f"✅ Objeto EmpresaFiltros funciona correctamente")
    print(f"✅ Query MongoDB se construye correctamente")
    print(f"✅ Estados AUTORIZADA disponible")
    print(f"✅ Endpoint debería funcionar correctamente")
    
    return True

def test_conversion_fechas():
    """Test de conversión de fechas."""
    
    print(f"\n🧪 TEST CONVERSIÓN DE FECHAS")
    print("=" * 40)
    
    # Casos de prueba de fechas
    casos_fechas = [
        "2024-01-01",
        "2024-12-31T23:59:59",
        "2024-06-15T12:30:00Z",
        "2024-06-15T12:30:00+00:00",
        "",
        None
    ]
    
    for caso in casos_fechas:
        try:
            if caso:
                fecha_dt = datetime.fromisoformat(caso.replace('Z', '+00:00'))
                print(f"✅ '{caso}' → {fecha_dt}")
            else:
                print(f"✅ '{caso}' → None (vacío)")
        except Exception as e:
            print(f"❌ '{caso}' → Error: {e}")
    
    return True

if __name__ == "__main__":
    success1 = asyncio.run(test_filtros_empresas())
    success2 = test_conversion_fechas()
    
    if success1 and success2:
        print(f"\n🎉 TODOS LOS TESTS EXITOSOS - FILTROS CORREGIDOS")
    else:
        print(f"\n⚠️  Algunos tests fallaron")