import { Component, OnInit, inject, signal, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { VehiculoBusquedaService, BusquedaSugerencia, ResultadoBusquedaGlobal } from '../../services/vehiculo-busqueda.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Componente de búsqueda global inteligente para vehículos
 * Proporciona búsqueda en tiempo real con sugerencias y autocompletado
 */
@Component({
  selector: 'app-vehiculo-busqueda-global',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  template: `
    <div class="busqueda-global-container">
      <mat-form-field appearance="outline" class="busqueda-field">
        <mat-label>{{ label() }}</mat-label>
        <input 
          matInput
          [formControl]="busquedaControl"
          [placeholder]="placeholder()"
          [matAutocomplete]="auto"
          (focus)="onFocus()"
          (blur)="onBlur()">
        
        <!-- Icono de búsqueda o loading -->
        @if (buscando()) {
          <mat-spinner matSuffix diameter="20"></mat-spinner>
        } @else {
          <app-smart-icon 
            [iconName]="'search'" 
            [size]="20" 
            matSuffix>
          </app-smart-icon>
        }

        <!-- Botón para limpiar -->
        @if (busquedaControl.value) {
          <button 
            mat-icon-button 
            matSuffix 
            (click)="limpiarBusqueda()"
            type="button"
            class="clear-button">
            <app-smart-icon 
              [iconName]="'close'" 
              [size]="18" 
              [clickable]="true">
            </app-smart-icon>
          </button>
        }

        <mat-hint>{{ hint() }}</mat-hint>
      </mat-form-field>

      <!-- Autocompletado con sugerencias -->
      <mat-autocomplete 
        #auto="matAutocomplete"
        (optionSelected)="onSugerenciaSeleccionada($event.option.value)"
        [displayWith]="displaySugerencia">
        
        <!-- Sugerencias agrupadas por tipo -->
        @if (sugerencias().length > 0) {
          <!-- Sugerencias de vehículos -->
          @for (sugerencia of getSugerenciasPorTipo('vehiculo'); track sugerencia.valor) {
            <mat-option [value]="sugerencia" class="sugerencia-option vehiculo">
              <div class="sugerencia-content">
                <app-smart-icon 
                  [iconName]="sugerencia.icono" 
                  [size]="20"
                  class="sugerencia-icon">
                </app-smart-icon>
                <div class="sugerencia-text">
                  <span class="sugerencia-titulo" [innerHTML]="resaltarTexto(sugerencia.texto)"></span>
                  @if (sugerencia.vehiculo) {
                    <span class="sugerencia-subtitulo">
                      {{ sugerencia.vehiculo.categoria }} - {{ sugerencia.vehiculo.estado }}
                    </span>
                  }
                </div>
              </div>
            </mat-option>
          }

          <!-- Divisor si hay empresas -->
          @if (getSugerenciasPorTipo('empresa').length > 0 && getSugerenciasPorTipo('vehiculo').length > 0) {
            <mat-option disabled class="divider-option">
              <div class="sugerencia-divider">Empresas</div>
            </mat-option>
          }

          <!-- Sugerencias de empresas -->
          @for (sugerencia of getSugerenciasPorTipo('empresa'); track sugerencia.valor) {
            <mat-option [value]="sugerencia" class="sugerencia-option empresa">
              <div class="sugerencia-content">
                <app-smart-icon 
                  [iconName]="sugerencia.icono" 
                  [size]="20"
                  class="sugerencia-icon">
                </app-smart-icon>
                <div class="sugerencia-text">
                  <span class="sugerencia-titulo" [innerHTML]="resaltarTexto(sugerencia.texto)"></span>
                  @if (sugerencia.empresa) {
                    <span class="sugerencia-subtitulo">
                      RUC: {{ sugerencia.empresa.ruc }}
                    </span>
                  }
                </div>
              </div>
            </mat-option>
          }

          <!-- Divisor si hay resoluciones -->
          @if (getSugerenciasPorTipo('resolucion').length > 0 && 
               (getSugerenciasPorTipo('vehiculo').length > 0 || getSugerenciasPorTipo('empresa').length > 0)) {
            <mat-option disabled class="divider-option">
              <div class="sugerencia-divider">Resoluciones</div>
            </mat-option>
          }

          <!-- Sugerencias de resoluciones -->
          @for (sugerencia of getSugerenciasPorTipo('resolucion'); track sugerencia.valor) {
            <mat-option [value]="sugerencia" class="sugerencia-option resolucion">
              <div class="sugerencia-content">
                <app-smart-icon 
                  [iconName]="sugerencia.icono" 
                  [size]="20"
                  class="sugerencia-icon">
                </app-smart-icon>
                <div class="sugerencia-text">
                  <span class="sugerencia-titulo" [innerHTML]="resaltarTexto(sugerencia.texto)"></span>
                </div>
              </div>
            </mat-option>
          }
        } @else if (busquedaControl.value && !buscando()) {
          <!-- Sin resultados -->
          <mat-option disabled class="no-results-option">
            <div class="no-results">
              <app-smart-icon [iconName]="'search_off'" [size]="32"></app-smart-icon>
              <p>No se encontraron resultados</p>
              <small>Intenta con otros términos de búsqueda</small>
            </div>
          </mat-option>
        }
      </mat-autocomplete>

      <!-- Chips de búsqueda reciente (opcional) -->
      @if (mostrarRecientes() && busquedasRecientes().length > 0 && !busquedaControl.value) {
        <div class="busquedas-recientes">
          <small class="recientes-label">Búsquedas recientes:</small>
          <mat-chip-set>
            @for (busqueda of busquedasRecientes(); track busqueda) {
              <mat-chip 
                (click)="aplicarBusquedaReciente(busqueda)"
                class="chip-reciente">
                <app-smart-icon [iconName]="'history'" [size]="16"></app-smart-icon>
                {{ busqueda }}
              </mat-chip>
            }
          </mat-chip-set>
        </div>
      }
    </div>
  `,
  styles: [`
    .busqueda-global-container {
      width: 100%;
      position: relative;
    }

    .busqueda-field {
      width: 100%;
    }

    .clear-button {
      margin-right: -8px;
    }

    .sugerencia-option {
      padding: 12px 16px;
      min-height: 56px;
    }

    .sugerencia-content {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .sugerencia-icon {
      flex-shrink: 0;
    }

    .sugerencia-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .sugerencia-titulo {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sugerencia-titulo ::ng-deep mark {
      background-color: #fff59d;
      padding: 2px 4px;
      border-radius: 2px;
      font-weight: 600;
    }

    .sugerencia-subtitulo {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .divider-option {
      pointer-events: none;
      opacity: 1 !important;
      padding: 8px 16px;
      min-height: 32px;
    }

    .sugerencia-divider {
      font-size: 12px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .no-results-option {
      pointer-events: none;
      opacity: 1 !important;
      padding: 24px 16px;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
    }

    .no-results p {
      margin: 0;
      font-weight: 500;
    }

    .no-results small {
      font-size: 12px;
    }

    .busquedas-recientes {
      margin-top: 8px;
      padding: 8px 0;
    }

    .recientes-label {
      display: block;
      margin-bottom: 8px;
      color: rgba(0, 0, 0, 0.6);
      font-size: 12px;
    }

    .chip-reciente {
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .chip-reciente:hover {
      background-color: rgba(0, 0, 0, 0.08);
    }

    /* Estilos específicos por tipo */
    .sugerencia-option.vehiculo .sugerencia-icon {
      color: #1976d2;
    }

    .sugerencia-option.empresa .sugerencia-icon {
      color: #388e3c;
    }

    .sugerencia-option.resolucion .sugerencia-icon {
      color: #f57c00;
    }
  `]
})
export class VehiculoBusquedaGlobalComponent implements OnInit {
  private busquedaService = inject(VehiculoBusquedaService);

  // Inputs
  label = input<string>('Búsqueda Global');
  placeholder = input<string>('Buscar por placa, marca, empresa, resolución...');
  hint = input<string>('Escribe para buscar en todos los campos');
  mostrarRecientes = input<boolean>(true);
  maxRecientes = input<number>(5);

  // Outputs
  busquedaRealizada = output<ResultadoBusquedaGlobal>();
  sugerenciaSeleccionada = output<BusquedaSugerencia>();
  vehiculoSeleccionado = output<Vehiculo>();

  // Señales
  buscando = signal(false);
  sugerencias = signal<BusquedaSugerencia[]>([]);
  busquedasRecientes = signal<string[]>([]);
  terminoActual = signal('');

  // Control del formulario
  busquedaControl = new FormControl('');

  ngOnInit() {
    this.configurarBusqueda();
    this.cargarBusquedasRecientes();
  }

  /**
   * Configura la búsqueda en tiempo real con debounce
   */
  private configurarBusqueda() {
    this.busquedaControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(termino => {
        if (!termino || termino.trim().length === 0) {
          this.sugerencias.set([]);
          return of(null);
        }

        this.buscando.set(true);
        this.terminoActual.set(termino);
        
        return this.busquedaService.buscarGlobal(termino).pipe(
          catchError(error => {
            console.error('Error en búsqueda global:', error);
            return of(null);
          })
        );
      })
    ).subscribe((resultado: any) => {
      this.buscando.set(false);
      
      if (resultado) {
        this.sugerencias.set(resultado.sugerencias);
        this.busquedaRealizada.emit(resultado);
      }
    });
  }

  /**
   * Maneja la selección de una sugerencia
   */
  onSugerenciaSeleccionada(sugerencia: BusquedaSugerencia) {
    this.sugerenciaSeleccionada.emit(sugerencia);
    
    // Si es un vehículo, emitir evento específico
    if (sugerencia.tipo === 'vehiculo' && sugerencia.vehiculo) {
      this.vehiculoSeleccionado.emit(sugerencia.vehiculo);
    }

    // Guardar en búsquedas recientes
    this.agregarBusquedaReciente(this.terminoActual());
    
    // Limpiar el campo
    this.busquedaControl.setValue('', { emitEvent: false });
  }

  /**
   * Obtiene sugerencias filtradas por tipo
   */
  getSugerenciasPorTipo(tipo: 'vehiculo' | 'empresa' | 'resolucion'): BusquedaSugerencia[] {
    return this.sugerencias().filter((s: any) => s.tipo === tipo);
  }

  /**
   * Resalta el término de búsqueda en el texto
   */
  resaltarTexto(texto: string): string {
    return this.busquedaService.resaltarTermino(texto, this.terminoActual());
  }

  /**
   * Función para mostrar el valor en el input del autocomplete
   */
  displaySugerencia(sugerencia: BusquedaSugerencia | null): string {
    return sugerencia ? sugerencia.texto : '';
  }

  /**
   * Limpia el campo de búsqueda
   */
  limpiarBusqueda() {
    this.busquedaControl.setValue('');
    this.sugerencias.set([]);
    this.terminoActual.set('');
  }

  /**
   * Maneja el evento de focus
   */
  onFocus() {
    // Podría mostrar sugerencias populares o recientes
  }

  /**
   * Maneja el evento de blur
   */
  onBlur() {
    // Lógica adicional si es necesaria
  }

  /**
   * Carga búsquedas recientes desde localStorage
   */
  private cargarBusquedasRecientes() {
    try {
      const recientes = localStorage.getItem('vehiculos_busquedas_recientes');
      if (recientes) {
        this.busquedasRecientes.set(JSON.parse(recientes));
      }
    } catch (error) {
      console.error('Error cargando búsquedas recientes:', error);
    }
  }

  /**
   * Agrega una búsqueda a la lista de recientes
   */
  private agregarBusquedaReciente(termino: string) {
    if (!termino || termino.trim().length === 0) {
      return;
    }

    const recientes = this.busquedasRecientes();
    const terminoLimpio = termino.trim();

    // Evitar duplicados
    const nuevasRecientes = [
      terminoLimpio,
      ...recientes.filter((b: any) => b !== terminoLimpio)
    ].slice(0, this.maxRecientes());

    this.busquedasRecientes.set(nuevasRecientes);

    // Guardar en localStorage
    try {
      localStorage.setItem('vehiculos_busquedas_recientes', JSON.stringify(nuevasRecientes));
    } catch (error) {
      console.error('Error guardando búsquedas recientes:', error);
    }
  }

  /**
   * Aplica una búsqueda reciente
   */
  aplicarBusquedaReciente(termino: string) {
    this.busquedaControl.setValue(termino);
  }
}
