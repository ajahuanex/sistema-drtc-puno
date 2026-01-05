#!/usr/bin/env python3
"""
Script para crear resoluciones usando empresas existentes
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import random

BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json", "Accept": "application/json"}

def log(mensaje):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {mensaje}")

def obtener_empresas():
    """Obtiene las empresas existentes"""
    try:
        response = requests.get(f"{BASE_URL}/empresas", headers=HEADERS)
        if response.status_code == 200:
            empresas = response.json()
            log(f"✅ Obtenidas {len(empresas)} empresas existentes")
            return empresas[:5]  # Usar solo las primeras 5
        else:
            log(f"❌ Error obteniendo empresas: {response.status_code}")
            return []
    except Exception as e:
        log(f"❌ Error: {str(e)}")
        return []

def crear_expediente(empresa_id, numero, tipo_tramite):
    """Crea un expediente"""
    expediente_data = {
        "nroExpediente": f"E-{numero.zfill(4)}-2025",
        "folio": random.randint(1, 1000),
        "fechaEmision": datetime.now().isoformat(),
        "tipoTramite": tipo_tramite,
        "empresaId": empresa_id,
        "descripcion": f"Expediente de prueba para {tipo_tramite}",
        "observaciones": "Expediente creado para testing"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/expedientes", json=expediente_data, headers=HEADERS)
        if response.status_code == 201:
            expediente = response.json()
            log(f"✅ Expediente creado: E-{numero.zfill(4)}-2025")
            return expediente
        else:
            log(f"❌ Error creando expediente: {response.status_code}")
            return None
    except Exception as e:
        log(f"❌ Error: {str(e)}")
        return None

def crear_resolucion(numero, empresa_id, expediente_id, tipo_tramite, resolucion_padre_id=None):
    """Crea una resolución"""
    fecha_emision = datetime.now()
    fecha_inicio = fecha_emision + timedelta(days=1)
    fecha_fin = fecha_inicio + timedelta(days=365 * random.randint(1, 3))
    
    tipo_resolucion = "PADRE" if tipo_tramite in ["AUTORIZACION_NUEVA", "RENOVACION"] else "HIJO"
    
    resolucion_data = {
        "nroResolucion": f"R-{numero.zfill(4)}-2025",
        "empresaId": empresa_id,
        "expedienteId": expediente_id,
        "fechaEmision": fecha_emision.isoformat(),
        "fechaVigenciaInicio": fecha_inicio.isoformat(),
        "fechaVigenciaFin": fecha_fin.isoformat(),
        "tipoResolucion": tipo_resolucion,
        "tipoTramite": tipo_tramite,
        "descripcion": f"Resolución de {tipo_tramite} para testing",
        "estado": "VIGENTE",
        "estaActivo": True,
        "vehiculosHabilitadosIds": [],
        "rutasAutorizadasIds": [],
        "resolucionesHijasIds": [],
        "observaciones": "Resolución creada para testing"
    }
    
    if resolucion_padre_id:
        resolucion_data["resolucionPadreId"] = resolucion_padre_id
    
    try:
        response = requests.post(f"{BASE_URL}/resoluciones", json=resolucion_data, headers=HEADERS)
        if response.status_code == 201:
            resolucion = response.json()
            log(f"✅ Resolución creada: R-{numero.zfill(4)}-2025 ({tipo_tramite})")
            return resolucion
        else:
            log(f"❌ Error creando resolución: {response.status_code}")
            if response.text:
                log(f"   Detalle: {response.text}")
            return None
    except Exception as e:
        log(f"❌ Error: {str(e)}")
        return None

def main():
    log("🚀 CREANDO RESOLUCIONES CON EMPRESAS EXISTENTES")
    log("=" * 50)
    
    # Obtener empresas
    empresas = obtener_empresas()
    if not empresas:
        log("❌ No hay empresas disponibles")
        return
    
    resoluciones_creadas = []
    contador = 1
    
    # Crear resoluciones para cada empresa
    for i, empresa in enumerate(empresas):
        empresa_id = empresa["id"]
        empresa_nombre = empresa.get("razonSocial", {}).get("principal", "Sin nombre")
        
        log(f"\n📋 Procesando empresa: {empresa_nombre}")
        
        # Crear resolución PADRE (AUTORIZACION_NUEVA)
        expediente = crear_expediente(empresa_id, str(contador), "AUTORIZACION_NUEVA")
        if expediente:
            resolucion_padre = crear_resolucion(
                str(contador), empresa_id, expediente["id"], "AUTORIZACION_NUEVA"
            )
            if resolucion_padre:
                resoluciones_creadas.append(resolucion_padre)
                contador += 1
                
                # Crear resolución HIJO (INCREMENTO) para algunas empresas
                if i < 3:  # Solo para las primeras 3 empresas
                    expediente_hijo = crear_expediente(empresa_id, str(contador), "INCREMENTO")
                    if expediente_hijo:
                        resolucion_hijo = crear_resolucion(
                            str(contador), empresa_id, expediente_hijo["id"], 
                            "INCREMENTO", resolucion_padre["id"]
                        )
                        if resolucion_hijo:
                            resoluciones_creadas.append(resolucion_hijo)
                            contador += 1
        
        # Crear resolución RENOVACION para algunas empresas
        if i < 2:  # Solo para las primeras 2 empresas
            expediente_renovacion = crear_expediente(empresa_id, str(contador), "RENOVACION")
            if expediente_renovacion:
                resolucion_renovacion = crear_resolucion(
                    str(contador), empresa_id, expediente_renovacion["id"], "RENOVACION"
                )
                if resolucion_renovacion:
                    resoluciones_creadas.append(resolucion_renovacion)
                    contador += 1
    
    # Crear una resolución SUSPENDIDA
    if empresas:
        empresa_id = empresas[0]["id"]
        expediente_suspendida = crear_expediente(empresa_id, str(contador), "AUTORIZACION_NUEVA")
        if expediente_suspendida:
            # Crear resolución suspendida manualmente
            resolucion_data = {
                "nroResolucion": f"R-{str(contador).zfill(4)}-2025",
                "empresaId": empresa_id,
                "expedienteId": expediente_suspendida["id"],
                "fechaEmision": (datetime.now() - timedelta(days=30)).isoformat(),
                "fechaVigenciaInicio": (datetime.now() - timedelta(days=29)).isoformat(),
                "fechaVigenciaFin": (datetime.now() + timedelta(days=335)).isoformat(),
                "tipoResolucion": "PADRE",
                "tipoTramite": "AUTORIZACION_NUEVA",
                "descripcion": "Resolución suspendida para pruebas",
                "estado": "SUSPENDIDA",
                "estaActivo": True,
                "vehiculosHabilitadosIds": [],
                "rutasAutorizadasIds": [],
                "resolucionesHijasIds": [],
                "observaciones": "Resolución suspendida para testing"
            }
            
            try:
                response = requests.post(f"{BASE_URL}/resoluciones", json=resolucion_data, headers=HEADERS)
                if response.status_code == 201:
                    log(f"✅ Resolución SUSPENDIDA creada: R-{str(contador).zfill(4)}-2025")
                    resoluciones_creadas.append(response.json())
            except Exception as e:
                log(f"❌ Error creando resolución suspendida: {str(e)}")
    
    # Reporte final
    log("\n" + "=" * 50)
    log("📊 REPORTE FINAL")
    log("=" * 50)
    log(f"Resoluciones creadas: {len(resoluciones_creadas)}")
    
    for resolucion in resoluciones_creadas:
        numero = resolucion.get("nroResolucion", "N/A")
        tipo = resolucion.get("tipoTramite", "N/A")
        estado = resolucion.get("estado", "N/A")
        log(f"  - {numero}: {tipo} ({estado})")
    
    if resoluciones_creadas:
        log("\n✅ RESOLUCIONES CREADAS EXITOSAMENTE")
        log("Ahora puede ejecutar las pruebas del módulo.")
    else:
        log("\n❌ NO SE CREARON RESOLUCIONES")

if __name__ == "__main__":
    main()