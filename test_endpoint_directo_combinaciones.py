#!/usr/bin/env python3
"""
Test directo del endpoint de combinaciones para verificar datos reales
"""
import requests
import json

def test_endpoint_combinaciones():
    """Probar directamente el endpoint de combinaciones"""
    
    print("🔍 PROBANDO ENDPOINT DIRECTO DE COMBINACIONES...")
    
    backend_url = "http://localhost:8000/api/v1"
    
    # 1. Probar endpoint de combinaciones directamente
    print(f"\n1️⃣ ENDPOINT: /rutas/combinaciones-rutas")
    try:
        response = requests.get(f"{backend_url}/rutas/combinaciones-rutas", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            
            print(f"   ✅ Combinaciones obtenidas: {len(combinaciones)}")
            print(f"   📊 Estructura de respuesta:")
            print(f"      - total_combinaciones: {data.get('total_combinaciones')}")
            print(f"      - mensaje: {data.get('mensaje')}")
            
            print(f"\n   🎯 COMBINACIONES DISPONIBLES:")
            for i, comb in enumerate(combinaciones):
                rutas_count = len(comb.get('rutas', []))
                print(f"      {i+1}. {comb.get('combinacion')} ({rutas_count} ruta(s))")
                
                # Mostrar detalles de las rutas
                for j, ruta in enumerate(comb.get('rutas', [])[:2]):  # Máximo 2 rutas por combinación
                    print(f"         - [{ruta.get('codigoRuta')}] Empresa: {ruta.get('empresaId', 'N/A')[:8]}...")
            
            return True, combinaciones
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text[:300]}")
            return False, []
            
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False, []

def test_busqueda_especifica():
    """Probar búsqueda específica en el endpoint"""
    
    print(f"\n2️⃣ PROBANDO BÚSQUEDA ESPECÍFICA")
    
    terminos = ["PUNO", "Juliaca", "Arequipa"]
    backend_url = "http://localhost:8000/api/v1"
    
    for termino in terminos:
        print(f"\n   🔍 Búsqueda: '{termino}'")
        try:
            response = requests.get(f"{backend_url}/rutas/combinaciones-rutas?busqueda={termino}", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                combinaciones = data.get('combinaciones', [])
                
                print(f"      ✅ Resultados: {len(combinaciones)}")
                for comb in combinaciones:
                    rutas_count = len(comb.get('rutas', []))
                    print(f"         - {comb.get('combinacion')} ({rutas_count} ruta(s))")
            else:
                print(f"      ❌ Error: {response.status_code}")
                
        except Exception as e:
            print(f"      ❌ Error: {e}")

def generar_codigo_frontend():
    """Generar código para usar directamente el endpoint de combinaciones"""
    
    print(f"\n3️⃣ GENERANDO CÓDIGO PARA FRONTEND")
    
    codigo = '''
// USAR DIRECTAMENTE EL ENDPOINT DE COMBINACIONES DEL BACKEND
cargarCombinacionesRutas(): void {
  console.log('🔄 CARGANDO COMBINACIONES DIRECTAMENTE DEL ENDPOINT...');
  
  // Usar directamente el endpoint de combinaciones en lugar de getRutas()
  const url = `${this.rutaService.apiUrl}/rutas/combinaciones-rutas`;
  
  this.http.get<any>(url).subscribe({
    next: (data) => {
      console.log('📊 RESPUESTA DEL ENDPOINT COMBINACIONES:', data);
      
      const combinaciones = data.combinaciones || [];
      
      console.log('✅ COMBINACIONES DIRECTAS DEL BACKEND:', {
        total: combinaciones.length,
        combinaciones: combinaciones.map(c => `${c.combinacion} (${c.rutas.length} ruta(s))`)
      });
      
      this.combinacionesDisponibles.set(combinaciones);
      this.combinacionesFiltradas.set(combinaciones);
      
      this.snackBar.open(`${combinaciones.length} combinaciones cargadas DIRECTAMENTE del backend`, 'Cerrar', { duration: 3000 });
    },
    error: (error) => {
      console.error('❌ Error al cargar combinaciones directamente:', error);
      
      // Fallback solo si falla completamente
      const combinacionesFallback = [
        {
          combinacion: 'Error - Verificar Backend',
          origen: 'Error',
          destino: 'Backend',
          rutas: []
        }
      ];
      
      this.combinacionesDisponibles.set(combinacionesFallback);
      this.combinacionesFiltradas.set(combinacionesFallback);
      
      this.snackBar.open('Error al conectar con el backend', 'Cerrar', { duration: 4000 });
    }
  });
}
'''
    
    print(f"   ✅ Código generado para usar endpoint directo")
    return codigo

if __name__ == "__main__":
    # 1. Probar endpoint de combinaciones
    exito, combinaciones = test_endpoint_combinaciones()
    
    if exito and len(combinaciones) > 0:
        print(f"\n✅ ENDPOINT DE COMBINACIONES FUNCIONA CORRECTAMENTE")
        print(f"   • {len(combinaciones)} combinaciones disponibles")
        print(f"   • Datos reales del backend")
        
        # 2. Probar búsquedas
        test_busqueda_especifica()
        
        # 3. Generar código
        codigo = generar_codigo_frontend()
        
        print(f"\n🎯 SOLUCIÓN:")
        print(f"   1. El endpoint /rutas/combinaciones-rutas funciona perfectamente")
        print(f"   2. Cambiar el frontend para usar este endpoint directamente")
        print(f"   3. Evitar el servicio getRutas() que puede estar devolviendo mock")
        
    else:
        print(f"\n❌ PROBLEMA CON EL ENDPOINT DE COMBINACIONES")
        print(f"   • Verificar que el backend esté corriendo")
        print(f"   • Verificar la implementación del endpoint")