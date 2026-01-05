#!/usr/bin/env python3
"""
Script de prueba para verificar las mejoras del módulo de resoluciones
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Configuración
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

class TestMejorasResoluciones:
    def __init__(self):
        self.resultados = []
        self.errores = []
        
    def log_resultado(self, test: str, exitoso: bool, mensaje: str = ""):
        """Registra el resultado de un test"""
        resultado = {
            "test": test,
            "exitoso": exitoso,
            "mensaje": mensaje,
            "timestamp": datetime.now().isoformat()
        }
        self.resultados.append(resultado)
        
        status = "✅" if exitoso else "❌"
        print(f"{status} {test}: {mensaje}")
        
        if not exitoso:
            self.errores.append(resultado)
    
    def test_backend_disponible(self) -> bool:
        """Verifica que el backend esté disponible"""
        try:
            response = requests.get(f"{BASE_URL}/resoluciones/test", headers=HEADERS, timeout=5)
            if response.status_code == 200:
                self.log_resultado("Backend disponible", True, "API responde correctamente")
                return True
            else:
                self.log_resultado("Backend disponible", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_resultado("Backend disponible", False, f"Error de conexión: {str(e)}")
            return False
    
    def test_listar_resoluciones(self) -> List[Dict]:
        """Prueba el endpoint de listado de resoluciones"""
        try:
            response = requests.get(f"{BASE_URL}/resoluciones", headers=HEADERS, timeout=10)
            if response.status_code == 200:
                resoluciones = response.json()
                self.log_resultado(
                    "Listar resoluciones", 
                    True, 
                    f"Se obtuvieron {len(resoluciones)} resoluciones"
                )
                return resoluciones
            else:
                self.log_resultado(
                    "Listar resoluciones", 
                    False, 
                    f"Status code: {response.status_code}"
                )
                return []
        except Exception as e:
            self.log_resultado("Listar resoluciones", False, f"Error: {str(e)}")
            return []
    
    def test_filtros_avanzados(self, resoluciones: List[Dict]) -> bool:
        """Prueba los filtros avanzados de resoluciones"""
        if not resoluciones:
            self.log_resultado("Filtros avanzados", False, "No hay resoluciones para filtrar")
            return False
        
        try:
            # Test filtro por estado
            filtros = {"estado": "VIGENTE"}
            response = requests.post(
                f"{BASE_URL}/resoluciones/filtradas", 
                json=filtros, 
                headers=HEADERS,
                timeout=10
            )
            
            if response.status_code == 200:
                filtradas = response.json()
                self.log_resultado(
                    "Filtros avanzados", 
                    True, 
                    f"Filtro por estado: {len(filtradas)} resultados"
                )
                return True
            else:
                self.log_resultado(
                    "Filtros avanzados", 
                    False, 
                    f"Status code: {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_resultado("Filtros avanzados", False, f"Error: {str(e)}")
            return False
    
    def test_estadisticas(self) -> bool:
        """Prueba el endpoint de estadísticas"""
        try:
            response = requests.get(f"{BASE_URL}/resoluciones/estadisticas", headers=HEADERS, timeout=10)
            if response.status_code == 200:
                stats = response.json()
                self.log_resultado(
                    "Estadísticas", 
                    True, 
                    f"Total: {stats.get('totalResoluciones', 0)}, Vigentes: {stats.get('resolucionesVigentes', 0)}"
                )
                return True
            else:
                self.log_resultado("Estadísticas", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_resultado("Estadísticas", False, f"Error: {str(e)}")
            return False
    
    def test_validacion_numero(self) -> bool:
        """Prueba la validación de números de resolución"""
        try:
            # Generar número de prueba
            fecha_emision = datetime.now()
            numero_test = "9999"  # Número que probablemente no existe
            
            response = requests.get(
                f"{BASE_URL}/resoluciones/validar-numero/{numero_test}",
                params={"fecha_emision": fecha_emision.isoformat()},
                headers=HEADERS,
                timeout=10
            )
            
            if response.status_code == 200:
                resultado = response.json()
                disponible = resultado.get("disponible", False)
                self.log_resultado(
                    "Validación número", 
                    True, 
                    f"Número {numero_test}: {'disponible' if disponible else 'ocupado'}"
                )
                return True
            else:
                self.log_resultado("Validación número", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_resultado("Validación número", False, f"Error: {str(e)}")
            return False
    
    def test_siguiente_numero(self) -> bool:
        """Prueba la generación del siguiente número disponible"""
        try:
            anio_actual = datetime.now().year
            response = requests.get(
                f"{BASE_URL}/resoluciones/siguiente-numero/{anio_actual}",
                headers=HEADERS,
                timeout=10
            )
            
            if response.status_code == 200:
                resultado = response.json()
                siguiente = resultado.get("siguienteNumero", "")
                self.log_resultado(
                    "Siguiente número", 
                    True, 
                    f"Siguiente número para {anio_actual}: {siguiente}"
                )
                return True
            else:
                self.log_resultado("Siguiente número", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_resultado("Siguiente número", False, f"Error: {str(e)}")
            return False
    
    def test_relaciones_resoluciones(self, resoluciones: List[Dict]) -> bool:
        """Prueba las relaciones padre-hijo entre resoluciones"""
        if not resoluciones:
            self.log_resultado("Relaciones resoluciones", False, "No hay resoluciones para analizar")
            return False
        
        try:
            # Contar resoluciones con relaciones
            con_padre = len([r for r in resoluciones if r.get("resolucionPadreId")])
            con_hijas = len([r for r in resoluciones if r.get("resolucionesHijasIds")])
            
            self.log_resultado(
                "Relaciones resoluciones", 
                True, 
                f"Con padre: {con_padre}, Con hijas: {con_hijas}"
            )
            return True
        except Exception as e:
            self.log_resultado("Relaciones resoluciones", False, f"Error: {str(e)}")
            return False
    
    def test_formato_numeros(self, resoluciones: List[Dict]) -> bool:
        """Verifica que los números de resolución tengan el formato correcto"""
        if not resoluciones:
            self.log_resultado("Formato números", False, "No hay resoluciones para verificar")
            return False
        
        try:
            import re
            patron = r"^R-\d{4}-\d{4}$"
            
            correctos = 0
            incorrectos = 0
            
            for resolucion in resoluciones:
                numero = resolucion.get("nroResolucion", "")
                if re.match(patron, numero):
                    correctos += 1
                else:
                    incorrectos += 1
            
            porcentaje_correcto = (correctos / len(resoluciones)) * 100 if resoluciones else 0
            
            self.log_resultado(
                "Formato números", 
                porcentaje_correcto >= 80,  # Al menos 80% deben tener formato correcto
                f"Correctos: {correctos}, Incorrectos: {incorrectos} ({porcentaje_correcto:.1f}%)"
            )
            return porcentaje_correcto >= 80
        except Exception as e:
            self.log_resultado("Formato números", False, f"Error: {str(e)}")
            return False
    
    def test_campos_requeridos(self, resoluciones: List[Dict]) -> bool:
        """Verifica que las resoluciones tengan los campos requeridos"""
        if not resoluciones:
            self.log_resultado("Campos requeridos", False, "No hay resoluciones para verificar")
            return False
        
        try:
            campos_requeridos = [
                "id", "nroResolucion", "empresaId", "fechaEmision", 
                "tipoResolucion", "tipoTramite", "estado"
            ]
            
            completas = 0
            incompletas = 0
            
            for resolucion in resoluciones:
                tiene_todos = all(
                    campo in resolucion and resolucion[campo] is not None 
                    for campo in campos_requeridos
                )
                
                if tiene_todos:
                    completas += 1
                else:
                    incompletas += 1
            
            porcentaje_completo = (completas / len(resoluciones)) * 100 if resoluciones else 0
            
            self.log_resultado(
                "Campos requeridos", 
                porcentaje_completo >= 90,  # Al menos 90% deben estar completas
                f"Completas: {completas}, Incompletas: {incompletas} ({porcentaje_completo:.1f}%)"
            )
            return porcentaje_completo >= 90
        except Exception as e:
            self.log_resultado("Campos requeridos", False, f"Error: {str(e)}")
            return False
    
    def test_consistencia_fechas(self, resoluciones: List[Dict]) -> bool:
        """Verifica la consistencia de las fechas de vigencia"""
        if not resoluciones:
            self.log_resultado("Consistencia fechas", False, "No hay resoluciones para verificar")
            return False
        
        try:
            consistentes = 0
            inconsistentes = 0
            
            for resolucion in resoluciones:
                fecha_inicio = resolucion.get("fechaVigenciaInicio")
                fecha_fin = resolucion.get("fechaVigenciaFin")
                
                if fecha_inicio and fecha_fin:
                    try:
                        inicio = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
                        fin = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
                        
                        if inicio < fin:
                            consistentes += 1
                        else:
                            inconsistentes += 1
                    except:
                        inconsistentes += 1
                else:
                    # Sin fechas de vigencia, consideramos consistente
                    consistentes += 1
            
            porcentaje_consistente = (consistentes / len(resoluciones)) * 100 if resoluciones else 0
            
            self.log_resultado(
                "Consistencia fechas", 
                inconsistentes == 0,
                f"Consistentes: {consistentes}, Inconsistentes: {inconsistentes} ({porcentaje_consistente:.1f}%)"
            )
            return inconsistentes == 0
        except Exception as e:
            self.log_resultado("Consistencia fechas", False, f"Error: {str(e)}")
            return False
    
    def ejecutar_todas_las_pruebas(self):
        """Ejecuta todas las pruebas del módulo de resoluciones"""
        print("🧪 INICIANDO PRUEBAS DEL MÓDULO DE RESOLUCIONES")
        print("=" * 60)
        
        # Test 1: Backend disponible
        if not self.test_backend_disponible():
            print("\n❌ Backend no disponible. Abortando pruebas.")
            return False
        
        # Test 2: Listar resoluciones
        resoluciones = self.test_listar_resoluciones()
        
        # Test 3: Filtros avanzados
        self.test_filtros_avanzados(resoluciones)
        
        # Test 4: Estadísticas
        self.test_estadisticas()
        
        # Test 5: Validación de números
        self.test_validacion_numero()
        
        # Test 6: Siguiente número
        self.test_siguiente_numero()
        
        # Test 7: Relaciones
        self.test_relaciones_resoluciones(resoluciones)
        
        # Test 8: Formato de números
        self.test_formato_numeros(resoluciones)
        
        # Test 9: Campos requeridos
        self.test_campos_requeridos(resoluciones)
        
        # Test 10: Consistencia de fechas
        self.test_consistencia_fechas(resoluciones)
        
        return True
    
    def generar_reporte(self):
        """Genera un reporte final de las pruebas"""
        print("\n" + "=" * 60)
        print("📊 REPORTE FINAL DE PRUEBAS")
        print("=" * 60)
        
        total_tests = len(self.resultados)
        exitosos = len([r for r in self.resultados if r["exitoso"]])
        fallidos = total_tests - exitosos
        
        print(f"Total de pruebas: {total_tests}")
        print(f"Exitosas: {exitosos}")
        print(f"Fallidas: {fallidos}")
        print(f"Porcentaje de éxito: {(exitosos/total_tests)*100:.1f}%")
        
        if self.errores:
            print(f"\n❌ ERRORES DETECTADOS ({len(self.errores)}):")
            for error in self.errores:
                print(f"  - {error['test']}: {error['mensaje']}")
        else:
            print(f"\n✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE")
        
        # Guardar reporte en archivo
        reporte = {
            "timestamp": datetime.now().isoformat(),
            "resumen": {
                "total": total_tests,
                "exitosos": exitosos,
                "fallidos": fallidos,
                "porcentaje_exito": (exitosos/total_tests)*100
            },
            "resultados": self.resultados,
            "errores": self.errores
        }
        
        with open(f"reporte_pruebas_resoluciones_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
            json.dump(reporte, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Reporte guardado en archivo JSON")
        
        return exitosos == total_tests

def main():
    """Función principal"""
    print("🚀 SISTEMA DE PRUEBAS - MÓDULO DE RESOLUCIONES")
    print("Verificando mejoras implementadas...")
    print()
    
    tester = TestMejorasResoluciones()
    
    try:
        # Ejecutar todas las pruebas
        tester.ejecutar_todas_las_pruebas()
        
        # Generar reporte final
        todas_exitosas = tester.generar_reporte()
        
        # Código de salida
        sys.exit(0 if todas_exitosas else 1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Pruebas interrumpidas por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error inesperado: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()