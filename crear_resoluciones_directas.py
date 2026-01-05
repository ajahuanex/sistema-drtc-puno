#!/usr/bin/env python3
"""
Script para crear resoluciones directamente para testing del módulo
"""

import requests
import json
from datetime import datetime, timedelta
import random

BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json", "Accept": "application/json"}

def log(mensaje):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {mensaje}")

def obtener_empresas():
    """Obtiene empresas existentes"""
    try:
        response = requests.get(f"{BASE_URL}/empresas", headers=HEADERS)
        if response.status_code == 200:
            empresas = response.json()
            return empresas[:3]  # Solo las primeras 3
        return []
    except:
        return []

def crear_resolucion_directa(numero, empresa_id, tipo_tramite, estado="VIGENTE", resolucion_padre_id=None):
    """Crea una resolución directamente"""
    fecha_emision = datetime.now()
    fecha_inicio = fecha_emision + timedelta(days=1)
    fecha_fin = fecha_inicio + timedelta(days=365 * random.randint(1, 3))
    
    tipo_resolucion = "PADRE" if tipo_tramite in ["AUTORIZACION_NUEVA", "RENOVACION"] else "HIJO"
    
    resolucion_data = {
        "nroResolucion": f"R-{numero.zfill(4)}-2025",
        "empresaId": empresa_id,
        "expedienteId": f"exp_{numero}",  # ID ficticio
        "fechaEmision": fecha_emision.isoformat(),
        "fechaVigenciaInicio": fecha_inicio.isoformat(),
        "fechaVigenciaFin": fecha_fin.isoformat(),
        "tipoResolucion": tipo_resolucion,
        "tipoTramite": tipo_tramite,
        "descripcion": f"Resolución de {tipo_tramite} para testing del módulo",
        "estado": estado,
        "estaActivo": True,
        "vehiculosHabilitadosIds": [],
        "rutasAutorizadasIds": [],
        "resolucionesHijasIds": [],
        "observaciones": f"Resolución de prueba - {tipo_tramite}"
    }
    
    if resolucion_padre_id:
        resolucion_data["resolucionPadreId"] = resolucion_padre_id
    
    try:
        response = requests.post(f"{BASE_URL}/resoluciones", json=resolucion_data, headers=HEADERS)
        if response.status_code == 201:
            resolucion = response.json()
            log(f"✅ Resolución creada: R-{numero.zfill(4)}-2025 ({tipo_tramite}, {estado})")
            return resolucion
        else:
            log(f"❌ Error creando resolución R-{numero.zfill(4)}-2025: {response.status_code}")
            return None
    except Exception as e:
        log(f"❌ Error: {str(e)}")
        return None

def main():
    log("🚀 CREANDO RESOLUCIONES PARA TESTING DEL MÓDULO")
    log("=" * 50)
    
    # Obtener empresas
    empresas = obtener_empresas()
    if not empresas:
        log("❌ No hay empresas disponibles")
        return
    
    resoluciones_creadas = []
    contador = 1
    
    # Crear diferentes tipos de resoluciones
    for i, empresa in enumerate(empresas):
        empresa_id = empresa["id"]
        empresa_nombre = empresa.get("razonSocial", {}).get("principal", "Sin nombre")[:50]
        
        log(f"\n📋 Empresa: {empresa_nombre}")
        
        # 1. Resolución PADRE - AUTORIZACION_NUEVA (VIGENTE)
        resolucion_padre = crear_resolucion_directa(
            str(contador), empresa_id, "AUTORIZACION_NUEVA", "VIGENTE"
        )
        if resolucion_padre:
            resoluciones_creadas.append(resolucion_padre)
            contador += 1
            
            # 2. Resolución HIJO - INCREMENTO
            resolucion_hijo = crear_resolucion_directa(
                str(contador), empresa_id, "INCREMENTO", "VIGENTE", resolucion_padre["id"]
            )
            if resolucion_hijo:
                resoluciones_creadas.append(resolucion_hijo)
                contador += 1
        
        # 3. Resolución PADRE - RENOVACION (solo para primera empresa)
        if i == 0:
            resolucion_renovacion = crear_resolucion_directa(
                str(contador), empresa_id, "RENOVACION", "VIGENTE"
            )
            if resolucion_renovacion:
                resoluciones_creadas.append(resolucion_renovacion)
                contador += 1
    
    # Crear resoluciones con diferentes estados
    if empresas:
        empresa_id = empresas[0]["id"]
        
        # Resolución SUSPENDIDA
        resolucion_suspendida = crear_resolucion_directa(
            str(contador), empresa_id, "AUTORIZACION_NUEVA", "SUSPENDIDA"
        )
        if resolucion_suspendida:
            resoluciones_creadas.append(resolucion_suspendida)
            contador += 1
        
        # Resolución con fecha vencida pero estado VIGENTE (para testing de validaciones)
        fecha_vencida = datetime.now() - timedelta(days=30)
        resolucion_data = {
            "nroResolucion": f"R-{str(contador).zfill(4)}-2025",
            "empresaId": empresa_id,
            "expedienteId": f"exp_{contador}",
            "fechaEmision": (fecha_vencida - timedelta(days=365)).isoformat(),
            "fechaVigenciaInicio": (fecha_vencida - timedelta(days=364)).isoformat(),
            "fechaVigenciaFin": fecha_vencida.isoformat(),  # Ya vencida
            "tipoResolucion": "PADRE",
            "tipoTramite": "AUTORIZACION_NUEVA",
            "descripcion": "Resolución vencida para testing de validaciones",
            "estado": "VIGENTE",  # Inconsistencia intencional
            "estaActivo": True,
            "vehiculosHabilitadosIds": [],
            "rutasAutorizadasIds": [],
            "resolucionesHijasIds": [],
            "observaciones": "Resolución vencida pero marcada como vigente (para testing)"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/resoluciones", json=resolucion_data, headers=HEADERS)
            if response.status_code == 201:
                log(f"✅ Resolución VENCIDA creada: R-{str(contador).zfill(4)}-2025 (para testing)")
                resoluciones_creadas.append(response.json())
                contador += 1
        except:
            pass
    
    # Reporte final
    log("\n" + "=" * 50)
    log("📊 REPORTE FINAL")
    log("=" * 50)
    log(f"Resoluciones creadas: {len(resoluciones_creadas)}")
    
    # Agrupar por tipo y estado
    tipos = {}
    estados = {}
    
    for resolucion in resoluciones_creadas:
        tipo = resolucion.get("tipoTramite", "N/A")
        estado = resolucion.get("estado", "N/A")
        numero = resolucion.get("nroResolucion", "N/A")
        
        tipos[tipo] = tipos.get(tipo, 0) + 1
        estados[estado] = estados.get(estado, 0) + 1
        
        log(f"  - {numero}: {tipo} ({estado})")
    
    log(f"\n📊 Por tipo: {tipos}")
    log(f"📊 Por estado: {estados}")
    
    if resoluciones_creadas:
        log("\n✅ RESOLUCIONES CREADAS EXITOSAMENTE")
        log("🧪 Ahora puede ejecutar: python test_mejoras_resoluciones.py")
    else:
        log("\n❌ NO SE CREARON RESOLUCIONES")

if __name__ == "__main__":
    main()