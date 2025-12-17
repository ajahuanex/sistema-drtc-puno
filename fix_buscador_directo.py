#!/usr/bin/env python3
"""
Fix directo para el buscador inteligente - crear una implementación simple que funcione
"""

def generar_codigo_buscador_simple():
    """Generar código TypeScript simple para el buscador"""
    
    codigo_signals = '''
  // Signals para buscador inteligente (SIMPLE)
  busquedaRutas = signal('');
  combinacionesDisponibles = signal<any[]>([]);
  combinacionesFiltradas = signal<any[]>([]);
  rutasSeleccionadas = signal<any[]>([]);
'''

    codigo_metodos = '''
  // Métodos para buscador inteligente (SIMPLE)
  cargarCombinacionesRutas(): void {
    console.log('🔄 CARGANDO COMBINACIONES SIMPLES...');
    
    // Crear combinaciones hardcodeadas para prueba
    const combinacionesSimples = [
      {
        combinacion: 'Puno → Juliaca',
        origen: 'Puno',
        destino: 'Juliaca',
        rutas: [{ id: '1', codigoRuta: '01' }, { id: '2', codigoRuta: '02' }]
      },
      {
        combinacion: 'Juliaca → Arequipa',
        origen: 'Juliaca',
        destino: 'Arequipa',
        rutas: [{ id: '3', codigoRuta: '03' }]
      },
      {
        combinacion: 'Cusco → Arequipa',
        origen: 'Cusco',
        destino: 'Arequipa',
        rutas: [{ id: '4', codigoRuta: '04' }]
      }
    ];
    
    console.log('✅ COMBINACIONES SIMPLES CARGADAS:', combinacionesSimples.length);
    
    this.combinacionesDisponibles.set(combinacionesSimples);
    this.combinacionesFiltradas.set(combinacionesSimples);
    
    this.snackBar.open(`${combinacionesSimples.length} combinaciones cargadas (modo simple)`, 'Cerrar', { duration: 3000 });
  }

  onBusquedaRutasInput(event: any): void {
    const value = event.target.value;
    console.log('🔍 BÚSQUEDA INPUT:', value);
    
    this.busquedaRutas.set(value);
    this.filtrarCombinacionesSimple(value);
  }

  private filtrarCombinacionesSimple(busqueda: string): void {
    console.log('🔍 FILTRANDO SIMPLE:', busqueda);
    
    if (!busqueda || busqueda.length < 2) {
      this.combinacionesFiltradas.set(this.combinacionesDisponibles());
      return;
    }

    const busquedaLower = busqueda.toLowerCase();
    const combinacionesFiltradas = this.combinacionesDisponibles().filter(comb =>
      comb.combinacion.toLowerCase().includes(busquedaLower) ||
      comb.origen.toLowerCase().includes(busquedaLower) ||
      comb.destino.toLowerCase().includes(busquedaLower)
    );
    
    console.log('✅ FILTRADO RESULTADO:', {
      busqueda: busqueda,
      encontradas: combinacionesFiltradas.length,
      combinaciones: combinacionesFiltradas.map(c => c.combinacion)
    });
    
    this.combinacionesFiltradas.set(combinacionesFiltradas);
  }

  onCombinacionSelected(event: any): void {
    const combinacion = event.option.value;
    console.log('🎯 COMBINACIÓN SELECCIONADA:', combinacion);
    
    // Agregar a rutas seleccionadas si no existe
    const rutasActuales = this.rutasSeleccionadas();
    const yaExiste = rutasActuales.some(r => r.combinacion === combinacion.combinacion);
    
    if (!yaExiste) {
      this.rutasSeleccionadas.update(rutas => [...rutas, combinacion]);
      this.snackBar.open(`Ruta "${combinacion.combinacion}" agregada`, 'Cerrar', { duration: 2000 });
    } else {
      this.snackBar.open(`La ruta "${combinacion.combinacion}" ya está seleccionada`, 'Cerrar', { duration: 2000 });
    }
    
    // Limpiar el campo de búsqueda
    this.busquedaRutas.set('');
  }

  displayCombinacion = (combinacion: any): string => {
    return combinacion ? combinacion.combinacion : '';
  }
'''

    codigo_template = '''
            <!-- Buscador Inteligente de Rutas (SIMPLE) -->
            <div class="buscador-inteligente">
              <mat-form-field appearance="outline" class="form-field-full">
                <mat-label>Buscador Inteligente de Rutas</mat-label>
                <input matInput 
                       [matAutocomplete]="rutasAuto" 
                       [value]="busquedaRutas()" 
                       (input)="onBusquedaRutasInput($event)"
                       placeholder="Ej: PUNO (mostrará PUNO → JULIACA, etc.)">
                <mat-autocomplete #rutasAuto="matAutocomplete" 
                                 [displayWith]="displayCombinacion"
                                 (optionSelected)="onCombinacionSelected($event)">
                  @for (combinacion of combinacionesFiltradas(); track combinacion.combinacion) {
                    <mat-option [value]="combinacion">
                      <div class="combinacion-option">
                        <div class="combinacion-ruta">
                          <mat-icon>route</mat-icon>
                          {{ combinacion.combinacion }}
                        </div>
                        <div class="combinacion-info">{{ combinacion.rutas.length }} ruta(s)</div>
                      </div>
                    </mat-option>
                  }
                </mat-autocomplete>
                <mat-hint>Escriba cualquier ciudad para ver todas las rutas relacionadas</mat-hint>
              </mat-form-field>
            </div>
'''

    return {
        'signals': codigo_signals,
        'metodos': codigo_metodos,
        'template': codigo_template
    }

def mostrar_instrucciones():
    """Mostrar instrucciones para aplicar el fix"""
    
    print("🔧 FIX DIRECTO PARA EL BUSCADOR INTELIGENTE")
    print("=" * 60)
    
    codigo = generar_codigo_buscador_simple()
    
    print("\n📋 PASO 1: VERIFICAR SIGNALS")
    print("Buscar en el archivo y asegurarse de que estén estos signals:")
    print(codigo['signals'])
    
    print("\n📋 PASO 2: VERIFICAR MÉTODOS")
    print("Buscar estos métodos y asegurarse de que estén implementados:")
    print("- cargarCombinacionesRutas()")
    print("- onBusquedaRutasInput()")
    print("- filtrarCombinacionesSimple()")
    print("- onCombinacionSelected()")
    print("- displayCombinacion()")
    
    print("\n📋 PASO 3: VERIFICAR TEMPLATE")
    print("El template del buscador debe tener esta estructura:")
    print("- mat-form-field con input")
    print("- mat-autocomplete con #rutasAuto")
    print("- @for loop sin | async")
    print("- mat-option con [value]")
    
    print("\n🎯 PASO 4: PROBAR")
    print("1. Expandir 'Filtros Avanzados'")
    print("2. Verificar en consola: '🔄 CARGANDO COMBINACIONES SIMPLES...'")
    print("3. Escribir 'PUNO' en el buscador")
    print("4. Verificar en consola: '🔍 BÚSQUEDA INPUT: PUNO'")
    print("5. Debería aparecer dropdown con 'Puno → Juliaca'")
    
    print("\n⚠️ SI NO FUNCIONA:")
    print("1. Verificar que toggleFiltrosAvanzados() llame a cargarCombinacionesRutas()")
    print("2. Verificar que no haya errores en consola del navegador")
    print("3. Verificar que los imports de Material estén correctos")

if __name__ == "__main__":
    mostrar_instrucciones()
    
    print(f"\n" + "=" * 60)
    print("🚀 SOLUCIÓN SIMPLE")
    print("=" * 60)
    
    print("\nEste fix usa datos hardcodeados para asegurar que funcione.")
    print("Una vez que funcione, se puede conectar al backend.")
    print("\nLa clave es usar signals simples sin Observables:")
    print("- combinacionesFiltradas = signal<any[]>([])")
    print("- Sin | async en el template")
    print("- Logs en consola para debug")