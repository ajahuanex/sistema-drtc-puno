import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EstadoEmpresa } from '../../models/empresa.model';

@Component({
  selector: 'app-empresa-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTableModule,
    MatExpansionModule,
    MatListModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ empresa?.razonSocial?.principal || 'Cargando...' }}</h1>
          <div class="header-subtitle">
            <span class="ruc">RUC: {{ empresa?.ruc || '...' }}</span>
            <span class="separator">•</span>
            <span class="estado" [class]="'estado-' + empresa?.estado?.toLowerCase()">
              {{ getEstadoDisplayName(empresa?.estado) }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-button color="accent" (click)="volver()" class="action-button">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
          <button mat-raised-button color="primary" (click)="editarEmpresa()" class="action-button">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
        </div>
      </div>
    </div>

    <div class="content-section">
      <!-- Loading State -->
      @if (isLoading) {
        <div class="loading-container">
          <div class="loading-content">
            <mat-spinner diameter="60" class="loading-spinner"></mat-spinner>
            <h3>Cargando empresa...</h3>
            <p>Obteniendo información detallada de la empresa</p>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (!isLoading && !empresa) {
        <div class="error-container">
          <div class="error-content">
            <mat-icon class="error-icon">error</mat-icon>
            <h3>Empresa no encontrada</h3>
            <p>La empresa que buscas no existe o ha sido eliminada.</p>
            <button mat-raised-button color="primary" (click)="volver()">
              <mat-icon>arrow_back</mat-icon>
              Volver a Empresas
            </button>
          </div>
        </div>
      }

      <!-- Content -->
      @if (!isLoading && empresa) {
        <div class="content-container">
          <mat-tab-group class="tabs-container">
            <!-- Tab: Información General -->
            <mat-tab label="Información General">
              <div class="tab-content">
                <div class="info-grid">
                  <!-- Información Básica -->
                  <mat-card class="info-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>business</mat-icon>
                        Información Básica
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="info-list">
                        <div class="info-item">
                          <span class="info-label">RUC:</span>
                          <span class="info-value">{{ empresa.ruc }}</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Razón Social:</span>
                          <span class="info-value">{{ empresa.razonSocial.principal }}</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Dirección Fiscal:</span>
                          <span class="info-value">{{ empresa.direccionFiscal }}</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Estado:</span>
                          <span class="info-value">
                            <mat-chip [class]="'estado-chip-' + empresa.estado.toLowerCase()">
                              {{ getEstadoDisplayName(empresa.estado) }}
                            </mat-chip>
                          </span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Fecha de Registro:</span>
                          <span class="info-value">{{ empresa.fechaRegistro | date:'dd/MM/yyyy' }}</span>
                        </div>
                        @if (empresa.fechaActualizacion) {
                          <div class="info-item">
                            <span class="info-label">Última Actualización:</span>
                            <span class="info-value">{{ empresa.fechaActualizacion | date:'dd/MM/yyyy' }}</span>
                          </div>
                        }
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Representante Legal -->
                  <mat-card class="info-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>person</mat-icon>
                        Representante Legal
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="info-list">
                        <div class="info-item">
                          <span class="info-label">DNI:</span>
                          <span class="info-value">{{ empresa.representanteLegal.dni }}</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Nombres:</span>
                          <span class="info-value">{{ empresa.representanteLegal.nombres }}</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">Apellidos:</span>
                          <span class="info-value">{{ empresa.representanteLegal.apellidos }}</span>
                        </div>
                        @if (empresa.representanteLegal.email) {
                          <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">{{ empresa.representanteLegal.email }}</span>
                          </div>
                        }
                        @if (empresa.representanteLegal.telefono) {
                          <div class="info-item">
                            <span class="info-label">Teléfono:</span>
                            <span class="info-value">{{ empresa.representanteLegal.telefono }}</span>
                          </div>
                        }
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Información de Contacto -->
                  <mat-card class="info-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>contact_phone</mat-icon>
                        Información de Contacto
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="info-list">
                        @if (empresa.emailContacto) {
                          <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">{{ empresa.emailContacto }}</span>
                          </div>
                        }
                        @if (empresa.telefonoContacto) {
                          <div class="info-item">
                            <span class="info-label">Teléfono:</span>
                            <span class="info-value">{{ empresa.telefonoContacto }}</span>
                          </div>
                        }
                        @if (empresa.sitioWeb) {
                          <div class="info-item">
                            <span class="info-label">Sitio Web:</span>
                            <span class="info-value">{{ empresa.sitioWeb }}</span>
                          </div>
                        }
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>

            <!-- Tab: Documentos -->
            <mat-tab label="Documentos">
              <div class="tab-content">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>description</mat-icon>
                      Documentos de la Empresa
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (empresa.documentos && empresa.documentos.length > 0) {
                      <div class="documentos-grid">
                        @for (documento of empresa.documentos; track documento.numero) {
                          <mat-card class="documento-card">
                            <mat-card-header>
                              <mat-card-title>{{ documento.tipo }}</mat-card-title>
                              <mat-card-subtitle>{{ documento.numero }}</mat-card-subtitle>
                            </mat-card-header>
                            <mat-card-content>
                              <div class="documento-info">
                                <div class="info-item">
                                  <span class="info-label">Fecha de Emisión:</span>
                                  <span class="info-value">{{ documento.fechaEmision | date:'dd/MM/yyyy' }}</span>
                                </div>
                                @if (documento.fechaVencimiento) {
                                  <div class="info-item">
                                    <span class="info-label">Fecha de Vencimiento:</span>
                                    <span class="info-value" [class.vencido]="isDocumentoVencido(documento)">
                                      {{ documento.fechaVencimiento | date:'dd/MM/yyyy' }}
                                    </span>
                                  </div>
                                }
                                <div class="info-item">
                                  <span class="info-label">Estado:</span>
                                  <span class="info-value">
                                    <mat-chip [class]="documento.estaActivo ? 'activo' : 'inactivo'">
                                      {{ documento.estaActivo ? 'Activo' : 'Inactivo' }}
                                    </mat-chip>
                                  </span>
                                </div>
                              </div>
                            </mat-card-content>
                          </mat-card>
                        }
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">description</mat-icon>
                        <h3>No hay documentos registrados</h3>
                        <p>Esta empresa no tiene documentos asociados.</p>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Tab: Vehículos -->
            <mat-tab label="Vehículos">
              <div class="tab-content">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>directions_car</mat-icon>
                      Vehículos Asociados
                      <span class="badge-count">({{ empresa.vehiculosHabilitadosIds.length || 0 }})</span>
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (empresa.vehiculosHabilitadosIds && empresa.vehiculosHabilitadosIds.length > 0) {
                      <div class="vehiculos-grid">
                        @for (vehiculoId of empresa.vehiculosHabilitadosIds; track vehiculoId) {
                          <mat-card class="vehiculo-card">
                            <mat-card-header>
                              <mat-card-title>Vehículo {{ vehiculoId }}</mat-card-title>
                              <mat-card-subtitle>ID: {{ vehiculoId }}</mat-card-subtitle>
                            </mat-card-header>
                            <mat-card-content>
                              <p>Información del vehículo se cargará próximamente.</p>
                            </mat-card-content>
                          </mat-card>
                        }
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">directions_car</mat-icon>
                        <h3>No hay vehículos asociados</h3>
                        <p>Esta empresa no tiene vehículos registrados.</p>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Tab: Conductores -->
            <mat-tab label="Conductores">
              <div class="tab-content">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>person</mat-icon>
                      Conductores Asociados
                      <span class="badge-count">({{ empresa.conductoresHabilitadosIds.length || 0 }})</span>
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (empresa.conductoresHabilitadosIds && empresa.conductoresHabilitadosIds.length > 0) {
                      <div class="conductores-grid">
                        @for (conductorId of empresa.conductoresHabilitadosIds; track conductorId) {
                          <mat-card class="conductor-card">
                            <mat-card-header>
                              <mat-card-title>Conductor {{ conductorId }}</mat-card-title>
                              <mat-card-subtitle>ID: {{ conductorId }}</mat-card-subtitle>
                            </mat-card-header>
                            <mat-card-content>
                              <p>Información del conductor se cargará próximamente.</p>
                            </mat-card-content>
                          </mat-card>
                        }
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">person</mat-icon>
                        <h3>No hay conductores asociados</h3>
                        <p>Esta empresa no tiene conductores registrados.</p>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Tab: Auditoría -->
            <mat-tab label="Auditoría">
              <div class="tab-content">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>history</mat-icon>
                      Historial de Cambios
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (empresa.auditoria && empresa.auditoria.length > 0) {
                      <div class="auditoria-list">
                        @for (auditoria of empresa.auditoria; track auditoria.fechaCambio) {
                          <mat-card class="auditoria-card">
                            <mat-card-header>
                              <mat-card-title>{{ auditoria.tipoCambio }}</mat-card-title>
                              <mat-card-subtitle>{{ auditoria.fechaCambio | date:'dd/MM/yyyy HH:mm' }}</mat-card-subtitle>
                            </mat-card-header>
                            <mat-card-content>
                              @if (auditoria.observaciones) {
                                <p>{{ auditoria.observaciones }}</p>
                              }
                            </mat-card-content>
                          </mat-card>
                        }
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">history</mat-icon>
                        <h3>No hay historial de cambios</h3>
                        <p>Esta empresa no tiene registros de auditoría.</p>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .header-content {
      flex: 1;
    }

    .header-title {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header-subtitle {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #6c757d;
      font-size: 16px;
    }

    .separator {
      color: #dee2e6;
    }

    .estado {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .estado-habilitada {
      background-color: #d4edda;
      color: #155724;
    }

    .estado-en_tramite {
      background-color: #fff3cd;
      color: #856404;
    }

    .estado-suspendida {
      background-color: #f8d7da;
      color: #721c24;
    }

    .estado-cancelada {
      background-color: #e2e3e5;
      color: #383d41;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: 40px;
      padding: 0 24px;
      transition: all 0.2s ease-in-out;
    }

    .content-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .loading-content h3 {
      margin: 24px 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .loading-content p {
      margin: 0;
      color: #6c757d;
    }

    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 80px 24px;
      text-align: center;
    }

    .error-content h3 {
      margin: 24px 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .error-content p {
      margin: 0 0 24px 0;
      color: #6c757d;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #dc3545;
    }

    .content-container {
      padding: 24px;
    }

    .tabs-container {
      background: transparent;
    }

    .tab-content {
      padding: 24px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .info-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: none;
    }

    .info-card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #2c3e50;
    }

    .info-value {
      color: #6c757d;
      font-weight: 500;
    }

    .estado-chip-habilitada {
      background-color: #d4edda;
      color: #155724;
    }

    .estado-chip-en_tramite {
      background-color: #fff3cd;
      color: #856404;
    }

    .estado-chip-suspendida {
      background-color: #f8d7da;
      color: #721c24;
    }

    .estado-chip-cancelada {
      background-color: #e2e3e5;
      color: #383d41;
    }

    .documentos-grid,
    .vehiculos-grid,
    .conductores-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .documento-card,
    .vehiculo-card,
    .conductor-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .documento-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .vencido {
      color: #dc3545;
      font-weight: 600;
    }

    .activo {
      background-color: #d4edda;
      color: #155724;
    }

    .inactivo {
      background-color: #f8d7da;
      color: #721c24;
    }

    .auditoria-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .auditoria-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #6c757d;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-weight: 500;
    }

    .empty-state p {
      margin: 0;
      color: #6c757d;
    }

    .badge-count {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-title h1 {
        font-size: 24px;
      }

      .header-subtitle {
        flex-direction: column;
        gap: 8px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .documentos-grid,
      .vehiculos-grid,
      .conductores-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EmpresaDetailComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  empresa?: Empresa;
  isLoading = false;

  ngOnInit(): void {
    const empresaId = this.route.snapshot.params['id'];
    if (empresaId) {
      this.loadEmpresa(empresaId);
    }
  }

  loadEmpresa(id: string): void {
    this.isLoading = true;
    this.empresaService.getEmpresaById(id).subscribe({
      next: (empresa) => {
        this.empresa = empresa;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.snackBar.open('Error al cargar la empresa', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getEstadoDisplayName(estado?: string): string {
    if (!estado) return 'Desconocido';
    
    const estados: { [key: string]: string } = {
      'HABILITADA': 'Habilitada',
      'EN_TRAMITE': 'En Trámite',
      'SUSPENDIDA': 'Suspendida',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  isDocumentoVencido(documento: any): boolean {
    if (!documento.fechaVencimiento) return false;
    return new Date(documento.fechaVencimiento) < new Date();
  }

  volver(): void {
    this.router.navigate(['/empresas']);
  }

  editarEmpresa(): void {
    if (this.empresa) {
      this.router.navigate(['/empresas', this.empresa.id, 'editar']);
    }
  }
} 