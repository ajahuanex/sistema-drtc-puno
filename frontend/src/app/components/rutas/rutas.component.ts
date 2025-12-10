import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RutaService } from '../../services/ruta.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { Ruta, EstadoRuta, TipoRuta } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AgregarRutaModalComponent, AgregarRutaData } from './agregar-ruta-modal.component';
import { RutaUpdate } from '../../models/ruta.model';
import { IntercambioCodigosModalComponent } from './intercambio-codigos-modal.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  template: `
    <div class="rutas-container">
      <div class="page-header">
        <div>
          <h1>Gestión de Rutas</h1>
          <p>Administra las rutas de transporte del sistema</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button 
                  color="accent" 
                  (click)="mostrarEstadoRutasMock()"
                  matTooltip="Mostrar estado de rutas mock (debug)">
            <mat-icon>bug_report</mat-icon>
            Debug Rutas
          </button>
          <button mat-stroked-button 
                  color="info" 
                  (click)="mostrarEstadoFiltros()"
                  matTooltip="Mostrar estado actual de los filtros">
            <mat-icon>filter_list</mat-icon>
            Estado Filtros
          </button>
          <button mat-stroked-button 
                  color="primary" 
                  (click)="mostrarTodasLasRutas()"
                  matTooltip="Mostrar todas las rutas del sistema">
            <mat-icon>list</mat-icon>
            Todas las Rutas
          </button>
          <button mat-stroked-button 
                  color="warn" 
                  (click)="forzarCargaRutas()"
                  matTooltip="Forzar carga de rutas">
            <mat-icon>refresh</mat-icon>
            Recargar Rutas
          </button>
          <button mat-stroked-button 
                  color="accent" 
                  (click)="mostrarEstadoCompleto()"
                  matTooltip="Mostrar estado completo del sistema">
            <mat-icon>bug_report</mat-icon>
            Debug Completo
          </button>
          <button mat-raised-button 
                  color="primary" 
                  (click)="nuevaRuta()">
            <mat-icon>add</mat-icon>
            Nueva Ruta
          </button>
          <!-- Botón de Ruta General eliminado - Se requiere empresa y resolución válidas -->
        </div>
      </div>

      <!-- Filtros de empresa y resolución -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <div class="filtros-grid">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Empresa</mat-label>
              <input matInput 
                     [matAutocomplete]="empresaAuto" 
                     [value]="empresaSearchValue()" 
                     (input)="onEmpresaSearchInput($event)"
                     placeholder="Buscar empresa por RUC o razón social">
              <mat-autocomplete #empresaAuto="matAutocomplete" 
                               [displayWith]="displayEmpresa"
                               (optionSelected)="onEmpresaSelected($event)">
                @for (empresa of empresasFiltradas() | async; track empresa.id) {
                  <mat-option [value]="empresa">
                    <div class="empresa-option">
                      <div class="empresa-ruc">{{ empresa.ruc }}</div>
                      <div class="empresa-razon">{{ empresa.razonSocial.principal || 'Sin razón social' }}</div>
                    </div>
                  </mat-option>
                }
              </mat-autocomplete>
              <mat-hint>Seleccione la empresa para filtrar rutas</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Resolución Primigenia</mat-label>
              <input matInput 
                     [matAutocomplete]="resolucionAuto" 
                     [value]="resolucionSearchValue()" 
                     (input)="onResolucionSearchInput($event)"
                     placeholder="Buscar resolución por número"
                     [disabled]="!empresaSeleccionada()">
              <mat-autocomplete #resolucionAuto="matAutocomplete" 
                               [displayWith]="displayResolucion"
                               (optionSelected)="onResolucionSelected($event)">
                @for (resolucion of resolucionesFiltradas() | async; track resolucion.id) {
                  <mat-option [value]="resolucion">
                    <div class="resolucion-option">
                      <div class="resolucion-info">
                        <div class="resolucion-numero">{{ resolucion.nroResolucion }}</div>
                        <div class="resolucion-tipo">{{ resolucion.tipoTramite }}</div>
                      </div>
                      <div class="resolucion-badges">
                        <span class="badge badge-vigente" *ngIf="resolucion.estado === 'VIGENTE'">
                          VIGENTE
                        </span>
                        <span class="badge badge-padre" *ngIf="resolucion.tipoResolucion === 'PADRE'">
                          PADRE
                        </span>
                      </div>
                    </div>
                  </mat-option>
                }
              </mat-autocomplete>
              <mat-hint>Seleccione la resolución primigenia</mat-hint>
            </mat-form-field>

            <div class="filtros-actions">
              <button mat-raised-button color="primary" (click)="aplicarFiltros()" [disabled]="!empresaSeleccionada() || !resolucionSeleccionada()">
                <mat-icon>search</mat-icon>
                Buscar Rutas
              </button>
              <button mat-button (click)="limpiarFiltros()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
              <button mat-button color="accent" (click)="mostrarEstadoCompleto()" matTooltip="Mostrar estado completo del sistema">
                <mat-icon>bug_report</mat-icon>
                Debug
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Información de la selección -->
      @if (empresaSeleccionada() && resolucionSeleccionada()) {
        <mat-card class="info-card">
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Empresa:</span>
                <span class="value">{{ displayEmpresa(empresaSeleccionada()!) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Resolución:</span>
                <span class="value">{{ displayResolucion(resolucionSeleccionada()!) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Rutas encontradas:</span>
                <span class="value">{{ rutas().length }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

        <!-- Tabla de Rutas -->
        <div class="content-section">
          <div class="section-header">
            <h3>
              @if (empresaSeleccionada() && resolucionSeleccionada()) {
                Rutas de {{ empresaSeleccionada()?.razonSocial?.principal }} - Resolución {{ resolucionSeleccionada()?.nroResolucion }}
              } @else if (empresaSeleccionada()) {
                Todas las Rutas de {{ empresaSeleccionada()?.razonSocial?.principal }}
              } @else {
                Todas las Rutas del Sistema
              }
            </h3>
            <p class="section-subtitle">
              @if (empresaSeleccionada() && resolucionSeleccionada()) {
                Mostrando {{ rutas().length }} rutas asociadas a la resolución seleccionada
              } @else if (empresaSeleccionada()) {
                Mostrando {{ rutas().length }} rutas de la empresa seleccionada
              } @else {
                Mostrando {{ totalRutas() }} rutas del sistema
              }
            </p>
          </div>

          @if (rutas().length > 0) {
            <div class="table-container">
              <table mat-table [dataSource]="rutas()" class="rutas-table">
                <!-- Código de Ruta -->
                <ng-container matColumnDef="codigoRuta">
                  <th mat-header-cell *matHeaderCellDef>Código</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="codigo-ruta">{{ ruta.codigoRuta }}</span>
                  </td>
                </ng-container>

                <!-- Origen -->
                <ng-container matColumnDef="origen">
                  <th mat-header-cell *matHeaderCellDef>Origen</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.origen || ruta.origenId }}</td>
                </ng-container>

                <!-- Destino -->
                <ng-container matColumnDef="destino">
                  <th mat-header-cell *matHeaderCellDef>Destino</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.destino || ruta.destinoId }}</td>
                </ng-container>

                <!-- Frecuencias -->
                <ng-container matColumnDef="frecuencias">
                  <th mat-header-cell *matHeaderCellDef>Frecuencias</th>
                  <td mat-cell *matCellDef="let ruta">{{ ruta.frecuencias }}</td>
                </ng-container>

                <!-- Itinerario -->
                <ng-container matColumnDef="itinerario">
                  <th mat-header-cell *matHeaderCellDef>Itinerario</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="itinerario-text">{{ ruta.descripcion || '-' }}</span>
                  </td>
                </ng-container>

                <!-- Estado -->
                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let ruta">
                    <span class="estado-badge" [class.activo]="ruta.estado === 'ACTIVA'">
                      {{ ruta.estado }}
                    </span>
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let ruta">
                    <button mat-icon-button 
                            color="primary" 
                            (click)="editarRuta(ruta)"
                            matTooltip="Editar ruta">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button 
                            color="warn" 
                            (click)="eliminarRuta(ruta)"
                            matTooltip="Eliminar ruta">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <!-- Intercambiar -->
                <ng-container matColumnDef="intercambiar">
                  <th mat-header-cell *matHeaderCellDef>Intercambiar</th>
                  <td mat-cell *matCellDef="let ruta">
                    <button mat-icon-button 
                            color="primary" 
                            (click)="abrirModalIntercambio(ruta)"
                            matTooltip="Intercambiar códigos con otra ruta">
                      <mat-icon>swap_horiz</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          } @else {
            <div class="empty-state">
              @if (empresaSeleccionada() && resolucionSeleccionada()) {
                <mat-icon class="empty-icon">route</mat-icon>
                <h3>No hay rutas para esta resolución</h3>
                <p>No se encontraron rutas asociadas a la empresa y resolución seleccionadas.</p>
                <button mat-raised-button 
                        color="primary" 
                        (click)="nuevaRuta()">
                  <mat-icon>add</mat-icon>
                  Agregar Primera Ruta
                </button>
              } @else if (empresaSeleccionada()) {
                <mat-icon class="empty-icon">business</mat-icon>
                <h3>No hay rutas para esta empresa</h3>
                <p>La empresa seleccionada no tiene rutas registradas en el sistema.</p>
                <button mat-raised-button 
                        color="primary" 
                        (click)="nuevaRuta()">
                  <mat-icon>add</mat-icon>
                  Agregar Primera Ruta
                </button>
              } @else {
                <mat-icon class="empty-icon">route</mat-icon>
                <h3>No hay rutas en el sistema</h3>
                <p>No se encontraron rutas registradas. Comienza agregando la primera ruta.</p>
                <p class="empty-message">
                  Selecciona una empresa y resolución para agregar rutas
                </p>
              }
            </div>
          }
        </div>
    </div>
  `,
  styleUrls: ['./rutas.component.scss']
})
export class RutasComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  private rutaService = inject(RutaService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  // Signals
  rutas = signal<Ruta[]>([]);
  todasLasRutas = signal<Ruta[]>([]); // Nueva signal para mantener todas las rutas
  isLoading = signal(false);
  empresaSeleccionada = signal<Empresa | null>(null);
  resolucionSeleccionada = signal<Resolucion | null>(null);
  empresaSearchValue = signal('');
  resolucionSearchValue = signal('');
  empresasFiltradas = signal<Observable<Empresa[]>>(of([]));
  resolucionesFiltradas = signal<Observable<Resolucion[]>>(of([]));
  totalRutas = signal<number>(0);

  // Columnas disponibles y mostradas
  availableColumns = [
    { key: 'codigoRuta', label: 'Código', visible: true },
    { key: 'origen', label: 'Origen', visible: true },
    { key: 'destino', label: 'Destino', visible: true },
    { key: 'frecuencias', label: 'Frecuencias', visible: true },
    { key: 'itinerario', label: 'Itinerario', visible: false },
    { key: 'estado', label: 'Estado', visible: true },
    { key: 'acciones', label: 'Acciones', visible: true },
    { key: 'intercambiar', label: 'Intercambiar', visible: true }
  ];

  get displayedColumns(): string[] {
    return this.availableColumns
      .filter(col => col.visible)
      .map(col => col.key);
  }

  ngOnInit(): void {
    console.log('🚀 COMPONENTE RUTAS INICIALIZADO');
    this.inicializarFiltros();
    this.cargarTodasLasRutas();
  }

  private inicializarFiltros(): void {
    // Cargar todas las empresas para el filtro
    this.empresaService.getEmpresas().subscribe(empresas => {
      this.empresasFiltradas.set(of(empresas));
    });
  }

  private cargarTodasLasRutas(): void {
    console.log('🔄 CARGANDO TODAS LAS RUTAS...');

    // Cargar todas las rutas del sistema
    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        console.log('✅ RUTAS CARGADAS EXITOSAMENTE:', {
          total: rutas.length,
          rutas: rutas.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre,
            origen: r.origen,
            destino: r.destino,
            resolucionId: r.resolucionId
          }))
        });

        this.rutas.set(rutas);
        this.todasLasRutas.set(rutas); // Actualizar todasLasRutas
        this.totalRutas.set(rutas.length);
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR RUTAS:', error);
        this.snackBar.open('Error al cargar las rutas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Métodos de filtrado
  onEmpresaSearchInput(event: any): void {
    const value = event.target.value;
    this.empresaSearchValue.set(value);
    this.filtrarEmpresas(value);
  }

  onResolucionSearchInput(event: any): void {
    const value = event.target.value;
    this.resolucionSearchValue.set(value);
    this.filtrarResoluciones(value);
  }

  onEmpresaSelected(event: any): void {
    const empresa = event.option.value;
    this.empresaSeleccionada.set(empresa);
    this.empresaSearchValue.set(this.displayEmpresa(empresa));
    this.resolucionSeleccionada.set(null);
    this.resolucionSearchValue.set('');

    // Cargar TODAS las rutas del sistema
    this.cargarTodasLasRutas();

    // Cargar resoluciones de la empresa seleccionada
    this.cargarResolucionesPorEmpresa(empresa.id);

    console.log('🏢 EMPRESA SELECCIONADA:', {
      empresa: empresa.razonSocial?.principal,
      empresaId: empresa.id
    });

    // Filtrar las rutas por la empresa seleccionada
    this.filtrarRutasPorEmpresa(empresa.id);
  }

  onResolucionSelected(event: any): void {
    const resolucion = event.option.value;
    this.resolucionSeleccionada.set(resolucion);
    this.resolucionSearchValue.set(this.displayResolucion(resolucion));

    // Filtrar las rutas por la resolución seleccionada (de todas las rutas del sistema)
    this.filtrarRutasPorResolucion(resolucion.id);
  }

  private filtrarEmpresas(value: string): void {
    if (typeof value !== 'string') return;
    const filterValue = value.toLowerCase();

    this.empresaService.getEmpresas().subscribe(empresas => {
      const empresasFiltradas = empresas.filter(empresa =>
        empresa.ruc.toLowerCase().includes(filterValue) ||
        (empresa.razonSocial?.principal || '').toLowerCase().includes(filterValue)
      );
      this.empresasFiltradas.set(of(empresasFiltradas));
    });
  }

  private filtrarResoluciones(value: string): void {
    if (typeof value !== 'string') return;
    const filterValue = value.toLowerCase();

    const resoluciones = this.resolucionesFiltradas();
    if (resoluciones) {
      resoluciones.subscribe(resolucionesList => {
        const resolucionesFiltradas = resolucionesList.filter(resolucion =>
          resolucion.nroResolucion.toLowerCase().includes(filterValue) ||
          resolucion.tipoTramite.toLowerCase().includes(filterValue)
        );
        this.resolucionesFiltradas.set(of(resolucionesFiltradas));
      });
    }
  }

  private cargarResolucionesPorEmpresa(empresaId: string): void {
    this.resolucionService.getResolucionesPorEmpresa(empresaId)
      .pipe(
        map(resoluciones => resoluciones.filter(r => 
          r.estado === 'VIGENTE' && 
          r.tipoResolucion === 'PADRE' &&
          (r.tipoTramite === 'AUTORIZACION_NUEVA' || r.tipoTramite === 'PRIMIGENIA')
        ))
      )
      .subscribe(resoluciones => {
        this.resolucionesFiltradas.set(of(resoluciones));
        
        if (resoluciones.length === 0) {
          this.snackBar.open(
            'La empresa no tiene resoluciones VIGENTES disponibles para agregar rutas',
            'Cerrar',
            { duration: 5000 }
          );
        }
        
        console.log('📋 RESOLUCIONES VIGENTES Y PADRE CARGADAS:', {
          empresaId,
          total: resoluciones.length,
          resoluciones: resoluciones.map(r => ({
            id: r.id,
            nroResolucion: r.nroResolucion,
            estado: r.estado,
            tipoResolucion: r.tipoResolucion
          }))
        });
      });
  }

  aplicarFiltros(): void {
    if (!this.empresaSeleccionada() || !this.resolucionSeleccionada()) {
      this.snackBar.open('Debe seleccionar empresa y resolución primigenia', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargarRutasPorEmpresa();
  }

  limpiarFiltros(): void {
    console.log('🧹 LIMPIANDO FILTROS...');

    this.empresaSeleccionada.set(null);
    this.resolucionSeleccionada.set(null);
    this.empresaSearchValue.set('');
    this.resolucionSearchValue.set('');

    // Cargar todas las rutas del sistema
    this.cargarTodasLasRutas();

    console.log('✅ FILTROS LIMPIADOS, MOSTRANDO TODAS LAS RUTAS');
    this.snackBar.open('Filtros limpiados, mostrando todas las rutas del sistema', 'Cerrar', { duration: 3000 });
  }

  private cargarRutasPorEmpresa(): void {
    if (!this.empresaSeleccionada()) return;

    console.log('🏢 CARGANDO RUTAS DE LA EMPRESA:', {
      empresa: this.empresaSeleccionada()!.razonSocial?.principal,
      empresaId: this.empresaSeleccionada()!.id
    });

    this.isLoading.set(true);
    this.rutaService.getRutasPorEmpresa(this.empresaSeleccionada()!.id).subscribe({
      next: (rutas) => {
        console.log('✅ RUTAS DE LA EMPRESA CARGADAS:', {
          total: rutas.length,
          empresa: this.empresaSeleccionada()!.razonSocial?.principal,
          rutas: rutas.map(r => ({
            id: r.id,
            codigoRuta: r.codigoRuta,
            nombre: r.nombre,
            origen: r.origen,
            destino: r.destino,
            resolucionId: r.resolucionId,
            empresaId: r.empresaId
          }))
        });

        this.rutas.set(rutas);
        this.totalRutas.set(rutas.length);
        this.isLoading.set(false);

        // Mostrar mensaje informativo
        this.snackBar.open(`Se cargaron ${rutas.length} ruta(s) de la empresa seleccionada`, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR RUTAS DE LA EMPRESA:', error);
        this.snackBar.open('Error al cargar las rutas de la empresa', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  private filtrarRutasPorResolucion(resolucionId: string): void {
    console.log('🔍 FILTRANDO RUTAS POR RESOLUCIÓN:', {
      resolucionId: resolucionId,
      totalRutasDisponibles: this.todasLasRutas().length
    });

    console.log('📊 RUTAS DISPONIBLES ANTES DEL FILTRO POR RESOLUCIÓN:', {
      totalRutas: this.todasLasRutas().length,
      todasLasRutas: this.todasLasRutas().map(r => ({
        id: r.id,
        codigoRuta: r.codigoRuta,
        nombre: r.nombre,
        origen: r.origen,
        destino: r.destino,
        resolucionId: r.resolucionId,
        empresaId: r.empresaId
      }))
    });

    // Filtrar todas las rutas del sistema por la resolución específica
    const rutasFiltradas = this.todasLasRutas().filter(ruta =>
      ruta.resolucionId === resolucionId
    );

    console.log('✅ RUTAS FILTRADAS POR RESOLUCIÓN:', {
      total: rutasFiltradas.length,
      resolucionId: resolucionId,
      rutas: rutasFiltradas.map(r => ({
        id: r.id,
        codigoRuta: r.codigoRuta,
        nombre: r.nombre,
        origen: r.origen,
        destino: r.destino,
        resolucionId: r.resolucionId
      }))
    });

    // Solo actualizar la vista, no todasLasRutas
    this.rutas.set(rutasFiltradas);
    this.totalRutas.set(rutasFiltradas.length);

    // Mostrar mensaje informativo
    this.snackBar.open(`Se encontraron ${rutasFiltradas.length} ruta(s) para la resolución seleccionada`, 'Cerrar', { duration: 3000 });
  }

  // Método para filtrar rutas por empresa
  private filtrarRutasPorEmpresa(empresaId: string): void {
    console.log('🔍 FILTRANDO RUTAS POR EMPRESA:', {
      empresaId: empresaId,
      totalRutasDisponibles: this.todasLasRutas().length
    });

    // Primero obtener las resoluciones de la empresa
    this.resolucionService.getResolucionesPorEmpresa(empresaId).subscribe(resoluciones => {
      // Obtener solo resoluciones primigenias (AUTORIZACION_NUEVA o PRIMIGENIA)
      const resolucionesPrimigenias = resoluciones.filter(r => 
        r.tipoTramite === 'AUTORIZACION_NUEVA' || r.tipoTramite === 'PRIMIGENIA'
      );

      console.log('📋 RESOLUCIONES DE LA EMPRESA:', {
        empresaId: empresaId,
        totalResoluciones: resolucionesPrimigenias.length,
        resoluciones: resolucionesPrimigenias.map(r => ({
          id: r.id,
          nroResolucion: r.nroResolucion,
          tipoTramite: r.tipoTramite
        }))
      });

      // Obtener los IDs de las resoluciones primigenias
      const resolucionIds = resolucionesPrimigenias.map(r => r.id);

      console.log('📊 RUTAS DISPONIBLES ANTES DEL FILTRO POR EMPRESA:', {
        totalRutas: this.todasLasRutas().length,
        todasLasRutas: this.todasLasRutas().map(r => ({
          id: r.id,
          codigoRuta: r.codigoRuta,
          nombre: r.nombre,
          origen: r.origen,
          destino: r.destino,
          resolucionId: r.resolucionId,
          empresaId: r.empresaId
        }))
      });

      // Filtrar rutas por las resoluciones de la empresa
      const rutasFiltradasPorEmpresa = this.todasLasRutas().filter(ruta =>
        ruta.resolucionId && resolucionIds.includes(ruta.resolucionId)
      );

      console.log('✅ RUTAS FILTRADAS POR EMPRESA:', {
        total: rutasFiltradasPorEmpresa.length,
        empresaId: empresaId,
        resolucionesIncluidas: resolucionIds,
        rutas: rutasFiltradasPorEmpresa.map(r => ({
          id: r.id,
          codigoRuta: r.codigoRuta,
          nombre: r.nombre,
          origen: r.origen,
          destino: r.destino,
          resolucionId: r.resolucionId,
          empresaId: r.empresaId
        }))
      });

      // Solo actualizar la vista, no todasLasRutas
      this.rutas.set(rutasFiltradasPorEmpresa);
      this.totalRutas.set(rutasFiltradasPorEmpresa.length);

      // Mostrar mensaje informativo
      this.snackBar.open(`Se encontraron ${rutasFiltradasPorEmpresa.length} ruta(s) para la empresa seleccionada`, 'Cerrar', { duration: 3000 });
    });
  }

  // Métodos de utilidad
  displayEmpresa = (empresa: Empresa): string => {
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial?.principal || 'Sin razón social'}` : '';
  }

  displayResolucion = (resolucion: Resolucion): string => {
    return resolucion ? `${resolucion.nroResolucion} - ${resolucion.tipoTramite}` : '';
  }

  getTipoDisplayName(tipo: TipoRuta | undefined): string {
    if (!tipo) return 'N/A';

    const tipos: { [key in TipoRuta]: string } = {
      'URBANA': 'Urbana',
      'INTERURBANA': 'Interurbana',
      'INTERPROVINCIAL': 'Interprovincial',
      'INTERREGIONAL': 'Interregional',
      'RURAL': 'Rural'
    };

    return tipos[tipo] || tipo;
  }

  getEstadoDisplayName(estado: EstadoRuta | undefined): string {
    if (!estado) return 'N/A';

    const estados: { [key in EstadoRuta]: string } = {
      'ACTIVA': 'Activa',
      'INACTIVA': 'Inactiva',
      'SUSPENDIDA': 'Suspendida',
      'EN_MANTENIMIENTO': 'En Mantenimiento',
      'ARCHIVADA': 'Archivada',
      'DADA_DE_BAJA': 'Dada de Baja'
    };

    return estados[estado] || estado;
  }

  nuevaRuta(): void {
    // Validar empresa seleccionada
    if (!this.empresaSeleccionada()) {
      this.snackBar.open(
        'Debe seleccionar una empresa antes de agregar rutas',
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }
    
    // Validar resolución seleccionada
    if (!this.resolucionSeleccionada()) {
      this.snackBar.open(
        'Debe seleccionar una resolución VIGENTE antes de agregar rutas',
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }
    
    // Validar que la resolución sea VIGENTE
    if (this.resolucionSeleccionada()!.estado !== 'VIGENTE') {
      this.snackBar.open(
        'La resolución seleccionada no está VIGENTE. Solo se pueden agregar rutas a resoluciones VIGENTES.',
        'Cerrar',
        { duration: 5000 }
      );
      return;
    }
    
    // Validar que la resolución sea PADRE
    if (this.resolucionSeleccionada()!.tipoResolucion !== 'PADRE') {
      this.snackBar.open(
        'Solo se pueden agregar rutas a resoluciones PADRE (primigenias)',
        'Cerrar',
        { duration: 5000 }
      );
      return;
    }

    const dialogRef = this.dialog.open(AgregarRutaModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        empresa: this.empresaSeleccionada()!,
        resolucion: this.resolucionSeleccionada()!,
        modo: 'creacion'
      } as AgregarRutaData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🔄 RESULTADO DEL MODAL:', result);

        // Usar directamente la ruta que viene del backend
        console.log('➕ AGREGANDO NUEVA RUTA A LA LISTA:', JSON.stringify(result, null, 2));

        // Agregar a la lista de rutas
        this.rutas.update(rutas => [...rutas, result]);

        console.log('📊 ESTADO ACTUAL DE RUTAS:', {
          totalRutas: this.rutas().length,
          rutas: this.rutas().map(r => ({ id: r.id, codigoRuta: r.codigoRuta, nombre: r.nombre, resolucionId: r.resolucionId }))
        });

        this.snackBar.open('Ruta agregada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  verRuta(id: string): void {
    this.router.navigate(['/rutas', id]);
  }

  editarRuta(ruta: Ruta): void {
    console.log('✏️ EDITANDO RUTA:', ruta);

    // Abrir modal de edición
    const dialogRef = this.dialog.open(AgregarRutaModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        empresa: this.empresaSeleccionada(),
        resolucion: this.resolucionSeleccionada(),
        ruta: ruta, // Pasar la ruta existente para edición
        modo: 'edicion'
      } as AgregarRutaData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🔄 RESULTADO DEL MODAL DE EDICIÓN:', result);

        // Actualizar la ruta existente
        const rutaActualizada: Ruta = {
          ...ruta,
          codigoRuta: result.codigoRuta,
          nombre: `${result.origen} - ${result.destino}`,
          origenId: result.origen,
          destinoId: result.destino,
          origen: result.origen,
          destino: result.destino,
          frecuencias: result.frecuencias,
          observaciones: result.observaciones || '',
          tipoRuta: result.tipoRuta || 'INTERPROVINCIAL',
          fechaActualizacion: new Date()
        };

        console.log('✏️ ACTUALIZANDO RUTA:', JSON.stringify(rutaActualizada, null, 2));

        // Actualizar en el servicio
        this.rutaService.updateRuta(ruta.id, rutaActualizada).subscribe({
          next: (rutaActualizada) => {
            console.log('✅ RUTA ACTUALIZADA EXITOSAMENTE:', rutaActualizada);

            // Actualizar en las listas locales
            this.actualizarRutaEnLista(rutaActualizada);

            this.snackBar.open('Ruta actualizada exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('❌ ERROR AL ACTUALIZAR RUTA:', error);
            this.snackBar.open('Error al actualizar la ruta', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  eliminarRuta(ruta: Ruta): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta ruta? Esta acción no se puede deshacer.')) {
      console.log('🗑️ ELIMINANDO RUTA:', ruta);

      // Eliminar del servicio
      this.rutaService.deleteRuta(ruta.id).subscribe({
        next: () => {
          console.log('✅ RUTA ELIMINADA EXITOSAMENTE DEL SERVICIO');

          // Eliminar de las listas locales
          this.rutas.update(rutas => rutas.filter(r => r.id !== ruta.id));
          this.todasLasRutas.update(todasLasRutas => todasLasRutas.filter(r => r.id !== ruta.id));
          this.totalRutas.update(total => total - 1);

          this.snackBar.open('Ruta eliminada exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('❌ ERROR AL ELIMINAR RUTA:', error);
          this.snackBar.open('Error al eliminar la ruta', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // Método agregarRutaGeneral() eliminado - Se requiere empresa y resolución válidas
  // El backend no acepta IDs 'general', solo ObjectIds válidos de MongoDB

  // Método para intercambiar códigos entre rutas
  intercambiarCodigos(ruta1: Ruta, ruta2: Ruta): void {
    if (!ruta1.resolucionId || !ruta2.resolucionId) {
      this.snackBar.open('Las rutas deben tener resolución asignada', 'Cerrar', { duration: 3000 });
      return;
    }

    if (ruta1.resolucionId !== ruta2.resolucionId) {
      this.snackBar.open('Solo se pueden intercambiar códigos entre rutas de la misma resolución', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🔄 INTERCAMBIANDO CÓDIGOS:', {
      ruta1: { id: ruta1.id, codigoRuta: ruta1.codigoRuta, nombre: ruta1.nombre },
      ruta2: { id: ruta2.id, codigoRuta: ruta2.codigoRuta, nombre: ruta2.nombre },
      resolucionId: ruta1.resolucionId
    });

    // Crear copias de las rutas con códigos intercambiados
    const ruta1Actualizada: Ruta = {
      ...ruta1,
      codigoRuta: ruta2.codigoRuta,
      fechaActualizacion: new Date()
    };

    const ruta2Actualizada: Ruta = {
      ...ruta2,
      codigoRuta: ruta1.codigoRuta,
      fechaActualizacion: new Date()
    };

    // Actualizar las listas locales inmediatamente
    this.actualizarRutaEnLista(ruta1Actualizada);
    this.actualizarRutaEnLista(ruta2Actualizada);

    console.log('✅ CÓDIGOS INTERCAMBIADOS EXITOSAMENTE EN FRONTEND');
    console.log('📊 RUTA 1 ACTUALIZADA:', ruta1Actualizada.codigoRuta);
    console.log('📊 RUTA 2 ACTUALIZADA:', ruta2Actualizada.codigoRuta);

    // Mostrar mensaje de éxito
    this.snackBar.open('Códigos intercambiados exitosamente', 'Cerrar', { duration: 3000 });

    // Intentar sincronizar con el backend (opcional, para cuando esté funcionando)
    this.intentarSincronizarConBackend(ruta1Actualizada, ruta2Actualizada);
  }

  // Método para intentar sincronizar con el backend (opcional)
  private intentarSincronizarConBackend(ruta1: Ruta, ruta2: Ruta): void {
    console.log('🔄 INTENTANDO SINCRONIZAR CON BACKEND...');

    // Crear objetos de actualización para el backend
    const actualizacionRuta1: Partial<RutaUpdate> = {
      codigoRuta: ruta1.codigoRuta
    };

    const actualizacionRuta2: Partial<RutaUpdate> = {
      codigoRuta: ruta2.codigoRuta
    };

    // Usar forkJoin para hacer ambas actualizaciones en paralelo y manejar errores mejor
    forkJoin({
      ruta1: this.rutaService.updateRuta(ruta1.id, actualizacionRuta1),
      ruta2: this.rutaService.updateRuta(ruta2.id, actualizacionRuta2)
    }).subscribe({
      next: (resultados) => {
        console.log('✅ BACKEND: Ambas rutas sincronizadas exitosamente');
        console.log('📊 Ruta 1:', resultados.ruta1.codigoRuta);
        console.log('📊 Ruta 2:', resultados.ruta2.codigoRuta);
      },
      error: (error) => {
        console.warn('⚠️ BACKEND: Error durante la sincronización:', error);
        // No mostrar error al usuario ya que el intercambio ya funcionó en frontend
      }
    });
  }

  // Método auxiliar para actualizar una ruta en la lista
  private actualizarRutaEnLista(rutaActualizada: Ruta): void {
    this.rutas.update(rutas =>
      rutas.map(r => r.id === rutaActualizada.id ? rutaActualizada : r)
    );

    this.todasLasRutas.update(todasLasRutas =>
      todasLasRutas.map(r => r.id === rutaActualizada.id ? rutaActualizada : r)
    );
  }

  // Método para mostrar el estado actual del filtrado
  mostrarEstadoFiltros(): void {
    console.log('🔍 ESTADO ACTUAL DE FILTROS:');
    console.log('🏢 Empresa seleccionada:', this.empresaSeleccionada()?.razonSocial?.principal || 'Ninguna');
    console.log('📋 Resolución seleccionada:', this.resolucionSeleccionada()?.nroResolucion || 'Ninguna');
    console.log('📊 Total de rutas mostradas:', this.rutas().length);
    console.log('📈 Total de rutas en el sistema:', this.totalRutas());

    // Mostrar también el estado del servicio
    // this.rutaService.mostrarEstadoRutasMock();
  }

  // Método para mostrar todas las rutas del sistema
  mostrarTodasLasRutas(): void {
    console.log('🌐 MOSTRANDO TODAS LAS RUTAS DEL SISTEMA');
    this.cargarTodasLasRutas();
  }

  // Método para mostrar el estado actual de las rutas mock (debug)
  mostrarEstadoRutasMock(): void {
    console.log('🔍 ESTADO ACTUAL DE RUTAS EN EL COMPONENTE:');
    console.log('📊 RUTAS EN MEMORIA:', this.rutas());
    console.log('📊 TOTAL RUTAS:', this.rutas().length);

    // Mostrar también el estado del servicio
    // this.rutaService.mostrarEstadoRutasMock();
  }

  forzarCargaRutas(): void {
    this.cargarTodasLasRutas();
    this.snackBar.open('Rutas forzadas a cargar', 'Cerrar', { duration: 3000 });
  }

  // Método para debug - mostrar estado completo
  mostrarEstadoCompleto(): void {
    console.log('🔍 === ESTADO COMPLETO DEL SISTEMA ===');

    console.log('🏢 EMPRESA SELECCIONADA:', {
      empresa: this.empresaSeleccionada()?.razonSocial?.principal,
      empresaId: this.empresaSeleccionada()?.id
    });

    console.log('📋 RESOLUCIÓN SELECCIONADA:', {
      resolucion: this.resolucionSeleccionada()?.nroResolucion,
      resolucionId: this.resolucionSeleccionada()?.id
    });

    console.log('📊 TODAS LAS RUTAS EN MEMORIA:', {
      total: this.rutas().length,
      rutas: this.rutas().map(r => ({
        id: r.id,
        codigoRuta: r.codigoRuta,
        nombre: r.nombre,
        origen: r.origen,
        destino: r.destino,
        resolucionId: r.resolucionId,
        empresaId: r.empresaId
      }))
    });

    console.log('🔍 FILTROS APLICADOS:', {
      empresaFiltrada: this.empresaSeleccionada()?.id,
      resolucionFiltrada: this.resolucionSeleccionada()?.id
    });

    console.log('=== FIN ESTADO COMPLETO ===');
  }

  // Método para abrir modal de intercambio de códigos
  abrirModalIntercambio(rutaOrigen: Ruta): void {
    if (!rutaOrigen.resolucionId) {
      this.snackBar.open('La ruta debe tener resolución asignada', 'Cerrar', { duration: 3000 });
      return;
    }

    // Obtener todas las rutas de la misma resolución
    const rutasMismaResolucion = this.todasLasRutas().filter(r =>
      r.id !== rutaOrigen.id &&
      r.resolucionId === rutaOrigen.resolucionId
    );

    if (rutasMismaResolucion.length === 0) {
      this.snackBar.open('No hay otras rutas en la misma resolución para intercambiar', 'Cerrar', { duration: 3000 });
      return;
    }

    // Crear un modal simple con las opciones
    const dialogRef = this.dialog.open(IntercambioCodigosModalComponent, {
      width: '500px',
      data: {
        rutaOrigen: rutaOrigen,
        rutasDisponibles: rutasMismaResolucion
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.rutaDestino) {
        this.intercambiarCodigos(rutaOrigen, result.rutaDestino);
      }
    });
  }

  cargaMasivaRutas(): void {
    this.router.navigate(['/rutas/carga-masiva']);
  }
} 