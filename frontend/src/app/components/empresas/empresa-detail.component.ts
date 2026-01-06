import { Component, OnInit, ChangeDetectorRef, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EstadoEmpresa } from '../../models/empresa.model';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaService } from '../../services/ruta.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { Resolucion } from '../../models/resolucion.model';
import { Ruta } from '../../models/ruta.model';
import { Vehiculo } from '../../models/vehiculo.model';
import { CrearResolucionModalComponent } from './crear-resolucion-modal.component';
import { CrearRutaModalComponent } from './crear-ruta-modal.component';
import { EmpresaVehiculosBatchComponent } from './empresa-vehiculos-batch.component';
import { CodigoEmpresaInfoComponent } from '../shared/codigo-empresa-info.component';

@Component({
  selector: 'app-empresa-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    MatDividerModule,
    MatMenuModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    CodigoEmpresaInfoComponent
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
          <button mat-raised-button color="accent" (click)="verHistorialTransferencias()" class="action-button">
            <mat-icon>swap_horiz</mat-icon>
            Historial Transferencias
          </button>
          <button mat-raised-button color="warn" (click)="verBajasVehiculares()" class="action-button">
            <mat-icon>remove_circle</mat-icon>
            Bajas Vehiculares
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

                  <!-- Código de Empresa -->
                  <app-codigo-empresa-info 
                    [codigoEmpresa]="empresa.codigoEmpresa || ''">
                  </app-codigo-empresa-info>
                </div>
              </div>
            </mat-tab>

            <!-- Tab: Gestión -->
            <mat-tab label="Gestión">
              <div class="tab-content">
                <div class="gestion-grid">
                  <!-- Gestión de Resoluciones -->
                  <mat-card class="gestion-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>gavel</mat-icon>
                        Resoluciones
                      </mat-card-title>
                      <mat-card-subtitle>Administrar resoluciones de la empresa</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>Gestiona las resoluciones administrativas, autorizaciones y permisos de la empresa.</p>
                      <div class="stats-row">
                        <span class="stat-item">
                          <strong>{{ empresa.resolucionesPrimigeniasIds.length || 0 }}</strong>
                          <small>Resoluciones</small>
                        </span>
                      </div>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-raised-button color="primary" (click)="crearResolucion()">
                        <mat-icon>add</mat-icon>
                        Nueva Resolución
                      </button>
                      <button mat-button color="accent" (click)="verTodasResoluciones()">
                        <mat-icon>list</mat-icon>
                        Ver Todas
                      </button>
                    </mat-card-actions>
                  </mat-card>

                  <!-- Gestión de Vehículos -->
                  <mat-card class="gestion-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>directions_car</mat-icon>
                        Vehículos
                      </mat-card-title>
                      <mat-card-subtitle>Administrar flota vehicular</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>Gestiona la flota de vehículos autorizados y sus documentos de circulación.</p>
                      <div class="stats-row">
                        <span class="stat-item">
                          <strong>{{ getTotalVehiculosEmpresa() }}</strong>
                          <small>Vehículos</small>
                        </span>
                      </div>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-raised-button color="primary" (click)="agregarVehiculos()">
                        <mat-icon>add</mat-icon>
                        Agregar Vehículos
                      </button>
                      <button mat-button color="accent" (click)="verTodosVehiculos()">
                        <mat-icon>list</mat-icon>
                        Ver Todos
                      </button>
                    </mat-card-actions>
                  </mat-card>

                  <!-- Gestión de Conductores -->
                  <mat-card class="gestion-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>person</mat-icon>
                        Conductores
                      </mat-card-title>
                      <mat-card-subtitle>Administrar personal conductor</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>Gestiona los conductores autorizados y sus licencias de conducir.</p>
                      <div class="stats-row">
                        <span class="stat-item">
                          <strong>{{ empresa.conductoresHabilitadosIds.length || 0 }}</strong>
                          <small>Conductores</small>
                        </span>
                      </div>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-raised-button color="primary" (click)="agregarConductores()">
                        <mat-icon>add</mat-icon>
                        Agregar Conductores
                      </button>
                      <button mat-button color="accent" (click)="verTodosConductores()">
                        <mat-icon>list</mat-icon>
                        Ver Todos
                      </button>
                    </mat-card-actions>
                  </mat-card>

                  <!-- Gestión de Rutas -->
                  <mat-card class="gestion-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>route</mat-icon>
                        Rutas
                      </mat-card-title>
                      <mat-card-subtitle>Administrar rutas autorizadas</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p>Gestiona las rutas autorizadas y permisos de circulación.</p>
                      <div class="stats-row">
                        <span class="stat-item">
                          <strong>{{ empresa.rutasAutorizadasIds.length || 0 }}</strong>
                          <small>Rutas</small>
                        </span>
                      </div>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-raised-button color="primary" (click)="irAModuloRutas()">>
                        <mat-icon>add</mat-icon>
                        Agregar Rutas
                      </button>
                      <button mat-button color="accent" (click)="verTodasRutas()">
                        <mat-icon>list</mat-icon>
                        Ver Todas
                      </button>
                    </mat-card-actions>
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

            <!-- Tab: Resoluciones -->
            <mat-tab label="Resoluciones">
              <div class="tab-content">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>gavel</mat-icon>
                      Resoluciones de la Empresa
                      <span class="badge-count">({{ empresa.resolucionesPrimigeniasIds.length || 0 }})</span>
                    </mat-card-title>
                    <mat-card-subtitle>
                      <button mat-raised-button color="primary" (click)="crearResolucion()" class="add-button">
                        <mat-icon>add</mat-icon>
                        Nueva Resolución
                      </button>
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    @if (isLoadingResoluciones) {
                      <div class="loading-resoluciones">
                        <mat-spinner diameter="40"></mat-spinner>
                        <p>Cargando resoluciones...</p>
                      </div>
                    }                     @else if (resoluciones && resoluciones.length > 0) {
                      <div class="resoluciones-hierarchical">
                        @for (resolucionPadre of getResolucionesPadre(); track resolucionPadre.id) {
                          <mat-card class="resolucion-padre-card">
                            <mat-card-header>
                              <mat-card-title>
                                <mat-icon class="resolucion-icon">gavel</mat-icon>
                                {{ resolucionPadre.nroResolucion }}
                                <span class="badge-count">({{ getResolucionesHijas(resolucionPadre.id).length }})</span>
                              </mat-card-title>
                              <mat-card-subtitle>
                                <div class="resolucion-meta">
                                  <mat-chip [class]="'estado-chip-' + resolucionPadre.estado?.toLowerCase()">
                                    {{ resolucionPadre.estado || 'SIN ESTADO' }}
                                  </mat-chip>
                                  <span class="tipo-tramite-chip">{{ resolucionPadre.tipoTramite }}</span>
                                </div>
                              </mat-card-subtitle>
                            </mat-card-header>
                            
                            <mat-card-content>
                              <div class="resolucion-info">
                                <p class="descripcion">{{ resolucionPadre.descripcion || 'Sin descripción' }}</p>
                                <div class="fechas">
                                  <span class="fecha">
                                    <strong>Emisión:</strong> {{ resolucionPadre.fechaEmision | date:'dd/MM/yyyy' }}
                                  </span>
                                  @if (resolucionPadre.fechaVigenciaInicio) {
                                    <span class="fecha">
                                      <strong>Vigencia:</strong> {{ resolucionPadre.fechaVigenciaInicio | date:'dd/MM/yyyy' }}
                                    </span>
                                  }
                                  @if (resolucionPadre.fechaVigenciaFin) {
                                    <span class="fecha">
                                      <strong>Vence:</strong> {{ resolucionPadre.fechaVigenciaFin | date:'dd/MM/yyyy' }}
                                    </span>
                                  }
                                </div>
                                
                                <!-- Estadísticas de la resolución padre -->
                                                                  <div class="resolucion-stats">
                                    <div class="stat-item">
                                      <mat-icon>directions_car</mat-icon>
                                      <span>{{ resolucionPadre.vehiculosHabilitadosIds.length || 0 }} Vehículos</span>
                                    </div>
                                    <div class="stat-item">
                                      <mat-icon>route</mat-icon>
                                      <span>{{ resolucionPadre.rutasAutorizadasIds.length || 0 }} Rutas</span>
                                    </div>
                                  </div>
                              </div>
                              
                              <!-- Resoluciones hijas -->
                              @if (getResolucionesHijas(resolucionPadre.id).length > 0) {
                                <mat-divider class="resolucion-divider"></mat-divider>
                                <div class="resoluciones-hijas">
                                  <h4 class="hijas-title">
                                    <mat-icon>subdirectory_arrow_right</mat-icon>
                                    Resoluciones Hijas
                                  </h4>
                                  <div class="hijas-grid">
                                    @for (resolucionHija of getResolucionesHijas(resolucionPadre.id); track resolucionHija.id) {
                                      <mat-card class="resolucion-hija-card">
                                        <mat-card-header>
                                          <mat-card-title>{{ resolucionHija.nroResolucion }}</mat-card-title>
                                          <mat-card-subtitle>
                                            <mat-chip [class]="'estado-chip-' + resolucionHija.estado?.toLowerCase()">
                                              {{ resolucionHija.estado || 'SIN ESTADO' }}
                                            </mat-chip>
                                          </mat-card-subtitle>
                                        </mat-card-header>
                                        <mat-card-content>
                                          <div class="resolucion-info">
                                            <p class="descripcion">{{ resolucionHija.descripcion || 'Sin descripción' }}</p>
                                            <div class="fechas">
                                              <span class="fecha">
                                                <strong>Emisión:</strong> {{ resolucionHija.fechaEmision | date:'dd/MM/yyyy' }}
                                              </span>
                                            </div>
                                            <div class="resolucion-stats">
                                              <div class="stat-item">
                                                <mat-icon>directions_car</mat-icon>
                                                <span>{{ resolucionHija.vehiculosHabilitadosIds.length || 0 }} Vehículos</span>
                                              </div>
                                              <div class="stat-item">
                                                <mat-icon>route</mat-icon>
                                                <span>{{ resolucionHija.rutasAutorizadasIds.length || 0 }} Rutas</span>
                                              </div>
                                            </div>
                                          </div>
                                        </mat-card-content>
                                        <mat-card-actions>
                                          <button mat-button color="accent" (click)="verResolucion(resolucionHija.id)">
                                            <mat-icon>visibility</mat-icon>
                                            Ver Detalles
                                          </button>
                                        </mat-card-actions>
                                      </mat-card>
                                    }
                                  </div>
                                </div>
                              }
                            </mat-card-content>
                            
                            <mat-card-actions>
                              <div class="resolucion-actions">
                                <button mat-button color="primary" (click)="verResolucion(resolucionPadre.id)">
                                  <mat-icon>visibility</mat-icon>
                                  Ver Detalles
                                </button>
                                <button mat-button color="accent" (click)="gestionarVehiculosResolucion(resolucionPadre.id)">
                                  <mat-icon>directions_car</mat-icon>
                                  Gestionar Vehículos
                                </button>
                                <button mat-icon-button color="accent" (click)="gestionarRutasResolucion(resolucionPadre.id)" matTooltip="Gestionar rutas de la resolución" class="route-button-resolucion">
                                  <mat-icon>route</mat-icon>
                                </button>
                                <button mat-button color="warn" (click)="crearResolucionHija(resolucionPadre.id)">
                                  <mat-icon>add</mat-icon>
                                  Nueva Hija
                                </button>
                              </div>
                            </mat-card-actions>
                          </mat-card>
                        }
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">gavel</mat-icon>
                        <h3>No hay resoluciones registradas</h3>
                        <p>Esta empresa no tiene resoluciones emitidas.</p>
                        <button mat-raised-button color="primary" (click)="crearResolucion()" class="add-button">
                          <mat-icon>add</mat-icon>
                          Crear Primera Resolución
                        </button>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Tab: Vehículos -->
            <mat-tab label="Vehículos">
              <div class="tab-content">
                <!-- Vehículos con Resolución Asociada -->
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>directions_car</mat-icon>
                      Vehículos con Resolución Asociada
                      <span class="badge-count">({{ getVehiculosConResolucion().length }})</span>
                    </mat-card-title>
                    <mat-card-subtitle>
                      <div class="header-actions">
                        <button mat-raised-button color="primary" (click)="crearNuevoVehiculo()" class="add-button">
                          <mat-icon>add</mat-icon>
                          Crear Nuevo Vehículo
                        </button>
                        
                        <button mat-button color="accent" (click)="agregarVehiculoExistente()" class="add-button">
                          <mat-icon>add_circle_outline</mat-icon>
                          Agregar Vehículo Existente
                        </button>
                        
                        <button mat-icon-button (click)="refrescarVehiculos()" matTooltip="Refrescar lista de vehículos">
                          <mat-icon>refresh</mat-icon>
                        </button>
                      </div>
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    @if (getVehiculosConResolucion().length > 0) {
                      <div class="vehiculos-table-container">
                        <table mat-table [dataSource]="getVehiculosConResolucion()" class="vehiculos-table">
                          <!-- Placa Column -->
                          <ng-container matColumnDef="placa">
                            <th mat-header-cell *matHeaderCellDef>Placa</th>
                            <td mat-cell *matCellDef="let vehiculo">
                              <span class="vehiculo-placa">{{ vehiculo.placa }}</span>
                            </td>
                          </ng-container>

                          <!-- Marca-Modelo Column -->
                          <ng-container matColumnDef="marca-modelo">
                            <th mat-header-cell *matHeaderCellDef>Marca/Modelo</th>
                            <td mat-cell *matCellDef="let vehiculo">
                              <div class="marca-modelo">
                                <span class="marca">{{ vehiculo.marca || 'No definido' }}</span>
                                <span class="modelo">{{ vehiculo.modelo || 'No definido' }}</span>
                              </div>
                            </td>
                          </ng-container>

                          <!-- Resolución Column -->
                          <ng-container matColumnDef="resolucion">
                            <th mat-header-cell *matHeaderCellDef>Resolución</th>
                            <td mat-cell *matCellDef="let vehiculo">
                              <mat-chip color="primary" selected>
                                {{ getResolucionVehiculo(vehiculo) }}
                              </mat-chip>
                            </td>
                          </ng-container>

                          <!-- Estado Column -->
                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let vehiculo">
                              <mat-chip [color]="getEstadoVehiculoColor(vehiculo.estado)" selected>
                                {{ vehiculo.estado || 'ACTIVO' }}
                              </mat-chip>
                            </td>
                          </ng-container>

                          <!-- Acciones Column -->
                          <ng-container matColumnDef="acciones">
                            <th mat-header-cell *matHeaderCellDef>Acciones</th>
                            <td mat-cell *matCellDef="let vehiculo">
                              <div class="acciones-vehiculo">
                                <button mat-icon-button color="primary" (click)="gestionarRutasVehiculo(vehiculo)" matTooltip="Gestionar rutas de la resolución asociada" class="route-button-empresa">
                                  <mat-icon>route</mat-icon>
                                </button>
                                
                                <button mat-icon-button [matMenuTriggerFor]="accionesMenu" matTooltip="Más acciones" class="actions-button-empresa">
                                  <mat-icon>more_vert</mat-icon>
                                </button>
                                
                                <mat-menu #accionesMenu="matMenu" class="vehicle-actions-menu-empresa">
                                  <button mat-menu-item (click)="verDetalleVehiculo(vehiculo)">
                                    <mat-icon>visibility</mat-icon>
                                    <span>Ver Detalles</span>
                                  </button>
                                  
                                  <button mat-menu-item (click)="editarVehiculo(vehiculo)">
                                    <mat-icon>edit</mat-icon>
                                    <span>Editar Vehículo</span>
                                  </button>
                                  
                                  <mat-divider></mat-divider>
                                  
                                  <button mat-menu-item (click)="transferirVehiculo(vehiculo)">
                                    <mat-icon>swap_horiz</mat-icon>
                                    <span>Transferir a Otra Empresa</span>
                                  </button>
                                  
                                  <button mat-menu-item (click)="cambiarEstadoVehiculo(vehiculo)" 
                                          [class.estado-activo]="vehiculo.estado === 'ACTIVO'"
                                          [class.estado-inactivo]="vehiculo.estado !== 'ACTIVO'">
                                    <mat-icon>{{ vehiculo.estado === 'ACTIVO' ? 'pause' : 'play_arrow' }}</mat-icon>
                                    <span>{{ vehiculo.estado === 'ACTIVO' ? 'Suspender' : 'Activar' }}</span>
                                  </button>
                                </mat-menu>
                              </div>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="['placa', 'marca-modelo', 'resolucion', 'estado', 'acciones']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['placa', 'marca-modelo', 'resolucion', 'estado', 'acciones'];"></tr>
                        </table>
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">directions_car</mat-icon>
                        <h3>No hay vehículos con resolución asociada</h3>
                        <p>Los vehículos deben estar asociados a una resolución para poder gestionar sus rutas.</p>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>

                <!-- Vehículos sin Resolución (Expandible) -->
                @if (getVehiculosSinResolucion().length > 0) {
                  <mat-expansion-panel class="vehiculos-sin-resolucion-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon class="warning-icon">warning</mat-icon>
                        Vehículos sin Resolución Asociada
                        <span class="badge-count warning">({{ getVehiculosSinResolucion().length }})</span>
                      </mat-panel-title>
                      <mat-panel-description>
                        Estos vehículos no pueden gestionar rutas hasta ser asociados a una resolución
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    
                    <div class="vehiculos-sin-resolucion-content">
                      <div class="vehiculos-table-container">
                        <table mat-table [dataSource]="getVehiculosSinResolucion()" class="vehiculos-table disabled-table">
                          <!-- Placa Column -->
                          <ng-container matColumnDef="placa">
                            <th mat-header-cell *matHeaderCellDef>Placa</th>
                            <td mat-cell *matCellDef="let vehiculo">
                              <span class="vehiculo-placa disabled">{{ vehiculo.placa }}</span>
                            </td>
                          </ng-container>

                          <!-- Marca-Modelo Column -->
                          <ng-container matColumnDef="marca-modelo">
                            <th mat-header-cell *matHeaderCellDef>Marca/Modelo</th>
                            <td mat-cell *matCellDef="let vehiculo">
                              <div class="marca-modelo disabled">
                                <span class="marca">{{ vehiculo.marca || 'No definido' }}</span>
                                <span class="modelo">{{ vehiculo.modelo || 'No definido' }}</span>
                              </div>
                            </td>
                          </ng-container>

                          <!-- Estado Column -->
                          <ng-container matColumnDef="estado">
                            <th mat-header-cell *matHeaderCellDef>Estado</th>
                            <td mat-cell *matCellDef="let vehiculo">
                              <mat-chip color="warn" selected>
                                Sin Resolución
                              </mat-chip>
                            </td>
                          </ng-container>

                          <!-- Acciones Column -->
                          <ng-container matColumnDef="acciones">
                            <th mat-header-cell *matHeaderCellDef>Acciones</th>
                            <td mat-cell *matCellDef="let vehiculo">
                              <div class="acciones-vehiculo">
                                <button mat-icon-button color="warn" disabled matTooltip="Debe asociar el vehículo a una resolución primero" class="route-button-disabled">
                                  <mat-icon>route</mat-icon>
                                </button>
                                
                                <button mat-icon-button color="primary" (click)="asociarVehiculoAResolucion(vehiculo)" matTooltip="Asociar a una resolución" class="associate-button-empresa">
                                  <mat-icon>link</mat-icon>
                                </button>
                              </div>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="['placa', 'marca-modelo', 'estado', 'acciones']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['placa', 'marca-modelo', 'estado', 'acciones'];" class="disabled-row"></tr>
                        </table>
                      </div>
                    </div>
                  </mat-expansion-panel>
                }
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
                    <mat-card-subtitle>
                      <button mat-raised-button color="primary" (click)="agregarConductores()" class="add-button">
                        <mat-icon>add</mat-icon>
                        Agregar Conductores
                      </button>
                    </mat-card-subtitle>
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
                            <mat-card-actions>
                              <button mat-button color="primary" (click)="verConductor(conductorId)">
                                <mat-icon>visibility</mat-icon>
                                Ver Detalles
                              </button>
                            </mat-card-actions>
                          </mat-card>
                        }
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">person</mat-icon>
                        <h3>No hay conductores asociados</h3>
                        <p>Esta empresa no tiene conductores registrados.</p>
                        <button mat-raised-button color="primary" (click)="agregarConductores()" class="add-button">
                          <mat-icon>add</mat-icon>
                          Agregar Primer Conductor
                        </button>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Tab: Rutas -->
            <mat-tab label="Rutas">
              <div class="tab-content">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>route</mat-icon>
                      Rutas por Resolución
                      <span class="badge-count">({{ getTotalRutas() }})</span>
                    </mat-card-title>
                    <mat-card-subtitle>
                      <div class="header-actions">
                        <button mat-raised-button color="primary" (click)="irAModuloRutas()" class="add-button">
                          <mat-icon>add</mat-icon>
                          Ir a Módulo de Rutas
                        </button>
                        
                        <button mat-icon-button [matMenuTriggerFor]="columnMenu" matTooltip="Seleccionar columnas">
                          <mat-icon>view_column</mat-icon>
                        </button>
                        
                        <mat-menu #columnMenu="matMenu">
                          <div class="column-menu-header">
                            <span>Mostrar columnas</span>
                          </div>
                          @for (column of allColumnsRutas; track column.key) {
                            <mat-checkbox 
                              class="column-checkbox"
                              [(ngModel)]="column.visible"
                              (change)="onColumnToggle()">
                              {{ column.label }}
                            </mat-checkbox>
                          }
                        </mat-menu>
                      </div>
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    @if (resolucionesPadre && resolucionesPadre.length > 0) {
                      <!-- Rutas organizadas por Resolución Padre -->
                      <div class="resoluciones-rutas-container">
                        @for (resolucionPadre of resolucionesPadre; track resolucionPadre.id) {
                          <mat-expansion-panel class="resolucion-rutas-panel">
                            <mat-expansion-panel-header>
                              <mat-panel-title>
                                <div class="resolucion-rutas-header">
                                  <div class="resolucion-info">
                                    <span class="resolucion-numero">{{ resolucionPadre.nroResolucion }}</span>
                                  </div>
                                  <div class="rutas-count">
                                    <mat-chip [color]="getEstadoColor(resolucionPadre.estado || '')" selected>
                                      {{ resolucionPadre.estado || 'VIGENTE' }}
                                    </mat-chip>
                                    <mat-chip color="primary" selected>
                                      {{ getRutasCountByResolucion(resolucionPadre.id) }} rutas
                                    </mat-chip>
                                  </div>
                                </div>
                              </mat-panel-title>
                              <mat-panel-description>
                                <div class="resolucion-description">
                                  <span>{{ formatFecha(resolucionPadre.fechaEmision) }}</span>
                                  <span class="separator">•</span>
                                  <span>{{ resolucionPadre.tipoTramite || 'ALTA' }}</span>
                                </div>
                              </mat-panel-description>
                            </mat-expansion-panel-header>

                            <!-- Tabla de Rutas para esta Resolución -->
                            <div class="rutas-table-container">
                              @if (getRutasByResolucion(resolucionPadre.id).length > 0) {
                                <table mat-table [dataSource]="getRutasByResolucion(resolucionPadre.id)" class="rutas-table">
                                  <!-- Código Column -->
                                  <ng-container matColumnDef="codigo">
                                    <th mat-header-cell *matHeaderCellDef>Código</th>
                                    <td mat-cell *matCellDef="let ruta">
                                      <span class="ruta-codigo">{{ ruta.codigoRuta }}</span>
                                    </td>
                                  </ng-container>

                                  <!-- Origen-Destino Column -->
                                  <ng-container matColumnDef="origen-destino">
                                    <th mat-header-cell *matHeaderCellDef>Origen - Destino</th>
                                    <td mat-cell *matCellDef="let ruta">
                                      <div class="origen-destino">
                                        <div class="localidad">
                                          <mat-icon>place</mat-icon>
                                          <span>{{ ruta.origen || 'No definido' }}</span>
                                        </div>
                                        <mat-icon class="arrow">arrow_forward</mat-icon>
                                        <div class="localidad">
                                          <mat-icon>flag</mat-icon>
                                          <span>{{ ruta.destino || 'No definido' }}</span>
                                        </div>
                                      </div>
                                    </td>
                                  </ng-container>

                                  <!-- Distancia Column -->
                                  <ng-container matColumnDef="distancia">
                                    <th mat-header-cell *matHeaderCellDef>Distancia</th>
                                    <td mat-cell *matCellDef="let ruta">
                                      <span class="distancia">{{ ruta.distancia || 0 }} km</span>
                                    </td>
                                  </ng-container>

                                  <!-- Itinerario Column -->
                                  <ng-container matColumnDef="itinerario">
                                    <th mat-header-cell *matHeaderCellDef>Itinerario</th>
                                    <td mat-cell *matCellDef="let ruta">
                                      <div class="itinerario">
                                        <span class="horario">{{ ruta.tiempoEstimado || 'No definido' }}</span>
                                      </div>
                                    </td>
                                  </ng-container>

                                  <!-- Frecuencia Column -->
                                  <ng-container matColumnDef="frecuencia">
                                    <th mat-header-cell *matHeaderCellDef>Frecuencia</th>
                                    <td mat-cell *matCellDef="let ruta">
                                      <div class="frecuencia">
                                        <span class="frecuencia-valor">{{ ruta.frecuencias || 'No definido' }}</span>
                                      </div>
                                    </td>
                                  </ng-container>

                                  <!-- Estado Column -->
                                  <ng-container matColumnDef="estado">
                                    <th mat-header-cell *matHeaderCellDef>Estado</th>
                                    <td mat-cell *matCellDef="let ruta">
                                      <mat-chip [color]="getEstadoRutaColor(ruta.estado)" selected>
                                        {{ ruta.estado || 'ACTIVA' }}
                                      </mat-chip>
                                    </td>
                                  </ng-container>

                                  <tr mat-header-row *matHeaderRowDef="displayedColumnsRutas"></tr>
                                  <tr mat-row *matRowDef="let row; columns: displayedColumnsRutas;"></tr>
                                </table>
                              } @else {
                                <div class="no-rutas-resolucion">
                                  <mat-icon>route_off</mat-icon>
                                  <p>No hay rutas registradas para esta resolución.</p>
                                  <button mat-button color="primary" (click)="irAModuloRutasConResolucion(resolucionPadre.id)">
                                    <mat-icon>add</mat-icon>
                                    Ir a Módulo de Rutas
                                  </button>
                                </div>
                              }
                            </div>
                          </mat-expansion-panel>
                        }
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">assignment</mat-icon>
                        <h3>No hay resoluciones</h3>
                        <p>Esta empresa debe tener resoluciones para gestionar rutas.</p>
                        <button mat-raised-button color="primary" (click)="crearResolucion()" class="add-button">
                          <mat-icon>add</mat-icon>
                          Crear Primera Resolución
                        </button>
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

    .estado-autorizada {
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

    .estado-chip-autorizada {
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

    .add-button {
      margin-top: 8px;
    }

    // Estilos para el selector de columnas
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .column-menu-header {
      padding: 8px 16px;
      font-weight: 600;
      color: #333;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 8px;
    }

    .column-checkbox {
      display: block;
      padding: 8px 16px;
      margin: 0;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }

    .resoluciones-grid,
    .rutas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .resolucion-card,
    .ruta-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .mat-card-actions {
      padding: 8px 16px 16px 16px;
      display: flex;
      justify-content: flex-end;
    }

    .gestion-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    }

    .gestion-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .gestion-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .stats-row {
      display: flex;
      justify-content: center;
      margin: 16px 0;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-item strong {
      font-size: 24px;
      color: #1976d2;
      font-weight: 600;
    }

    .stat-item small {
      color: #6c757d;
      font-size: 12px;
      text-transform: uppercase;
      margin-top: 4px;
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
      .conductores-grid,
      .resoluciones-grid,
      .rutas-grid,
      .gestion-grid,
      .hijas-grid {
        grid-template-columns: 1fr;
      }

      .resoluciones-hierarchical {
        gap: 16px;
      }

      .resolucion-actions {
        flex-direction: column;
      }

      .resolucion-actions button {
        width: 100%;
      }
    }

    /* Estilos para resoluciones jerárquicas */
    .resoluciones-hierarchical {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }

    .resolucion-padre-card {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #1976d2;
      transition: all 0.3s ease;
      height: fit-content;
    }

    .resolucion-padre-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .resolucion-icon {
      margin-right: 8px;
      color: #1976d2;
    }

    .badge-count {
      background-color: #e3f2fd;
      color: #1565c0;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }

    .resolucion-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tipo-tramite-chip {
      background-color: #f3e5f5;
      color: #7b1fa2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .resolucion-stats {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .resolucion-stats .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #6c757d;
      background-color: #f8f9fa;
      padding: 4px 8px;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .resolucion-stats .stat-item mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #1976d2;
    }

    .resolucion-divider {
      margin: 20px 0;
    }

    .resoluciones-hijas {
      margin-top: 16px;
    }

    .hijas-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #495057;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    .hijas-title mat-icon {
      color: #6c757d;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .hijas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
    }

    .resolucion-hija-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-left: 3px solid #ff9800;
      background-color: #fafafa;
    }

    .resolucion-hija-card .mat-mdc-card-content {
      padding: 12px !important;
    }

    .resolucion-hija-card .mat-mdc-card-header {
      padding: 12px 12px 0 12px !important;
    }

    .resolucion-hija-card .mat-mdc-card-actions {
      padding: 8px 12px 12px 12px !important;
    }

    .resolucion-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: flex-start;
    }

    .resolucion-actions button {
      min-width: auto;
      padding: 0 12px;
      height: 32px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .resolucion-actions button mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .loading-resoluciones {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 16px;
      color: #6c757d;
    }

    .resolucion-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .descripcion {
      font-weight: 500;
      color: #2c3e50;
      margin: 0;
      line-height: 1.4;
    }

    .fechas {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .fecha {
      font-size: 12px;
      color: #6c757d;
      background-color: #f8f9fa;
      padding: 2px 6px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .fecha strong {
      color: #495057;
    }

    .tipo-info {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .tipo-resolucion,
    .tipo-tramite {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tipo-resolucion {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .tipo-tramite {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .estado-chip-vigente {
      background-color: #d4edda;
      color: #155724;
    }

    .estado-chip-vencida {
      background-color: #f8d7da;
      color: #721c24;
    }

    .estado-chip-suspendida {
      background-color: #fff3cd;
      color: #856404;
    }

    .estado-chip-revocada {
      background-color: #e2e3e5;
      color: #383d41;
    }

    .estado-chip-dada_de_baja {
      background-color: #f8f9fa;
      color: #6c757d;
    }

    // Estilos para rutas por resolución
    .resoluciones-rutas-container {
      .resolucion-rutas-panel {
        margin-bottom: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);

        .resolucion-rutas-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;

          .resolucion-info {
            display: flex;
            align-items: center;
            gap: 12px;

            .resolucion-numero {
              font-weight: 600;
              color: #1976d2;
              font-size: 16px;
            }
          }

          .rutas-count {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        .resolucion-description {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 14px;

          .separator {
            color: #ccc;
          }
        }
      }

      .rutas-table-container {
        padding: 0;
        margin-top: 16px;

        .rutas-table {
          width: 100%;
          background: white;

          th {
            background: #f5f5f5;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
          }

          td {
            border-bottom: 1px solid #f0f0f0;
          }

          tr:hover {
            background-color: #f8f9fa;
          }

          .ruta-codigo {
            font-family: monospace;
            background: #e3f2fd;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            color: #1976d2;
            font-weight: 600;
          }

          .ruta-nombre {
            display: flex;
            flex-direction: column;

            .nombre-principal {
              font-weight: 500;
              color: #333;
              margin-bottom: 2px;
            }

            .descripcion {
              font-size: 12px;
              color: #666;
            }
          }

          .origen-destino {
            display: flex;
            align-items: center;
            gap: 8px;

            .localidad {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 14px;

              mat-icon {
                font-size: 16px;
                width: 16px;
                height: 16px;
              }
            }

            .arrow {
              color: #666;
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }

          .distancia {
            font-weight: 500;
            color: #333;
          }

          .itinerario {
            .horario {
              font-size: 14px;
              color: #555;
              font-weight: 500;
            }
          }

          .frecuencia {
            .frecuencia-valor {
              font-size: 14px;
              color: #1976d2;
              font-weight: 500;
              background: #e3f2fd;
              padding: 2px 8px;
              border-radius: 12px;
            }
          }

        }

        .no-rutas-resolucion {
          padding: 32px;
          text-align: center;
          color: #666;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 16px 0;

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: #ccc;
            margin-bottom: 16px;
          }

          p {
            margin: 8px 0 16px;
            font-style: italic;
          }

          button {
            margin-top: 8px;
          }
        }
      }
    }

    // Estilos para tabla de vehículos
    .vehiculos-table-container {
      padding: 0;
      margin-top: 16px;

      .vehiculos-table {
        width: 100%;
        background: white;

        th {
          background: #f5f5f5;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
        }

        td {
          border-bottom: 1px solid #f0f0f0;
        }

        tr:hover {
          background-color: #f8f9fa;
        }

        .vehiculo-placa {
          font-family: monospace;
          background: #e8f5e8;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          color: #2e7d32;
          font-weight: 600;
        }

        .marca-modelo {
          display: flex;
          flex-direction: column;

          .marca {
            font-weight: 500;
            color: #333;
            margin-bottom: 2px;
          }

          .modelo {
            font-size: 12px;
            color: #666;
          }
        }

        .anio {
          font-weight: 500;
          color: #333;
        }

        .categoria {
          font-size: 14px;
          color: #1976d2;
          font-weight: 500;
        }

        .combustible {
          font-size: 14px;
          color: #ff9800;
          font-weight: 500;
        }
      }
    }

    // Responsive para rutas por resolución
    @media (max-width: 768px) {
      .resoluciones-rutas-container {
        .resolucion-rutas-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .rutas-table-container {
          .origen-destino {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;

            .arrow {
              transform: rotate(90deg);
            }
          }
        }
      }
    }

    /* Estilos específicos para columnas de vehículos */
    .vehiculos-table {
      .rutas-asignadas {
        mat-chip-set {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        
        mat-chip {
          font-size: 11px;
          height: 24px;
          line-height: 24px;
        }
        
        .no-rutas {
          color: #6c757d;
          font-style: italic;
          font-size: 12px;
        }
      }

      .tuc-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        
        .tuc-numero {
          font-weight: 500;
          font-size: 13px;
        }
        
        .tuc-fecha {
          color: #6c757d;
          font-size: 11px;
        }
        
        .no-tuc {
          color: #6c757d;
          font-style: italic;
          font-size: 12px;
        }
      }

      .marca-modelo {
        display: flex;
        flex-direction: column;
        gap: 2px;
        
        .marca {
          font-weight: 500;
          font-size: 13px;
        }
        
        .modelo {
          color: #6c757d;
          font-size: 12px;
        }
      }

      .vehiculo-placa {
        font-weight: 600;
        font-family: 'Courier New', monospace;
        background: #f8f9fa;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #dee2e6;
      }

      .peso-neto, .peso-bruto {
        font-family: 'Courier New', monospace;
        font-size: 12px;
      }

      .medidas {
        font-family: 'Courier New', monospace;
        font-size: 11px;
        white-space: nowrap;
      }

      .cilindrada, .potencia {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        font-weight: 500;
      }

      .acciones-vehiculo {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: flex-start;
      }
    }

    // Estilos para vehículos sin resolución
    .vehiculos-sin-resolucion-panel {
      margin-top: 16px;
      border: 2px solid #ffc107;
      border-radius: 8px;
      
      .mat-expansion-panel-header {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        
        .mat-panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .warning-icon {
            color: #856404;
          }
          
          .badge-count.warning {
            background: #dc3545;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
        }
        
        .mat-panel-description {
          color: #856404;
          font-style: italic;
        }
      }
      
      .vehiculos-sin-resolucion-content {
        padding: 16px;
        background: #fffbf0;
      }
    }

    // Tabla deshabilitada para vehículos sin resolución
    .disabled-table {
      opacity: 0.7;
      
      .mat-mdc-cell {
        color: #6c757d;
      }

      .vehiculo-placa.disabled {
        background: #f8f9fa;
        color: #6c757d;
        border-color: #dee2e6;
      }

      .marca-modelo.disabled {
        .marca, .modelo {
          color: #adb5bd;
        }
      }
    }

    .disabled-row {
      background-color: #f8f9fa !important;
      
      &:hover {
        background-color: #f8f9fa !important;
      }
    }

    // Estilos para chips de estado mejorados
    .mat-mdc-chip {
      &.mat-primary {
        background: #28a745;
        color: white;
      }
      
      &.mat-warn {
        background: #dc3545;
        color: white;
      }
      
      &.mat-accent {
        background: #17a2b8;
        color: white;
      }
    }

    // Estilos para botones de gestión de rutas
    .acciones-vehiculo {
      .mat-raised-button {
        font-size: 12px;
        padding: 8px 16px;
        min-height: 32px;
        
        mat-icon {
          font-size: 16px;
          margin-right: 4px;
        }
      }
      
      .mat-stroked-button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .motor, .chasis {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sede-registro, .resolucion {
      font-size: 12px;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cilindros, .ejes, .asientos {
      text-align: center;
      font-weight: 500;
    }

    .categoria {
      background: #e3f2fd;
      color: #1565c0;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-align: center;
    }

    .combustible {
      background: #f3e5f5;
      color: #7b1fa2;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-align: center;
    }

    .acciones-vehiculo {
      display: flex;
      justify-content: center;
      align-items: center;
      
      button {
        min-width: 40px;
        height: 40px;
      }
    }

    /* Estilos para menús de acciones */
    .estado-activo {
      color: #4caf50;
    }

    .estado-inactivo {
      color: #ff9800;
    }

    .accion-peligrosa {
      color: #f44336;
      
      mat-icon {
        color: #f44336;
      }
    }

    /* Estilos para botones de acción en header */
    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .header-actions .add-button {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      padding: 8px 16px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    
    .header-actions .add-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* ============================================ */
    /* ESTILOS PARA BOTONES DE VEHÍCULOS - EMPRESA */
    /* ============================================ */
    
    .acciones-vehiculo {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
    }
    
    /* Botón de rutas - SOLO ICONO */
    .route-button-empresa {
      color: #1976d2 !important;
      background-color: transparent !important;
      border: none !important;
      padding: 8px !important;
      min-width: 40px !important;
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      transition: all 0.2s ease !important;
      
      &:hover {
        background-color: rgba(25, 118, 210, 0.1) !important;
        transform: scale(1.1) !important;
      }
      
      mat-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        color: inherit !important;
      }
    }
    
    /* Botón de rutas deshabilitado */
    .route-button-disabled {
      color: #999 !important;
      background-color: transparent !important;
      border: none !important;
      padding: 8px !important;
      min-width: 40px !important;
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      opacity: 0.5 !important;
      cursor: not-allowed !important;
      
      mat-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        color: inherit !important;
      }
    }
    
    /* Botón de acciones - SOLO ICONO */
    .actions-button-empresa {
      color: #666 !important;
      background-color: transparent !important;
      border: none !important;
      padding: 8px !important;
      min-width: 40px !important;
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      transition: all 0.2s ease !important;
      
      &:hover {
        color: #1976d2 !important;
        background-color: rgba(25, 118, 210, 0.1) !important;
      }
      
      mat-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        color: inherit !important;
      }
    }
    
    /* Botón de asociar */
    .associate-button-empresa {
      color: #1976d2 !important;
      background-color: transparent !important;
      border: none !important;
      padding: 8px !important;
      min-width: 40px !important;
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      transition: all 0.2s ease !important;
      
      &:hover {
        background-color: rgba(25, 118, 210, 0.1) !important;
        transform: scale(1.1) !important;
      }
      
      mat-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        color: inherit !important;
      }
    }
    
    /* Botón de rutas para resolución */
    .route-button-resolucion {
      color: #ff9800 !important;
      background-color: transparent !important;
      border: none !important;
      padding: 8px !important;
      min-width: 40px !important;
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      transition: all 0.2s ease !important;
      
      &:hover {
        background-color: rgba(255, 152, 0, 0.1) !important;
        transform: scale(1.1) !important;
      }
      
      mat-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        color: inherit !important;
      }
    }
    
    /* Menú de acciones */
    .vehicle-actions-menu-empresa {
      min-width: 240px !important;
      max-width: 280px !important;
      background-color: #ffffff !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
      border: 1px solid #e0e0e0 !important;
      
      .mat-menu-content {
        padding: 8px 0 !important;
      }
      
      .mat-menu-item {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        padding: 12px 16px !important;
        font-size: 13px !important;
        min-height: 44px !important;
        
        mat-icon {
          font-size: 18px !important;
          width: 18px !important;
          height: 18px !important;
          color: #666 !important;
          margin: 0 !important;
        }
        
        span {
          flex: 1 !important;
          color: #333 !important;
          font-weight: 500 !important;
        }
        
        &:hover {
          background-color: #f5f5f5 !important;
          
          mat-icon {
            color: #1976d2 !important;
          }
          
          span {
            color: #1976d2 !important;
          }
        }
      }
    }
  `]
})
export class EmpresaDetailComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private authService = inject(AuthService);
  private resolucionService = inject(ResolucionService);
  private rutaService = inject(RutaService);
  private vehiculoService = inject(VehiculoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  empresa?: Empresa;
  isLoading = false;
  resoluciones: Resolucion[] = [];
  isLoadingResoluciones = false;
  
  // Propiedades para las tablas
  allColumnsRutas = [
    { key: 'codigo', label: 'Código', visible: true },
    { key: 'origen-destino', label: 'Origen - Destino', visible: true },
    { key: 'distancia', label: 'Distancia', visible: true },
    { key: 'itinerario', label: 'Itinerario', visible: true },
    { key: 'frecuencia', label: 'Frecuencia', visible: true },
    { key: 'estado', label: 'Estado', visible: true }
  ];
  
  get displayedColumnsRutas(): string[] {
    return this.allColumnsRutas.filter(col => col.visible).map(col => col.key);
  }
  
  resolucionesPadre: Resolucion[] = [];
  rutasPorResolucion = new Map<string, Ruta[]>();
  
  // Propiedades para vehículos
  allColumnsVehiculos = [
    { key: 'placa', label: 'Placa', visible: true },
    { key: 'marca-modelo', label: 'Marca/Modelo', visible: true },
    { key: 'anio', label: 'Año', visible: true },
    { key: 'categoria', label: 'Categoría', visible: true },
    { key: 'combustible', label: 'Combustible', visible: true },
    { key: 'estado', label: 'Estado', visible: true },
    { key: 'rutas-asignadas', label: 'Rutas Asignadas', visible: false },
    { key: 'sede-registro', label: 'Sede Registro', visible: false },
    { key: 'resolucion', label: 'Resolución', visible: false },
    { key: 'tuc', label: 'TUC', visible: false },
    { key: 'motor', label: 'Motor', visible: false },
    { key: 'chasis', label: 'Chasis', visible: false },
    { key: 'cilindros', label: 'Cilindros', visible: false },
    { key: 'ejes', label: 'Ejes', visible: false },
    { key: 'asientos', label: 'Asientos', visible: false },
    { key: 'peso-neto', label: 'Peso Neto', visible: false },
    { key: 'peso-bruto', label: 'Peso Bruto', visible: false },
    { key: 'medidas', label: 'Medidas (L×A×H)', visible: false },
    { key: 'cilindrada', label: 'Cilindrada', visible: false },
    { key: 'potencia', label: 'Potencia', visible: false },
    { key: 'acciones', label: 'Acciones', visible: true }
  ];
  
  get displayedColumnsVehiculos(): string[] {
    return this.allColumnsVehiculos.filter(col => col.visible).map(col => col.key);
  }
  
  vehiculosEmpresa: Vehiculo[] = [];
  
  // Cache para evitar valores aleatorios que cambien en cada ciclo de detección
  private rutasCountCache = new Map<string, number>();

  /**
   * Calcula el total de vehículos de la empresa sumando todos los vehículos
   * de todas las resoluciones asociadas a la empresa
   */
  getTotalVehiculosEmpresa(): number {
    if (!this.resoluciones || this.resoluciones.length === 0) {
      return 0;
    }
    
    // Usar Set para evitar duplicados
    const vehiculosUnicos = new Set<string>();
    
    this.resoluciones.forEach(resolucion => {
      if (resolucion.vehiculosHabilitadosIds && resolucion.vehiculosHabilitadosIds.length > 0) {
        resolucion.vehiculosHabilitadosIds.forEach(vehiculoId => {
          vehiculosUnicos.add(vehiculoId);
        });
      }
    });
    
    return vehiculosUnicos.size;
  }

  /**
   * Obtiene vehículos asociados a resoluciones (con resolución padre)
   */
  getVehiculosConResolucion(): any[] {
    if (!this.vehiculosEmpresa || !this.resoluciones) {
      return [];
    }
    
    return this.vehiculosEmpresa.filter(vehiculo => {
      return this.resoluciones.some(resolucion => 
        resolucion.vehiculosHabilitadosIds && 
        resolucion.vehiculosHabilitadosIds.includes(vehiculo.id)
      );
    }).map(vehiculo => {
      // Encontrar la resolución asociada
      const resolucionAsociada = this.resoluciones.find(resolucion => 
        resolucion.vehiculosHabilitadosIds && 
        resolucion.vehiculosHabilitadosIds.includes(vehiculo.id)
      );
      
      return {
        ...vehiculo,
        resolucionAsociada: resolucionAsociada
      };
    });
  }

  /**
   * Obtiene vehículos sin resolución asociada (huérfanos)
   */
  getVehiculosSinResolucion(): any[] {
    if (!this.vehiculosEmpresa || !this.resoluciones) {
      return [];
    }
    
    return this.vehiculosEmpresa.filter(vehiculo => {
      return !this.resoluciones.some(resolucion => 
        resolucion.vehiculosHabilitadosIds && 
        resolucion.vehiculosHabilitadosIds.includes(vehiculo.id)
      );
    });
  }

  /**
   * Obtiene el número de resolución asociada a un vehículo
   */
  getResolucionVehiculo(vehiculo: any): string {
    if (vehiculo.resolucionAsociada) {
      return vehiculo.resolucionAsociada.nroResolucion;
    }
    
    const resolucionAsociada = this.resoluciones.find(resolucion => 
      resolucion.vehiculosHabilitadosIds && 
      resolucion.vehiculosHabilitadosIds.includes(vehiculo.id)
    );
    
    return resolucionAsociada ? resolucionAsociada.nroResolucion : 'Sin resolución';
  }

  ngOnInit(): void {
    const empresaId = this.route.snapshot.params['id'];
    if (empresaId) {
      this.loadEmpresa(empresaId);
    }
  }

  loadEmpresa(id: string): void {
    console.log('📋 Cargando empresa con ID:', id);
    this.isLoading = true;
    this.empresaService.getEmpresa(id).subscribe({
      next: (empresa) => {
        console.log('📋 Empresa cargada:', empresa);
        this.empresa = empresa;
        this.isLoading = false;
        this.cdr.detectChanges();
        
        // Cargar las resoluciones de la empresa
        this.cargarResolucionesEmpresa(id);
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
      'AUTORIZADA': 'Autorizada',
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

  verHistorialTransferencias(): void {
    if (this.empresa) {
      this.router.navigate(['/empresas', this.empresa.id, 'transferencias']);
    }
  }

  verBajasVehiculares(): void {
    if (this.empresa) {
      this.router.navigate(['/empresas', this.empresa.id, 'bajas-vehiculos']);
    }
  }

  cargarResolucionesEmpresa(empresaId: string): void {
    this.isLoadingResoluciones = true;
    
    console.log('📋 === CARGA DE RESOLUCIONES ===');
    console.log('🏢 Empresa ID:', empresaId);
    
    this.resolucionService.getResoluciones(0, 100, undefined, empresaId).subscribe({
      next: (resoluciones) => {
        console.log('📋 Resoluciones cargadas para empresa:', empresaId, resoluciones);
        console.log('📊 Cantidad de resoluciones:', resoluciones.length);
        
        if (resoluciones.length > 0) {
          console.log('🔍 ESTRUCTURA DE LA PRIMERA RESOLUCIÓN:', resoluciones[0]);
          console.log('🔍 PROPIEDADES DE RESOLUCIÓN:', Object.keys(resoluciones[0] || {}));
          
          // Analizar propiedades relacionadas con vehículos
          resoluciones.forEach((res, index) => {
            console.log(`📋 Resolución ${index + 1}:`, {
              id: res.id,
              nroResolucion: res.nroResolucion,
              vehiculosHabilitadosIds: res.vehiculosHabilitadosIds,
              // Buscar otras propiedades que puedan contener vehículos
              ...Object.keys(res).filter(key => key.toLowerCase().includes('vehiculo')).reduce((acc, key) => {
                (acc as any)[key] = (res as any)[key];
                return acc;
              }, {} as any)
            });
          });
        }
        
        this.resoluciones = resoluciones;
        this.resolucionesPadre = this.getResolucionesPadre();
        // Limpiar cache de rutas cuando se cargan nuevas resoluciones
        this.rutasCountCache.clear();
        this.rutasPorResolucion.clear();
        
        // Cargar rutas para cada resolución padre
        this.cargarRutasParaResoluciones();
        
        // Cargar vehículos después de tener las resoluciones
        this.cargarVehiculosEmpresa(empresaId);
        
        this.isLoadingResoluciones = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando resoluciones de la empresa:', error);
        this.isLoadingResoluciones = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarRutasParaResoluciones(): void {
    this.resolucionesPadre.forEach(resolucion => {
      this.rutaService.getRutasPorResolucion(resolucion.id).subscribe({
        next: (rutas) => {
          console.log(`🚌 Rutas cargadas para resolución ${resolucion.nroResolucion}:`, rutas);
          this.rutasPorResolucion.set(resolucion.id, rutas);
          this.rutasCountCache.set(resolucion.id, rutas.length);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`Error cargando rutas para resolución ${resolucion.nroResolucion}:`, error);
          this.rutasPorResolucion.set(resolucion.id, []);
          this.rutasCountCache.set(resolucion.id, 0);
        }
      });
    });
  }

  cargarVehiculosEmpresa(empresaId: string): void {
    console.log('🚨🚨🚨 MÉTODO CARGAR VEHÍCULOS EJECUTÁNDOSE 🚨🚨🚨');
    console.log('🚗 === CARGA DIRECTA DE VEHÍCULOS ===');
    console.log('🏢 Empresa ID:', empresaId);
    console.log('📋 Resoluciones disponibles:', this.resoluciones.length);
    
    // Limpiar vehículos actuales
    this.vehiculosEmpresa = [];
    this.cdr.detectChanges();
    
    // ESTRATEGIA CORRECTA: Usar vehiculosHabilitadosIds de la EMPRESA directamente
    if (!this.empresa) {
      console.log('❌ No hay empresa cargada');
      return;
    }
    
    console.log('🎯 === ESTRATEGIA: VEHICULOS HABILITADOS IDS DE LA EMPRESA ===');
    console.log('🏢 Empresa:', this.empresa.razonSocial.principal);
    console.log('📋 vehiculosHabilitadosIds de la empresa:', this.empresa.vehiculosHabilitadosIds);
    
    if (!this.empresa.vehiculosHabilitadosIds || this.empresa.vehiculosHabilitadosIds.length === 0) {
      console.log('⚠️ La empresa no tiene vehículos habilitados');
      this.vehiculosEmpresa = [];
      this.cdr.detectChanges();
      return;
    }
    
    // Obtener TODOS los vehículos y filtrar usando vehiculosHabilitadosIds de la empresa
    this.vehiculoService.getVehiculos().subscribe({
      next: (todosLosVehiculos: Vehiculo[]) => {
        console.log('🚗 TODOS LOS VEHÍCULOS EN EL SISTEMA:', todosLosVehiculos.length);
        
        if (todosLosVehiculos.length > 0) {
          console.log('🔍 ESTRUCTURA DEL PRIMER VEHÍCULO:', todosLosVehiculos[0]);
          
          // Crear Set de IDs de vehículos habilitados de la empresa
          const vehiculosHabilitadosIds = new Set(this.empresa!.vehiculosHabilitadosIds);
          console.log('📊 Total IDs únicos de vehículos habilitados:', vehiculosHabilitadosIds.size);
          console.log('📋 IDs de vehículos habilitados:', Array.from(vehiculosHabilitadosIds));
          
          // Filtrar vehículos que estén en la lista de habilitados
          const vehiculosEncontrados = todosLosVehiculos.filter(vehiculo => {
            const estaHabilitado = vehiculosHabilitadosIds.has(vehiculo.id);
            if (estaHabilitado) {
              console.log(`✅ Vehículo habilitado encontrado: ${vehiculo.placa} (ID: ${vehiculo.id})`);
            }
            return estaHabilitado;
          });
          
          console.log('🎉 === RESULTADO FINAL ===');
          console.log('📊 Total vehículos encontrados:', vehiculosEncontrados.length);
          if (vehiculosEncontrados.length > 0) {
            console.log('🚗 Placas encontradas:', vehiculosEncontrados.map(v => v.placa));
          }
          
          // ASIGNACIÓN DIRECTA Y FORZADA
          console.log('🔄 === ASIGNACIÓN FORZADA ===');
          this.vehiculosEmpresa = [...vehiculosEncontrados]; // Crear nueva referencia
          
          console.log('✅ vehiculosEmpresa asignado:', this.vehiculosEmpresa.length);
          console.log('✅ Placas en vehiculosEmpresa:', this.vehiculosEmpresa.map(v => v.placa));
          
          // Forzar detección de cambios
          this.cdr.detectChanges();
          this.cdr.markForCheck();
          
          console.log('✅ Detección de cambios ejecutada');
          
        } else {
          console.log('⚠️ No hay vehículos en el sistema');
          this.vehiculosEmpresa = [];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('❌ Error obteniendo vehículos:', error);
        this.vehiculosEmpresa = [];
        this.cdr.detectChanges();
      }
    });
  }

  private buscarVehiculosPorResoluciones(todosVehiculos: Vehiculo[], empresaId: string): void {
    console.log('🔍 Buscando vehículos por resoluciones...');
    console.log('📋 Resoluciones disponibles:', this.resoluciones.length);
    
    if (this.resoluciones.length === 0) {
      console.log('⚠️ No hay resoluciones cargadas');
      this.vehiculosEmpresa = [];
      this.cdr.detectChanges();
      return;
    }
    
    const resolucionesIds = this.resoluciones.map(r => r.id);
    console.log('📋 IDs de resoluciones:', resolucionesIds);
    
    // Buscar vehículos que tengan resolucionId que coincida
    const vehiculosPorResolucionId = todosVehiculos.filter(v => 
      v.resolucionId && resolucionesIds.includes(v.resolucionId)
    );
    console.log('🚗 Vehículos por resolucionId:', vehiculosPorResolucionId.length);
    
    // Buscar vehículos listados en vehiculosHabilitadosIds de las resoluciones
    const vehiculosIdsEnResoluciones = new Set<string>();
    this.resoluciones.forEach(resolucion => {
      if (resolucion.vehiculosHabilitadosIds) {
        resolucion.vehiculosHabilitadosIds.forEach(vehiculoId => {
          vehiculosIdsEnResoluciones.add(vehiculoId);
        });
      }
    });
    
    const vehiculosPorIdEnResoluciones = todosVehiculos.filter(v => 
      vehiculosIdsEnResoluciones.has(v.id)
    );
    console.log('🚗 Vehículos por ID en resoluciones:', vehiculosPorIdEnResoluciones.length);
    
    // Combinar ambos métodos sin duplicados
    const vehiculosEncontrados = new Map<string, Vehiculo>();
    
    vehiculosPorResolucionId.forEach(v => vehiculosEncontrados.set(v.id, v));
    vehiculosPorIdEnResoluciones.forEach(v => vehiculosEncontrados.set(v.id, v));
    
    const vehiculosFinales = Array.from(vehiculosEncontrados.values());
    console.log('🚗 Total vehículos únicos encontrados:', vehiculosFinales.length);
    console.log('🚗 Placas encontradas:', vehiculosFinales.map(v => v.placa));
    
    this.vehiculosEmpresa = vehiculosFinales;
    this.cdr.detectChanges();
  }

  private cargarVehiculosMetodoAlternativo(empresaId: string): void {
    console.log('🔄 Método alternativo: Cargando vehículos por resoluciones individuales...');
    
    if (this.resoluciones.length === 0) {
      console.log('⚠️ No hay resoluciones para el método alternativo');
      this.vehiculosEmpresa = [];
      this.cdr.detectChanges();
      return;
    }
    
    const todosVehiculos: Vehiculo[] = [];
    let resolucionesProcesadas = 0;
    const totalResoluciones = this.resoluciones.length;
    
    this.resoluciones.forEach(resolucion => {
      console.log(`🔍 Cargando vehículos para resolución: ${resolucion.nroResolucion}`);
      
      this.vehiculoService.getVehiculosPorResolucion(resolucion.id).subscribe({
        next: (vehiculosResolucion: Vehiculo[]) => {
          console.log(`✅ Resolución ${resolucion.nroResolucion}: ${vehiculosResolucion.length} vehículos`);
          
          // Agregar vehículos únicos
          vehiculosResolucion.forEach(vehiculo => {
            if (!todosVehiculos.find(v => v.id === vehiculo.id)) {
              todosVehiculos.push(vehiculo);
            }
          });
          
          resolucionesProcesadas++;
          
          if (resolucionesProcesadas === totalResoluciones) {
            console.log('🚗 === RESULTADO MÉTODO ALTERNATIVO ===');
            console.log('📊 Total vehículos recolectados:', todosVehiculos.length);
            console.log('🚗 Placas recolectadas:', todosVehiculos.map(v => v.placa));
            
            this.vehiculosEmpresa = todosVehiculos;
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.error(`❌ Error en resolución ${resolucion.nroResolucion}:`, error);
          resolucionesProcesadas++;
          
          if (resolucionesProcesadas === totalResoluciones) {
            console.log('🚗 Finalizando con errores, total recolectado:', todosVehiculos.length);
            this.vehiculosEmpresa = todosVehiculos;
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  // Métodos para estructura jerárquica de resoluciones
  getResolucionesPadre(): Resolucion[] {
    return this.resoluciones.filter(r => r.tipoResolucion === 'PADRE');
  }

  getResolucionesHijas(resolucionPadreId: string): Resolucion[] {
    return this.resoluciones.filter(r => r.resolucionPadreId === resolucionPadreId);
  }

  // Métodos para gestión de vehículos y rutas por resolución
  gestionarVehiculosResolucion(resolucionId: string): void {
    // TODO: Implementar modal para gestionar vehículos de la resolución
    this.snackBar.open('Funcionalidad de gestión de vehículos próximamente', 'Cerrar', { duration: 3000 });
  }

  gestionarRutasResolucion(resolucionId: string): void {
    // TODO: Implementar modal para gestionar rutas de la resolución
    this.snackBar.open('Funcionalidad de gestión de rutas próximamente', 'Cerrar', { duration: 3000 });
  }

  crearResolucionHija(resolucionPadreId: string): void {
    if (this.empresa) {
      // Abrir modal de creación de resolución hija
      const dialogRef = this.dialog.open(CrearResolucionModalComponent, {
        width: '800px',
        data: { 
          empresaId: this.empresa.id, 
          empresa: this.empresa,
          resolucionPadreId: resolucionPadreId,
          esResolucionHija: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Recargar las resoluciones para mostrar la nueva hija
          this.cargarResolucionesEmpresa(this.empresa!.id);
          this.snackBar.open('Resolución hija creada exitosamente', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  editarEmpresa(): void {
    if (this.empresa) {
      this.router.navigate(['/empresas', this.empresa.id, 'editar']);
    }
  }

  // Métodos para Resoluciones
  crearResolucion(): void {
    if (this.empresa) {
      // Abrir modal de creación de resolución
      const dialogRef = this.dialog.open(CrearResolucionModalComponent, {
        width: '800px',
        data: { empresaId: this.empresa.id, empresa: this.empresa }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Recargar las resoluciones para mostrar la nueva
          this.cargarResolucionesEmpresa(this.empresa!.id);
          this.snackBar.open('Resolución creada exitosamente', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  verResolucion(resolucionId: string): void {
    // Navegar a la vista de detalles de la resolución
    this.router.navigate(['/resoluciones', resolucionId]);
  }

  // Métodos para Vehículos
  agregarVehiculos(): void {
    if (this.empresa) {
      // Abrir modal de agregar vehículos
      const dialogRef = this.dialog.open(EmpresaVehiculosBatchComponent, {
        width: '900px',
        data: { empresaId: this.empresa.id, empresa: this.empresa }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Recargar la empresa para mostrar los nuevos vehículos
          this.loadEmpresa(this.empresa!.id);
          this.snackBar.open('Vehículos agregados exitosamente', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  verVehiculo(vehiculoId: string): void {
    // Navegar a la vista de detalles del vehículo
    this.router.navigate(['/vehiculos', vehiculoId]);
  }

  // Métodos para Conductores
  agregarConductores(): void {
    if (this.empresa) {
      // Navegar a la vista de gestión de conductores
      this.router.navigate(['/empresas', this.empresa.id, 'conductores']);
    }
  }

  verConductor(conductorId: string): void {
    // Navegar a la vista de detalles del conductor
    this.router.navigate(['/conductores', conductorId]);
  }

  // Métodos para Rutas
  irAModuloRutas(): void {
    if (this.empresa) {
      // Redirigir al módulo de rutas con el ID de la empresa como parámetro
      this.router.navigate(['/rutas'], { 
        queryParams: { 
          empresaId: this.empresa.id,
          action: 'create'
        } 
      });
    }
  }

  verRuta(rutaId: string): void {
    // Navegar a la vista de detalles de la ruta
    this.router.navigate(['/rutas', rutaId]);
  }

  // Métodos para "Ver Todos"
  verTodasResoluciones(): void {
    if (this.empresa) {
      this.router.navigate(['/resoluciones'], { queryParams: { empresaId: this.empresa.id } });
    }
  }

  verTodosVehiculos(): void {
    if (this.empresa) {
      this.router.navigate(['/vehiculos'], { queryParams: { empresaId: this.empresa.id } });
    }
  }

  verTodosConductores(): void {
    if (this.empresa) {
      this.router.navigate(['/conductores'], { queryParams: { empresaId: this.empresa.id } });
    }
  }

  verTodasRutas(): void {
    if (this.empresa) {
      this.router.navigate(['/rutas'], { queryParams: { empresaId: this.empresa.id } });
    }
  }

  // Nuevos métodos para rutas por resolución
  getTotalRutas(): number {
    if (!this.empresa?.rutasAutorizadasIds) return 0;
    return this.empresa.rutasAutorizadasIds.length;
  }

  getRutasCountByResolucion(resolucionId: string): number {
    // Usar el cache que se actualiza con datos reales
    return this.rutasCountCache.get(resolucionId) || 0;
  }

  getRutasByResolucion(resolucionId: string): Ruta[] {
    // Retornar las rutas cargadas para esta resolución
    return this.rutasPorResolucion.get(resolucionId) || [];
  }

  getEstadoColor(estado: string): 'primary' | 'accent' | 'warn' {
    switch (estado?.toUpperCase()) {
      case 'VIGENTE':
      case 'APROBADA':
        return 'primary';
      case 'PENDIENTE':
      case 'EN_TRAMITE':
        return 'accent';
      case 'VENCIDA':
      case 'ANULADA':
      case 'RECHAZADA':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getEstadoRutaColor(estado: string): 'primary' | 'accent' | 'warn' {
    switch (estado?.toUpperCase()) {
      case 'ACTIVA':
        return 'primary';
      case 'INACTIVA':
      case 'SUSPENDIDA':
        return 'warn';
      case 'EN_MANTENIMIENTO':
        return 'accent';
      default:
        return 'primary';
    }
  }

  getEstadoVehiculoColor(estado: string): 'primary' | 'accent' | 'warn' {
    switch (estado?.toUpperCase()) {
      case 'ACTIVO':
      case 'HABILITADO':
        return 'primary';
      case 'INACTIVO':
      case 'SUSPENDIDO':
      case 'INHABILITADO':
        return 'warn';
      case 'EN_MANTENIMIENTO':
      case 'EN_REVISION':
        return 'accent';
      default:
        return 'primary';
    }
  }

  // Métodos auxiliares para formatear datos de vehículos
  getRutaNombre(rutaId: string): string {
    // Buscar en las rutas cargadas
    for (const rutas of this.rutasPorResolucion.values()) {
      const ruta = rutas.find(r => r.id === rutaId);
      if (ruta) {
        return `${ruta.origen} - ${ruta.destino}`;
      }
    }
    return `Ruta ${rutaId.substring(0, 8)}...`;
  }

  getResolucionNumero(resolucionId: string): string {
    const resolucion = this.resoluciones.find(r => r.id === resolucionId);
    return resolucion?.nroResolucion || 'No encontrada';
  }

  formatPeso(peso: number | undefined): string {
    if (!peso) return 'N/A';
    return `${peso.toLocaleString()} kg`;
  }

  formatMedidas(medidas: any): string {
    if (!medidas || !medidas.largo || !medidas.ancho || !medidas.alto) {
      return 'N/A';
    }
    return `${medidas.largo}×${medidas.ancho}×${medidas.alto} mm`;
  }

  formatCilindrada(cilindrada: number | undefined): string {
    if (!cilindrada) return 'N/A';
    return `${cilindrada} cc`;
  }

  formatPotencia(potencia: number | undefined): string {
    if (!potencia) return 'N/A';
    return `${potencia} HP`;
  }

  formatFecha(fecha: string | Date): string {
    if (!fecha) return 'No disponible';
    
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  irAModuloRutasConResolucion(resolucionId: string): void {
    if (this.empresa) {
      // Redirigir al módulo de rutas con empresa y resolución específica
      this.router.navigate(['/rutas'], { 
        queryParams: { 
          empresaId: this.empresa.id,
          resolucionId: resolucionId,
          action: 'create'
        } 
      });
    }
  }

  // Métodos para Vehículos
  irAModuloVehiculos(): void {
    if (this.empresa) {
      // Redirigir al módulo de vehículos con el ID de la empresa como parámetro
      this.router.navigate(['/vehiculos'], { 
        queryParams: { 
          empresaId: this.empresa.id,
          action: 'create'
        } 
      });
    }
  }

  refrescarVehiculos(): void {
    if (this.empresa) {
      console.log('🔄 Refrescando lista de vehículos para empresa:', this.empresa.id);
      this.cargarVehiculosEmpresa(this.empresa.id);
      
      // Mostrar mensaje de confirmación
      this.snackBar.open(
        'Lista de vehículos actualizada',
        'Cerrar',
        { duration: 2000 }
      );
    }
  }

  // Métodos para gestión de vehículos desde el módulo de empresas
  crearNuevoVehiculo(): void {
    if (!this.empresa) return;
    
    console.log('🚗 Creando nuevo vehículo para empresa:', this.empresa.id);
    
    // Navegar al módulo de vehículos con parámetros para crear nuevo vehículo
    this.router.navigate(['/vehiculos'], { 
      queryParams: { 
        empresaId: this.empresa.id,
        action: 'create',
        returnTo: 'empresa-detail',
        returnId: this.empresa.id
      } 
    });
  }

  agregarVehiculoExistente(): void {
    if (!this.empresa) return;
    
    console.log('🔍 Buscando vehículo existente para agregar a empresa:', this.empresa.id);
    
    // Aquí se podría abrir un modal para buscar y seleccionar vehículos existentes
    // Por ahora, navegar al módulo de vehículos con parámetros específicos
    this.router.navigate(['/vehiculos'], { 
      queryParams: { 
        empresaId: this.empresa.id,
        action: 'add-existing',
        returnTo: 'empresa-detail',
        returnId: this.empresa.id
      } 
    });
  }

  getVehiculosPlacas(): string {
    return this.vehiculosEmpresa?.map(v => v.placa).join(', ') || '';
  }

  verDetalleVehiculo(vehiculo: Vehiculo): void {
    console.log('👁️ Ver detalles del vehículo:', vehiculo.placa);
    
    // Navegar al detalle del vehículo
    this.router.navigate(['/vehiculos', vehiculo.id], {
      queryParams: {
        returnTo: 'empresa-detail',
        returnId: this.empresa?.id
      }
    });
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    console.log('✏️ Editar vehículo:', vehiculo.placa);
    
    // Navegar al formulario de edición del vehículo
    this.router.navigate(['/vehiculos', vehiculo.id, 'edit'], {
      queryParams: {
        returnTo: 'empresa-detail',
        returnId: this.empresa?.id
      }
    });
  }

  gestionarRutasVehiculo(vehiculo: Vehiculo): void {
    console.log('🛣️ Gestionar rutas del vehículo:', vehiculo.placa);
    
    // Buscar la resolución padre a la que está asociado el vehículo
    const resolucionAsociada = this.resoluciones.find(resolucion => 
      resolucion.vehiculosHabilitadosIds && 
      resolucion.vehiculosHabilitadosIds.includes(vehiculo.id)
    );
    
    if (resolucionAsociada) {
      console.log('📋 Vehículo asociado a resolución:', resolucionAsociada.nroResolucion);
      
      // Navegar al módulo de rutas filtrado por la resolución específica
      this.router.navigate(['/rutas'], {
        queryParams: {
          vehiculoId: vehiculo.id,
          empresaId: this.empresa?.id,
          resolucionId: resolucionAsociada.id,
          resolucionNumero: resolucionAsociada.nroResolucion,
          action: 'manage-vehicle-routes',
          returnTo: 'empresa-detail',
          returnId: this.empresa?.id
        }
      });
    } else {
      console.log('⚠️ Vehículo no asociado a ninguna resolución');
      
      // Mostrar mensaje informativo
      this.snackBar.open(
        `El vehículo ${vehiculo.placa} no está asociado a ninguna resolución. Debe asociarlo primero.`,
        'Cerrar',
        { 
          duration: 5000,
          panelClass: ['warning-snackbar']
        }
      );
      
      // Opcionalmente, navegar al módulo de rutas general
      this.router.navigate(['/rutas'], {
        queryParams: {
          vehiculoId: vehiculo.id,
          empresaId: this.empresa?.id,
          action: 'assign-to-resolution',
          returnTo: 'empresa-detail',
          returnId: this.empresa?.id
        }
      });
    }
  }

  transferirVehiculo(vehiculo: Vehiculo): void {
    console.log('🔄 Transferir vehículo:', vehiculo.placa);
    
    // Por ahora, mostrar mensaje informativo
    this.snackBar.open(
      `Funcionalidad de transferencia de vehículo ${vehiculo.placa} próximamente disponible`,
      'Cerrar',
      { duration: 3000 }
    );
    
    // TODO: Implementar modal de confirmación
    // const dialogRef = this.dialog.open(ConfirmarTransferenciaVehiculoComponent, {
    //   width: '500px',
    //   data: {
    //     vehiculo: vehiculo,
    //     empresaActual: this.empresa
    //   }
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result && result.confirmed) {
    //     this.ejecutarTransferenciaVehiculo(vehiculo, result.empresaDestino);
    //   }
    // });
  }

  asociarVehiculoAResolucion(vehiculo: Vehiculo): void {
    console.log('🔗 Asociar vehículo a resolución:', vehiculo.placa);
    
    // Por ahora, mostrar mensaje informativo
    this.snackBar.open(
      `Funcionalidad de asociación de vehículo ${vehiculo.placa} próximamente disponible`,
      'Cerrar',
      { duration: 3000 }
    );
    
    // TODO: Implementar modal para seleccionar resolución
    // const dialogRef = this.dialog.open(AsociarVehiculoResolucionComponent, {
    //   width: '600px',
    //   data: {
    //     vehiculo: vehiculo,
    //     empresa: this.empresa,
    //     resoluciones: this.resoluciones.filter(r => r.tipoResolucion === 'PADRE' && r.estado === 'VIGENTE')
    //   }
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result && result.resolucionId) {
    //     this.ejecutarAsociacionVehiculo(vehiculo, result.resolucionId);
    //   }
    // });
  }

  private ejecutarAsociacionVehiculo(vehiculo: Vehiculo, resolucionId: string): void {
    console.log('🔗 Ejecutando asociación de vehículo:', vehiculo.placa, 'a resolución:', resolucionId);
    
    // Encontrar la resolución
    const resolucion = this.resoluciones.find(r => r.id === resolucionId);
    if (!resolucion) {
      this.snackBar.open('Error: Resolución no encontrada', 'Cerrar', { duration: 3000 });
      return;
    }

    // Agregar el vehículo a la resolución
    const vehiculosActualizados = [...(resolucion.vehiculosHabilitadosIds || [])];
    if (!vehiculosActualizados.includes(vehiculo.id)) {
      vehiculosActualizados.push(vehiculo.id);
    }

    const resolucionActualizada = {
      ...resolucion,
      vehiculosHabilitadosIds: vehiculosActualizados
    };

    // Actualizar la resolución en el backend
    this.resolucionService.updateResolucion(resolucionId, resolucionActualizada).subscribe({
      next: (resolucionUpdated) => {
        console.log('✅ Vehículo asociado exitosamente a resolución:', resolucionUpdated);
        
        this.snackBar.open(
          `Vehículo ${vehiculo.placa} asociado a resolución ${resolucion.nroResolucion}`,
          'Cerrar',
          { duration: 3000 }
        );
        
        // Refrescar los datos
        this.loadEmpresa(this.empresa!.id);
      },
      error: (error) => {
        console.error('❌ Error asociando vehículo a resolución:', error);
        this.snackBar.open(
          'Error al asociar el vehículo a la resolución. Intente nuevamente.',
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }

  private ejecutarTransferenciaVehiculo(vehiculo: Vehiculo, empresaDestinoId: string): void {
    console.log('🚚 Ejecutando transferencia de vehículo:', vehiculo.placa, 'a empresa:', empresaDestinoId);
    
    // Actualizar el vehículo con la nueva empresa
    const vehiculoActualizado = {
      ...vehiculo,
      empresaActualId: empresaDestinoId
    };

    this.vehiculoService.updateVehiculo(vehiculo.id, vehiculoActualizado).subscribe({
      next: (vehiculoTransferido) => {
        console.log('✅ Vehículo transferido exitosamente:', vehiculoTransferido);
        
        this.snackBar.open(
          `Vehículo ${vehiculo.placa} transferido exitosamente`,
          'Cerrar',
          { duration: 3000 }
        );
        
        // Refrescar la lista de vehículos
        this.refrescarVehiculos();
      },
      error: (error) => {
        console.error('❌ Error transfiriendo vehículo:', error);
        this.snackBar.open(
          'Error al transferir el vehículo. Intente nuevamente.',
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }

  cambiarEstadoVehiculo(vehiculo: Vehiculo): void {
    const nuevoEstado = vehiculo.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'suspender';
    
    console.log(`🔄 Cambiar estado del vehículo ${vehiculo.placa} a:`, nuevoEstado);
    
    // Mostrar diálogo de confirmación
    const mensaje = `¿Está seguro que desea ${accion} el vehículo ${vehiculo.placa}?`;
    
    if (confirm(mensaje)) {
      const vehiculoActualizado = {
        ...vehiculo,
        estado: nuevoEstado
      };

      this.vehiculoService.updateVehiculo(vehiculo.id, vehiculoActualizado).subscribe({
        next: (vehiculoModificado) => {
          console.log('✅ Estado del vehículo actualizado:', vehiculoModificado);
          
          this.snackBar.open(
            `Vehículo ${vehiculo.placa} ${nuevoEstado.toLowerCase()} exitosamente`,
            'Cerrar',
            { duration: 3000 }
          );
          
          // Refrescar la lista de vehículos
          this.refrescarVehiculos();
        },
        error: (error) => {
          console.error('❌ Error actualizando estado del vehículo:', error);
          this.snackBar.open(
            'Error al actualizar el estado del vehículo. Intente nuevamente.',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
    }
  }

  eliminarVehiculoDeEmpresa(vehiculo: Vehiculo): void {
    console.log('🗑️ Quitar vehículo de empresa:', vehiculo.placa);
    
    const mensaje = `¿Está seguro que desea quitar el vehículo ${vehiculo.placa} de esta empresa?\n\nEsto no eliminará el vehículo del sistema, solo lo desasociará de la empresa.`;
    
    if (confirm(mensaje)) {
      // Actualizar el vehículo quitando la asociación con la empresa
      const vehiculoActualizado = {
        ...vehiculo,
        empresaActualId: '', // Quitar la asociación
        estado: 'DISPONIBLE' // Cambiar estado a disponible
      };

      this.vehiculoService.updateVehiculo(vehiculo.id, vehiculoActualizado).subscribe({
        next: (vehiculoModificado) => {
          console.log('✅ Vehículo quitado de la empresa exitosamente:', vehiculoModificado);
          
          this.snackBar.open(
            `Vehículo ${vehiculo.placa} quitado de la empresa exitosamente`,
            'Cerrar',
            { duration: 3000 }
          );
          
          // Refrescar la lista de vehículos
          this.refrescarVehiculos();
        },
        error: (error) => {
          console.error('❌ Error quitando vehículo de la empresa:', error);
          this.snackBar.open(
            'Error al quitar el vehículo de la empresa. Intente nuevamente.',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
    }
  }

  // Método para manejar el toggle de columnas
  onColumnToggle(): void {
    // Forzar detección de cambios para actualizar la tabla
    this.cdr.detectChanges();
  }

  // Método para manejar el toggle de columnas de vehículos
  onColumnToggleVehiculos(): void {
    // Forzar detección de cambios para actualizar la tabla
    this.cdr.detectChanges();
  }

  editarRuta(rutaId: string): void {
    console.log('Editar ruta:', rutaId);
    
    // Buscar la ruta en los datos cargados
    let rutaEncontrada: Ruta | undefined;
    for (const [resolucionId, rutas] of this.rutasPorResolucion) {
      rutaEncontrada = rutas.find(r => r.id === rutaId);
      if (rutaEncontrada) break;
    }
    
    if (rutaEncontrada) {
      // Abrir modal de edición de ruta
      const dialogRef = this.dialog.open(CrearRutaModalComponent, {
        width: '900px',
        data: { 
          ruta: rutaEncontrada,
          empresa: this.empresa,
          modo: 'editar'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Recargar las rutas para mostrar los cambios
          this.cargarRutasParaResoluciones();
          this.snackBar.open('Ruta actualizada exitosamente', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('No se pudo encontrar la ruta', 'Cerrar', { duration: 3000 });
    }
  }
}

// Componente de diálogo para confirmar transferencia de vehículos
@Component({
  selector: 'app-confirmar-transferencia-vehiculo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>swap_horiz</mat-icon>
      Transferir Vehículo
    </h2>
    
    <mat-dialog-content>
      <div class="transferencia-info">
        <p><strong>Vehículo:</strong> {{ data.vehiculo.placa }}</p>
        <p><strong>Empresa Actual:</strong> {{ data.empresaActual?.razonSocial?.principal }}</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Empresa Destino</mat-label>
          <mat-select [(ngModel)]="empresaDestinoSeleccionada" required>
            <mat-option *ngFor="let empresa of empresasDisponibles" [value]="empresa.id">
              {{ empresa.razonSocial.principal }} ({{ empresa.ruc }})
            </mat-option>
          </mat-select>
        </mat-form-field>
        
        <div class="advertencia">
          <mat-icon color="warn">warning</mat-icon>
          <p>Esta acción transferirá el vehículo a la empresa seleccionada. ¿Está seguro?</p>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-raised-button color="primary" 
              [disabled]="!empresaDestinoSeleccionada"
              (click)="confirmar()">
        <mat-icon>swap_horiz</mat-icon>
        Transferir
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .transferencia-info {
      min-width: 400px;
      padding: 16px 0;
    }
    
    .full-width {
      width: 100%;
      margin: 16px 0;
    }
    
    .advertencia {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fff3e0;
      padding: 12px;
      border-radius: 4px;
      margin-top: 16px;
      
      mat-icon {
        color: #f57c00;
      }
      
      p {
        margin: 0;
        color: #e65100;
      }
    }
  `]
})
export class ConfirmarTransferenciaVehiculoComponent {
  empresaDestinoSeleccionada: string = '';
  empresasDisponibles: Empresa[] = [];
  
  private empresaService = inject(EmpresaService);
  private dialogRef = inject(MatDialogRef<ConfirmarTransferenciaVehiculoComponent>);
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: { vehiculo: Vehiculo, empresaActual: Empresa }) {
    this.cargarEmpresas();
  }
  
  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        // Filtrar la empresa actual
        this.empresasDisponibles = empresas.filter(e => e.id !== this.data.empresaActual?.id);
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
      }
    });
  }
  
  cancelar(): void {
    this.dialogRef.close();
  }
  
  confirmar(): void {
    this.dialogRef.close({
      confirmed: true,
      empresaDestino: this.empresaDestinoSeleccionada
    });
  }
}