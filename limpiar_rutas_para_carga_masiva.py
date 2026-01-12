#!/usr/bin/env python3
"""
Script para limpiar rutas de la base de datos y preparar carga masiva con localidades únicas
"""

import os
import sys
import django
from datetime import datetime

# Configurar Django
sys.path.append('/path/to/your/django/project')  # Ajustar según tu estructura
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.rutas.models import Ruta
from apps.localidades.models import Localidad
from apps.empresas.models import Empresa
from apps.resoluciones.models import Resolucion

def limpiar_rutas():
    """Elimina todas las rutas de la base de datos"""
    print("🗑️ Iniciando limpieza de rutas...")
    
    # Contar rutas antes de eliminar
    total_rutas = Ruta.objects.count()
    print(f"📊 Total de rutas encontradas: {total_rutas}")
    
    if total_rutas == 0:
        print("✅ No hay rutas para eliminar")
        return
    
    # Confirmar eliminación
    respuesta = input(f"⚠️ ¿Estás seguro de eliminar {total_rutas} rutas? (s/N): ")
    if respuesta.lower() != 's':
        print("❌ Operación cancelada")
        return
    
    # Eliminar rutas
    rutas_eliminadas = Ruta.objects.all().delete()
    print(f"✅ Eliminadas {rutas_eliminadas[0]} rutas exitosamente")

def mostrar_estadisticas_localidades():
    """Muestra estadísticas de localidades antes de la carga"""
    print("\n📊 ESTADÍSTICAS DE LOCALIDADES")
    print("=" * 50)
    
    total_localidades = Localidad.objects.count()
    localidades_activas = Localidad.objects.filter(esta_activa=True).count()
    localidades_inactivas = total_localidades - localidades_activas
    
    print(f"Total localidades: {total_localidades}")
    print(f"Localidades activas: {localidades_activas}")
    print(f"Localidades inactivas: {localidades_inactivas}")
    
    # Agrupar por departamento
    print("\n📍 Por Departamento:")
    departamentos = Localidad.objects.values('departamento').distinct()
    for dept in departamentos:
        count = Localidad.objects.filter(departamento=dept['departamento']).count()
        print(f"  - {dept['departamento']}: {count}")
    
    # Agrupar por tipo
    print("\n🏷️ Por Tipo:")
    tipos = Localidad.objects.values('tipo').distinct()
    for tipo in tipos:
        count = Localidad.objects.filter(tipo=tipo['tipo']).count()
        tipo_name = tipo['tipo'] or 'Sin tipo'
        print(f"  - {tipo_name}: {count}")

def mostrar_estadisticas_empresas():
    """Muestra estadísticas de empresas"""
    print("\n🏢 ESTADÍSTICAS DE EMPRESAS")
    print("=" * 50)
    
    total_empresas = Empresa.objects.count()
    empresas_activas = Empresa.objects.filter(estado='ACTIVA').count()
    
    print(f"Total empresas: {total_empresas}")
    print(f"Empresas activas: {empresas_activas}")
    
    # Mostrar algunas empresas de ejemplo
    print("\n📋 Empresas de ejemplo:")
    empresas_ejemplo = Empresa.objects.filter(estado='ACTIVA')[:5]
    for empresa in empresas_ejemplo:
        razon_social = empresa.razon_social.get('principal', 'Sin razón social') if empresa.razon_social else 'Sin razón social'
        print(f"  - {empresa.ruc}: {razon_social}")

def mostrar_estadisticas_resoluciones():
    """Muestra estadísticas de resoluciones"""
    print("\n📄 ESTADÍSTICAS DE RESOLUCIONES")
    print("=" * 50)
    
    total_resoluciones = Resolucion.objects.count()
    resoluciones_activas = Resolucion.objects.filter(estado='ACTIVA').count()
    
    print(f"Total resoluciones: {total_resoluciones}")
    print(f"Resoluciones activas: {resoluciones_activas}")
    
    # Mostrar algunas resoluciones de ejemplo
    print("\n📋 Resoluciones de ejemplo:")
    resoluciones_ejemplo = Resolucion.objects.filter(estado='ACTIVA')[:5]
    for resolucion in resoluciones_ejemplo:
        print(f"  - {resolucion.nro_resolucion}: {resolucion.tipo_tramite}")

def verificar_integridad_datos():
    """Verifica la integridad de los datos antes de la carga masiva"""
    print("\n🔍 VERIFICACIÓN DE INTEGRIDAD")
    print("=" * 50)
    
    errores = []
    
    # Verificar empresas sin RUC
    empresas_sin_ruc = Empresa.objects.filter(ruc__isnull=True).count()
    if empresas_sin_ruc > 0:
        errores.append(f"❌ {empresas_sin_ruc} empresas sin RUC")
    
    # Verificar localidades sin nombre
    localidades_sin_nombre = Localidad.objects.filter(nombre__isnull=True).count()
    if localidades_sin_nombre > 0:
        errores.append(f"❌ {localidades_sin_nombre} localidades sin nombre")
    
    # Verificar resoluciones sin número
    resoluciones_sin_numero = Resolucion.objects.filter(nro_resolucion__isnull=True).count()
    if resoluciones_sin_numero > 0:
        errores.append(f"❌ {resoluciones_sin_numero} resoluciones sin número")
    
    if errores:
        print("⚠️ Errores encontrados:")
        for error in errores:
            print(f"  {error}")
        print("\n💡 Recomendación: Corregir estos errores antes de la carga masiva")
    else:
        print("✅ Todos los datos están íntegros")

def crear_localidades_ejemplo():
    """Crea algunas localidades de ejemplo para pruebas"""
    print("\n🆕 CREANDO LOCALIDADES DE EJEMPLO")
    print("=" * 50)
    
    localidades_ejemplo = [
        {
            'nombre': 'PUNO',
            'departamento': 'PUNO',
            'provincia': 'PUNO',
            'distrito': 'PUNO',
            'municipalidad_centro_poblado': 'PUNO',
            'nivel_territorial': 'CIUDAD',
            'tipo': 'CIUDAD',
            'descripcion': 'Capital del departamento de Puno',
            'esta_activa': True
        },
        {
            'nombre': 'JULIACA',
            'departamento': 'PUNO',
            'provincia': 'SAN ROMAN',
            'distrito': 'JULIACA',
            'municipalidad_centro_poblado': 'JULIACA',
            'nivel_territorial': 'CIUDAD',
            'tipo': 'CIUDAD',
            'descripcion': 'Ciudad comercial de Puno',
            'esta_activa': True
        },
        {
            'nombre': 'PUCARA',
            'departamento': 'PUNO',
            'provincia': 'LAMPA',
            'distrito': 'PUCARA',
            'municipalidad_centro_poblado': 'PUCARA',
            'nivel_territorial': 'DISTRITO',
            'tipo': 'DISTRITO',
            'descripcion': 'Distrito de Pucará',
            'esta_activa': True
        },
        {
            'nombre': 'TARACO',
            'departamento': 'PUNO',
            'provincia': 'HUANCANE',
            'distrito': 'TARACO',
            'municipalidad_centro_poblado': 'TARACO',
            'nivel_territorial': 'DISTRITO',
            'tipo': 'DISTRITO',
            'descripcion': 'Distrito de Taraco',
            'esta_activa': True
        }
    ]
    
    creadas = 0
    for localidad_data in localidades_ejemplo:
        # Verificar si ya existe
        existe = Localidad.objects.filter(
            nombre=localidad_data['nombre'],
            departamento=localidad_data['departamento']
        ).exists()
        
        if not existe:
            Localidad.objects.create(**localidad_data)
            print(f"✅ Creada localidad: {localidad_data['nombre']}")
            creadas += 1
        else:
            print(f"ℹ️ Ya existe localidad: {localidad_data['nombre']}")
    
    print(f"\n📊 Total localidades creadas: {creadas}")

def main():
    """Función principal"""
    print("🚀 PREPARACIÓN PARA CARGA MASIVA DE RUTAS CON LOCALIDADES ÚNICAS")
    print("=" * 70)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        # 1. Mostrar estadísticas actuales
        mostrar_estadisticas_localidades()
        mostrar_estadisticas_empresas()
        mostrar_estadisticas_resoluciones()
        
        # 2. Verificar integridad
        verificar_integridad_datos()
        
        # 3. Limpiar rutas
        print("\n" + "=" * 50)
        limpiar_rutas()
        
        # 4. Crear localidades de ejemplo si es necesario
        respuesta = input("\n¿Crear localidades de ejemplo para pruebas? (s/N): ")
        if respuesta.lower() == 's':
            crear_localidades_ejemplo()
        
        print("\n✅ PREPARACIÓN COMPLETADA")
        print("=" * 50)
        print("🎯 El sistema está listo para la carga masiva de rutas")
        print("💡 Las localidades se procesarán automáticamente para evitar duplicados")
        print("📊 Usa el componente de carga masiva en el frontend para procesar las rutas")
        
    except Exception as e:
        print(f"❌ Error durante la preparación: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()