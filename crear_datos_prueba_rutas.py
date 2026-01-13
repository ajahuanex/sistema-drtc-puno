#!/usr/bin/env python3
"""
Script para crear datos de prueba realistas para carga masiva de rutas
"""
import pandas as pd
from datetime import datetime

def crear_datos_prueba_rutas():
    """Crear archivo Excel con datos de prueba realistas para rutas"""
    
    print("🚌 CREANDO DATOS DE PRUEBA PARA RUTAS")
    print("=" * 50)
    
    # Datos realistas de rutas del sur del Perú
    datos_rutas = [
        # Empresa TRANSPORTES PUNO S.A. (ID ficticio)
        {
            'Código Ruta': '04',
            'Nombre': 'PUNO - AREQUIPA',
            'Empresa ID': '675e8b5c4a90c2b8f1234567',
            'Resolución ID': '675e8b5c4a90c2b8f1234569',
            'Origen ID': 'PUNO_001',
            'Destino ID': 'AREQUIPA_001',
            'Frecuencias': 'Diaria, cada 2 horas de 06:00 a 20:00',
            'Tipo Ruta': 'INTERPROVINCIAL',
            'Tipo Servicio': 'PASAJEROS',
            'Estado': 'ACTIVA',
            'Distancia (km)': 280.5,
            'Tiempo Estimado': '04:30',
            'Tarifa Base': 35.00,
            'Capacidad Máxima': 45,
            'Observaciones': 'Ruta turística principal con paradas en Lampa y Juliaca'
        },
        {
            'Código Ruta': '05',
            'Nombre': 'PUNO - CUSCO',
            'Empresa ID': '675e8b5c4a90c2b8f1234567',
            'Resolución ID': '675e8b5c4a90c2b8f1234569',
            'Origen ID': 'PUNO_001',
            'Destino ID': 'CUSCO_001',
            'Frecuencias': 'Diaria, 4 salidas: 06:00, 10:00, 14:00, 18:00',
            'Tipo Ruta': 'INTERPROVINCIAL',
            'Tipo Servicio': 'PASAJEROS',
            'Estado': 'ACTIVA',
            'Distancia (km)': 385.0,
            'Tiempo Estimado': '06:00',
            'Tarifa Base': 45.00,
            'Capacidad Máxima': 50,
            'Observaciones': 'Ruta turística hacia Machu Picchu, paradas en Sicuani y Urcos'
        },
        {
            'Código Ruta': '06',
            'Nombre': 'JULIACA - AREQUIPA',
            'Empresa ID': '675e8b5c4a90c2b8f1234567',
            'Resolución ID': '675e8b5c4a90c2b8f1234569',
            'Origen ID': 'JULIACA_001',
            'Destino ID': 'AREQUIPA_001',
            'Frecuencias': 'Diaria, cada 3 horas de 05:00 a 23:00',
            'Tipo Ruta': 'INTERPROVINCIAL',
            'Tipo Servicio': 'PASAJEROS',
            'Estado': 'ACTIVA',
            'Distancia (km)': 280.0,
            'Tiempo Estimado': '04:00',
            'Tarifa Base': 32.00,
            'Capacidad Máxima': 48,
            'Observaciones': 'Ruta comercial directa sin paradas intermedias'
        },
        
        # Empresa TRANSPORTES LIMA E.I.R.L. (ID ficticio)
        {
            'Código Ruta': '01',
            'Nombre': 'LIMA - PUNO',
            'Empresa ID': '675e8b5c4a90c2b8f1234568',
            'Resolución ID': '675e8b5c4a90c2b8f123456a',
            'Origen ID': 'LIMA_001',
            'Destino ID': 'PUNO_001',
            'Frecuencias': 'Diaria, 1 salida nocturna a las 20:00',
            'Tipo Ruta': 'INTERPROVINCIAL',
            'Tipo Servicio': 'PASAJEROS',
            'Estado': 'ACTIVA',
            'Distancia (km)': 1293.0,
            'Tiempo Estimado': '18:00',
            'Tarifa Base': 120.00,
            'Capacidad Máxima': 55,
            'Observaciones': 'Ruta larga distancia con servicio cama, paradas en Nazca, Arequipa'
        },
        {
            'Código Ruta': '02',
            'Nombre': 'LIMA - CUSCO',
            'Empresa ID': '675e8b5c4a90c2b8f1234568',
            'Resolución ID': '675e8b5c4a90c2b8f123456a',
            'Origen ID': 'LIMA_001',
            'Destino ID': 'CUSCO_001',
            'Frecuencias': 'Diaria, 2 salidas: 19:00 y 21:00',
            'Tipo Ruta': 'INTERPROVINCIAL',
            'Tipo Servicio': 'PASAJEROS',
            'Estado': 'ACTIVA',
            'Distancia (km)': 1165.0,
            'Tiempo Estimado': '20:00',
            'Tarifa Base': 110.00,
            'Capacidad Máxima': 52,
            'Observaciones': 'Ruta turística premium con servicios a bordo'
        },
        
        # Rutas urbanas de Puno
        {
            'Código Ruta': '07',
            'Nombre': 'CENTRO - UNIVERSIDAD',
            'Empresa ID': '675e8b5c4a90c2b8f1234567',
            'Resolución ID': '675e8b5c4a90c2b8f1234569',
            'Origen ID': 'PUNO_CENTRO',
            'Destino ID': 'PUNO_UNA',
            'Frecuencias': 'Lunes a Viernes, cada 15 minutos de 06:00 a 22:00',
            'Tipo Ruta': 'URBANA',
            'Tipo Servicio': 'PASAJEROS',
            'Estado': 'ACTIVA',
            'Distancia (km)': 8.5,
            'Tiempo Estimado': '00:25',
            'Tarifa Base': 1.50,
            'Capacidad Máxima': 35,
            'Observaciones': 'Ruta estudiantil con alta demanda en horarios académicos'
        },
        {
            'Código Ruta': '08',
            'Nombre': 'TERMINAL - AEROPUERTO',
            'Empresa ID': '675e8b5c4a90c2b8f1234567',
            'Resolución ID': '675e8b5c4a90c2b8f1234569',
            'Origen ID': 'PUNO_TERMINAL',
            'Destino ID': 'PUNO_AEROPUERTO',
            'Frecuencias': 'Diaria, cada 30 minutos de 05:00 a 23:00',
            'Tipo Ruta': 'INTERURBANA',
            'Tipo Servicio': 'PASAJEROS',
            'Estado': 'ACTIVA',
            'Distancia (km)': 12.0,
            'Tiempo Estimado': '00:30',
            'Tarifa Base': 3.00,
            'Capacidad Máxima': 25,
            'Observaciones': 'Servicio de conexión aeroportuaria'
        },
        
        # Ruta de carga
        {
            'Código Ruta': '09',
            'Nombre': 'PUNO - JULIACA CARGA',
            'Empresa ID': '675e8b5c4a90c2b8f1234567',
            'Resolución ID': '675e8b5c4a90c2b8f1234569',
            'Origen ID': 'PUNO_001',
            'Destino ID': 'JULIACA_001',
            'Frecuencias': 'Lunes a Sábado, 6 viajes diarios',
            'Tipo Ruta': 'INTERPROVINCIAL',
            'Tipo Servicio': 'CARGA',
            'Estado': 'ACTIVA',
            'Distancia (km)': 45.0,
            'Tiempo Estimado': '01:15',
            'Tarifa Base': 25.00,
            'Capacidad Máxima': 15,
            'Observaciones': 'Transporte de carga comercial y productos agrícolas'
        },
        
        # Ruta mixta
        {
            'Código Ruta': '10',
            'Nombre': 'PUNO - YUNGUYO',
            'Empresa ID': '675e8b5c4a90c2b8f1234567',
            'Resolución ID': '675e8b5c4a90c2b8f1234569',
            'Origen ID': 'PUNO_001',
            'Destino ID': 'YUNGUYO_001',
            'Frecuencias': 'Diaria, cada 2 horas de 06:00 a 18:00',
            'Tipo Ruta': 'INTERPROVINCIAL',
            'Tipo Servicio': 'MIXTO',
            'Estado': 'ACTIVA',
            'Distancia (km)': 135.0,
            'Tiempo Estimado': '02:30',
            'Tarifa Base': 18.00,
            'Capacidad Máxima': 30,
            'Observaciones': 'Servicio mixto pasajeros y encomiendas hacia frontera con Bolivia'
        }
    ]
    
    # Crear DataFrame
    df = pd.DataFrame(datos_rutas)
    
    # Crear archivo Excel con múltiples hojas
    nombre_archivo = f"rutas_prueba_realistas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    with pd.ExcelWriter(nombre_archivo, engine='openpyxl') as writer:
        # Hoja de instrucciones
        instrucciones = pd.DataFrame({
            'INSTRUCCIONES PARA CARGA MASIVA DE RUTAS': [
                '1. Este archivo contiene datos de prueba realistas',
                '2. Los IDs de empresa y resolución son ficticios',
                '3. Antes de usar, actualice los IDs con valores reales del sistema',
                '4. Verifique que las empresas y resoluciones existan',
                '5. Los códigos de ruta deben ser únicos dentro de cada resolución',
                '',
                'DATOS INCLUIDOS:',
                f'• {len(datos_rutas)} rutas de prueba',
                '• Rutas interprovinciales, urbanas e interurbanas',
                '• Servicios de pasajeros, carga y mixto',
                '• Empresas ficticias del sur del Perú',
                '',
                'MODIFICACIONES NECESARIAS:',
                '• Actualizar Empresa ID con IDs reales',
                '• Actualizar Resolución ID con IDs reales',
                '• Verificar que los códigos de ruta no existan',
                '• Ajustar Origen ID y Destino ID según su sistema'
            ]
        })
        instrucciones.to_excel(writer, sheet_name='INSTRUCCIONES', index=False)
        
        # Hoja de datos
        df.to_excel(writer, sheet_name='DATOS', index=False)
        
        # Hoja de resumen
        resumen = pd.DataFrame({
            'RESUMEN DE DATOS': [
                f'Total de rutas: {len(datos_rutas)}',
                f'Empresas únicas: {df["Empresa ID"].nunique()}',
                f'Resoluciones únicas: {df["Resolución ID"].nunique()}',
                '',
                'Por tipo de ruta:',
                f'• INTERPROVINCIAL: {len(df[df["Tipo Ruta"] == "INTERPROVINCIAL"])}',
                f'• URBANA: {len(df[df["Tipo Ruta"] == "URBANA"])}',
                f'• INTERURBANA: {len(df[df["Tipo Ruta"] == "INTERURBANA"])}',
                '',
                'Por tipo de servicio:',
                f'• PASAJEROS: {len(df[df["Tipo Servicio"] == "PASAJEROS"])}',
                f'• CARGA: {len(df[df["Tipo Servicio"] == "CARGA"])}',
                f'• MIXTO: {len(df[df["Tipo Servicio"] == "MIXTO"])}',
                '',
                'Distancias:',
                f'• Mínima: {df["Distancia (km)"].min()} km',
                f'• Máxima: {df["Distancia (km)"].max()} km',
                f'• Promedio: {df["Distancia (km)"].mean():.1f} km',
                '',
                'Tarifas:',
                f'• Mínima: S/ {df["Tarifa Base"].min():.2f}',
                f'• Máxima: S/ {df["Tarifa Base"].max():.2f}',
                f'• Promedio: S/ {df["Tarifa Base"].mean():.2f}'
            ]
        })
        resumen.to_excel(writer, sheet_name='RESUMEN', index=False)
    
    print(f"✅ Archivo creado: {nombre_archivo}")
    print(f"📊 Datos generados:")
    print(f"   • {len(datos_rutas)} rutas de prueba")
    print(f"   • {df['Empresa ID'].nunique()} empresas ficticias")
    print(f"   • {df['Resolución ID'].nunique()} resoluciones ficticias")
    print(f"   • Tipos de ruta: {', '.join(df['Tipo Ruta'].unique())}")
    print(f"   • Tipos de servicio: {', '.join(df['Tipo Servicio'].unique())}")
    
    print(f"\n📋 Hojas del archivo:")
    print(f"   • INSTRUCCIONES: Guía de uso")
    print(f"   • DATOS: Rutas para cargar")
    print(f"   • RESUMEN: Estadísticas de los datos")
    
    print(f"\n⚠️ IMPORTANTE:")
    print(f"   • Actualice los IDs de empresa y resolución con valores reales")
    print(f"   • Verifique que los códigos de ruta no existan en el sistema")
    print(f"   • Ajuste los IDs de origen y destino según su configuración")
    
    return nombre_archivo

if __name__ == "__main__":
    archivo_creado = crear_datos_prueba_rutas()
    print(f"\n🎯 Archivo listo para usar: {archivo_creado}")
    print("Ahora puede probar la carga masiva con datos realistas del sistema.")