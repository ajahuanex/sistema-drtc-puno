import { Component, OnInit, OnDestroy, inject, signal, computed, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, of, Subject, combineLatest } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs/operators';
import { RutaService } from '../../services/ruta.service';
import { LocalidadService } from '../../services/localidad.service';
import { EmpresaService } from '../../services/empresa.service';
import { Ruta } from '../../models/ruta.model';
import { Localidad } from '../../models/localidad.model';
import { Empresa } from '../../models/empresa.model';

export interface SugerenciaBusqueda {
  tipo: 'ruta' | 'empresa' | 'localidad' | 'codigo' | 'combinacion';
  valor: string;
  descripcion: string;
  datos?: any;
  icono: string;
}

export interface ResultadoBusqueda {
  termino: string;
  tipo: 'general' | 'codigo' | 'empresa' | 'localidad' | 'combinacion';
  rutas: Ruta[];
}

@Component({
  selector: 'app-buscador-general-rutas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-card class="buscador-card">
      <mat-card-content>
        <div class="buscador-container">
          <!-- Campo de búsqueda principal -->
          <mat-form-field appearance="outline" class="buscador-field">
            <mat-label>Buscar rutas...</mat-label>
            <input matInput 
                   [formControl]="busquedaControl"
                   [matAutocomplete]="auto"
                   placeholder="Código, empresa, origen-destino, etc."
                   (keydown.enter)="buscar()">
            <button matSuffix 
                    mat-icon-button 
                    (click)="buscar()"
                    [disabled]="!busquedaControl.value"
                    matTooltip="Buscar">
              <mat-icon>search</mat-icon>
            </button>
            
            <!-- Autocomplete con sugerencias -->
            <mat-autocomplete #auto="matAutocomplete" 
                             [displayWith]="displaySugerencia"
                             (optionSelected)="onSugerenciaSeleccionada($event.option.value)">
              @for (sugerencia of sugerenciasFiltradas | async; track sugerencia.valor) {
                <mat-option [value]="sugerencia" class="sugerencia-option">
                  <div class="sugerencia-content">
                    <mat-icon class="sugerencia-icon">{{ sugerencia.icono }}</mat-icon>
                    <div class="sugerencia-info">
                      <span class="sugerencia-valor">{{ sugerencia.valor }}</span>
                      <span class="sugerencia-descripcion">{{ sugerencia.descripcion }}</span>
                    </div>
                    <span class="sugerencia-tipo">{{ getTipoLabel(sugerencia.tipo) }}</span>
                  </div>
                </mat-option>
              }
              
              @if ((sugerenciasFiltradas | async)?.length === 0 && busquedaControl.value) {
                <mat-option disabled>
                  <div class="no-sugerencias">
                    <mat-icon>search_off</mat-icon>
                    <span>No se encontraron sugerencias</span>
                  </div>
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          <!-- Botones de acción -->
          <div class="buscador-actions">
            <button mat-icon-button 
                    [matMenuTriggerFor]="busquedaMenu"
                    matTooltip="Opciones de búsqueda">
              <mat-icon>more_vert</mat-icon>
            </button>
            
            <mat-menu #busquedaMenu="matMenu">
              <button mat-menu-item (click)="busquedaAvanzada()">
                <mat-icon>tune</mat-icon>
                Búsqueda Avanzada
              </button>
              <button mat-menu-item (click)="limpiarBusqueda()">
                <mat-icon>clear</mat-icon>
                Limpiar Búsqueda
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="guardarBusqueda()" [disabled]="!busquedaControl.value">
                <mat-icon>bookmark</mat-icon>
                Guardar Búsqueda
              </button>
              <button mat-menu-item (click)="mostrarHistorial()">
                <mat-icon>history</mat-icon>
                Historial
              </button>
            </mat-menu>

            <button mat-button 
                    (click)="limpiarBusqueda()"
                    [disabled]="!busquedaControl.value">
              <mat-icon>clear</mat-icon>
              Limpiar
            </button>
          </div>
        </div>

        <!-- Chips de búsquedas recientes -->
        @if (busquedasRecientes().length > 0) {
          <div class="busquedas-recientes">
            <span class="recientes-label">Búsquedas recientes:</span>
            <mat-chip-set>
              @for (busqueda of busquedasRecientes(); track busqueda) {
                <mat-chip (click)="aplicarBusquedaReciente(busqueda)" 
                         class="busqueda-reciente-chip">
                  {{ busqueda }}
                  <button matChipRemove (click)="eliminarBusquedaReciente(busqueda)">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              }
            </mat-chip-set>
          </div>
        }

        <!-- Sugerencias rápidas -->
        <div class="sugerencias-rapidas">
          <span class="sugerencias-label">Búsquedas rápidas:</span>
          <div class="sugerencias-buttons">
            <button mat-stroked-button 
                    size="small"
                    (click)="busquedaRapida('activas')"
                    class="sugerencia-rapida">
              <mat-icon>check_circle</mat-icon>
              Rutas Activas
            </button>
            <button mat-stroked-button 
                    size="small"
                    (click)="busquedaRapida('urbanas')"
                    class="sugerencia-rapida">
              <mat-icon>location_city</mat-icon>
              Rutas Urbanas
            </button>
            <button mat-stroked-button 
                    size="small"
                    (click)="busquedaRapida('interprovinciales')"
                    class="sugerencia-rapida">
              <mat-icon>map</mat-icon>
              Interprovinciales
            </button>
            <button mat-stroked-button 
                    size="small"
                    (click)="busquedaRapida('sin_frecuencias')"
                    class="sugerencia-rapida">
              <mat-icon>warning</mat-icon>
              Sin Frecuencias
            </button>
          </div>
        </div>

        <!-- Resultados de búsqueda -->
        @if (ultimoResultado()) {
          <div class="resultado-busqueda">
            <div class="resultado-header">
              <div class="resultado-info">
                <mat-icon>search</mat-icon>
                <span class="resultado-termino">"{{ ultimoResultado()!.termino }}"</span>
                <span class="resultado-count">{{ ultimoResultado()!.rutas.length }} resultado(s)</span>
              </div>
              <button mat-icon-button 
                      (click)="limpiarResultados()"
                      matTooltip="Limpiar resultados">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            @if (ultimoResultado()!.rutas.length > 0) {
              <div class="resultado-tipo">
                <span class="tipo-badge tipo-{{ ultimoResultado()!.tipo }}">
                  {{ getTipoResultadoLabel(ultimoResultado()!.tipo) }}
                </span>
              </div>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .buscador-card {
      margin-bottom: 20px;
      border: 1px solid #e3f2fd;
    }

    .buscador-container {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .buscador-field {
      flex: 1;
      min-width: 300px;
    }

    .buscador-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .sugerencia-option {
      padding: 8px 16px !important;
      min-height: 60px !important;
    }

    .sugerencia-content {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .sugerencia-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .sugerencia-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sugerencia-valor {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .sugerencia-descripcion {
      font-size: 12px;
      color: #666;
    }

    .sugerencia-tipo {
      font-size: 11px;
      color: #1976d2;
      background-color: #e3f2fd;
      padding: 2px 6px;
      border-radius: 10px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .no-sugerencias {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-style: italic;
    }

    .busquedas-recientes {
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .recientes-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .busqueda-reciente-chip {
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .busqueda-reciente-chip:hover {
      background-color: #e3f2fd;
    }

    .sugerencias-rapidas {
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .sugerencias-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      margin-right: 8px;
    }

    .sugerencias-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .sugerencia-rapida {
      font-size: 12px;
      height: 32px;
      padding: 0 12px;
    }

    .sugerencia-rapida mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .resultado-busqueda {
      margin-top: 16px;
      padding: 12px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .resultado-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .resultado-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .resultado-termino {
      font-weight: 500;
      color: #1976d2;
    }

    .resultado-count {
      font-size: 12px;
      color: #666;
      background-color: #e3f2fd;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .resultado-tipo {
      margin-top: 8px;
    }

    .tipo-badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .tipo-general {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .tipo-codigo {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .tipo-empresa {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .tipo-localidad {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .tipo-combinacion {
      background-color: #fce4ec;
      color: #c2185b;
    }

    @media (max-width: 768px) {
      .buscador-container {
        flex-direction: column;
        align-items: stretch;
      }

      .buscador-field {
        min-width: auto;
      }

      .buscador-actions {
        justify-content: flex-end;
      }

      .busquedas-recientes,
      .sugerencias-rapidas {
        flex-direction: column;
        align-items: flex-start;
      }

      .sugerencias-buttons {
        width: 100%;
      }

      .sugerencia-rapida {
        flex: 1;
        min-width: 120px;
      }
    }
  `]
})
export class BuscadorGeneralRutasComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private rutaService = inject(RutaService);
  private localidadService = inject(LocalidadService);
  private empresaService = inject(EmpresaService);

  @Input() rutas: Ruta[] = [];
  @Output() resultadoBusqueda = new EventEmitter<ResultadoBusqueda>();
  @Output() busquedaLimpiada = new EventEmitter<void>();

  // Form control
  busquedaControl = new FormControl('');

  // Signals
  sugerencias = signal<SugerenciaBusqueda[]>([]);
  busquedasRecientes = signal<string[]>([]);
  ultimoResultado = signal<ResultadoBusqueda | null>(null);

  // Observables
  sugerenciasFiltradas!: Observable<SugerenciaBusqueda[]>;

  ngOnInit(): void {
    this.cargarBusquedasRecientes();
    this.configurarAutocompletado();
    this.generarSugerencias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configurarAutocompletado(): void {
    this.sugerenciasFiltradas = this.busquedaControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(valor => {
        if (typeof valor === 'string' && valor.length >= 2) {
          return this.filtrarSugerencias(valor);
        }
        return of([]);
      }),
      takeUntil(this.destroy$)
    );
  }

  private async generarSugerencias(): Promise<void> {
    try {
      const [empresas, localidades] = await Promise.all([
        this.empresaService.getEmpresas().pipe(takeUntil(this.destroy$)).toPromise(),
        this.localidadService.obtenerLocalidades()
      ]);

      const sugerencias: SugerenciaBusqueda[] = [];

      // Sugerencias de empresas
      empresas?.forEach(empresa => {
        sugerencias.push({
          tipo: 'empresa',
          valor: empresa.ruc,
          descripcion: empresa.razonSocial?.principal || 'Sin razón social',
          datos: empresa,
          icono: 'business'
        });
      });

      // Sugerencias de localidades
      localidades?.forEach(localidad => {
        sugerencias.push({
          tipo: 'localidad',
          valor: localidad.nombre,
          descripcion: `${localidad.provincia}, ${localidad.departamento}`,
          datos: localidad,
          icono: 'place'
        });
      });

      // Sugerencias de códigos de ruta únicos
      const codigosUnicos = [...new Set(this.rutas.map(r => r.codigoRuta))];
      codigosUnicos.forEach(codigo => {
        const rutasConCodigo = this.rutas.filter(r => r.codigoRuta === codigo);
        sugerencias.push({
          tipo: 'codigo',
          valor: codigo,
          descripcion: `${rutasConCodigo.length} ruta(s) con este código`,
          datos: { codigo, rutas: rutasConCodigo },
          icono: 'confirmation_number'
        });
      });

      // Sugerencias de combinaciones origen-destino populares
      const combinaciones = new Map<string, Ruta[]>();
      this.rutas.forEach(ruta => {
        const origen = ruta.origen?.nombre || ruta.origen;
        const destino = ruta.destino?.nombre || ruta.destino;
        if (origen && destino) {
          const clave = `${origen} - ${destino}`;
          if (!combinaciones.has(clave)) {
            combinaciones.set(clave, []);
          }
          combinaciones.get(clave)!.push(ruta);
        }
      });

      // Agregar las 10 combinaciones más populares
      Array.from(combinaciones.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10)
        .forEach(([combinacion, rutas]) => {
          sugerencias.push({
            tipo: 'combinacion',
            valor: combinacion,
            descripcion: `${rutas.length} ruta(s) disponible(s)`,
            datos: { combinacion, rutas },
            icono: 'route'
          });
        });

      this.sugerencias.set(sugerencias);
    } catch (error) {
      console.error('Error generando sugerencias:', error);
    }
  }

  private filtrarSugerencias(valor: string): Observable<SugerenciaBusqueda[]> {
    const filtro = valor.toLowerCase();
    const sugerenciasFiltradas = this.sugerencias().filter(sugerencia =>
      sugerencia.valor.toLowerCase().includes(filtro) ||
      sugerencia.descripcion.toLowerCase().includes(filtro)
    ).slice(0, 8); // Limitar a 8 sugerencias

    return of(sugerenciasFiltradas);
  }

  displaySugerencia(sugerencia: SugerenciaBusqueda): string {
    return sugerencia ? sugerencia.valor : '';
  }

  getTipoLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'ruta': 'Ruta',
      'empresa': 'Empresa',
      'localidad': 'Localidad',
      'codigo': 'Código',
      'combinacion': 'Ruta'
    };
    return labels[tipo] || tipo;
  }

  getTipoResultadoLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'general': 'Búsqueda General',
      'codigo': 'Por Código',
      'empresa': 'Por Empresa',
      'localidad': 'Por Localidad',
      'combinacion': 'Por Ruta'
    };
    return labels[tipo] || tipo;
  }

  onSugerenciaSeleccionada(sugerencia: SugerenciaBusqueda): void {
    this.busquedaControl.setValue(sugerencia.valor);
    this.buscarPorSugerencia(sugerencia);
  }

  buscar(): void {
    const termino = this.busquedaControl.value;
    if (!termino || termino.trim().length === 0) return;

    this.agregarBusquedaReciente(termino.trim());
    this.realizarBusqueda(termino.trim());
  }

  busquedaRapida(tipo: string): void {
    let termino = '';
    let resultados: Ruta[] = [];

    switch (tipo) {
      case 'activas':
        termino = 'Rutas Activas';
        resultados = this.rutas.filter(r => r.estado === 'ACTIVA');
        break;
      case 'urbanas':
        termino = 'Rutas Urbanas';
        resultados = this.rutas.filter(r => r.tipoRuta === 'URBANA');
        break;
      case 'interprovinciales':
        termino = 'Rutas Interprovinciales';
        resultados = this.rutas.filter(r => r.tipoRuta === 'INTERPROVINCIAL');
        break;
      case 'sin_frecuencias':
        termino = 'Sin Frecuencias';
        resultados = this.rutas.filter(r => !r.frecuencia || !r.frecuencia.descripcion || r.frecuencia.descripcion.trim() === '');
        break;
    }

    this.busquedaControl.setValue(termino);
    this.emitirResultado({
      termino,
      tipo: 'general',
      rutas: resultados
    });
  }

  private buscarPorSugerencia(sugerencia: SugerenciaBusqueda): void {
    let resultados: Ruta[] = [];
    let tipo: ResultadoBusqueda['tipo'] = 'general';

    switch (sugerencia.tipo) {
      case 'empresa':
        resultados = this.rutas.filter(r => r.empresa?.ruc === sugerencia.valor);
        tipo = 'empresa';
        break;
      case 'localidad':
        resultados = this.rutas.filter(r => 
          (r.origen?.nombre || r.origen) === sugerencia.valor ||
          (r.destino?.nombre || r.destino) === sugerencia.valor
        );
        tipo = 'localidad';
        break;
      case 'codigo':
        resultados = this.rutas.filter(r => r.codigoRuta === sugerencia.valor);
        tipo = 'codigo';
        break;
      case 'combinacion':
        resultados = sugerencia.datos?.rutas || [];
        tipo = 'combinacion';
        break;
    }

    this.emitirResultado({
      termino: sugerencia.valor,
      tipo,
      rutas: resultados
    });
  }

  private realizarBusqueda(termino: string): void {
    const terminoLower = termino.toLowerCase();
    
    // Buscar en múltiples campos
    const resultados = this.rutas.filter(ruta => {
      return (
        // Código de ruta
        ruta.codigoRuta.toLowerCase().includes(terminoLower) ||
        // Nombre/descripción
        (ruta.nombre && ruta.nombre.toLowerCase().includes(terminoLower)) ||
        (ruta.descripcion && ruta.descripcion.toLowerCase().includes(terminoLower)) ||
        // Empresa
        (ruta.empresa?.ruc && ruta.empresa.ruc.toLowerCase().includes(terminoLower)) ||
        (ruta.empresa?.razonSocial && 
         typeof ruta.empresa.razonSocial === 'string' && 
         ruta.empresa.razonSocial.toLowerCase().includes(terminoLower)) ||
        (ruta.empresa?.razonSocial && 
         typeof ruta.empresa.razonSocial === 'object' &&
         ruta.empresa.razonSocial.principal && 
         ruta.empresa.razonSocial.principal.toLowerCase().includes(terminoLower)) ||
        // Origen y destino
        (ruta.origen?.nombre && ruta.origen.nombre.toLowerCase().includes(terminoLower)) ||
        (typeof ruta.origen === 'string' && (ruta.origen as string).toLowerCase().includes(terminoLower)) ||
        (ruta.destino?.nombre && ruta.destino.nombre.toLowerCase().includes(terminoLower)) ||
        (typeof ruta.destino === 'string' && (ruta.destino as string).toLowerCase().includes(terminoLower)) ||
        // Frecuencias
        (ruta.frecuencia?.descripcion && ruta.frecuencia.descripcion.toLowerCase().includes(terminoLower)) ||
        // Resolución
        (ruta.resolucion?.nroResolucion && ruta.resolucion.nroResolucion.toLowerCase().includes(terminoLower))
      );
    });

    this.emitirResultado({
      termino,
      tipo: 'general',
      rutas: resultados
    });
  }

  private emitirResultado(resultado: ResultadoBusqueda): void {
    this.ultimoResultado.set(resultado);
    this.resultadoBusqueda.emit(resultado);
  }

  limpiarBusqueda(): void {
    this.busquedaControl.setValue('');
    this.limpiarResultados();
  }

  limpiarResultados(): void {
    this.ultimoResultado.set(null);
    this.busquedaLimpiada.emit();
  }

  busquedaAvanzada(): void {
    // Emitir evento para mostrar filtros avanzados
    // Esto se manejará en el componente padre
  }

  aplicarBusquedaReciente(busqueda: string): void {
    this.busquedaControl.setValue(busqueda);
    this.realizarBusqueda(busqueda);
  }

  eliminarBusquedaReciente(busqueda: string): void {
    const recientes = this.busquedasRecientes().filter(b => b !== busqueda);
    this.busquedasRecientes.set(recientes);
    this.guardarBusquedasRecientes();
  }

  guardarBusqueda(): void {
    const termino = this.busquedaControl.value;
    if (termino) {
      this.agregarBusquedaReciente(termino);
    }
  }

  mostrarHistorial(): void {
    // Implementar modal de historial si es necesario
    console.log('Historial de búsquedas:', this.busquedasRecientes());
  }

  private agregarBusquedaReciente(termino: string): void {
    const recientes = this.busquedasRecientes().filter(b => b !== termino);
    recientes.unshift(termino);
    
    // Mantener solo las últimas 5 búsquedas
    const nuevasRecientes = recientes.slice(0, 5);
    this.busquedasRecientes.set(nuevasRecientes);
    this.guardarBusquedasRecientes();
  }

  private cargarBusquedasRecientes(): void {
    try {
      const recientes = localStorage.getItem('busquedas_recientes_rutas');
      if (recientes) {
        this.busquedasRecientes.set(JSON.parse(recientes));
      }
    } catch (error) {
      console.error('Error cargando búsquedas recientes:', error);
    }
  }

  private guardarBusquedasRecientes(): void {
    try {
      localStorage.setItem('busquedas_recientes_rutas', JSON.stringify(this.busquedasRecientes()));
    } catch (error) {
      console.error('Error guardando búsquedas recientes:', error);
    }
  }
}