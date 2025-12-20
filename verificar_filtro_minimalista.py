#!/usr/bin/env python3
"""
Verificar que el filtro minimalista de resoluciones esté activo
"""

import requests
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def verificar_filtro_minimalista():
    """Verificar que el componente minimalista esté cargando"""
    
    print("🔍 VERIFICANDO FILTRO MINIMALISTA DE RESOLUCIONES")
    print("=" * 60)
    
    # Configurar Chrome en modo headless
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        # Inicializar driver
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_window_size(1920, 1080)
        
        print("✅ Navegador iniciado")
        
        # Ir a la página de resoluciones
        url = "http://localhost:4200/resoluciones"
        print(f"🌐 Navegando a: {url}")
        
        driver.get(url)
        
        # Esperar a que la página cargue
        wait = WebDriverWait(driver, 10)
        
        # Verificar que el componente minimalista esté presente
        print("🔍 Buscando elementos del filtro minimalista...")
        
        # Buscar el selector del componente minimalista
        try:
            filtro_minimal = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "app-resoluciones-filters-minimal"))
            )
            print("✅ Componente 'app-resoluciones-filters-minimal' encontrado")
        except:
            print("❌ Componente 'app-resoluciones-filters-minimal' NO encontrado")
            return False
        
        # Verificar que solo hay 2 campos de filtro (búsqueda y estado)
        try:
            campos_filtro = driver.find_elements(By.CSS_SELECTOR, "app-resoluciones-filters-minimal mat-form-field")
            print(f"📊 Campos de filtro encontrados: {len(campos_filtro)}")
            
            if len(campos_filtro) == 2:
                print("✅ Correcto: Solo 2 campos de filtro (minimalista)")
            else:
                print(f"❌ Incorrecto: Se esperaban 2 campos, se encontraron {len(campos_filtro)}")
                return False
                
        except Exception as e:
            print(f"❌ Error verificando campos: {e}")
            return False
        
        # Verificar que NO hay panel de expansión complejo
        try:
            panel_expansion = driver.find_elements(By.CSS_SELECTOR, "mat-expansion-panel")
            if len(panel_expansion) == 0:
                print("✅ Correcto: No hay panel de expansión complejo")
            else:
                print(f"❌ Incorrecto: Se encontró panel de expansión ({len(panel_expansion)})")
                return False
        except:
            print("✅ Correcto: No hay panel de expansión complejo")
        
        # Verificar el título de la página
        try:
            titulo = driver.find_element(By.TAG_NAME, "h1").text
            print(f"📝 Título encontrado: '{titulo}'")
            
            if "Resoluciones" in titulo:
                print("✅ Título correcto")
            else:
                print("❌ Título incorrecto")
                return False
        except Exception as e:
            print(f"⚠️  No se pudo verificar el título: {e}")
        
        # Verificar que la tabla esté presente
        try:
            tabla = driver.find_element(By.CSS_SELECTOR, "table.tabla")
            print("✅ Tabla de resoluciones encontrada")
        except:
            print("❌ Tabla de resoluciones NO encontrada")
            return False
        
        print("\n" + "=" * 60)
        print("🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE")
        print("✅ El filtro minimalista está ACTIVO y funcionando")
        print("✅ Solo 2 campos de filtro (búsqueda y estado)")
        print("✅ Sin panel de expansión complejo")
        print("✅ Interfaz limpia y simple")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la verificación: {e}")
        return False
        
    finally:
        try:
            driver.quit()
            print("🔒 Navegador cerrado")
        except:
            pass

def verificar_backend_resoluciones():
    """Verificar que el backend esté respondiendo"""
    
    print("\n🔍 VERIFICANDO BACKEND DE RESOLUCIONES")
    print("=" * 40)
    
    try:
        # Verificar endpoint de resoluciones
        url = "http://localhost:8000/resoluciones"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend respondiendo: {len(data)} resoluciones")
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False

if __name__ == "__main__":
    print("🚀 INICIANDO VERIFICACIÓN DEL FILTRO MINIMALISTA")
    print("=" * 60)
    
    # Esperar un poco para que el servidor esté listo
    print("⏳ Esperando que el servidor esté listo...")
    time.sleep(3)
    
    # Verificar backend primero
    backend_ok = verificar_backend_resoluciones()
    
    if backend_ok:
        # Verificar frontend
        frontend_ok = verificar_filtro_minimalista()
        
        if frontend_ok:
            print("\n🎉 ÉXITO TOTAL")
            print("✅ Backend funcionando")
            print("✅ Frontend con filtro minimalista activo")
            print("✅ Listo para usar")
        else:
            print("\n⚠️  PROBLEMA EN FRONTEND")
            print("✅ Backend funcionando")
            print("❌ Frontend con problemas")
    else:
        print("\n❌ PROBLEMA EN BACKEND")
        print("❌ Backend no responde")
        print("⚠️  Verificar que el backend esté corriendo")
    
    print("\n" + "=" * 60)
    print("Verificación completada")