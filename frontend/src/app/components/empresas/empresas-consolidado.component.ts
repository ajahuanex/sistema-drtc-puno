import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { EmpresaConsolidadoService } from '../../services/empresa-consolidado.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EstadoEmpresa } from '../../models/empresa.model';

@Component({
  selector: 'app-empresas-consolidado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './empresas-consolidado.component.html',
  styleUrls: ['./empresas-consolidado.component.scss']
})
export class EmpresasConsolidadoComponent implements OnInit {
  private readonly empresaService = inject(EmpresaConsolidadoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoading = signal(false);
  readonly empresas = signal<Empresa[]>([]);
  readonly filteredEmpresas = signal<Empresa[]>([]);

  searchTerm = '';
  displayedColumns: string[] = ['ruc', 'razonSocial', 'representante', 'estado', 'acciones'];

  readonly totalEmpresas = computed(() => this.filteredEmpresas().length);

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading.set(true);
    
    setTimeout(() => {
      const mockEmpresas: Empresa[] = [
        {
          id: '1',
          codigoEmpresa: 'EMP001',
          ruc: '20123456789',
          razonSocial: {
            principal: 'Empresa de Transporte ABC S.A.C.',
            sunat: 'Empresa de Transporte ABC S.A.C.',
            minimo: 'ABC SAC'
          },
          direccionFiscal: 'Av. Principal 123, Puno',
          estado: 'AUTORIZADO' as EstadoEmpresa,
          tiposServicio: ['PERSONAS' as any],
          estaActivo: true,
          fechaRegistro: new Date(),
          fechaActualizacion: new Date(),
          representanteLegal: {
            dni: '12345678',
            nombres: 'Juan',
            apellidos: 'Pérez García',
            email: 'juan.perez@abc.com',
            telefono: '987654321'
          },
          documentos: [],
          auditoria: [],
          historialEventos: [],
          historialEstados: [],
          historialRepresentantes: [],
          resolucionesPrimigeniasIds: [],
          vehiculosHabilitadosIds: [],
          conductoresHabilitadosIds: [],
          rutasAutorizadasIds: [],
          observaciones: ''
        },
        {
          id: '2',
          codigoEmpresa: 'EMP002',
          ruc: '20987654321',
          razonSocial: {
            principal: 'Transportes Unidos del Sur E.I.R.L.',
            sunat: 'Transportes Unidos del Sur E.I.R.L.',
            minimo: 'Unidos Sur'
          },
          direccionFiscal: 'Jr. Comercio 456, Juliaca',
          estado: 'AUTORIZADO' as EstadoEmpresa,
          tiposServicio: ['PERSONAS' as any],
          estaActivo: true,
          fechaRegistro: new Date(),
          fechaActualizacion: new Date(),
          representanteLegal: {
            dni: '87654321',
            nombres: 'María',
            apellidos: 'López Quispe',
            email: 'maria.lopez@unidos.com',
            telefono: '123456789'
          },
          documentos: [],
          auditoria: [],
          historialEventos: [],
          historialEstados: [],
          historialRepresentantes: [],
          resolucionesPrimigeniasIds: [],
          vehiculosHabilitadosIds: [],
          conductoresHabilitadosIds: [],
          rutasAutorizadasIds: [],
          observaciones: ''
        }
      ];
      
      this.empresas.set(mockEmpresas);
      this.filteredEmpresas.set(mockEmpresas);
      this.isLoading.set(false);
    }, 1000);
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredEmpresas.set(this.empresas());
      return;
    }

    const filtered = this.empresas().filter(empresa =>
      empresa.ruc.toLowerCase().includes(term) ||
      empresa.razonSocial.principal.toLowerCase().includes(term) ||
      (empresa.representanteLegal.nombres + ' ' + empresa.representanteLegal.apellidos).toLowerCase().includes(term)
    );
    
    this.filteredEmpresas.set(filtered);
  }

  openCreateModal(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  viewDetails(empresa: Empresa): void {
    this.router.navigate(['/empresas', empresa.id]);
  }

  editEmpresa(empresa: Empresa): void {
    this.router.navigate(['/empresas', empresa.id, 'editar']);
  }

  viewVehiculos(empresa: Empresa): void {
    this.router.navigate(['/vehiculos'], { queryParams: { empresaId: empresa.id } });
  }

  viewTransferencias(empresa: Empresa): void {
    this.router.navigate(['/empresas', empresa.id, 'transferencias']);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredEmpresas.set(this.empresas());
  }

  getEstadoBadgeClass(estado: EstadoEmpresa): string {
    switch (estado) {
      case 'AUTORIZADO': return 'badge-success';
      case 'SUSPENDIDO': return 'badge-warning';
      case 'CANCELADO': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}