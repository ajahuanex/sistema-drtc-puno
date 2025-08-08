import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../models/empresa.model';

@Component({
  selector: 'app-empresa-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="container mx-auto p-4">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Detalles de Empresa</mat-card-title>
          <mat-card-subtitle>{{ empresa?.razonSocial?.principal }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="mt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Información básica -->
            <div>
              <h3 class="text-lg font-semibold mb-4">Información Básica</h3>
              <div class="space-y-3">
                <div>
                  <label class="text-sm font-medium text-gray-600">RUC:</label>
                  <p class="text-gray-900">{{ empresa?.ruc }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-600">Razón Social:</label>
                  <p class="text-gray-900">{{ empresa?.razonSocial?.principal }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-600">Dirección Fiscal:</label>
                  <p class="text-gray-900">{{ empresa?.direccionFiscal }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-600">Estado:</label>
                  <span class="px-2 py-1 text-xs rounded-full" 
                        [class]="getEstadoClass(empresa?.estado)">
                    {{ empresa?.estado }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Representante Legal -->
            <div>
              <h3 class="text-lg font-semibold mb-4">Representante Legal</h3>
              <div class="space-y-3">
                <div>
                  <label class="text-sm font-medium text-gray-600">DNI:</label>
                  <p class="text-gray-900">{{ empresa?.representanteLegal?.dni }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-600">Nombres:</label>
                  <p class="text-gray-900">{{ empresa?.representanteLegal?.nombres }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Resoluciones -->
          <div class="mt-8">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">Resoluciones Primigenias</h3>
              <button mat-raised-button color="primary" (click)="agregarResolucion()">
                <mat-icon>add</mat-icon>
                Agregar Resolución
              </button>
            </div>
            
            <div class="space-y-2">
              <div *ngFor="let resolucionId of empresa?.resolucionesPrimigeniasIds" 
                   class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span class="text-gray-900">{{ resolucionId }}</span>
                <button mat-icon-button color="warn" (click)="removerResolucion(resolucionId)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
              
              <div *ngIf="!empresa?.resolucionesPrimigeniasIds?.length" 
                   class="text-center py-8 text-gray-500">
                No hay resoluciones asignadas
              </div>
            </div>
          </div>

          <!-- Vehículos -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold mb-4">Vehículos Habilitados</h3>
            <div class="flex flex-wrap gap-2">
              <mat-chip *ngFor="let vehiculoId of empresa?.vehiculosHabilitadosIds" 
                       class="bg-blue-100 text-blue-800">
                {{ vehiculoId }}
              </mat-chip>
              <span *ngIf="!empresa?.vehiculosHabilitadosIds?.length" class="text-gray-500">
                No hay vehículos asignados
              </span>
            </div>
            <button mat-raised-button 
                    color="primary" 
                    (click)="irAAgregarVehiculos()"
                    class="action-button">
              <mat-icon>add_circle</mat-icon>
              Agregar Múltiples Vehículos
            </button>
          </div>

          <!-- Conductores -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold mb-4">Conductores Habilitados</h3>
            <div class="flex flex-wrap gap-2">
              <mat-chip *ngFor="let conductorId of empresa?.conductoresHabilitadosIds" 
                       class="bg-green-100 text-green-800">
                {{ conductorId }}
              </mat-chip>
              <span *ngIf="!empresa?.conductoresHabilitadosIds?.length" class="text-gray-500">
                No hay conductores asignados
              </span>
            </div>
          </div>

          <!-- Rutas -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold mb-4">Rutas Autorizadas</h3>
            <div class="flex flex-wrap gap-2">
              <mat-chip *ngFor="let rutaId of empresa?.rutasAutorizadasIds" 
                       class="bg-purple-100 text-purple-800">
                {{ rutaId }}
              </mat-chip>
              <span *ngIf="!empresa?.rutasAutorizadasIds?.length" class="text-gray-500">
                No hay rutas asignadas
              </span>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions class="p-4">
          <button mat-raised-button color="primary" (click)="editarEmpresa()">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
          <button mat-raised-button color="warn" (click)="eliminarEmpresa()">
            <mat-icon>delete</mat-icon>
            Eliminar
          </button>
          <button mat-raised-button (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }
  `]
})
export class EmpresaDetailComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  empresa: Empresa | null = null;
  resolucionForm: FormGroup;

  constructor() {
    this.resolucionForm = this.fb.group({
      resolucionId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const empresaId = this.route.snapshot.paramMap.get('id');
    if (empresaId) {
      this.cargarEmpresa(empresaId);
    }
  }

  cargarEmpresa(id: string): void {
    this.empresaService.getEmpresaById(id).subscribe({
      next: (empresa) => {
        this.empresa = empresa;
        console.log('Empresa cargada:', empresa);
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.snackBar.open('Error al cargar la empresa', 'Cerrar', { duration: 3000 });
      }
    });
  }

  agregarResolucion(): void {
    const resolucionId = prompt('Ingrese el ID de la resolución:');
    if (resolucionId && this.empresa) {
      this.empresaService.agregarResolucionAEmpresa(this.empresa.id, resolucionId).subscribe({
        next: (empresaActualizada) => {
          this.empresa = empresaActualizada;
          this.snackBar.open('Resolución agregada exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error agregando resolución:', error);
          this.snackBar.open('Error al agregar la resolución', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  removerResolucion(resolucionId: string): void {
    if (confirm(`¿Está seguro de que desea remover la resolución ${resolucionId}?`) && this.empresa) {
      this.empresaService.removerResolucionDeEmpresa(this.empresa.id, resolucionId).subscribe({
        next: (empresaActualizada) => {
          this.empresa = empresaActualizada;
          this.snackBar.open('Resolución removida exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error removiendo resolución:', error);
          this.snackBar.open('Error al remover la resolución', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  editarEmpresa(): void {
    if (this.empresa) {
      this.router.navigate(['/empresas', this.empresa.id, 'editar']);
    }
  }

  eliminarEmpresa(): void {
    if (this.empresa && confirm('¿Está seguro de que desea eliminar esta empresa?')) {
      this.empresaService.deleteEmpresa(this.empresa.id).subscribe({
        next: () => {
          this.snackBar.open('Empresa eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/empresas']);
        },
        error: (error) => {
          console.error('Error eliminando empresa:', error);
          this.snackBar.open('Error al eliminar la empresa', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  volver(): void {
    this.router.navigate(['/empresas']);
  }

  irAAgregarVehiculos(): void {
    if (this.empresa?.id) {
      this.router.navigate(['/empresas', this.empresa.id, 'vehiculos', 'batch']);
    }
  }

  getEstadoClass(estado?: string): string {
    switch (estado) {
      case 'HABILITADA':
        return 'bg-green-100 text-green-800';
      case 'EN_TRAMITE':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDIDA':
        return 'bg-red-100 text-red-800';
      case 'CANCELADA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
} 