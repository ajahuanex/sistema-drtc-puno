#!/usr/bin/env python3
"""
Script para crear datos de prueba para el módulo de resoluciones
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any
import random

# Configuración
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

class CreadorDatosPrueba:
    def __init__(self):
        self.empresas_creadas = []
        self.expedientes_creados = []
        self.resoluciones_creadas = []
        
    def log(self, mensaje: str):
        """Log con timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {mensaje}")
    
    def crear_empresa_prueba(self, ruc: str, razon_social: str) -> Dict:
        """Crea una empresa de prueba"""
        empresa_data = {
            "ruc": ruc,
            "razonSocial": {
                "principal": razon_social,
                "comercial": razon_social,
                "minimo": razon_social[:50]
            },
            "tipoEmpresa": "JURIDICA",
            "estado": "HABILITADA",
            "direccion": {
                "direccion": "Av. Ejemplo 123",
                "distrito": "Puno",
                "provincia": "Puno",
                "departamento": "Puno"
            },
            "contacto": {
                "telefono": ["051-123456"],
                "email": ["contacto@ejemplo.com"],
                "web": "www.ejemplo.com"
            },
            "representanteLegal": {
                "nombres": "Juan",
                "apellidos": "Pérez García",
                "dni": "12345678",
                "cargo": "Gerente General"
            },
            "fechaConstitucion": "2020-01-01",
            "capitalSocial": 100000.0,
            "actividadEconomica": "Transporte de pasajeros",
            "observaciones": "Empresa de prueba para testing"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/empresas", json=empresa_data, headers=HEADERS)
            if response.status_code == 201:
                empresa = response.json()
                self.empresas_creadas.append(empresa)
                self.log(f"✅ Empresa creada: {razon_social} (ID: {empresa['id']})")
                return empresa
            else:
                self.log(f"❌ Error creando empresa {razon_social}: {response.status_code}")
                return None
        except Exception as e:
            self.log(f"❌ Error creando empresa {razon_social}: {str(e)}")
            return None
    
    def crear_expediente_prueba(self, empresa_id: str, numero: str, tipo_tramite: str) -> Dict:
        """Crea un expediente de prueba"""
        expediente_data = {
            "nroExpediente": f"E-{numero}-2025",
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
                self.expedientes_creados.append(expediente)
                self.log(f"✅ Expediente creado: E-{numero}-2025 ({tipo_tramite})")
                return expediente
            else:
                self.log(f"❌ Error creando expediente E-{numero}-2025: {response.status_code}")
                return None
        except Exception as e:
            self.log(f"❌ Error creando expediente E-{numero}-2025: {str(e)}")
            return None
    
    def crear_resolucion_prueba(self, numero: str, empresa_id: str, expediente_id: str, 
                               tipo_tramite: str, resolucion_padre_id: str = None) -> Dict:
        """Crea una resolución de prueba"""
        fecha_emision = datetime.now()
        fecha_inicio = fecha_emision + timedelta(days=1)
        fecha_fin = fecha_inicio + timedelta(days=365 * random.randint(1, 5))  # 1-5 años
        
        # Determinar tipo de resolución
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
            "descripcion": f"Resolución de {tipo_tramite} para empresa de prueba",
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
                self.resoluciones_creadas.append(resolucion)
                self.log(f"✅ Resolución creada: R-{numero.zfill(4)}-2025 ({tipo_tramite})")
                return resolucion
            else:
                self.log(f"❌ Error creando resolución R-{numero.zfill(4)}-2025: {response.status_code}")
                if response.text:
                    self.log(f"   Detalle: {response.text}")
                return None
        except Exception as e:
            self.log(f"❌ Error creando resolución R-{numero.zfill(4)}-2025: {str(e)}")
            return None
    
    def crear_conjunto_datos_completo(self):
        """Crea un conjunto completo de datos de prueba"""
        self.log("🚀 INICIANDO CREACIÓN DE DATOS DE PRUEBA")
        self.log("=" * 50)
        
        # 1. Crear empresas de prueba
        self.log("📋 Creando empresas de prueba...")
        empresas_data = [
            ("20123456789", "TRANSPORTES PUNO S.A.C."),
            ("20987654321", "EMPRESA DE TRANSPORTE TITICACA LTDA."),
            ("20456789123", "SERVICIOS TURÍSTICOS ALTIPLANO S.R.L."),
            ("20789123456", "TRANSPORTE INTERPROVINCIAL DEL SUR S.A."),
            ("20321654987", "COOPERATIVA DE TRANSPORTE UNION")
        ]
        
        for ruc, razon_social in empresas_data:
            self.crear_empresa_prueba(ruc, razon_social)
        
        if not self.empresas_creadas:
            self.log("❌ No se pudieron crear empresas. Abortando.")
            return False
        
        # 2. Crear expedientes y resoluciones
        self.log("\n📄 Creando expedientes y resoluciones...")
        
        contador_resolucion = 1
        
        for i, empresa in enumerate(self.empresas_creadas):
            empresa_id = empresa["id"]
            
            # Crear resolución PADRE (AUTORIZACION_NUEVA)
            expediente_padre = self.crear_expediente_prueba(
                empresa_id, 
                str(contador_resolucion).zfill(4), 
                "AUTORIZACION_NUEVA"
            )
            
            if expediente_padre:
                resolucion_padre = self.crear_resolucion_prueba(
                    str(contador_resolucion),
                    empresa_id,
                    expediente_padre["id"],
                    "AUTORIZACION_NUEVA"
                )
                contador_resolucion += 1
                
                # Crear algunas resoluciones HIJO para esta empresa
                if resolucion_padre and i < 3:  # Solo para las primeras 3 empresas
                    # Resolución INCREMENTO
                    expediente_incremento = self.crear_expediente_prueba(
                        empresa_id,
                        str(contador_resolucion).zfill(4),
                        "INCREMENTO"
                    )
                    
                    if expediente_incremento:
                        self.crear_resolucion_prueba(
                            str(contador_resolucion),
                            empresa_id,
                            expediente_incremento["id"],
                            "INCREMENTO",
                            resolucion_padre["id"]
                        )
                        contador_resolucion += 1
                    
                    # Resolución RENOVACION (también PADRE)
                    if i < 2:  # Solo para las primeras 2 empresas
                        expediente_renovacion = self.crear_expediente_prueba(
                            empresa_id,
                            str(contador_resolucion).zfill(4),
                            "RENOVACION"
                        )
                        
                        if expediente_renovacion:
                            self.crear_resolucion_prueba(
                                str(contador_resolucion),
                                empresa_id,
                                expediente_renovacion["id"],
                                "RENOVACION"
                            )
                            contador_resolucion += 1
        
        # 3. Crear algunas resoluciones con estados diferentes
        self.log("\n🔄 Creando resoluciones con estados variados...")
        
        if len(self.empresas_creadas) >= 2:
            empresa_id = self.empresas_creadas[1]["id"]
            
            # Resolución SUSPENDIDA
            expediente_suspendida = self.crear_expediente_prueba(
                empresa_id,
                str(contador_resolucion).zfill(4),
                "AUTORIZACION_NUEVA"
            )
            
            if expediente_suspendida:
                resolucion_data = {
                    "nroResolucion": f"R-{str(contador_resolucion).zfill(4)}-2025",
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
                        self.log(f"✅ Resolución SUSPENDIDA creada: R-{str(contador_resolucion).zfill(4)}-2025")
                        contador_resolucion += 1
                except Exception as e:
                    self.log(f"❌ Error creando resolución suspendida: {str(e)}")
        
        return True
    
    def generar_reporte_final(self):
        """Genera un reporte final de los datos creados"""
        self.log("\n" + "=" * 50)
        self.log("📊 REPORTE FINAL DE CREACIÓN DE DATOS")
        self.log("=" * 50)
        
        self.log(f"Empresas creadas: {len(self.empresas_creadas)}")
        self.log(f"Expedientes creados: {len(self.expedientes_creados)}")
        self.log(f"Resoluciones creadas: {len(self.resoluciones_creadas)}")
        
        if self.resoluciones_creadas:
            self.log("\n📋 RESOLUCIONES CREADAS:")
            for resolucion in self.resoluciones_creadas:
                tipo = resolucion.get("tipoTramite", "N/A")
                estado = resolucion.get("estado", "N/A")
                numero = resolucion.get("nroResolucion", "N/A")
                self.log(f"  - {numero}: {tipo} ({estado})")
        
        # Guardar reporte
        reporte = {
            "timestamp": datetime.now().isoformat(),
            "resumen": {
                "empresas": len(self.empresas_creadas),
                "expedientes": len(self.expedientes_creados),
                "resoluciones": len(self.resoluciones_creadas)
            },
            "empresas_creadas": self.empresas_creadas,
            "expedientes_creados": self.expedientes_creados,
            "resoluciones_creadas": self.resoluciones_creadas
        }
        
        filename = f"datos_prueba_resoluciones_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(reporte, f, indent=2, ensure_ascii=False)
        
        self.log(f"\n📄 Reporte guardado en: {filename}")
        
        return len(self.resoluciones_creadas) > 0

def main():
    """Función principal"""
    print("🏗️ CREADOR DE DATOS DE PRUEBA - MÓDULO DE RESOLUCIONES")
    print("Creando datos de prueba para testing...")
    print()
    
    creador = CreadorDatosPrueba()
    
    try:
        # Verificar que el backend esté disponible
        response = requests.get(f"{BASE_URL}/resoluciones/test", headers=HEADERS, timeout=5)
        if response.status_code != 200:
            print("❌ Backend no disponible. Verifique que el servidor esté ejecutándose.")
            sys.exit(1)
        
        # Crear datos de prueba
        exito = creador.crear_conjunto_datos_completo()
        
        # Generar reporte
        creador.generar_reporte_final()
        
        if exito:
            print("\n✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE")
            print("Ahora puede ejecutar las pruebas del módulo de resoluciones.")
        else:
            print("\n❌ ERROR AL CREAR DATOS DE PRUEBA")
            sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Creación interrumpida por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error inesperado: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()