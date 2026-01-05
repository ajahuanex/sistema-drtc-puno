#!/usr/bin/env python3
"""
Script corregido para crear resoluciones de prueba
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

def crear_resolucion_completa(numero, empresa_id, tipo_tramite, estado="VIGENTE", resolucion_padre_id=None):
    """Crea una resolución con todos los campos requeridos"""
    fecha_emision = datetime.now()
    fecha_inicio = fecha_emision + timedelta(days=1)
    fecha_fin = fecha_inicio + timedelta(days=365 * random.randint(1, 3))
    
    tipo_resolucion = "PADRE" if tipo_tramite in ["AUTORIZACION_NUEVA", "RENOVACION"] else "HIJO"
    
    resolucion_data = {
        "nroResolucion": f"R-{numero.zfill(4)}-2025",
        "empresaId": empresa_id,
        "expedienteId": f"test_exp_{numero}",
        "fechaEmision": fecha_emision.isoformat(),
        "fechaVigenciaInicio": fecha_inicio.isoformat(),
        "fechaVigenciaFin": fecha_fin.isoformat(),
        "tipoResolucion": tipo_resolucion,
        "tipoTramite": tipo_tramite,
        "descripcion": f"Resolución de {tipo_tramite} para testing del módulo de resoluciones",
        "estado": estado,
        "estaActivo": True,
        "usuarioEmisionId": "admin_test",  # Campo requerido
        "vehiculosHabilitadosIds": [],
        "rutasAutorizadasIds": [],
        "resolucionesHijasIds": [],
        "observaciones": f"Resolución de prueba - {tipo_tramite} - {estado}"
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
            if response.text:
                error_detail = response.text[:200] + "..." if len(response.text) > 200 else response.text
                log(f"   Detalle: {error_detail}")
            return None
    except Exception as e:
        log(f"❌ Error: {str(e)}")
        return None

def main():
    log("🚀 CREANDO RESOLUCIONES DE PRUEBA PARA EL MÓDULO")
    log("=" * 55)
    
    # Obtener una empresa existente
    try:
        response = requests.get(f"{BASE_URL}/empresas", headers=HEADERS)
        if response.status_code == 200:
            empresas = response.json()
            if not empresas:
                log("❌ No hay empresas en el sistema")
                return
            empresa = empresas[0]  # Usar la primera empresa
            empresa_id = empresa["id"]
            empresa_nombre = empresa.get("razonSocial", {}).get("principal", "Sin nombre")
            log(f"📋 Usando empresa: {empresa_nombre[:50]}")
        else:
            log("❌ Error obteniendo empresas")
            return
    except Exception as e:
        log(f"❌ Error: {str(e)}")
        return
    
    resoluciones_creadas = []
    contador = 1
    
    # 1. Crear resolución PADRE - AUTORIZACION_NUEVA (VIGENTE)
    log(f"\n🔹 Creando resolución PADRE - AUTORIZACION_NUEVA")
    resolucion_padre = crear_resolucion_completa(
        str(contador), empresa_id, "AUTORIZACION_NUEVA", "VIGENTE"
    )
    if resolucion_padre:
        resoluciones_creadas.append(resolucion_padre)
        contador += 1
        
        # 2. Crear resolución HIJO - INCREMENTO
        log(f"🔹 Creando resolución HIJO - INCREMENTO")
        resolucion_hijo = crear_resolucion_completa(
            str(contador), empresa_id, "INCREMENTO", "VIGENTE", resolucion_padre["id"]
        )
        if resolucion_hijo:
            resoluciones_creadas.append(resolucion_hijo)
            contador += 1
    
    # 3. Crear resolución PADRE - RENOVACION
    log(f"🔹 Creando resolución PADRE - RENOVACION")
    resolucion_renovacion = crear_resolucion_completa(
        str(contador), empresa_id, "RENOVACION", "VIGENTE"
    )
    if resolucion_renovacion:
        resoluciones_creadas.append(resolucion_renovacion)
        contador += 1
    
    # 4. Crear resolución SUSPENDIDA
    log(f"🔹 Creando resolución SUSPENDIDA")
    resolucion_suspendida = crear_resolucion_completa(
        str(contador), empresa_id, "AUTORIZACION_NUEVA", "SUSPENDIDA"
    )
    if resolucion_suspendida:
        resoluciones_creadas.append(resolucion_suspendida)
        contador += 1
    
    # 5. Crear resolución con fecha vencida (para testing de validaciones)
    log(f"🔹 Creando resolución VENCIDA (para testing)")
    fecha_vencida = datetime.now() - timedelta(days=30)
    resolucion_data = {
        "nroResolucion": f"R-{str(contador).zfill(4)}-2025",
        "empresaId": empresa_id,
        "expedienteId": f"test_exp_{contador}",
        "fechaEmision": (fecha_vencida - timedelta(days=365)).isoformat(),
        "fechaVigenciaInicio": (fecha_vencida - timedelta(days=364)).isoformat(),
        "fechaVigenciaFin": fecha_vencida.isoformat(),  # Ya vencida
        "tipoResolucion": "PADRE",
        "tipoTramite": "AUTORIZACION_NUEVA",
        "descripcion": "Resolución vencida para testing de validaciones",
        "estado": "VIGENTE",  # Inconsistencia intencional para testing
        "estaActivo": True,
        "usuarioEmisionId": "admin_test",
        "vehiculosHabilitadosIds": [],
        "rutasAutorizadasIds": [],
        "resolucionesHijasIds": [],
        "observaciones": "Resolución vencida pero marcada como vigente (para testing de validaciones)"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/resoluciones", json=resolucion_data, headers=HEADERS)
        if response.status_code == 201:
            log(f"✅ Resolución VENCIDA creada: R-{str(contador).zfill(4)}-2025")
            resoluciones_creadas.append(response.json())
            contador += 1
    except Exception as e:
        log(f"❌ Error creando resolución vencida: {str(e)}")
    
    # 6. Crear resolución con formato de número incorrecto (para testing)
    log(f"🔹 Creando resolución con formato incorrecto")
    resolucion_formato_malo = {
        "nroResolucion": f"RES-{contador}-2025",  # Formato incorrecto intencional
        "empresaId": empresa_id,
        "expedienteId": f"test_exp_{contador}",
        "fechaEmision": datetime.now().isoformat(),
        "fechaVigenciaInicio": (datetime.now() + timedelta(days=1)).isoformat(),
        "fechaVigenciaFin": (datetime.now() + timedelta(days=366)).isoformat(),
        "tipoResolucion": "PADRE",
        "tipoTramite": "AUTORIZACION_NUEVA",
        "descripcion": "Resolución con formato de número incorrecto para testing",
        "estado": "VIGENTE",
        "estaActivo": True,
        "usuarioEmisionId": "admin_test",
        "vehiculosHabilitadosIds": [],
        "rutasAutorizadasIds": [],
        "resolucionesHijasIds": [],
        "observaciones": "Formato de número incorrecto para testing de validaciones"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/resoluciones", json=resolucion_formato_malo, headers=HEADERS)
        if response.status_code == 201:
            log(f"✅ Resolución con formato incorrecto creada: RES-{contador}-2025")
            resoluciones_creadas.append(response.json())
    except Exception as e:
        log(f"❌ Error creando resolución con formato incorrecto: {str(e)}")
    
    # Reporte final
    log("\n" + "=" * 55)
    log("📊 REPORTE FINAL DE CREACIÓN")
    log("=" * 55)
    log(f"Total de resoluciones creadas: {len(resoluciones_creadas)}")
    
    if resoluciones_creadas:
        log(f"\n📋 RESOLUCIONES CREADAS:")
        
        # Agrupar por tipo y estado
        tipos = {}
        estados = {}
        
        for resolucion in resoluciones_creadas:
            tipo = resolucion.get("tipoTramite", "N/A")
            estado = resolucion.get("estado", "N/A")
            numero = resolucion.get("nroResolucion", "N/A")
            tipo_res = resolucion.get("tipoResolucion", "N/A")
            
            tipos[tipo] = tipos.get(tipo, 0) + 1
            estados[estado] = estados.get(estado, 0) + 1
            
            log(f"  - {numero}: {tipo} ({tipo_res}, {estado})")
        
        log(f"\n📊 ESTADÍSTICAS:")
        log(f"   Por tipo de trámite: {dict(tipos)}")
        log(f"   Por estado: {dict(estados)}")
        
        log(f"\n✅ RESOLUCIONES CREADAS EXITOSAMENTE")
        log(f"🧪 Ejecute ahora: python test_mejoras_resoluciones.py")
        log(f"🎯 O abra el frontend en: http://localhost:4200/resoluciones")
        
    else:
        log(f"\n❌ NO SE PUDIERON CREAR RESOLUCIONES")
        log(f"   Verifique que el backend esté funcionando correctamente")

if __name__ == "__main__":
    main()