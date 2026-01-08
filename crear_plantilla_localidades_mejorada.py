#!/usr/bin/env python3
"""
Script para crear plantilla Excel de localidades con los nuevos campos mejorados
"""

import pandas as pd
from datetime import datetime
import os

def crear_plantilla_localidades():
    """Crea una plantilla Excel para carga masiva de localidades"""
    
    print("📊 Creando plantilla de localidades mejorada...")
    
    # Definir las columnas según los nuevos requerimientos
    columnas = [
        "UBIGEO",
        "UBIGEO_E_IDENTIFICADOR_MCP", 
        "DEPARTAMENTO",
        "PROVINCIA",
        "DISTRITO",
        "MUNICIPALIDAD_CENTRO_POBLADO",
        "DISPOSITIVO_LEGAL_CREACION",
        "LATITUD",
        "LONGITUD",
        "NOMBRE",
        "TIPO",
        "DESCRIPCION",
        "OBSERVACIONES",
        "ESTA_ACTIVA"
    ]
    
    # Datos de ejemplo
    datos_ejemplo = [
        {
            "UBIGEO": "150101",
            "UBIGEO_E_IDENTIFICADOR_MCP": "150101-MCP-001",
            "DEPARTAMENTO": "LIMA",
            "PROVINCIA": "LIMA", 
            "DISTRITO": "LIMA",
            "MUNICIPALIDAD_CENTRO_POBLADO": "Municipalidad Metropolitana de Lima",
            "DISPOSITIVO_LEGAL_CREACION": "Ley N° 27972 - Ley Orgánica de Municipalidades",
            "LATITUD": -12.0464,
            "LONGITUD": -77.0428,
            "NOMBRE": "Lima",
            "TIPO": "CIUDAD",
            "DESCRIPCION": "Capital del Perú",
            "OBSERVACIONES": "Centro político y económico del país",
            "ESTA_ACTIVA": True
        },
        {
            "UBIGEO": "040101", 
            "UBIGEO_E_IDENTIFICADOR_MCP": "040101-MCP-001",
            "DEPARTAMENTO": "AREQUIPA",
            "PROVINCIA": "AREQUIPA",
            "DISTRITO": "AREQUIPA", 
            "MUNICIPALIDAD_CENTRO_POBLADO": "Municipalidad Provincial de Arequipa",
            "DISPOSITIVO_LEGAL_CREACION": "Ley N° 27972 - Ley Orgánica de Municipalidades",
            "LATITUD": -16.4090,
            "LONGITUD": -71.5375,
            "NOMBRE": "Arequipa",
            "TIPO": "CIUDAD",
            "DESCRIPCION": "Ciudad Blanca del Perú",
            "OBSERVACIONES": "Segunda ciudad más importante del país",
            "ESTA_ACTIVA": True
        },
        {
            "UBIGEO": "080101",
            "UBIGEO_E_IDENTIFICADOR_MCP": "080101-MCP-001", 
            "DEPARTAMENTO": "CUSCO",
            "PROVINCIA": "CUSCO",
            "DISTRITO": "CUSCO",
            "MUNICIPALIDAD_CENTRO_POBLADO": "Municipalidad Provincial del Cusco",
            "DISPOSITIVO_LEGAL_CREACION": "Ley N° 27972 - Ley Orgánica de Municipalidades",
            "LATITUD": -13.5319,
            "LONGITUD": -71.9675,
            "NOMBRE": "Cusco",
            "TIPO": "CIUDAD", 
            "DESCRIPCION": "Capital Histórica del Perú",
            "OBSERVACIONES": "Patrimonio Cultural de la Humanidad",
            "ESTA_ACTIVA": True
        },
        {
            "UBIGEO": "210101",
            "UBIGEO_E_IDENTIFICADOR_MCP": "210101-MCP-001",
            "DEPARTAMENTO": "PUNO",
            "PROVINCIA": "PUNO",
            "DISTRITO": "PUNO",
            "MUNICIPALIDAD_CENTRO_POBLADO": "Municipalidad Provincial de Puno",
            "DISPOSITIVO_LEGAL_CREACION": "Ley N° 27972 - Ley Orgánica de Municipalidades",
            "LATITUD": -15.8402,
            "LONGITUD": -70.0219,
            "NOMBRE": "Puno",
            "TIPO": "CIUDAD",
            "DESCRIPCION": "Capital folklórica del Perú",
            "OBSERVACIONES": "A orillas del Lago Titicaca",
            "ESTA_ACTIVA": True
        },
        {
            "UBIGEO": "200101",
            "UBIGEO_E_IDENTIFICADOR_MCP": "200101-MCP-001",
            "DEPARTAMENTO": "PIURA", 
            "PROVINCIA": "PIURA",
            "DISTRITO": "PIURA",
            "MUNICIPALIDAD_CENTRO_POBLADO": "Municipalidad Provincial de Piura",
            "DISPOSITIVO_LEGAL_CREACION": "",
            "LATITUD": -5.1945,
            "LONGITUD": -80.6328,
            "NOMBRE": "Piura",
            "TIPO": "CIUDAD",
            "DESCRIPCION": "Ciudad del eterno calor",
            "OBSERVACIONES": "",
            "ESTA_ACTIVA": True
        }
    ]
    
    # Crear DataFrame
    df = pd.DataFrame(datos_ejemplo)
    
    # Generar nombre de archivo con timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_archivo = f"plantilla_localidades_mejorada_{timestamp}.xlsx"
    
    # Crear el archivo Excel con múltiples hojas
    with pd.ExcelWriter(nombre_archivo, engine='openpyxl') as writer:
        
        # Hoja 1: Plantilla con datos de ejemplo
        df.to_excel(writer, sheet_name='Datos_Ejemplo', index=False)
        
        # Hoja 2: Plantilla vacía para llenar
        df_vacio = pd.DataFrame(columns=columnas)
        df_vacio.to_excel(writer, sheet_name='Plantilla_Vacia', index=False)
        
        # Hoja 3: Instrucciones
        instrucciones = crear_instrucciones()
        df_instrucciones = pd.DataFrame(instrucciones)
        df_instrucciones.to_excel(writer, sheet_name='Instrucciones', index=False)
        
        # Hoja 4: Códigos UBIGEO de referencia
        ubigeos_referencia = crear_ubigeos_referencia()
        df_ubigeos = pd.DataFrame(ubigeos_referencia)
        df_ubigeos.to_excel(writer, sheet_name='Codigos_UBIGEO', index=False)
    
    print(f"✅ Plantilla creada: {nombre_archivo}")
    
    # Mostrar resumen
    print(f"\n📋 Resumen de la plantilla:")
    print(f"   - Archivo: {nombre_archivo}")
    print(f"   - Hojas: 4 (Datos_Ejemplo, Plantilla_Vacia, Instrucciones, Codigos_UBIGEO)")
    print(f"   - Columnas: {len(columnas)}")
    print(f"   - Ejemplos: {len(datos_ejemplo)}")
    
    return nombre_archivo

def crear_instrucciones():
    """Crea las instrucciones para usar la plantilla"""
    
    return [
        {
            "Campo": "UBIGEO",
            "Descripción": "Código UBIGEO de 6 dígitos",
            "Obligatorio": "SÍ",
            "Formato": "6 dígitos numéricos",
            "Ejemplo": "150101"
        },
        {
            "Campo": "UBIGEO_E_IDENTIFICADOR_MCP", 
            "Descripción": "UBIGEO e Identificador MCP único",
            "Obligatorio": "SÍ",
            "Formato": "UBIGEO-MCP-XXX",
            "Ejemplo": "150101-MCP-001"
        },
        {
            "Campo": "DEPARTAMENTO",
            "Descripción": "Nombre del departamento",
            "Obligatorio": "SÍ", 
            "Formato": "Texto en mayúsculas",
            "Ejemplo": "LIMA"
        },
        {
            "Campo": "PROVINCIA",
            "Descripción": "Nombre de la provincia",
            "Obligatorio": "SÍ",
            "Formato": "Texto en mayúsculas", 
            "Ejemplo": "LIMA"
        },
        {
            "Campo": "DISTRITO",
            "Descripción": "Nombre del distrito",
            "Obligatorio": "SÍ",
            "Formato": "Texto en mayúsculas",
            "Ejemplo": "LIMA"
        },
        {
            "Campo": "MUNICIPALIDAD_CENTRO_POBLADO",
            "Descripción": "Nombre completo de la municipalidad",
            "Obligatorio": "SÍ",
            "Formato": "Texto descriptivo",
            "Ejemplo": "Municipalidad Metropolitana de Lima"
        },
        {
            "Campo": "DISPOSITIVO_LEGAL_CREACION",
            "Descripción": "Dispositivo legal de creación de la municipalidad",
            "Obligatorio": "NO",
            "Formato": "Texto descriptivo",
            "Ejemplo": "Ley N° 27972 - Ley Orgánica de Municipalidades"
        },
        {
            "Campo": "LATITUD",
            "Descripción": "Coordenada de latitud en grados decimales",
            "Obligatorio": "NO",
            "Formato": "Número decimal (-90 a 90)",
            "Ejemplo": "-12.0464"
        },
        {
            "Campo": "LONGITUD", 
            "Descripción": "Coordenada de longitud en grados decimales",
            "Obligatorio": "NO",
            "Formato": "Número decimal (-180 a 180)",
            "Ejemplo": "-77.0428"
        },
        {
            "Campo": "NOMBRE",
            "Descripción": "Nombre común de la localidad",
            "Obligatorio": "NO",
            "Formato": "Texto",
            "Ejemplo": "Lima"
        },
        {
            "Campo": "TIPO",
            "Descripción": "Tipo de localidad",
            "Obligatorio": "NO", 
            "Formato": "CIUDAD, PUEBLO, DISTRITO, PROVINCIA, DEPARTAMENTO, CENTRO_POBLADO",
            "Ejemplo": "CIUDAD"
        },
        {
            "Campo": "DESCRIPCION",
            "Descripción": "Descripción adicional de la localidad",
            "Obligatorio": "NO",
            "Formato": "Texto descriptivo",
            "Ejemplo": "Capital del Perú"
        },
        {
            "Campo": "OBSERVACIONES",
            "Descripción": "Observaciones adicionales",
            "Obligatorio": "NO",
            "Formato": "Texto libre",
            "Ejemplo": "Centro político y económico del país"
        },
        {
            "Campo": "ESTA_ACTIVA",
            "Descripción": "Estado de la localidad",
            "Obligatorio": "NO",
            "Formato": "TRUE o FALSE",
            "Ejemplo": "TRUE"
        }
    ]

def crear_ubigeos_referencia():
    """Crea una tabla de referencia de códigos UBIGEO por departamento"""
    
    return [
        {"Código": "01", "Departamento": "AMAZONAS"},
        {"Código": "02", "Departamento": "ANCASH"},
        {"Código": "03", "Departamento": "APURIMAC"},
        {"Código": "04", "Departamento": "AREQUIPA"},
        {"Código": "05", "Departamento": "AYACUCHO"},
        {"Código": "06", "Departamento": "CAJAMARCA"},
        {"Código": "07", "Departamento": "CALLAO"},
        {"Código": "08", "Departamento": "CUSCO"},
        {"Código": "09", "Departamento": "HUANCAVELICA"},
        {"Código": "10", "Departamento": "HUANUCO"},
        {"Código": "11", "Departamento": "ICA"},
        {"Código": "12", "Departamento": "JUNIN"},
        {"Código": "13", "Departamento": "LA LIBERTAD"},
        {"Código": "14", "Departamento": "LAMBAYEQUE"},
        {"Código": "15", "Departamento": "LIMA"},
        {"Código": "16", "Departamento": "LORETO"},
        {"Código": "17", "Departamento": "MADRE DE DIOS"},
        {"Código": "18", "Departamento": "MOQUEGUA"},
        {"Código": "19", "Departamento": "PASCO"},
        {"Código": "20", "Departamento": "PIURA"},
        {"Código": "21", "Departamento": "PUNO"},
        {"Código": "22", "Departamento": "SAN MARTIN"},
        {"Código": "23", "Departamento": "TACNA"},
        {"Código": "24", "Departamento": "TUMBES"},
        {"Código": "25", "Departamento": "UCAYALI"}
    ]

def main():
    """Función principal"""
    
    print("🚀 Generador de Plantilla de Localidades Mejorada")
    print("=" * 55)
    
    try:
        archivo_creado = crear_plantilla_localidades()
        
        print(f"\n✅ ¡Plantilla creada exitosamente!")
        print(f"\n📋 Campos incluidos:")
        print("   ✅ UBIGEO (obligatorio)")
        print("   ✅ UBIGEO e Identificador MCP (obligatorio)")
        print("   ✅ Departamento (obligatorio)")
        print("   ✅ Provincia (obligatorio)")
        print("   ✅ Distrito (obligatorio)")
        print("   ✅ Municipalidad de Centro Poblado (obligatorio)")
        print("   ✅ Dispositivo Legal de Creación (opcional)")
        print("   ✅ Coordenadas geográficas (opcional)")
        print("   ✅ Campos adicionales de compatibilidad")
        
        print(f"\n📁 Archivo generado: {archivo_creado}")
        print(f"📍 Ubicación: {os.path.abspath(archivo_creado)}")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error creando la plantilla: {str(e)}")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())