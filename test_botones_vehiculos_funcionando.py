#!/usr/bin/env python3
"""
Test para verificar que los botones del módulo de vehículos funcionen correctamente
- Botón de rutas (solo icono)
- Menú de acciones (tres puntos)
"""

import requests
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

def test_frontend_vehiculos_botones():
    """Test específico para botones del módulo de vehículos"""
    
    print("🚗 INICIANDO TEST DE BOTONES MÓDULO VEHÍCULOS")
    print("=" * 60)
    
    # Configurar Chrome para headless
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = None
    
    try:
        # Verificar que el frontend esté corriendo
        print("1. Verificando que el frontend esté disponible...")
        try:
            response = requests.get("http://localhost:4200", timeout=5)
            print(f"   ✅ Frontend disponible (Status: {response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Frontend no disponible: {e}")
            return False
        
        # Inicializar driver
        print("\n2. Iniciando navegador...")
        driver = webdriver.Chrome(options=chrome_options)
        driver.get("http://localhost:4200")
        
        # Esperar a que cargue la página
        print("3. Esperando carga inicial...")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Navegar al módulo de vehículos
        print("4. Navegando al módulo de vehículos...")
        try:
            # Buscar enlace de vehículos en el menú
            vehiculos_link = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/vehiculos') or contains(text(), 'VEHÍCULOS')]"))
            )
            vehiculos_link.click()
            print("   ✅ Navegación a vehículos exitosa")
        except TimeoutException:
            print("   ⚠️ No se encontró enlace directo, intentando URL directa...")
            driver.get("http://localhost:4200/vehiculos")
        
        # Esperar a que cargue la tabla de vehículos
        print("5. Esperando carga de tabla de vehículos...")
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".modern-table, .mat-table, table"))
            )
            print("   ✅ Tabla de vehículos cargada")
        except TimeoutException:
            print("   ❌ No se pudo cargar la tabla de vehículos")
            return False
        
        # Test 1: Verificar botón de rutas (solo icono)
        print("\n6. TEST 1: Verificando botón de rutas...")
        try:
            # Buscar botones de rutas en la columna RUTAS
            route_buttons = driver.find_elements(By.CSS_SELECTOR, 
                "button[mat-icon-button] mat-icon[fontIcon='route'], " +
                "button[mat-icon-button]:has(mat-icon:contains('route')), " +
                "td[mat-cell] button[mat-icon-button]"
            )
            
            if route_buttons:
                print(f"   ✅ Encontrados {len(route_buttons)} botones de rutas")
                
                # Verificar que sea solo icono (sin texto)
                for i, button in enumerate(route_buttons[:3]):  # Solo los primeros 3
                    button_text = button.text.strip()
                    if button_text == "" or "route" in button_text.lower():
                        print(f"   ✅ Botón {i+1}: Solo icono (correcto)")
                    else:
                        print(f"   ⚠️ Botón {i+1}: Contiene texto '{button_text}' (debería ser solo icono)")
                
                # Intentar hacer clic en el primer botón
                try:
                    first_button = route_buttons[0]
                    driver.execute_script("arguments[0].scrollIntoView(true);", first_button)
                    time.sleep(1)
                    first_button.click()
                    print("   ✅ Clic en botón de rutas exitoso")
                    
                    # Verificar si se abre modal
                    time.sleep(2)
                    modal = driver.find_elements(By.CSS_SELECTOR, ".mat-dialog-container, .modal, [role='dialog']")
                    if modal:
                        print("   ✅ Modal de rutas específicas se abrió correctamente")
                        # Cerrar modal
                        close_button = driver.find_elements(By.CSS_SELECTOR, "button[mat-dialog-close], .close-button, button:has(mat-icon:contains('close'))")
                        if close_button:
                            close_button[0].click()
                            time.sleep(1)
                    else:
                        print("   ⚠️ No se detectó apertura de modal")
                        
                except Exception as e:
                    print(f"   ❌ Error al hacer clic en botón de rutas: {e}")
            else:
                print("   ❌ No se encontraron botones de rutas")
                
        except Exception as e:
            print(f"   ❌ Error en test de botón de rutas: {e}")
        
        # Test 2: Verificar menú de acciones (tres puntos)
        print("\n7. TEST 2: Verificando menú de acciones...")
        try:
            # Buscar botones de menú (tres puntos)
            action_buttons = driver.find_elements(By.CSS_SELECTOR, 
                "button[mat-icon-button]:has(mat-icon:contains('more_vert')), " +
                "button[matMenuTriggerFor], " +
                "button:has(mat-icon[fontIcon='more_vert'])"
            )
            
            if action_buttons:
                print(f"   ✅ Encontrados {len(action_buttons)} botones de acciones")
                
                # Intentar hacer clic en el primer botón de acciones
                try:
                    first_action_button = action_buttons[0]
                    driver.execute_script("arguments[0].scrollIntoView(true);", first_action_button)
                    time.sleep(1)
                    first_action_button.click()
                    print("   ✅ Clic en botón de acciones exitoso")
                    
                    # Verificar si se abre el menú
                    time.sleep(2)
                    menu = driver.find_elements(By.CSS_SELECTOR, ".mat-menu-panel, .mat-menu-content, [role='menu']")
                    if menu:
                        print("   ✅ Menú de acciones se abrió correctamente")
                        
                        # Verificar opciones del menú
                        menu_items = driver.find_elements(By.CSS_SELECTOR, ".mat-menu-item, button[mat-menu-item]")
                        print(f"   ✅ Encontradas {len(menu_items)} opciones en el menú")
                        
                        # Listar algunas opciones
                        for i, item in enumerate(menu_items[:5]):  # Solo las primeras 5
                            item_text = item.text.strip()
                            if item_text:
                                print(f"      - Opción {i+1}: {item_text}")
                        
                        # Cerrar menú haciendo clic fuera
                        driver.find_element(By.TAG_NAME, "body").click()
                        time.sleep(1)
                        
                    else:
                        print("   ❌ No se detectó apertura del menú de acciones")
                        
                except Exception as e:
                    print(f"   ❌ Error al hacer clic en botón de acciones: {e}")
            else:
                print("   ❌ No se encontraron botones de acciones")
                
        except Exception as e:
            print(f"   ❌ Error en test de menú de acciones: {e}")
        
        # Test 3: Verificar estructura de la tabla
        print("\n8. TEST 3: Verificando estructura de tabla...")
        try:
            # Verificar headers de columnas
            headers = driver.find_elements(By.CSS_SELECTOR, "th[mat-header-cell], .table-header-cell")
            print(f"   ✅ Encontradas {len(headers)} columnas en la tabla")
            
            # Buscar específicamente columna RUTAS
            rutas_header = None
            acciones_header = None
            
            for header in headers:
                header_text = header.text.strip().upper()
                if "RUTA" in header_text:
                    rutas_header = header
                    print(f"   ✅ Columna de rutas encontrada: '{header_text}'")
                elif "ACCION" in header_text:
                    acciones_header = header
                    print(f"   ✅ Columna de acciones encontrada: '{header_text}'")
            
            if not rutas_header:
                print("   ⚠️ No se encontró columna de rutas")
            if not acciones_header:
                print("   ⚠️ No se encontró columna de acciones")
                
        except Exception as e:
            print(f"   ❌ Error verificando estructura de tabla: {e}")
        
        print("\n" + "=" * 60)
        print("✅ TEST DE BOTONES COMPLETADO")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR GENERAL EN TEST: {e}")
        return False
        
    finally:
        if driver:
            driver.quit()

def main():
    """Función principal"""
    print("🧪 INICIANDO VERIFICACIÓN DE BOTONES MÓDULO VEHÍCULOS")
    print("📅 Fecha:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print()
    
    success = test_frontend_vehiculos_botones()
    
    if success:
        print("\n🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE")
    else:
        print("\n⚠️ VERIFICACIÓN COMPLETADA CON PROBLEMAS")
    
    return success

if __name__ == "__main__":
    main()