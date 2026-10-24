import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { CustodiaService, DocumentoCustodia, EstadisticasCustodia } from '../../services/custodia.service';
import { CustodiaFormDrawerComponent } from './custodia-form-drawer.component';
import { CustodiaPrestamoDialogComponent } from './custodia-prestamo-dialog.component';

@Component({
  selector: 'app-custodia',
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatMenuModule,
    MatPaginatorModule,
    MatDividerModule,
    CustodiaFormDrawerComponent
  ],
  templateUrl: './custodia.component.html',
  styleUrls: ['./custodia.component.scss']
})
export class CustodiaComponent implements OnInit {
  public custodiaService = inject(CustodiaService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Filtros reactivos
  search = signal<string>('');
  estadoFiltro = signal<string>('TODOS');
  areaFiltro = signal<string>('TODOS');
  tipoTramiteFiltro = signal<string>('TODOS');

  // Paginación
  pageIndex = signal<number>(0);
  pageSize = signal<number>(25);

  // Expediente seleccionado para ver trazabilidad
  documentoDetalle = signal<DocumentoCustodia | null>(null);

  // Estados reactivos para el Drawer Lateral Derecho de Formulario
  isDrawerFormOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  isDrawerAcumularMode = signal<boolean>(false);
  drawerDocEditando = signal<DocumentoCustodia | null>(null);

  areasOpciones = [
    'SUB DIRECCION DE TRANSPORTE TERRESTRE',
    'SUBDIRECCIÓN DE AUTORIZACIONES',
    'SUBDIRECCIÓN DE FISCALIZACIÓN',
    'DIRECCIÓN DE CIRCULACIÓN TERRESTRE',
    'ASESORÍA JURÍDICA',
    'DIRECCIÓN REGIONAL DRTC PUNO',
    'MESA DE PARTES / TRÁMITE DOCUMENTARIO'
  ];

  ngOnInit(): void {
    this.cargarDatos();
    this.custodiaService.cargarEstadisticas().subscribe();
  }

  cargarDatos(): void {
    const skip = this.pageIndex() * this.pageSize();
    const limit = this.pageSize();
    this.custodiaService.cargarDocumentos(
      skip,
      limit,
      this.search(),
      this.estadoFiltro(),
      this.areaFiltro(),
      this.tipoTramiteFiltro()
    ).subscribe();
  }

  onSearchChange(text: string): void {
    this.search.set(text);
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  onEstadoChange(estado: string): void {
    this.estadoFiltro.set(estado);
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  onAreaChange(area: string): void {
    this.areaFiltro.set(area);
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.search.set('');
    this.estadoFiltro.set('TODOS');
    this.areaFiltro.set('TODOS');
    this.tipoTramiteFiltro.set('TODOS');
    this.pageIndex.set(0);
    this.cargarDatos();
  }

  // Acciones de Formulario (Slide-over Lateral Derecho)
  abrirModalRegistro(): void {
    this.drawerDocEditando.set(null);
    this.isEditMode.set(false);
    this.isDrawerAcumularMode.set(false);
    this.isDrawerFormOpen.set(true);
  }

  abrirModalEdicion(doc: DocumentoCustodia): void {
    this.drawerDocEditando.set(doc);
    this.isEditMode.set(true);
    this.isDrawerAcumularMode.set(false);
    this.isDrawerFormOpen.set(true);
  }

  abrirModalAcumular(doc?: DocumentoCustodia): void {
    this.drawerDocEditando.set(doc || null);
    this.isEditMode.set(false);
    this.isDrawerAcumularMode.set(true);
    this.isDrawerFormOpen.set(true);
  }

  cerrarDrawerForm(): void {
    this.isDrawerFormOpen.set(false);
    this.drawerDocEditando.set(null);
    this.isDrawerAcumularMode.set(false);
  }

  onDrawerFormGuardado(): void {
    this.isDrawerFormOpen.set(false);
    this.drawerDocEditando.set(null);
    this.isDrawerAcumularMode.set(false);
    this.cargarDatos();
    this.custodiaService.cargarEstadisticas().subscribe();
    if (this.documentoDetalle()) {
      const id = this.documentoDetalle()?.id || this.documentoDetalle()?._id;
      if (id) {
        this.custodiaService.obtenerPorId(id).subscribe({
          next: (actualizado) => this.documentoDetalle.set(actualizado)
        });
      }
    }
  }

  abrirModalPrestamo(doc: DocumentoCustodia): void {
    const ref = this.dialog.open(CustodiaPrestamoDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: { documento: doc, modo: 'PRESTAMO' }
    });

    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.cargarDatos();
      }
    });
  }

  abrirModalDevolucion(doc: DocumentoCustodia): void {
    const ref = this.dialog.open(CustodiaPrestamoDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: { documento: doc, modo: 'DEVOLUCION' }
    });

    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.cargarDatos();
      }
    });
  }

  verTrazabilidad(doc: DocumentoCustodia): void {
    this.documentoDetalle.set(doc);
  }

  cerrarDetalle(): void {
    this.documentoDetalle.set(null);
  }

  eliminarRegistro(doc: DocumentoCustodia): void {
    const id = doc.id || doc._id!;
    const confirmacion = confirm(`¿Está seguro de eliminar el registro de custodia ${doc.codigo_custodia || doc.nro_expediente}? Esta acción no se puede deshacer.`);
    if (confirmacion) {
      this.custodiaService.eliminar(id).subscribe({
        next: () => {
          this.snackBar.open('✓ Registro eliminado del archivo de custodia', 'Cerrar', { duration: 3000 });
          this.cargarDatos();
          if (this.documentoDetalle()?.id === id || this.documentoDetalle()?._id === id) {
            this.documentoDetalle.set(null);
          }
        },
        error: (err) => {
          this.snackBar.open(`❌ Error al eliminar: ${err.message || 'Error en servidor'}`, 'Cerrar', { duration: 4000 });
        }
      });
    }
  }

  // Helpers de Formato
  formatoFecha(fechaStr?: string): string {
    if (!fechaStr) return '-';
    const match = String(fechaStr).match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return fechaStr;
  }

  getTipoTramiteLabel(tipo?: string): string {
    switch (tipo) {
      case 'CONCESION_RUTA': return 'Concesión de Ruta';
      case 'INCREMENTO_FLOTA': return 'Incremento de Flota';
      case 'SUSTITUCION_FLOTA': return 'Sustitución de Flota';
      case 'RENOVACION_PERMISO': return 'Renovación de Permiso';
      case 'MODIFICACION_RUTA': return 'Modificación de Ruta';
      case 'BAJA_VEHICULAR': return 'Baja Vehicular';
      case 'SANCION_FISCALIZACION': return 'Fiscalización / PAD';
      case 'DUPLICADO_TUC': return 'Duplicado TUC';
      default: return 'Trámite General';
    }
  }
}
