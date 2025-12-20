#!/usr/bin/env python3
"""
Script para crear datos de prueba para el filtro de rutas
"""

import requests
import json

def crear_datos_prueba():
    """Crear datos de prueba para el filtro de rutas"""
    
    print("🔧 CREANDO DATOS DE PRUEBA PARA FILTRO DE RUTAS")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # Datos de prueba
    datos_prueba = {
        "empresa": {
            "id": "675e8b5c4a90c2b8f1234567",
            "codigoEmpresa": "EMP-001",
            "ruc": "20123456789",
            "razonSocial": {
                "principal": "Paputec S.A.C.",
                "comercial": "Paputec"
            },
            "direccionFiscal": {
                "direccion": "Av. Principal 123",
                "distrito": "Puno",
                "provincia": "Puno",
                "departamento": "Puno"
            },
            "estado": "ACTIVO",
            "estaActivo": True
        },
        "resolucion": {
            "id": "675e8b5c4a90c2b8f1234568",
            "nroResolucion": "R-0005-2025",
            "empresaId": "675e8b5c4a90c2b8f1234567",
            "tipoTramite": "PRIMIGENIA",
            "tipoResolucion": "PADRE",
            "fechaEmision": "2025-01-01T00:00:00Z",
            "estado": "VIGENTE",
            "estaActivo": True
        },
        "rutas": [
            {
                "id": "675e8b5c4a90c2b8f1234569",
                "codigoRuta": "01",
                "nombre": "Puno - Juliaca",
                "origen": "Puno",
                "destino": "Juliaca",
                "empresaId": "675e8b5c4a90c2b8f1234567",
                "resolucionId": "675e8b5c4a90c2b8f1234568",
                "tipo": "URBANA",
                "estado": "ACTIVA",
                "estaActivo": True
            },
            {
                "id": "675e8b5c4a90c2b8f123456a",
                "codigoRuta": "02",
                "nombre": "Juliaca - Puno",
                "origen": "Juliaca",
                "destino": "Puno",
                "empresaId": "675e8b5c4a90c2b8f1234567",
                "resolucionId": "675e8b5c4a90c2b8f1234568",
                "tipo": "URBANA",
                "estado": "ACTIVA",
                "estaActivo": True
            }
        ]
    }
    
    print("📊 DATOS DE PRUEBA PREPARADOS:")
    print(f"   Empresa: {datos_prueba['empresa']['razonSocial']['principal']}")
    print(f"   Resolución: {datos_prueba['resolucion']['nroResolucion']}")
    print(f"   Rutas: {len(datos_prueba['rutas'])}")
    
    print()
    print("💡 PARA CREAR ESTOS DATOS EN EL SISTEMA:")
    print("   1. Usar el frontend para crear la empresa")
    print("   2. Crear la resolución asociada a la empresa")
    print("   3. Crear las rutas asociadas a la empresa y resolución")
    print("   4. Verificar que los IDs coincidan")
    
    print()
    print("🔍 IDs IMPORTANTES PARA EL FRONTEND:")
    print(f"   EMPRESA_ID: '{datos_prueba['empresa']['id']}'")
    print(f"   RESOLUCION_ID: '{datos_prueba['resolucion']['id']}'")
    print(f"   RUTA_1_ID: '{datos_prueba['rutas'][0]['id']}'")
    print(f"   RUTA_2_ID: '{datos_prueba['rutas'][1]['id']}'")
    
    # Crear archivo de configuración para el frontend
    config_frontend = f"""
// Configuración de IDs para pruebas del filtro de rutas
export const TEST_IDS = {{
  EMPRESA_PAPUTEC: '{datos_prueba['empresa']['id']}',
  RESOLUCION_R0005: '{datos_prueba['resolucion']['id']}',
  RUTA_PUNO_JULIACA: '{datos_prueba['rutas'][0]['id']}',
  RUTA_JULIACA_PUNO: '{datos_prueba['rutas'][1]['id']}'
}};

// Función para verificar en consola
export function verificarIdsTest() {{
  console.log('🔍 IDs de prueba para filtro de rutas:', TEST_IDS);
}}
"""
    
    try:
        with open('test-ids-config.ts', 'w', encoding='utf-8') as f:
            f.write(config_frontend)
        print()
        print("   ✅ Archivo de configuración creado: test-ids-config.ts")
    except Exception as e:
        print(f"   ⚠️ No se pudo crear archivo de configuración: {e}")
    
    print()
    print("🎯 PASOS PARA ARREGLAR EL FILTRO:")
    print("   1. Verificar que estos datos existan en la base de datos")
    print("   2. Si no existen, crearlos usando el frontend")
    print("   3. Actualizar el frontend con estos IDs específicos")
    print("   4. Probar el filtro con estos datos conocidos")
    
    print()
    print("🏁 DATOS DE PRUEBA PREPARADOS")
    print("=" * 60)

if __name__ == "__main__":
    crear_datos_prueba()