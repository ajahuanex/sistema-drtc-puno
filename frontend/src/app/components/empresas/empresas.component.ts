import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { EmpresaService } from '../../services/empresa.service';
import { RutaService } from '../../services/ruta.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaFiltros, EmpresaEstadisticas } from '../../models/empresa.model';
import { Ruta } from '../../models/ruta.model';
import { CrearResolucionModalComponent } from './crear-resolucion-modal.component';
import { ValidacionSunatModalComponent } from './validacion-sunat-modal.component';
import { GestionDocumentosModalComponent } from './gestion-documentos-modal.component';
import { HistorialAuditoriaModalComponent } from './historial-auditoria-modal.component';
import { CrearRutaModalComponent } from './crear-ruta-modal.component';
import { VehiculoModalService } from '../../services/vehiculo-modal.service';

@Component({
  selector: 'app-empresas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatChipsModule,
    MatDialogModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.scss']
})
export class EmpresasComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private rutaService = inject(RutaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private vehiculoModalService = inject(VehiculoModalService);

  // Signals
  empresas = signal<Empresa[]>([]);
  isLoading = signal(false);
  estadisticas = signal<EmpresaEstadisticas | undefined>(undefined);

  // Computed properties
  displayedColumns = ['ruc', 'razonSocial', 'estado', 'rutas', 'vehiculos', 'conductores', 'acciones'];
  filtrosForm: FormGroup;

  constructor() {
    this.filtrosForm = this.fb.group({
      ruc: [''],
      razonSocial: [''],
      estado: [''],
      fechaDesde: [''],
      fechaHasta: ['']
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      console.log('USUARIO NO AUTENTICADO, REDIRIGIENDO A LOGIN...');
      this.router.navigate(['/login']);
      return;
    }

    console.log('USUARIO AUTENTICADO:', this.authService.getCurrentUser());
    console.log('TOKEN DISPONIBLE:', !!this.authService.getToken());

    this.loadEmpresas();
    this.loadEstadisticas();
  }

  recargarEmpresas(): void {
    console.log('RECARGANDO EMPRESAS MANUALMENTE...');
    this.loadEmpresas();
    this.loadEstadisticas();
  }

  loadEmpresas(): void {
    this.isLoading.set(true);
    console.log('INICIANDO CARGA DE EMPRESAS...');

    this.empresaService.getEmpresas(0, 100).subscribe({
      next: (empresas) => {
        console.log('EMPRESAS CARGADAS EXITOSAMENTE:', empresas);
        this.empresas.set(empresas);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('ERROR CARGANDO EMPRESAS:', error);
        this.isLoading.set(false);
        this.snackBar.open('ERROR AL CARGAR LAS EMPRESAS', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  loadEstadisticas(): void {
    this.empresaService.getEstadisticasEmpresas().subscribe({
      next: (estadisticas) => {
        this.estadisticas.set(estadisticas);
      },
      error: (error) => {
        console.error('ERROR CARGANDO ESTADÍSTICAS:', error);
      }
    });
  }

  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;
    console.log('APLICANDO FILTROS:', filtros);

    this.isLoading.set(true);
    this.empresaService.getEmpresasConFiltros(filtros).subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('ERROR APLICANDO FILTROS:', error);
        this.isLoading.set(false);
        this.snackBar.open('ERROR AL APLICAR FILTROS', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.loadEmpresas();
  }

  verEmpresa(id: string): void {
    this.router.navigate(['/empresas', id]);
  }

  editarEmpresa(id: string): void {
    this.router.navigate(['/empresas', id, 'editar']);
  }

  nuevaEmpresa(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  cargaMasivaEmpresas(): void {
    this.router.navigate(['/empresas/carga-masiva']);
  }

  nuevoVehiculo(empresaId: string): void {
    this.vehiculoModalService.openCreateForEmpresa(empresaId).subscribe({
      next: (vehiculo) => {
        console.log('✅ Vehículo creado para empresa:', vehiculo);
        this.snackBar.open('Vehículo creado correctamente', 'Cerrar', { duration: 3000 });
        // Recargar datos de la empresa para mostrar el nuevo vehículo
        this.loadEmpresas();
        this.loadEstadisticas();
      },
      error: (error) => {
        console.error('❌ Error al crear vehículo:', error);
        this.snackBar.open('Error al crear vehículo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  gestionarVehiculos(empresaId: string): void {
    this.router.navigate(['/empresas', empresaId, 'vehiculos', 'batch']);
  }

  gestionarConductores(empresaId: string): void {
    // TODO: Implementar gestión de conductores
    this.snackBar.open('FUNCIÓN EN DESARROLLO', 'CERRAR', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  verResoluciones(empresaId: string): void {
    // TODO: Implementar vista de resoluciones
    this.snackBar.open('FUNCIÓN EN DESARROLLO', 'CERRAR', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  eliminarEmpresa(id: string): void {
    if (confirm('¿ESTÁ SEGURO DE QUE DESEA ELIMINAR ESTA EMPRESA? ESTA ACCIÓN NO SE PUEDE DESHACER.')) {
      this.empresaService.deleteEmpresa(id).subscribe({
        next: () => {
          this.snackBar.open('EMPRESA ELIMINADA EXITOSAMENTE', 'CERRAR', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.loadEmpresas();
          this.loadEstadisticas();
        },
        error: (error) => {
          console.error('ERROR ELIMINANDO EMPRESA:', error);
          this.snackBar.open('ERROR AL ELIMINAR LA EMPRESA', 'CERRAR', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  exportarEmpresas(): void {
    this.empresaService.exportarEmpresas('excel').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'empresas.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('ARCHIVO EXPORTADO EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        console.error('ERROR EXPORTANDO EMPRESAS:', error);
        this.snackBar.open('ERROR AL EXPORTAR EMPRESAS', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  dashboardEmpresas(): void {
    this.router.navigate(['/empresas/dashboard']);
  }

  gestionarDocumentos(empresa: Empresa): void {
    const dialogRef = this.dialog.open(GestionDocumentosModalComponent, {
      width: '800px',
      data: {
        empresaId: empresa.id,
        empresaRuc: empresa.ruc,
        empresaRazonSocial: empresa.razonSocial.principal,
        documentos: empresa.documentos
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Documentos actualizados:', result);
        this.snackBar.open('DOCUMENTOS ACTUALIZADOS EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  verHistorialAuditoria(empresa: Empresa): void {
    const dialogRef = this.dialog.open(HistorialAuditoriaModalComponent, {
      width: '900px',
      data: {
        empresaId: empresa.id,
        empresaRuc: empresa.ruc,
        empresaRazonSocial: empresa.razonSocial.principal,
        auditoria: empresa.auditoria
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Auditoría exportada:', result);
      }
    });
  }

  validarConSunat(empresa: Empresa): void {
    const dialogRef = this.dialog.open(ValidacionSunatModalComponent, {
      width: '600px',
      data: {
        ruc: empresa.ruc,
        razonSocial: empresa.razonSocial.principal
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Validación SUNAT:', result);
        this.snackBar.open('VALIDACIÓN SUNAT COMPLETADA', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  crearRuta(empresa: Empresa): void {
    const dialogRef = this.dialog.open(CrearRutaModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        empresa: empresa // Pre-cargar la empresa seleccionada
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('RUTA CREADA:', result);
        this.snackBar.open('RUTA CREADA EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        // Aquí podrías recargar las rutas si es necesario
      }
    });
  }

  crearRutaGeneral(): void {
    const dialogRef = this.dialog.open(CrearRutaModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {} // Los datos se seleccionarán en el modal
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('RUTA CREADA:', result);
        this.snackBar.open('RUTA CREADA EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        // Aquí podrías recargar las rutas si es necesario
      }
    });
  }

  crearResolucion(): void {
    const dialogRef = this.dialog.open(CrearResolucionModalComponent, {
      width: '700px',
      data: { empresaId: null } // SE SELECCIONARÁ LA EMPRESA EN EL MODAL
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('RESOLUCIÓN CREADA:', result);
        this.snackBar.open('RESOLUCIÓN CREADA EXITOSAMENTE', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        // AQUÍ PODRÍAS RECARGAR LAS RESOLUCIONES SI ES NECESARIO
      }
    });
  }

  verRutasEmpresa(empresa: Empresa): void {
    // Cargar las rutas de la empresa
    this.rutaService.getRutasPorEmpresa(empresa.id).subscribe({
      next: (rutas) => {
        // Mostrar las rutas en un modal o navegar a una vista de rutas
        console.log('RUTAS DE LA EMPRESA:', rutas);

        // Por ahora, mostrar en consola y snackbar
        this.snackBar.open(`EMPRESA ${empresa.ruc}: ${rutas.length} RUTAS ENCONTRADAS`, 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });

        // Aquí podrías abrir un modal para mostrar las rutas
        // o navegar a una vista específica de rutas de la empresa
      },
      error: (error) => {
        console.error('ERROR CARGANDO RUTAS:', error);
        this.snackBar.open('ERROR AL CARGAR LAS RUTAS DE LA EMPRESA', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }
}