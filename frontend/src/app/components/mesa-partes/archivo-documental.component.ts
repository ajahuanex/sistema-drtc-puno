/**
 * Archivo Documental Component
 * Requirements: 9.3, 9.4, 9.5, 9.7
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { ArchivoService } from '../../services/mesa-partes/archivo.service';
import {
  Archivo,
  FiltrosArchivo,
  ClasificacionArchivoEnum,
  PoliticaRetencionEnum,
  getClasificacionLabel,
  getPoliticaRetencionLabel,
  getPoliticaRetencionColor
} from '../../models/mesa-partes/archivo.model';
import { RestaurarDocumentoModalComponent } from './restaurar-documento-modal.component';

@Component({
  selector: 'app-archivo-documental',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatCardModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="archivo-container">
      <mat-card class="filters-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>archive</mat-icon>
            Archivo Documental
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filters-form">
            <div class="filters-row">
              <mat-form-field appearance="outline">
                <mat-label>Búsqueda</mat-label>
                <input matInput formControlName="busqueda" placeholder="Expediente, remitente, asunto...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Clasificación</mat-label>
                <mat-select formControlName="clasificacion">
                  <mat-option [value]="null">Todas</mat-option>
                  <mat-option *ngFor="let clasificacion of clasificaciones" [value]="clasificacion.value">
                    {{ clasificacion.label }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Política de Retención</mat-label>
                <mat-select formControlName="politica_retencion">
                  <mat-option [value]="null">Todas</mat-option>
                  <mat-option *ngFor="let politica of politicas" [value]="politica.value">
                    {{ politica.label }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Código de Ubicación</mat-label>
                <input matInput formControlName="codigo_ubicacion" placeholder="EST-TD-2025-0001">
              </mat-form-field>
            </div>

            <div class="filters-row">
              <mat-form-field appearance="outline">
                <mat-label>Fecha Desde</mat-label>
                <input matInput [matDatepicker]="pickerDesde" formControlName="fecha_archivado_desde">
                <mat-datepicker-toggle matSuffix [for]="pickerDesde"></mat-datepicker-toggle>
                <mat-datepicker #pickerDesde></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha Hasta</mat-label>
                <input matInput [matDatepicker]="pickerHasta" formControlName="fecha_archivado_hasta">
                <mat-datepicker-toggle matSuffix [for]="pickerHasta"></mat-datepicker-toggle>
                <mat-datepicker #pickerHasta></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="activo">
                  <mat-option [value]="null">Todos</mat-option>
                  <mat-option value="ARCHIVADO">Archivado</mat-option>
                  <mat-option value="RESTAURADO">Restaurado</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-raised-button color="primary" (click)="aplicarFiltros()" class="filter-button">
                <mat-icon>filter_list</mat-icon>
                Filtrar
              </button>

              <button mat-button (click)="limpiarFiltros()" class="filter-button">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-header">
            <h3>Documentos Archivados ({{ totalArchivos }})</h3>
            <button mat-raised-button color="accent" (click)="verProximosAExpirar()">
              <mat-icon>warning</mat-icon>
              Próximos a Expirar ({{ proximosAExpirar }})
            </button>
          </div>

          <table mat-table [dataSource]="archivos" matSort (matSortChange)="onSort($event)" class="archivo-table">
            <!-- Código Ubicación Column -->
            <ng-container matColumnDef="codigo_ubicacion">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Código</th>
              <td mat-cell *matCellDef="let archivo">
                <strong>{{ archivo.codigo_ubicacion }}</strong>
              </td>
            </ng-container>

            <!-- Clasificación Column -->
            <ng-container matColumnDef="clasificacion">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Clasificación</th>
              <td mat-cell *matCellDef="let archivo">
                <mat-chip>{{ getClasificacionLabel(archivo.clasificacion) }}</mat-chip>
              </td>
            </ng-container>

            <!-- Política Retención Column -->
            <ng-container matColumnDef="politica_retencion">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Retención</th>
              <td mat-cell *matCellDef="let archivo">
                <mat-chip [style.background-color]="getPoliticaColor(archivo.politica_retencion)">
                  {{ getPoliticaLabel(archivo.politica_retencion) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Ubicación Física Column -->
            <ng-container matColumnDef="ubicacion_fisica">
              <th mat-header-cell *matHeaderCellDef>Ubicación Física</th>
              <td mat-cell *matCellDef="let archivo">
                {{ archivo.ubicacion_fisica || 'No especificada' }}
              </td>
            </ng-container>

            <!-- Fecha Archivado Column -->
            <ng-container matColumnDef="fecha_archivado">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha Archivado</th>
              <td mat-cell *matCellDef="let archivo">
                {{ archivo.fecha_archivado | date:'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <!-- Fecha Expiración Column -->
            <ng-container matColumnDef="fecha_expiracion">
              <th mat-header-cell *matHeaderCellDef>Expira</th>
              <td mat-cell *matCellDef="let archivo">
                <span *ngIf="archivo.fecha_expiracion_retencion" 
                      [class.expiring-soon]="isExpiringSoon(archivo.fecha_expiracion_retencion)">
                  {{ archivo.fecha_expiracion_retencion | date:'dd/MM/yyyy' }}
                </span>
                <span *ngIf="!archivo.fecha_expiracion_retencion">Permanente</span>
              </td>
            </ng-container>

            <!-- Estado Column -->
            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let archivo">
                <mat-chip [color]="archivo.activo === 'ARCHIVADO' ? 'primary' : 'accent'">
                  {{ archivo.activo }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Acciones Column -->
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let archivo">
                <button mat-icon-button [matTooltip]="'Ver detalles'" (click)="verDetalle(archivo)">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button [matTooltip]="'Editar ubicación'" (click)="editarUbicacion(archivo)">
                  <mat-icon>edit_location</mat-icon>
                </button>
                <button mat-icon-button 
                        [matTooltip]="'Restaurar documento'" 
                        (click)="restaurarDocumento(archivo)"
                        *ngIf="archivo.activo === 'ARCHIVADO'"
                        color="warn">
                  <mat-icon>restore</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="totalArchivos"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 20, 50, 100]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .archivo-container {
      padding: 20px;
    }

    .filters-card, .table-card {
      margin-bottom: 20px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .filters-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .filters-row {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filters-row mat-form-field {
      flex: 1;
      min-width: 200px;
    }

    .filter-button {
      height: 56px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .archivo-table {
      width: 100%;
    }

    .expiring-soon {
      color: #f44336;
      font-weight: bold;
    }

    mat-chip {
      font-size: 12px;
    }
  `]
})
export class ArchivoDocumentalComponent implements OnInit {
  filtrosForm: FormGroup;
  archivos: Archivo[] = [];
  totalArchivos = 0;
  pageSize = 20;
  currentPage = 1;
  proximosAExpirar = 0;

  displayedColumns: string[] = [
    'codigo_ubicacion',
    'clasificacion',
    'politica_retencion',
    'ubicacion_fisica',
    'fecha_archivado',
    'fecha_expiracion',
    'activo',
    'acciones'
  ];

  clasificaciones = Object.values(ClasificacionArchivoEnum).map(value => ({
    value,
    label: getClasificacionLabel(value)
  }));

  politicas = Object.values(PoliticaRetencionEnum).map(value => ({
    value,
    label: getPoliticaRetencionLabel(value)
  }));

  constructor(
    private archivoService: ArchivoService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.filtrosForm = this.fb.group({
      busqueda: [''],
      clasificacion: [null],
      politica_retencion: [null],
      codigo_ubicacion: [''],
      fecha_archivado_desde: [null],
      fecha_archivado_hasta: [null],
      activo: [null]
    });
  }

  ngOnInit(): void {
    this.cargarArchivos();
    this.cargarProximosAExpirar();
  }

  cargarArchivos(): void {
    const filtros = this.construirFiltros();
    
    this.archivoService.listarArchivos(filtros).subscribe({
      next: (response) => {
        this.archivos = response.items;
        this.totalArchivos = response.total;
      },
      error: (error) => {
        console.error('Error loading archivos:', error);
      }
    });
  }

  cargarProximosAExpirar(): void {
    this.archivoService.obtenerProximosAExpirar(30).subscribe({
      next: (archivos) => {
        this.proximosAExpirar = archivos.length;
      },
      error: (error) => {
        console.error('Error loading expiring archivos:', error);
      }
    });
  }

  construirFiltros(): FiltrosArchivo {
    const formValue = this.filtrosForm.value;
    const filtros: FiltrosArchivo = {
      page: this.currentPage,
      size: this.pageSize,
      sort_by: 'fecha_archivado',
      sort_order: 'desc'
    };

    if (formValue.busqueda) {
      filtros.numero_expediente = formValue.busqueda;
      filtros.remitente = formValue.busqueda;
      filtros.asunto = formValue.busqueda;
    }

    if (formValue.clasificacion) {
      filtros.clasificacion = formValue.clasificacion;
    }

    if (formValue.politica_retencion) {
      filtros.politica_retencion = formValue.politica_retencion;
    }

    if (formValue.codigo_ubicacion) {
      filtros.codigo_ubicacion = formValue.codigo_ubicacion;
    }

    if (formValue.fecha_archivado_desde) {
      filtros.fecha_archivado_desde = formValue.fecha_archivado_desde;
    }

    if (formValue.fecha_archivado_hasta) {
      filtros.fecha_archivado_hasta = formValue.fecha_archivado_hasta;
    }

    if (formValue.activo) {
      filtros.activo = formValue.activo;
    }

    return filtros;
  }

  aplicarFiltros(): void {
    this.currentPage = 1;
    this.cargarArchivos();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.currentPage = 1;
    this.cargarArchivos();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarArchivos();
  }

  onSort(sort: Sort): void {
    // Implement sorting logic
    this.cargarArchivos();
  }

  verDetalle(archivo: Archivo): void {
    // Navigate to detail view or open modal
    console.log('Ver detalle:', archivo);
  }

  editarUbicacion(archivo: Archivo): void {
    // Open modal to edit ubicacion_fisica
    console.log('Editar ubicación:', archivo);
  }

  restaurarDocumento(archivo: Archivo): void {
    const dialogRef = this.dialog.open(RestaurarDocumentoModalComponent, {
      width: '500px',
      data: { archivo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarArchivos();
      }
    });
  }

  verProximosAExpirar(): void {
    // Filter to show only expiring documents
    this.filtrosForm.patchValue({
      activo: 'ARCHIVADO'
    });
    this.cargarArchivos();
  }

  isExpiringSoon(fechaExpiracion: Date): boolean {
    const fecha = new Date(fechaExpiracion);
    const hoy = new Date();
    const diasRestantes = Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 30 && diasRestantes >= 0;
  }

  getClasificacionLabel(clasificacion: ClasificacionArchivoEnum): string {
    return getClasificacionLabel(clasificacion);
  }

  getPoliticaLabel(politica: PoliticaRetencionEnum): string {
    return getPoliticaRetencionLabel(politica);
  }

  getPoliticaColor(politica: PoliticaRetencionEnum): string {
    return getPoliticaRetencionColor(politica);
  }
}
