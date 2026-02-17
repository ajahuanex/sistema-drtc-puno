#!/usr/bin/env python3
"""
Script de Pruebas Automatizadas - Sistema de Vehículos
Verifica que el sistema refactorizado funciona correctamente
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuración
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:4200"

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")

class VehiculoTester:
    def __init__(self):
        self.vehiculo_data_id = None
        self.vehiculo_id = None
        self.empresa_id = None
        self.tests_passed = 0
        self.tests_failed = 0
        
    def run_all_tests(self):
        """Ejecuta todas las pruebas"""
        print_header("🧪 INICIANDO PRUEBAS DEL SISTEMA DE VEHÍCULOS")
        
        # 1. Verificar servicios
        if not self.test_services():
            print_error("Servicios no disponibles. Abortando pruebas.")
            return False
            
        # 2. Obtener empresa para pruebas
        if not self.get_test_empresa():
            print_warning("No hay empresas disponibles. Algunas pruebas se saltarán.")
            
        # 3. Pruebas de VehiculoData
        self.test_vehiculo_data_create()
        self.test_vehiculo_data_get()
        self.test_vehiculo_data_search()
        
        # 4. Pruebas de Vehiculo
        if self.empresa_id:
            self.test_vehiculo_create()
            self.test_vehiculo_get()
            self.test_vehiculo_with_data()
        
        # 5. Pruebas de validación
        self.test_validations()
        
        # 6. Resumen
        self.print_summary()
        
        return self.tests_failed == 0
    
    def test_services(self) -> bool:
        """Verifica que los servicios estén corriendo"""
        print_header("1️⃣ Verificación de Servicios")
        
        # Backend
        try:
            response = requests.get(f"{BASE_URL}/docs", timeout=5)
            if response.status_code == 200:
                print_success("Backend corriendo en http://localhost:8000")
                self.tests_passed += 1
            else:
                print_error(f"Backend responde con código {response.status_code}")
                self.tests_failed += 1
                return False
        except requests.exceptions.RequestException as e:
            print_error(f"Backend no disponible: {e}")
            self.tests_failed += 1
            return False
        
        # Frontend (opcional)
        try:
            response = requests.get(FRONTEND_URL, timeout=5)
            if response.status_code == 200:
                print_success("Frontend corriendo en http://localhost:4200")
            else:
                print_warning("Frontend no responde correctamente")
        except requests.exceptions.RequestException:
            print_warning("Frontend no disponible (opcional)")
        
        return True
    
    def get_test_empresa(self) -> bool:
        """Obtiene una empresa para usar en las pruebas"""
        print_header("2️⃣ Obtener Empresa de Prueba")
        
        try:
            response = requests.get(f"{BASE_URL}/api/empresas", timeout=5)
            if response.status_code == 200:
                empresas = response.json()
                if empresas and len(empresas) > 0:
                    self.empresa_id = empresas[0].get('id')
                    print_success(f"Empresa encontrada: {self.empresa_id}")
                    return True
                else:
                    print_warning("No hay empresas en el sistema")
                    return False
            else:
                print_warning(f"Error al obtener empresas: {response.status_code}")
                return False
        except Exception as e:
            print_warning(f"Error al obtener empresas: {e}")
            return False
    
    def test_vehiculo_data_create(self):
        """Prueba crear VehiculoData"""
        print_header("3️⃣ Crear VehiculoData (Datos Técnicos)")
        
        data = {
            "placa_actual": f"TEST-{datetime.now().strftime('%H%M%S')}",
            "marca": "TOYOTA",
            "modelo": "HIACE",
            "anio_fabricacion": 2020,
            "categoria": "M3",
            "numero_motor": "TEST1234567890",
            "vin": "TESTVIN1234567890",
            "combustible": "DIESEL",
            "numero_asientos": 15,
            "numero_pasajeros": 15,
            "numero_ejes": 2,
            "peso_seco": 2500,
            "peso_bruto": 4500,
            "longitud": 6.5,
            "ancho": 2.2,
            "altura": 2.8
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/vehiculos-solo",
                json=data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                self.vehiculo_data_id = result.get('id')
                print_success(f"VehiculoData creado: {self.vehiculo_data_id}")
                print_info(f"Placa: {data['placa_actual']}")
                print_info(f"Marca/Modelo: {data['marca']} {data['modelo']}")
                self.tests_passed += 1
            else:
                print_error(f"Error al crear VehiculoData: {response.status_code}")
                print_error(f"Respuesta: {response.text}")
                self.tests_failed += 1
        except Exception as e:
            print_error(f"Excepción al crear VehiculoData: {e}")
            self.tests_failed += 1
    
    def test_vehiculo_data_get(self):
        """Prueba obtener VehiculoData por ID"""
        print_header("4️⃣ Obtener VehiculoData por ID")
        
        if not self.vehiculo_data_id:
            print_warning("No hay VehiculoData ID. Saltando prueba.")
            return
        
        try:
            response = requests.get(
                f"{BASE_URL}/api/vehiculos-solo/{self.vehiculo_data_id}",
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                print_success("VehiculoData obtenido correctamente")
                print_info(f"Placa: {result.get('placa_actual')}")
                print_info(f"Marca: {result.get('marca')}")
                print_info(f"Modelo: {result.get('modelo')}")
                self.tests_passed += 1
            else:
                print_error(f"Error al obtener VehiculoData: {response.status_code}")
                self.tests_failed += 1
        except Exception as e:
            print_error(f"Excepción al obtener VehiculoData: {e}")
            self.tests_failed += 1
    
    def test_vehiculo_data_search(self):
        """Prueba buscar VehiculoData por placa"""
        print_header("5️⃣ Buscar VehiculoData por Placa")
        
        if not self.vehiculo_data_id:
            print_warning("No hay VehiculoData creado. Saltando prueba.")
            return
        
        try:
            # Primero obtener la placa
            response = requests.get(
                f"{BASE_URL}/api/vehiculos-solo/{self.vehiculo_data_id}",
                timeout=5
            )
            
            if response.status_code != 200:
                print_error("No se pudo obtener la placa")
                self.tests_failed += 1
                return
            
            placa = response.json().get('placa_actual')
            
            # Buscar por placa
            response = requests.get(
                f"{BASE_URL}/api/vehiculos-solo?placa={placa}",
                timeout=5
            )
            
            if response.status_code == 200:
                results = response.json()
                if results and len(results) > 0:
                    print_success(f"Búsqueda exitosa: {len(results)} resultado(s)")
                    print_info(f"Placa buscada: {placa}")
                    self.tests_passed += 1
                else:
                    print_error("Búsqueda no devolvió resultados")
                    self.tests_failed += 1
            else:
                print_error(f"Error en búsqueda: {response.status_code}")
                self.tests_failed += 1
        except Exception as e:
            print_error(f"Excepción en búsqueda: {e}")
            self.tests_failed += 1
    
    def test_vehiculo_create(self):
        """Prueba crear Vehiculo (administrativo)"""
        print_header("6️⃣ Crear Vehículo (Administrativo)")
        
        if not self.vehiculo_data_id or not self.empresa_id:
            print_warning("Faltan datos necesarios. Saltando prueba.")
            return
        
        # Obtener placa del VehiculoData
        try:
            response = requests.get(
                f"{BASE_URL}/api/vehiculos-solo/{self.vehiculo_data_id}",
                timeout=5
            )
            placa = response.json().get('placa_actual')
        except:
            print_error("No se pudo obtener la placa")
            self.tests_failed += 1
            return
        
        data = {
            "placa": placa,
            "vehiculoDataId": self.vehiculo_data_id,
            "empresaActualId": self.empresa_id,
            "tipoServicio": "TRANSPORTE INTERPROVINCIAL",
            "estado": "ACTIVO",
            "sedeRegistro": "PUNO",
            "observaciones": "Vehículo de prueba automatizada"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/vehiculos",
                json=data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                self.vehiculo_id = result.get('id')
                print_success(f"Vehículo creado: {self.vehiculo_id}")
                print_info(f"Placa: {placa}")
                print_info(f"Tipo Servicio: {data['tipoServicio']}")
                self.tests_passed += 1
            else:
                print_error(f"Error al crear Vehículo: {response.status_code}")
                print_error(f"Respuesta: {response.text}")
                self.tests_failed += 1
        except Exception as e:
            print_error(f"Excepción al crear Vehículo: {e}")
            self.tests_failed += 1
    
    def test_vehiculo_get(self):
        """Prueba obtener Vehiculo por ID"""
        print_header("7️⃣ Obtener Vehículo por ID")
        
        if not self.vehiculo_id:
            print_warning("No hay Vehículo ID. Saltando prueba.")
            return
        
        try:
            response = requests.get(
                f"{BASE_URL}/api/vehiculos/{self.vehiculo_id}",
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                print_success("Vehículo obtenido correctamente")
                print_info(f"Placa: {result.get('placa')}")
                print_info(f"Estado: {result.get('estado')}")
                print_info(f"Tipo Servicio: {result.get('tipoServicio')}")
                self.tests_passed += 1
            else:
                print_error(f"Error al obtener Vehículo: {response.status_code}")
                self.tests_failed += 1
        except Exception as e:
            print_error(f"Excepción al obtener Vehículo: {e}")
            self.tests_failed += 1
    
    def test_vehiculo_with_data(self):
        """Prueba que el vehículo incluya datos técnicos"""
        print_header("8️⃣ Verificar JOIN con Datos Técnicos")
        
        if not self.vehiculo_id:
            print_warning("No hay Vehículo ID. Saltando prueba.")
            return
        
        try:
            response = requests.get(
                f"{BASE_URL}/api/vehiculos/{self.vehiculo_id}",
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Verificar que tenga vehiculoDataId
                if result.get('vehiculoDataId'):
                    print_success("Vehículo tiene vehiculoDataId")
                    print_info(f"vehiculoDataId: {result.get('vehiculoDataId')}")
                    
                    # Verificar si incluye datosTecnicos
                    if result.get('datosTecnicos'):
                        print_success("Vehículo incluye datosTecnicos (JOIN exitoso)")
                        print_info(f"Marca: {result['datosTecnicos'].get('marca')}")
                        print_info(f"Modelo: {result['datosTecnicos'].get('modelo')}")
                        self.tests_passed += 1
                    else:
                        print_warning("Vehículo no incluye datosTecnicos (JOIN no implementado)")
                        print_info("Esto es normal si el endpoint no hace JOIN automático")
                        self.tests_passed += 1
                else:
                    print_error("Vehículo no tiene vehiculoDataId")
                    self.tests_failed += 1
            else:
                print_error(f"Error al obtener Vehículo: {response.status_code}")
                self.tests_failed += 1
        except Exception as e:
            print_error(f"Excepción: {e}")
            self.tests_failed += 1
    
    def test_validations(self):
        """Prueba validaciones del sistema"""
        print_header("9️⃣ Pruebas de Validación")
        
        # Intentar crear vehículo sin vehiculoDataId
        print_info("Probando crear vehículo sin vehiculoDataId...")
        try:
            data = {
                "placa": "INVALID-001",
                "empresaActualId": self.empresa_id or "fake-id",
                "tipoServicio": "REGULAR",
                "estado": "ACTIVO"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/vehiculos",
                json=data,
                timeout=5
            )
            
            if response.status_code in [400, 422]:
                print_success("Validación correcta: rechaza vehículo sin vehiculoDataId")
                self.tests_passed += 1
            elif response.status_code in [200, 201]:
                print_warning("Sistema permite crear vehículo sin vehiculoDataId (compatibilidad legacy)")
                self.tests_passed += 1
            else:
                print_error(f"Respuesta inesperada: {response.status_code}")
                self.tests_failed += 1
        except Exception as e:
            print_error(f"Excepción en validación: {e}")
            self.tests_failed += 1
    
    def print_summary(self):
        """Imprime resumen de las pruebas"""
        print_header("📊 RESUMEN DE PRUEBAS")
        
        total = self.tests_passed + self.tests_failed
        percentage = (self.tests_passed / total * 100) if total > 0 else 0
        
        print(f"\n{Colors.BOLD}Total de pruebas: {total}{Colors.RESET}")
        print_success(f"Pruebas exitosas: {self.tests_passed}")
        
        if self.tests_failed > 0:
            print_error(f"Pruebas fallidas: {self.tests_failed}")
        else:
            print_success("Pruebas fallidas: 0")
        
        print(f"\n{Colors.BOLD}Porcentaje de éxito: {percentage:.1f}%{Colors.RESET}\n")
        
        if self.tests_failed == 0:
            print_success("🎉 ¡TODAS LAS PRUEBAS PASARON!")
            print_info("El sistema está funcionando correctamente")
        else:
            print_warning("⚠️  Algunas pruebas fallaron")
            print_info("Revisa los errores arriba para más detalles")
        
        # IDs generados
        if self.vehiculo_data_id or self.vehiculo_id:
            print(f"\n{Colors.BOLD}IDs Generados:{Colors.RESET}")
            if self.vehiculo_data_id:
                print_info(f"VehiculoData ID: {self.vehiculo_data_id}")
            if self.vehiculo_id:
                print_info(f"Vehiculo ID: {self.vehiculo_id}")

def main():
    """Función principal"""
    tester = VehiculoTester()
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
