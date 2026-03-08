import { Component, OnInit, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';

import { LocalidadAliasService } from '../../services/localidad-alias.service';
import { LocalidadAlias, AliasEstadisticas } from '../../models/localidad-alias.model';
import { Localidad } from '../../models/localidad.model';
import { AliasModalComponent } from './alias-modal.component';

export interface GestionAliasData {
  localidad: Localidad;
}

@Component({
  selector: 'app-gestion-alias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule,
    MatTabsModule
  ],
  templateUrl: './gestion-alias.component.html',
  styleUrls: ['./gestion-alias.component.scss']
})
export class GestionAliasComponent implements OnInit {
  // Signals
  isLoading = signal(false);
  alias = signal<LocalidadAlias[]>([]);
  aliasFiltrados = signal<LocalidadAlias[]>([]);
  aliasMasUsados = signal<AliasEstadisticas[]>([]);
  aliasSinUsar = signal<LocalidadAlias[]>([]);
  
  // Búsqueda
  terminoBusqueda = '';
  
  // Columnas de la tabla
  displayedColumns = ['alias', 'localidad_nombre', 'usos', 'verificado', 'acciones'];

  constructor(
    private aliasService: LocalidadAliasService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<GestionAliasComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionAliasData
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      // Obtener todos los alias y filtrar por la localidad actual
      const todosAlias = await this.aliasService.obtenerAlias(0, 1000).toPromise() || [];
      const aliasDeLocalidad = todosAlias.filter(a => a.localidad_id === this.data.localidad.id);

      this.alias.set(aliasDeLocalidad);
      this.aliasFiltrados.set(aliasDeLocalidad);
      
      console.log(`📋 Alias de ${this.data.localidad.nombre}:`, aliasDeLocalidad);
    } catch (error) {
      console.error('Error cargando alias:', error);
      this.snackBar.open('Error al cargar los alias', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  buscarAlias(): void {
    const termino = this.terminoBusqueda.toLowerCase().trim();
    
    if (!termino) {
      this.aliasFiltrados.set(this.alias());
      return;
    }

    const filtrados = this.alias().filter(a =>
      a.alias.toLowerCase().includes(termino) ||
      a.localidad_nombre.toLowerCase().includes(termino) ||
      (a.notas && a.notas.toLowerCase().includes(termino))
    );

    this.aliasFiltrados.set(filtrados);
  }

  nuevoAlias(): void {
    const dialogRef = this.dialog.open(AliasModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { 
        modo: 'crear',
        localidadPreestablecida: this.data.localidad
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarDatos();
      }
    });
  }

  editarAlias(alias: LocalidadAlias): void {
    const dialogRef = this.dialog.open(AliasModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { modo: 'editar', alias }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarDatos();
      }
    });
  }

  async eliminarAlias(alias: LocalidadAlias): Promise<void> {
    if (!confirm(`¿Eliminar el alias "${alias.alias}"?`)) {
      return;
    }

    try {
      await this.aliasService.eliminarAlias(alias.id).toPromise();
      this.snackBar.open('Alias eliminado exitosamente', 'Cerrar', { duration: 3000 });
      this.cargarDatos();
    } catch (error) {
      console.error('Error eliminando alias:', error);
      this.snackBar.open('Error al eliminar el alias', 'Cerrar', { duration: 3000 });
    }
  }

  getTotalUsos(alias: LocalidadAlias): number {
    return alias.usos_como_origen + alias.usos_como_destino + alias.usos_en_itinerario;
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.buscarAlias();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
