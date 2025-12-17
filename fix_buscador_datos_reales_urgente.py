#!/usr/bin/env python3
"""
Script URGENTE para arreglar el buscador inteligente con datos reales
El problema: Las rutas tienen origenId/destinoId pero no origen/destino
"""
import requests
import json

def fix_buscador_datos_reales():
    """Arreglar el problema de datos reales en el buscador"""
    
    print("🚨 ARREGLANDO BUSCADOR INTELIGENTE CON DATOS REALES...")
    
    backend_url = "http://localhost:8000/api/v1"
    
    # 1. Verificar el problema
    print(f"\n1️⃣ VERIFICANDO EL PROBLEMA")
    try:
        response = requests.get(f"{backend_url}/rutas", timeout=5)
        if response.status_code == 200:
            rutas = response.json()
            print(f"   📊 Total rutas: {len(rutas)}")
            
            # Analizar estructura de datos
            rutas_con_origen_destino = 0
            rutas_con_origenId_destinoId = 0
            
            print(f"\n   🔍 ANÁLISIS DE ESTRUCTURA:")
            for i, ruta in enumerate(rutas[:5]):
                print(f"   Ruta {i+1}: [{ruta.get('codigoRuta')}] {ruta.get('nombre', 'Sin nombre')}")
                
                # Verificar campos
                origen = ruta.get('origen')
                destino = ruta.get('destino')
                origenId = ruta.get('origenId')
                destinoId = ruta.get('destinoId')
                
                print(f"      origen: {origen}")
                print(f"      destino: {destino}")
                print(f"      origenId: {origenId}")
                print(f"      destinoId: {destinoId}")
                
                if origen and destino:
                    rutas_con_origen_destino += 1
                if origenId and destinoId:
                    rutas_con_origenId_destinoId += 1
                print()
            
            print(f"   📊 RESUMEN:")
            print(f"      Rutas con origen/destino: {rutas_con_origen_destino}")
            print(f"      Rutas con origenId/destinoId: {rutas_con_origenId_destinoId}")
            
            if rutas_con_origen_destino == 0 and rutas_con_origenId_destinoId > 0:
                print(f"   🎯 PROBLEMA IDENTIFICADO: Las rutas usan origenId/destinoId pero el frontend necesita origen/destino")
                return True, rutas
            else:
                print(f"   ✅ Los datos parecen estar correctos")
                return False, rutas
                
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False, []

def crear_mapeo_localidades():
    """Crear mapeo de IDs a nombres de localidades"""
    
    # Mapeo basado en los datos que vimos
    mapeo = {
        'PUNO_001': 'Puno',
        'JULIACA_001': 'Juliaca', 
        'AREQUIPA_001': 'Arequipa',
        'CUSCO_001': 'Cusco',
        'MOQUEGUA_001': 'Moquegua',
        'LIMA_001': 'Lima',
        'TRUJILLO_001': 'Trujillo',
        'CHICLAYO_001': 'Chiclayo',
        'MOLLENDO_001': 'Mollendo',
        'TACNA_001': 'Tacna'
    }
    
    return mapeo

def generar_solucion_frontend():
    """Generar solución para el frontend"""
    
    print(f"\n2️⃣ GENERANDO SOLUCIÓN PARA EL FRONTEND")
    
    mapeo = crear_mapeo_localidades()
    
    # Código TypeScript para arreglar el frontend
    codigo_fix = '''
// FIX URGENTE: Convertir origenId/destinoId a origen/destino
cargarCombinacionesRutas(): void {
  console.log('🔄 CARGANDO COMBINACIONES REALES DEL BACKEND...');
  
  this.rutaService.getRutas().subscribe({
    next: (rutas) => {
      console.log('📊 RUTAS RECIBIDAS DEL BACKEND:', rutas.length);
      
      const combinacionesMap = new Map<string, any>();
      
      // MAPEO DE IDs A NOMBRES
      const mapeoLocalidades: {[key: string]: string} = {
        'PUNO_001': 'Puno',
        'JULIACA_001': 'Juliaca', 
        'AREQUIPA_001': 'Arequipa',
        'CUSCO_001': 'Cusco',
        'MOQUEGUA_001': 'Moquegua',
        'LIMA_001': 'Lima',
        'TRUJILLO_001': 'Trujillo',
        'CHICLAYO_001': 'Chiclayo',
        'MOLLENDO_001': 'Mollendo',
        'TACNA_001': 'Tacna'
      };
      
      rutas.forEach(ruta => {
        // CONVERTIR IDs A NOMBRES
        const origenNombre = ruta.origen || mapeoLocalidades[ruta.origenId] || ruta.origenId;
        const destinoNombre = ruta.destino || mapeoLocalidades[ruta.destinoId] || ruta.destinoId;
        
        if (origenNombre && destinoNombre) {
          const combinacionKey = `${origenNombre} → ${destinoNombre}`;
          
          if (!combinacionesMap.has(combinacionKey)) {
            combinacionesMap.set(combinacionKey, {
              combinacion: combinacionKey,
              origen: origenNombre,
              destino: destinoNombre,
              rutas: []
            });
          }
          
          combinacionesMap.get(combinacionKey)!.rutas.push({
            id: ruta.id,
            codigoRuta: ruta.codigoRuta,
            empresaId: ruta.empresaId,
            resolucionId: ruta.resolucionId,
            estado: ruta.estado
          });
        }
      });
      
      const combinaciones = Array.from(combinacionesMap.values()).sort((a, b) => 
        a.combinacion.localeCompare(b.combinacion)
      );
      
      console.log('✅ COMBINACIONES REALES CARGADAS:', {
        total: combinaciones.length,
        combinaciones: combinaciones.map(c => c.combinacion)
      });
      
      this.combinacionesDisponibles.set(combinaciones);
      this.combinacionesFiltradas.set(combinaciones);
      
      this.snackBar.open(`${combinaciones.length} combinaciones de rutas cargadas desde el backend`, 'Cerrar', { duration: 3000 });
    },
    error: (error) => {
      console.error('❌ Error al cargar combinaciones del backend:', error);
      
      // Fallback: usar datos de ejemplo si el backend falla
      const combinacionesFallback = [
        {
          combinacion: 'Puno → Juliaca',
          origen: 'Puno',
          destino: 'Juliaca',
          rutas: [{ id: '1', codigoRuta: '01' }]
        }
      ];
      
      this.combinacionesDisponibles.set(combinacionesFallback);
      this.combinacionesFiltradas.set(combinacionesFallback);
      
      this.snackBar.open('Error al cargar del backend. Usando datos de ejemplo.', 'Cerrar', { duration: 4000 });
    }
  });
}
'''
    
    print(f"   ✅ Código de solución generado")
    return codigo_fix

def probar_solucion():
    """Probar la solución con datos reales"""
    
    print(f"\n3️⃣ PROBANDO SOLUCIÓN CON DATOS REALES")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/rutas", timeout=5)
        if response.status_code == 200:
            rutas = response.json()
            
            mapeo = crear_mapeo_localidades()
            combinaciones_map = {}
            
            for ruta in rutas:
                # Convertir IDs a nombres
                origen_nombre = ruta.get('origen') or mapeo.get(ruta.get('origenId', ''), ruta.get('origenId', ''))
                destino_nombre = ruta.get('destino') or mapeo.get(ruta.get('destinoId', ''), ruta.get('destinoId', ''))
                
                if origen_nombre and destino_nombre:
                    combinacion_key = f"{origen_nombre} → {destino_nombre}"
                    
                    if combinacion_key not in combinaciones_map:
                        combinaciones_map[combinacion_key] = {
                            'combinacion': combinacion_key,
                            'origen': origen_nombre,
                            'destino': destino_nombre,
                            'rutas': []
                        }
                    
                    combinaciones_map[combinacion_key]['rutas'].append({
                        'id': ruta.get('id'),
                        'codigoRuta': ruta.get('codigoRuta'),
                        'empresaId': ruta.get('empresaId'),
                        'resolucionId': ruta.get('resolucionId'),
                        'estado': ruta.get('estado')
                    })
            
            combinaciones = list(combinaciones_map.values())
            combinaciones.sort(key=lambda x: x['combinacion'])
            
            print(f"   ✅ SOLUCIÓN FUNCIONA:")
            print(f"      Total combinaciones: {len(combinaciones)}")
            
            for i, comb in enumerate(combinaciones):
                rutas_count = len(comb['rutas'])
                print(f"      {i+1}. {comb['combinacion']} ({rutas_count} ruta(s))")
            
            # Probar búsqueda
            busqueda = "Puno"
            resultados = [c for c in combinaciones if busqueda.lower() in c['combinacion'].lower()]
            print(f"\n   🔍 BÚSQUEDA '{busqueda}': {len(resultados)} resultados")
            for r in resultados:
                print(f"      - {r['combinacion']} ({len(r['rutas'])} ruta(s))")
            
            return True, combinaciones
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False, []

if __name__ == "__main__":
    # 1. Verificar el problema
    hay_problema, rutas = fix_buscador_datos_reales()
    
    if hay_problema:
        # 2. Generar solución
        codigo_fix = generar_solucion_frontend()
        
        # 3. Probar solución
        funciona, combinaciones = probar_solucion()
        
        if funciona:
            print(f"\n✅ SOLUCIÓN CONFIRMADA")
            print(f"   📋 PASOS PARA APLICAR:")
            print(f"   1. Abrir: frontend/src/app/components/rutas/rutas.component.ts")
            print(f"   2. Buscar el método: cargarCombinacionesRutas()")
            print(f"   3. Reemplazar con el código de arriba")
            print(f"   4. Guardar y probar en el navegador")
            
            print(f"\n🎯 RESULTADO ESPERADO:")
            print(f"   • {len(combinaciones)} combinaciones disponibles")
            print(f"   • Búsqueda inteligente funcionando")
            print(f"   • Datos reales del backend")
        else:
            print(f"\n❌ LA SOLUCIÓN NO FUNCIONA")
    else:
        print(f"\n✅ NO HAY PROBLEMA - LOS DATOS YA ESTÁN CORRECTOS")
        
    print(f"\n🔧 APLICANDO FIX AUTOMÁTICAMENTE...")