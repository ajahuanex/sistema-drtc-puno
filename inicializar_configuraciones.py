#!/usr/bin/env python3
"""
Script para inicializar las configuraciones predefinidas del sistema
"""

import asyncio
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.dependencies.db import connect_to_mongo, close_mongo_connection, get_database
from app.services.configuracion_service import ConfiguracionService

async def inicializar_configuraciones():
    """Inicializar configuraciones predefinidas"""
    
    print("🔧 INICIALIZANDO CONFIGURACIONES DEL SISTEMA")
    print("=" * 50)
    
    try:
        # Inicializar conexión
        await connect_to_mongo()
        db = await get_database()
        
        # Crear servicio de configuraciones
        config_service = ConfiguracionService(db)
        
        # Inicializar configuraciones predefinidas
        await config_service.inicializar_configuraciones_predefinidas("SISTEMA")
        
        # Verificar configuraciones creadas
        print("\n📊 VERIFICANDO CONFIGURACIONES:")
        
        # Obtener tipos de servicio
        tipos_servicio = await config_service.get_tipos_servicio_activos()
        print(f"\n✅ Tipos de Servicio configurados ({len(tipos_servicio)}):")
        for item in tipos_servicio:
            print(f"   • {item.codigo}: {item.nombre}")
        
        print(f"\n🎯 Configuraciones inicializadas exitosamente")
        
    except Exception as e:
        print(f"❌ Error inicializando configuraciones: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

async def test_configuraciones():
    """Probar el servicio de configuraciones"""
    
    print("\n🧪 PROBANDO SERVICIO DE CONFIGURACIONES")
    print("=" * 50)
    
    try:
        await connect_to_mongo()
        db = await get_database()
        
        config_service = ConfiguracionService(db)
        
        # Probar obtener códigos de tipos de servicio
        codigos = await config_service.get_tipos_servicio_codigos()
        print(f"📋 Códigos de tipos de servicio: {codigos}")
        
        # Probar obtener configuración completa
        from app.models.configuracion import TipoConfiguracion
        config = await config_service.get_configuracion_por_tipo(TipoConfiguracion.TIPOS_SERVICIO)
        if config:
            print(f"📄 Configuración encontrada: {config['nombre']}")
            print(f"   Items activos: {len([i for i in config['items'] if i.estaActivo])}")
        
        print("✅ Pruebas completadas exitosamente")
        
    except Exception as e:
        print(f"❌ Error en pruebas: {e}")
    finally:
        await close_mongo_connection()

async def main():
    """Función principal"""
    await inicializar_configuraciones()
    await test_configuraciones()

if __name__ == "__main__":
    asyncio.run(main())