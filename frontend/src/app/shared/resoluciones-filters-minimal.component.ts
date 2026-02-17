import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { debounceTime } from 'rxjs';

/**
 * Filtro MINIMALISTA para resoluciones - Solo lo esencial
 */
@Component({
  selector: 'app-resoluciones-filters-minimal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="filtros-minimal">
      <form [formGroup]="form" class="filtros-form">
        
        <!-- Solo búsqueda inteligente en una línea -->
        <mat-form-field appearance="outline" class="busqueda">
          <mat-label>Buscar</mat-label>
          <input matInput formControlName="busqueda" placeholder="N° resolución, empresa o RUC">
          <mat-icon matSuffix>search</mat-icon>
          <mat-hint>Busca por número de resolución, razón social o RUC</mat-hint>
        </mat-form-field>

        <button mat-button type="button" (click)="mostrarFiltrosAvanzados = !mostrarFiltrosAvanzados" class="avanzados-btn">
          <mat-icon>{{ mostrarFiltrosAvanzados ? 'expand_less' : 'tune' }}</mat-icon>
          {{ mostrarFiltrosAvanzados ? 'Ocultar' : 'Avanzado' }}
        </button>

        <button mat-button type="button" (click)="limpiar()" class="limpiar-btn" *ngIf="tieneFiltrosActivos()">
          <mat-icon>clear</mat-icon>
          Limpiar
        </button>
      </form>

      <!-- Filtros avanzados colapsables -->
      <div class="filtros-avanzados" *ngIf="mostrarFiltrosAvanzados">
        <form [formGroup]="form" class="filtros-avanzados-form">
          
          <mat-form-field appearance="outline" class="estado">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="estado">
              <mat-option value="">Todos</mat-option>
              <mat-option value="VIGENTE">Vigente</mat-option>
              <mat-option value="VENCIDA">Vencida</mat-option>
              <mat-option value="SUSPENDIDA">Suspendida</mat-option>
              <mat-option value="REVOCADA">Revocada</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="tipo">
            <mat-label>Tipo de Trámite</mat-label>
            <mat-select formControlName="tipoTramite">
              <mat-option value="">Todos</mat-option>
              <mat-option value="PRIMIGENIA">Primigenia</mat-option>
              <mat-option value="RENOVACION">Renovación</mat-option>
              <mat-option value="INCREMENTO">Incremento</mat-option>
              <mat-option value="SUSTITUCION">Sustitución</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="fecha">
            <mat-label>Desde</mat-label>
            <input matInput [matDatepicker]="pickerDesde" formControlName="fechaDesde">
            <mat-datepicker-toggle matSuffix [for]="pickerDesde"></mat-datepicker-toggle>
            <mat-datepicker #pickerDesde></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="fecha">
            <mat-label>Hasta</mat-label>
            <input matInput [matDatepicker]="pickerHasta" formControlName="fechaHasta">
            <mat-datepicker-toggle matSuffix [for]="pickerHasta"></mat-datepicker-toggle>
            <mat-datepicker #pickerHasta></mat-datepicker>
          </mat-form-field>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .filtros-minimal {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 16px;
    }

    .filtros-form {
      display: flex;
      gap: 16px;
      align-items: end;
    }

    .busqueda {
      flex: 3;
    }

    .avanzados-btn, .limpiar-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 40px;
      white-space: nowrap;
    }

    .avanzados-btn {
      color: #1976d2;
    }

    .limpiar-btn {
      color: #f44336;
    }

    .filtros-avanzados {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .filtros-avanzados-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    @media (max-width: 768px) {
      .filtros-form {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      
      .avanzados-btn, .limpiar-btn {
        align-self: center;
        width: fit-content;
      }

      .filtros-avanzados-form {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ResolucionesFiltersMinimalComponent implements OnInit, OnChanges {
  @Input() filtros: any = {};
  @Output() filtrosChange = new EventEmitter<any>();

  form: FormGroup;
  mostrarFiltrosAvanzados = false;
  private previousFiltros: any = {};

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      busqueda: [''],
      estado: [''],
      tipoTramite: [''],
      fechaDesde: [''],
      fechaHasta: ['']
    });
  }

  ngOnInit(): void {
    // console.log removed for production
    
    // Cargar valores iniciales
    this.cargarFiltrosEnFormulario();

    // console.log removed for production

    // Mostrar filtros avanzados si hay filtros aplicados
    if (this.tieneFiltrosAvanzadosActivos()) {
      this.mostrarFiltrosAvanzados = true;
    }

    // Emitir cambios con debounce
    this.form.valueChanges.pipe(
      debounceTime(300)
    ).subscribe((valores) => {
      // console.log removed for production
      this.emitirFiltros();
    });
  }

  ngOnChanges(changes: any): void {
    // Detectar cuando los filtros cambian externamente (ej: al limpiar)
    if (changes['filtros'] && !changes['filtros'].firstChange) {
      const newFiltros = changes['filtros'].currentValue;
      const oldFiltros = changes['filtros'].previousValue;
      
      // Solo actuar si realmente cambió
      if (JSON.stringify(newFiltros) !== JSON.stringify(oldFiltros)) {
        // Si los filtros están vacíos, resetear el formulario
        if (Object.keys(newFiltros).length === 0) {
          console.log('🔄 Filtros vacíos detectados, reseteando formulario');
          this.form.reset({
            busqueda: '',
            estado: '',
            tipoTramite: '',
            fechaDesde: '',
            fechaHasta: ''
          }, { emitEvent: false }); // No emitir evento para evitar loop
          this.mostrarFiltrosAvanzados = false;
        } else {
          this.cargarFiltrosEnFormulario();
        }
      }
    }
  }

  private cargarFiltrosEnFormulario(): void {
    this.form.patchValue({
      busqueda: this.filtros.busquedaGeneral || this.filtros.numeroResolucion || '',
      estado: this.filtros.estados?.[0] || '',
      tipoTramite: this.filtros.tiposTramite?.[0] || '',
      fechaDesde: this.filtros.fechaInicio || '',
      fechaHasta: this.filtros.fechaFin || ''
    }, { emitEvent: false }); // No emitir evento al cargar
  }

  private emitirFiltros(): void {
    const valores = this.form.value;
    console.log('📤 Emitiendo filtros desde formulario:', valores);
    
    const filtros: any = {};

    // Búsqueda inteligente (número, razón social o RUC)
    // IMPORTANTE: Siempre incluir busquedaGeneral, incluso si está vacío
    // Esto permite limpiar el filtro cuando se borra el texto
    if (valores.busqueda !== null && valores.busqueda !== undefined) {
      const busquedaTrimmed = String(valores.busqueda || '').trim();
      if (busquedaTrimmed) {
        filtros.busquedaGeneral = busquedaTrimmed;
        console.log('✅ Agregando busquedaGeneral:', busquedaTrimmed);
      } else {
        console.log('🧹 Búsqueda vacía, no se agrega al filtro');
      }
      // Si está vacío, no agregamos el campo, lo que limpiará el filtro
    }

    // Filtros avanzados
    if (valores.estado) {
      filtros.estados = [valores.estado];
    }

    if (valores.tipoTramite) {
      filtros.tiposTramite = [valores.tipoTramite];
    }

    if (valores.fechaDesde) {
      filtros.fechaInicio = valores.fechaDesde;
    }

    if (valores.fechaHasta) {
      filtros.fechaFin = valores.fechaHasta;
    }

    console.log('📤 Filtros finales a emitir:', filtros);
    this.filtrosChange.emit(filtros);
  }

  limpiar(): void {
    // Resetear el formulario
    this.form.reset({
      busqueda: '',
      estado: '',
      tipoTramite: '',
      fechaDesde: '',
      fechaHasta: ''
    });
    this.mostrarFiltrosAvanzados = false;
    
    // Emitir filtros vacíos inmediatamente
    // No esperar al valueChanges para que sea instantáneo
    this.filtrosChange.emit({});
  }

  tieneFiltrosActivos(): boolean {
    const valores = this.form.value;
    return !!(valores.busqueda?.trim() || valores.estado || valores.tipoTramite || valores.fechaDesde || valores.fechaHasta);
  }

  private tieneFiltrosAvanzadosActivos(): boolean {
    return !!(this.filtros.estados?.length || this.filtros.tiposTramite?.length || this.filtros.fechaInicio || this.filtros.fechaFin);
  }
}