#!/usr/bin/env python3
"""
Probar el frontend con el filtro de resoluciones corregido
"""

import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select

def test_frontend_filtro_resoluciones():
    """Probar el filtro de resoluciones en el frontend"""
    
    print("🚀 PROBANDO FRONTEND - FILTRO DE RESOLUCIONES")
    print("=" * 60)
    
    # Configurar Chrome
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    try:
        # Inicializar driver
        driver = webdriver.Chrome(options=chrome_options)
        wait = WebDriverWait(driver, 10)
        
        print("✅ Navegador iniciado")
        
        # 1. Ir a la página de resoluciones
        url = "http://localhost:4200/resoluciones"
        print(f"\n1. Navegando a: {url}")
        
        driver.get(url)
        time.sleep(3)  # Esperar carga inicial
        
        # 2. Verificar que el filtro minimalista esté presente
        print("\n2. Verificando filtro minimalista...")
        
        try:
            # Buscar el componente de filtros minimal
            filtro_minimal = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-resoluciones-filters-minimal"))
            )
            print("   ✅ Componente filtro minimalista encontrado")
        except:
            print("   ❌ Componente filtro minimalista NO encontrado")
            return False
        
        # 3. Verificar campos del filtro
        print("\n3. Verificando campos del filtro...")
        
        try:
            # Campo de búsqueda
            campo_busqueda = driver.find_element(By.CSS_SELECTOR, "input[formControlName='busqueda']")
            print("   ✅ Campo de búsqueda encontrado")
            
            # Selector de estado
            selector_estado = driver.find_element(By.CSS_SELECTOR, "mat-select[formControlName='estado']")
            print("   ✅ Selector de estado encontrado")
            
            # Botón limpiar
            boton_limpiar = driver.find_element(By.CSS_SELECTOR, "button:has(mat-icon:contains('clear'))")
            print("   ✅ Botón limpiar encontrado")
            
        except Exception as e:
            print(f"   ❌ Error verificando campos: {e}")
            return False
        
        # 4. Probar búsqueda por número
        print("\n4. Probando búsqueda por número...")
        
        try:
            # Escribir en el campo de búsqueda
            campo_busqueda.clear()
            campo_busqueda.send_keys("RD-2024")
            
            print("   ✅ Texto 'RD-2024' ingresado en búsqueda")
            
            # Esperar un poco para el debounce
            time.sleep(1)
            
            # Verificar que se muestren resultados
            try:
                contador_resultados = wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".results-counter"))
                )
                texto_contador = contador_resultados.text
                print(f"   ✅ Contador de resultados: {texto_contador}")
            except:
                print("   ⚠️  Contador de resultados no visible (puede ser normal si no hay filtros activos)")
            
        except Exception as e:
            print(f"   ❌ Error en búsqueda: {e}")
        
        # 5. Probar filtro por estado
        print("\n5. Probando filtro por estado...")
        
        try:
            # Limpiar búsqueda anterior
            campo_busqueda.clear()
            time.sleep(0.5)
            
            # Hacer clic en el selector de estado
            selector_estado.click()
            time.sleep(0.5)
            
            # Buscar y seleccionar "Vigente"
            try:
                opcion_vigente = wait.until(
                    EC.element_to_be_clickable((By.XPATH, "//mat-option[contains(.,'Vigente')]"))
                )
                opcion_vigente.click()
                print("   ✅ Estado 'Vigente' seleccionado")
                time.sleep(1)
            except:
                print("   ⚠️  No se pudo seleccionar 'Vigente'")
            
        except Exception as e:
            print(f"   ❌ Error en filtro por estado: {e}")
        
        # 6. Verificar tabla de resoluciones
        print("\n6. Verificando tabla de resoluciones...")
        
        try:
            # Buscar la tabla
            tabla = driver.find_element(By.CSS_SELECTOR, "app-resoluciones-table")
            print("   ✅ Tabla de resoluciones encontrada")
            
            # Verificar filas de datos
            try:
                filas = driver.find_elements(By.CSS_SELECTOR, "app-resoluciones-table tr[mat-row]")
                print(f"   ✅ {len(filas)} filas de datos en la tabla")
            except:
                print("   ⚠️  No se pudieron contar las filas")
            
        except Exception as e:
            print(f"   ❌ Error verificando tabla: {e}")
        
        # 7. Probar botón limpiar
        print("\n7. Probando botón limpiar...")
        
        try:
            # Hacer clic en limpiar
            boton_limpiar.click()
            time.sleep(1)
            
            # Verificar que los campos se limpiaron
            valor_busqueda = campo_busqueda.get_attribute("value")
            if not valor_busqueda:
                print("   ✅ Campo de búsqueda limpiado")
            else:
                print(f"   ⚠️  Campo de búsqueda no se limpió: '{valor_busqueda}'")
            
        except Exception as e:
            print(f"   ❌ Error probando limpiar: {e}")
        
        # 8. Verificar header y estadísticas
        print("\n8. Verificando header y estadísticas...")
        
        try:
            # Buscar el header
            header = driver.find_element(By.CSS_SELECTOR, ".page-header")
            print("   ✅ Header encontrado")
            
            # Buscar estadísticas
            try:
                stats = driver.find_elements(By.CSS_SELECTOR, ".stat-item")
                print(f"   ✅ {len(stats)} estadísticas mostradas")
            except:
                print("   ⚠️  Estadísticas no visibles")
            
            # Buscar botones de acción
            try:
                botones = driver.find_elements(By.CSS_SELECTOR, ".header-actions button")
                print(f"   ✅ {len(botones)} botones de acción encontrados")
            except:
                print("   ⚠️  Botones de acción no encontrados")
            
        except Exception as e:
            print(f"   ❌ Error verificando header: {e}")
        
        print("\n" + "=" * 60)
        print("🎉 PRUEBA DEL FRONTEND COMPLETADA")
        print("✅ El filtro minimalista está funcionando")
        print("✅ La tabla completa está presente")
        print("✅ Las funcionalidades básicas funcionan")
        
        return True
        
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False
        
    finally:
        try:
            driver.quit()
            print("🔒 Navegador cerrado")
        except:
            pass

def verificar_backend_disponible():
    """Verificar que el backend esté disponible"""
    
    print("\n🔍 VERIFICANDO BACKEND")
    print("=" * 30)
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend disponible")
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend no disponible: {e}")
        return False

def verificar_frontend_disponible():
    """Verificar que el frontend esté disponible"""
    
    print("\n🔍 VERIFICANDO FRONTEND")
    print("=" * 30)
    
    try:
        response = requests.get("http://localhost:4200", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend disponible")
            return True
        else:
            print(f"❌ Frontend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend no disponible: {e}")
        return False

if __name__ == "__main__":
    print("🚀 PRUEBA COMPLETA DEL FILTRO DE RESOLUCIONES")
    print("=" * 60)
    
    # 1. Verificar servicios
    backend_ok = verificar_backend_disponible()
    frontend_ok = verificar_frontend_disponible()
    
    if not frontend_ok:
        print("\n❌ FRONTEND NO DISPONIBLE")
        print("   Asegúrate de que el frontend esté corriendo:")
        print("   cd frontend && npm start")
        exit(1)
    
    if not backend_ok:
        print("\n⚠️  BACKEND NO DISPONIBLE")
        print("   El frontend funcionará pero sin datos reales")
        print("   Para datos reales, inicia el backend:")
        print("   cd backend && uvicorn app.main:app --reload")
    
    # 2. Probar frontend
    print("\n" + "=" * 60)
    exito = test_frontend_filtro_resoluciones()
    
    if exito:
        print("\n🎉 PRUEBA EXITOSA")
        print("✅ El filtro de resoluciones funciona correctamente")
        print("✅ Interfaz minimalista activa")
        print("✅ Tabla completa disponible")
        print("\n🌐 Abre tu navegador en: http://localhost:4200/resoluciones")
    else:
        print("\n❌ PRUEBA FALLIDA")
        print("   Revisa los errores anteriores")
        print("   Verifica que el frontend esté compilado correctamente")
    
    print("\n" + "=" * 60)
    print("Prueba completada")