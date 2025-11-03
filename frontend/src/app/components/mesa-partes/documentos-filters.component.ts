import { Component, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DateRangePickerComponent, RangoFechas } from '../../shared/date-range-picker.component';
import { 
  FiltrosDocumento, 
  EstadoDocumento, 
  PrioridadDocumento 
} from '../../models/mesa-partes/documento.model';
import { DocumentoService } from '../../services/mesa-partes/documento.service';

/**
 * Componente de filtros para lista de documentos
 * Requirements: 5.1, 5.2, 5.3
 */
@Component({
  selector: 'app-documentos-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    DateRangePickerComponent
  ],
  template: `
    <div class="filters-container">
      <!-- Búsqueda rápida -->
      <div class="quick-search">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Búsqueda rápida</mat-label>
          <input matInput 
                 [formControl]="busquedaRapidaControl"
                 placeholder="Buscar por expediente, remitente o asunto..."
                 (keyup.enter)="aplicarFiltros()">
          <mat-icon matPrefix>search</mat-icon>
          @if (busquedaRapidaControl.value) {
            <button matSuffix 
                    mat-icon-button 
                    (click)="limpiarBusquedaRapida()"
                    matTooltip="Limpiar búsqueda">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <button mat-raised-button 
                color="primary"
                (click)="aplicarFiltros()"
                class="search-button">
          <mat-icon>search</mat-icon>
          Buscar
        </button>
      </div>

      <!-- Filtros avanzados -->
      <mat-expansion-panel class="filters-panel" [expanded]="panelExpandido()">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>filter_list</mat-icon>
            Filtros Avanzados
            @if (contadorFiltrosActivos() > 0) {
              <span class="filters-badge">{{ contadorFiltrosActivos() }}</span>
            }
          </mat-panel-title>
        </mat-expansion-panel-header>

        <form [formGroup]="filtrosForm" class="filters-form">
          <div class="filters-grid">
            <!-- Filtro por Estado -->
            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado" multiple>
                <mat-option [value]="EstadoDocumento.REGISTRADO">
                  Registrado
                </mat-option>
                <mat-option [value]="EstadoDocumento.EN_PROCESO">
                  En Proceso
                </mat-option>
                <mat-option [value]="EstadoDocumento.ATENDIDO">
                  Atendido
                </mat-option>
                <mat-option [value]="EstadoDocumento.ARCHIVADO">
                  Archivado
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>assignment</mat-icon>
            </mat-form-field>

            <!-- Filtro por Tipo de Documento -->
            <mat-form-field appearance="outline">
              <mat-label>Tipo de Documento</mat-label>
              <mat-select formControlName="tipoDocumentoId">
                <mat-option [value]="null">Todos</mat-option>
                @for (tipo of tiposDocumento(); track tipo.id) {
                  <mat-option [value]="tipo.id">
                    {{ tipo.nombre }}
                  </mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>

            <!-- Filtro por Prioridad -->
            <mat-form-field appearance="outline">
              <mat-label>Prioridad</mat-label>
              <mat-select formControlName="prioridad" multiple>
                <mat-option [value]="PrioridadDocumento.NORMAL">
                  Normal
                </mat-option>
                <mat-option [value]="PrioridadDocumento.ALTA">
                  Alta
                </mat-option>
                <mat-option [value]="PrioridadDocumento.URGENTE">
                  Urgente
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>priority_high</mat-icon>
            </mat-form-field>

            <!-- Filtro por Remitente -->
            <mat-form-field appearance="outline">
              <mat-label>Remitente</mat-label>
              <input matInput formControlName="remitente" placeholder="Nombre del remitente">
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <!-- Filtro por Asunto -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Asunto</mat-label>
              <input matInput formControlName="asunto" placeholder="Palabras clave en el asunto">
              <mat-icon matPrefix>subject</mat-icon>
            </mat-form-field>

            <!-- Filtro por Número de Expediente -->
            <mat-form-field appearance="outline">
              <mat-label>Número de Expediente</mat-label>
              <input matInput formControlName="numeroExpediente" placeholder="EXP-2025-0001">
              <mat-icon matPrefix>tag</mat-icon>
            </mat-form-field>
          </div>

          <!-- Filtro por Rango de Fechas -->
          <div class="date-filter">
            <app-date-range-picker
              label="Rango de Fechas"
              hint="Seleccione el período de recepción"
              [mostrarBotones]="true"
              (rangoChange)="onRangoFechasChange($event)">
            </app-date-range-picker>
          </div>

          <!-- Acciones de filtros -->
          <div class="filters-actions">
            <button mat-button 
                    type="button"
                    (click)="limpiarFiltros()"
                    [disabled]="!tieneFiltrosActivos()">
              <mat-icon>clear_all</mat-icon>
              Limpiar Filtros
            </button>

            <div class="action-buttons">
              <button mat-stroked-button 
                      type="button"
                      (click)="cerrarPanel()">
                Cancelar
              </button>
              
              <button mat-raised-button 
                      color="primary"
                      type="button"
                      (click)="aplicarFiltros()">
                <mat-icon>check</mat-icon>
                Aplicar Filtros
              </button>
            </div>
          </div>
        </form>
      </mat-expansion-panel>

      <!-- Chips de filtros activos -->
      @if (contadorFiltrosActivos() > 0) {
        <div class="active-filters">
          <span class="filters-label">Filtros activos:</span>
          <mat-chip-set class="filters-chips">
            @if (filtrosAplicados.estado && filtrosAplicados.estado.length > 0) {
              <mat-chip (removed)="removerFiltro('estado')">
                Estado: {{ filtrosAplicados.estado.length }} seleccionado(s)
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            }
            
            @if (filtrosAplicados.tipoDocumentoId) {
              <mat-chip (removed)="removerFiltro('tipoDocumentoId')">
                Tipo: {{ getNombreTipoDocumento(filtrosAplicados.tipoDocumentoId) }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            }
            
            @if (filtrosAplicados.prioridad && filtrosAplicados.prioridad.length > 0) {
              <mat-chip (removed)="removerFiltro('prioridad')">
                Prioridad: {{ filtrosAplicados.prioridad.length }} seleccionada(s)
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            }
            
            @if (filtrosAplicados.remitente) {
              <mat-chip (removed)="removerFiltro('remitente')">
                Remitente: {{ filtrosAplicados.remitente }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            }
            
            @if (filtrosAplicados.asunto) {
              <mat-chip (removed)="removerFiltro('asunto')">
                Asunto: {{ filtrosAplicados.asunto }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            }
            
            @if (filtrosAplicados.numeroExpediente) {
              <mat-chip (removed)="removerFiltro('numeroExpediente')">
                Expediente: {{ filtrosAplicados.numeroExpediente }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            }
            
            @if (filtrosAplicados.fechaDesde || filtrosAplicados.fechaHasta) {
              <mat-chip (removed)="removerFiltro('fechas')">
                Fechas: {{ formatearRangoFechas() }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            }
          </mat-chip-set>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      background: white;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .quick-search {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .search-field {
      flex: 1;
      margin: 0;
    }

    .search-button {
      height: 56px;
      padding: 0 24px;
    }

    .filters-panel {
      box-shadow: none;
      border: 1px solid #e1e4e8;
    }

    .filters-panel mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .filters-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background-color: #1976d2;
      color: white;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }

    .filters-form {
      padding: 16px 0;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .filters-grid .full-width {
      grid-column: 1 / -1;
    }

    .date-filter {
      margin-bottom: 16px;
    }

    .filters-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #e1e4e8;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .active-filters {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background-color: #f5f7fa;
      border-radius: 6px;
      flex-wrap: wrap;
    }

    .filters-label {
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }

    .filters-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .filters-chips mat-chip {
      font-size: 12px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .quick-search {
        flex-direction: column;
      }
      
      .search-button {
        width: 100%;
      }
      
      .filters-grid {
        grid-template-columns: 1fr;
      }
      
      .filters-actions {
        flex-direction: column;
        gap: 12px;
      }
      
      .action-buttons {
        width: 100%;
        flex-direction: column;
      }
      
      .action-buttons button {
        width: 100%;
      }
      
      .active-filters {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class DocumentosFiltrosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private documentoService = inject(DocumentoService);

  // Outputs
  @Output() filtrosChange = new EventEmitter<FiltrosDocumento>();

  // Enums para el template
  EstadoDocumento = EstadoDocumento;
  PrioridadDocumento = PrioridadDocumento;

  // Estado del componente
  panelExpandido = signal(false);
  contadorFiltrosActivos = signal(0);
  tiposDocumento = signal<any[]>([]);

  // Formularios
  busquedaRapidaControl = this.fb.control('');
  filtrosForm: FormGroup;
  filtrosAplicados: FiltrosDocumento = {};

  constructor() {
    this.filtrosForm = this.fb.group({
      estado: [[]],
      tipoDocumentoId: [null],
      prioridad: [[]],
      remitente: [''],
      asunto: [''],
      numeroExpediente: ['']
    });

    // Búsqueda rápida con debounce
    this.busquedaRapidaControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        // La búsqueda rápida se aplica al presionar Enter o el botón Buscar
      });
  }

  ngOnInit(): void {
    this.cargarTiposDocumento();
  }

  /**
   * Cargar tipos de documento disponibles
   * Requirements: 2.1
   */
  cargarTiposDocumento(): void {
    this.documentoService.obtenerTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de documento:', error);
      }
    });
  }

  /**
   * Aplicar filtros
   * Requirements: 5.1, 5.2, 5.3
   */
  aplicarFiltros(): void {
    const valores = this.filtrosForm.value;
    const busquedaRapida = this.busquedaRapidaControl.value?.trim();

    const filtros: FiltrosDocumento = {};

    // Búsqueda rápida (busca en múltiples campos)
    if (busquedaRapida) {
      // Si parece un número de expediente
      if (busquedaRapida.match(/^EXP-/i)) {
        filtros.numeroExpediente = busquedaRapida;
      } else {
        // Buscar en remitente y asunto
        filtros.remitente = busquedaRapida;
        filtros.asunto = busquedaRapida;
      }
    }

    // Filtros avanzados
    if (valores.estado && valores.estado.length > 0) {
      filtros.estado = valores.estado[0]; // API espera un solo estado
    }

    if (valores.tipoDocumentoId) {
      filtros.tipoDocumentoId = valores.tipoDocumentoId;
    }

    if (valores.prioridad && valores.prioridad.length > 0) {
      filtros.prioridad = valores.prioridad[0]; // API espera una sola prioridad
    }

    if (valores.remitente?.trim()) {
      filtros.remitente = valores.remitente.trim();
    }

    if (valores.asunto?.trim()) {
      filtros.asunto = valores.asunto.trim();
    }

    if (valores.numeroExpediente?.trim()) {
      filtros.numeroExpediente = valores.numeroExpediente.trim();
    }

    this.filtrosAplicados = filtros;
    this.actualizarContadorFiltros();
    this.filtrosChange.emit(filtros);
    this.cerrarPanel();
  }

  /**
   * Limpiar todos los filtros
   * Requirements: 5.1, 5.2
   */
  limpiarFiltros(): void {
    this.filtrosForm.reset({
      estado: [],
      tipoDocumentoId: null,
      prioridad: [],
      remitente: '',
      asunto: '',
      numeroExpediente: ''
    });
    this.busquedaRapidaControl.setValue('');
    this.filtrosAplicados = {};
    this.actualizarContadorFiltros();
    this.filtrosChange.emit({});
  }

  /**
   * Limpiar búsqueda rápida
   */
  limpiarBusquedaRapida(): void {
    this.busquedaRapidaControl.setValue('');
  }

  /**
   * Remover un filtro específico
   */
  removerFiltro(campo: string): void {
    switch (campo) {
      case 'estado':
        this.filtrosForm.patchValue({ estado: [] });
        delete this.filtrosAplicados.estado;
        break;
      case 'tipoDocumentoId':
        this.filtrosForm.patchValue({ tipoDocumentoId: null });
        delete this.filtrosAplicados.tipoDocumentoId;
        break;
      case 'prioridad':
        this.filtrosForm.patchValue({ prioridad: [] });
        delete this.filtrosAplicados.prioridad;
        break;
      case 'remitente':
        this.filtrosForm.patchValue({ remitente: '' });
        delete this.filtrosAplicados.remitente;
        break;
      case 'asunto':
        this.filtrosForm.patchValue({ asunto: '' });
        delete this.filtrosAplicados.asunto;
        break;
      case 'numeroExpediente':
        this.filtrosForm.patchValue({ numeroExpediente: '' });
        delete this.filtrosAplicados.numeroExpediente;
        break;
      case 'fechas':
        delete this.filtrosAplicados.fechaDesde;
        delete this.filtrosAplicados.fechaHasta;
        break;
    }

    this.actualizarContadorFiltros();
    this.filtrosChange.emit(this.filtrosAplicados);
  }

  /**
   * Manejar cambio de rango de fechas
   */
  onRangoFechasChange(rango: RangoFechas): void {
    if (rango.inicio) {
      this.filtrosAplicados.fechaDesde = rango.inicio;
    } else {
      delete this.filtrosAplicados.fechaDesde;
    }

    if (rango.fin) {
      this.filtrosAplicados.fechaHasta = rango.fin;
    } else {
      delete this.filtrosAplicados.fechaHasta;
    }
  }

  /**
   * Actualizar contador de filtros activos
   */
  private actualizarContadorFiltros(): void {
    let contador = 0;

    if (this.filtrosAplicados.estado) contador++;
    if (this.filtrosAplicados.tipoDocumentoId) contador++;
    if (this.filtrosAplicados.prioridad) contador++;
    if (this.filtrosAplicados.remitente) contador++;
    if (this.filtrosAplicados.asunto) contador++;
    if (this.filtrosAplicados.numeroExpediente) contador++;
    if (this.filtrosAplicados.fechaDesde || this.filtrosAplicados.fechaHasta) contador++;

    this.contadorFiltrosActivos.set(contador);
  }

  /**
   * Verificar si hay filtros activos
   */
  tieneFiltrosActivos(): boolean {
    return this.contadorFiltrosActivos() > 0 || !!this.busquedaRapidaControl.value;
  }

  /**
   * Cerrar panel de filtros
   */
  cerrarPanel(): void {
    this.panelExpandido.set(false);
  }

  /**
   * Obtener nombre de tipo de documento por ID
   */
  getNombreTipoDocumento(id: string): string {
    const tipo = this.tiposDocumento().find(t => t.id === id);
    return tipo ? tipo.nombre : 'Desconocido';
  }

  /**
   * Formatear rango de fechas para mostrar
   */
  formatearRangoFechas(): string {
    const desde = this.filtrosAplicados.fechaDesde;
    const hasta = this.filtrosAplicados.fechaHasta;

    if (desde && hasta) {
      return `${this.formatearFecha(desde)} - ${this.formatearFecha(hasta)}`;
    } else if (desde) {
      return `Desde ${this.formatearFecha(desde)}`;
    } else if (hasta) {
      return `Hasta ${this.formatearFecha(hasta)}`;
    }

    return '';
  }

  /**
   * Formatear fecha
   */
  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
