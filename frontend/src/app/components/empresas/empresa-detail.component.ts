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
import { ResolucionService } from '../../services/resolucion.service';
import { Resolucion } from '../../models/resolucion.model';
import { CrearResolucionModalComponent } from './crear-resolucion-modal.component';
import { CrearRutaModalComponent } from '../rutas/crear-ruta-modal.component';
import { EmpresaVehiculosBatchComponent } from './empresa-vehiculos-batch.component';
import { CodigoEmpresaInfoComponent } from '../shared/codigo-empresa-info.component';

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
    MatDividerModule,
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
                          <strong>{{ empresa.vehiculosHabilitadosIds.length || 0 }}</strong>
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
                      <button mat-raised-button color="primary" (click)="agregarRutas()">
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
                                <button mat-button color="accent" (click)="gestionarRutasResolucion(resolucionPadre.id)">
                                  <mat-icon>route</mat-icon>
                                  Gestionar Rutas
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
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>directions_car</mat-icon>
                      Vehículos Asociados
                      <span class="badge-count">({{ empresa.vehiculosHabilitadosIds.length || 0 }})</span>
                    </mat-card-title>
                    <mat-card-subtitle>
                      <button mat-raised-button color="primary" (click)="agregarVehiculos()" class="add-button">
                        <mat-icon>add</mat-icon>
                        Agregar Vehículos
                      </button>
                    </mat-card-subtitle>
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
                            <mat-card-actions>
                              <button mat-button color="primary" (click)="verVehiculo(vehiculoId)">
                                <mat-icon>visibility</mat-icon>
                                Ver Detalles
                              </button>
                            </mat-card-actions>
                          </mat-card>
                        }
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">directions_car</mat-icon>
                        <h3>No hay vehículos asociados</h3>
                        <p>Esta empresa no tiene vehículos registrados.</p>
                        <button mat-raised-button color="primary" (click)="agregarVehiculos()" class="add-button">
                          <mat-icon>add</mat-icon>
                          Agregar Primer Vehículo
                        </button>
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
                      Rutas Autorizadas
                      <span class="badge-count">({{ empresa.rutasAutorizadasIds.length || 0 }})</span>
                    </mat-card-title>
                    <mat-card-subtitle>
                      <button mat-raised-button color="primary" (click)="agregarRutas()" class="add-button">
                        <mat-icon>add</mat-icon>
                        Agregar Rutas
                      </button>
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    @if (empresa.rutasAutorizadasIds && empresa.rutasAutorizadasIds.length > 0) {
                      <div class="rutas-grid">
                        @for (rutaId of empresa.rutasAutorizadasIds; track rutaId) {
                          <mat-card class="ruta-card">
                            <mat-card-header>
                              <mat-card-title>Ruta {{ rutaId }}</mat-card-title>
                              <mat-card-subtitle>ID: {{ rutaId }}</mat-card-subtitle>
                            </mat-card-header>
                            <mat-card-content>
                              <p>Información de la ruta se cargará próximamente.</p>
                            </mat-card-content>
                            <mat-card-actions>
                              <button mat-button color="primary" (click)="verRuta(rutaId)">
                                <mat-icon>visibility</mat-icon>
                                Ver Detalles
                              </button>
                            </mat-card-actions>
                          </mat-card>
                        }
                      </div>
                    } @else {
                      <div class="empty-state">
                        <mat-icon class="empty-icon">route</mat-icon>
                        <h3>No hay rutas autorizadas</h3>
                        <p>Esta empresa no tiene rutas autorizadas.</p>
                        <button mat-raised-button color="primary" (click)="agregarRutas()" class="add-button">
                          <mat-icon>add</mat-icon>
                          Agregar Primera Ruta
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

    .add-button {
      margin-top: 8px;
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
  `]
})
export class EmpresaDetailComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private authService = inject(AuthService);
  private resolucionService = inject(ResolucionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  empresa?: Empresa;
  isLoading = false;
  resoluciones: Resolucion[] = [];
  isLoadingResoluciones = false;

  ngOnInit(): void {
    const empresaId = this.route.snapshot.params['id'];
    if (empresaId) {
      this.loadEmpresa(empresaId);
    }
  }

  loadEmpresa(id: string): void {
    this.isLoading = true;
    this.empresaService.getEmpresa(id).subscribe({
      next: (empresa) => {
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
    
    this.resolucionService.getResoluciones(0, 100, undefined, empresaId).subscribe({
      next: (resoluciones) => {
        console.log('📋 Resoluciones cargadas para empresa:', empresaId, resoluciones);
        this.resoluciones = resoluciones;
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
  agregarRutas(): void {
    if (this.empresa) {
      // Verificar si la empresa tiene resoluciones para crear rutas
      if (!this.empresa.resolucionesPrimigeniasIds || this.empresa.resolucionesPrimigeniasIds.length === 0) {
        this.snackBar.open('Esta empresa debe tener al menos una resolución para crear rutas', 'Cerrar', { 
          duration: 4000,
          panelClass: ['warning-snackbar']
        });
        return;
      }

      // Abrir modal de creación de ruta
      const dialogRef = this.dialog.open(CrearRutaModalComponent, {
        width: '800px',
        data: { 
          empresa: this.empresa,
          empresaId: this.empresa.id
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Recargar los datos de la empresa para mostrar la nueva ruta
          this.loadEmpresa(this.empresa!.id);
          this.snackBar.open('Ruta creada exitosamente', 'Cerrar', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
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
} 