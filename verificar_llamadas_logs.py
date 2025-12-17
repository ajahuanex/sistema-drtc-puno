#!/usr/bin/env python3
"""
Script para verificar las llamadas específicas que aparecen en los logs
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def verificar_llamadas_logs():
    """Verificar las llamadas específicas de los logs"""
    print("🔍 VERIFICANDO LLAMADAS DE LOS LOGS")
    print("=" * 60)
    
    # Datos de los logs
    empresa_id = "694186fec6302fb8566ba09e"
    resoluciones_ids = [
        "ed6b078b-e4aa-4966-8b35-ca9798e4914c",
        "824108dd-39b3-4fb7-829a-0bec681131f8"
    ]
    
    try:
        print(f"\n1️⃣ INFORMACIÓN DE LA EMPRESA:")
        print(f"   Empresa ID: {empresa_id}")
        
        # Obtener información de la empresa
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}")
        if response.status_code == 200:
            empresa = response.json()
            ruc = empresa.get('ruc', 'Sin RUC')
            razon_social = empresa.get('razonSocial', {}).get('principal', 'Sin razón social')
            print(f"   ✅ Empresa: {ruc} - {razon_social}")
        else:
            print(f"   ❌ Error obteniendo empresa: {response.status_code}")
            return False
        
        # Verificar rutas totales de la empresa
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        if response.status_code == 200:
            rutas_empresa = response.json()
            print(f"   ✅ Total rutas de empresa: {len(rutas_empresa)}")
            
            # Mostrar distribución por resolución
            resoluciones_count = {}
            for ruta in rutas_empresa:
                res_id = ruta.get('resolucionId')
                if res_id:
                    resoluciones_count[res_id] = resoluciones_count.get(res_id, 0) + 1
            
            print(f"   📊 Distribución por resolución:")
            for res_id, count in resoluciones_count.items():
                print(f"      - {res_id[:8]}...: {count} ruta(s)")
        else:
            print(f"   ❌ Error obteniendo rutas: {response.status_code}")
        
        print(f"\n2️⃣ VERIFICANDO LLAMADAS ESPECÍFICAS DE LOS LOGS:")
        
        for i, resolucion_id in enumerate(resoluciones_ids, 1):
            print(f"\n   {i}. Resolución ID: {resolucion_id}")
            
            # Obtener información de la resolución
            response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
            if response.status_code == 200:
                resolucion = response.json()
                numero = resolucion.get('nroResolucion', 'Sin número')
                tipo_tramite = resolucion.get('tipoTramite', 'Sin tipo')
                print(f"      Resolución: {numero} ({tipo_tramite})")
            else:
                print(f"      ❌ Error obteniendo resolución: {response.status_code}")
                continue
            
            # Probar la llamada exacta de los logs
            endpoint_url = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
            print(f"      URL: {endpoint_url}")
            
            response = requests.get(endpoint_url)
            print(f"      Status: {response.status_code}")
            
            if response.status_code == 200:
                rutas = response.json()
                print(f"      ✅ Rutas devueltas: {len(rutas)}")
                
                if len(rutas) > 0:
                    print(f"      📋 DETALLES DE LAS RUTAS:")
                    for j, ruta in enumerate(rutas, 1):
                        codigo = ruta.get('codigoRuta', 'N/A')
                        nombre = ruta.get('nombre', 'Sin nombre')
                        origen = ruta.get('origen', ruta.get('origenId', 'N/A'))
                        destino = ruta.get('destino', ruta.get('destinoId', 'N/A'))
                        estado = ruta.get('estado', 'N/A')
                        
                        print(f"         {j}. [{codigo}] {origen} → {destino}")
                        print(f"            Nombre: {nombre}")
                        print(f"            Estado: {estado}")
                        print(f"            EmpresaId: {ruta.get('empresaId', 'N/A')}")
                        print(f"            ResolucionId: {ruta.get('resolucionId', 'N/A')}")
                else:
                    print(f"      ⚠️ El endpoint devuelve array vacío")
                    print(f"      ❓ Esto explica por qué el frontend muestra 0 rutas")
            else:
                print(f"      ❌ Error: {response.text}")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def diagnosticar_problema_frontend():
    """Diagnosticar el problema del frontend"""
    print(f"\n" + "=" * 60)
    print("🔍 DIAGNÓSTICO DEL PROBLEMA FRONTEND")
    print("=" * 60)
    
    print(f"\n📊 ANÁLISIS DE LOS LOGS:")
    print(f"   - Backend recibe las llamadas: ✅")
    print(f"   - Backend devuelve 200 OK: ✅")
    print(f"   - Frontend no muestra datos: ❌")
    
    print(f"\n🔍 POSIBLES CAUSAS:")
    print(f"   1. El backend devuelve array vacío (rutas = [])")
    print(f"   2. Error en el procesamiento del frontend")
    print(f"   3. Problema en la actualización del signal rutas")
    print(f"   4. Error en la lógica de filtrado")
    
    print(f"\n🔧 PASOS PARA RESOLVER:")
    print(f"   1. Verificar qué devuelve exactamente el backend")
    print(f"   2. Revisar los console.log del frontend")
    print(f"   3. Verificar que el signal rutas se actualice")
    print(f"   4. Comprobar la lógica de renderizado")

if __name__ == "__main__":
    print("🚀 INICIANDO VERIFICACIÓN DE LLAMADAS DE LOGS")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    resultado = verificar_llamadas_logs()
    diagnosticar_problema_frontend()
    
    print(f"\n" + "=" * 60)
    print("🏁 CONCLUSIÓN")
    print("=" * 60)
    
    if resultado:
        print("✅ VERIFICACIÓN COMPLETADA")
        print("🔍 REVISAR LOS RESULTADOS PARA IDENTIFICAR EL PROBLEMA")
    else:
        print("❌ ERROR EN LA VERIFICACIÓN")
    
    print(f"\n💡 SIGUIENTE PASO:")
    print(f"   Revisar los console.log del navegador para ver")
    print(f"   qué está recibiendo exactamente el frontend")