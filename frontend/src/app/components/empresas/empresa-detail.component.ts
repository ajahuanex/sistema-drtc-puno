import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa, SunatData, ExpedienteOperativoEmpresa, PrimigeniaDetalleItem, VehiculoPrimigeniaItem } from '../../models/empresa.model';

const ESTADOS_RUC: Record<string, string> = {
  '00': 'ACTIVO',
  '10': 'SUSPENSION TEMPORAL',
  '11': 'BAJA DE OFICIO',
  '12': 'BAJA DEFINITIVA',
  '20': 'BAJA PROVISIONAL',
  '21': 'BAJA PROV. POR OFICIO',
  '22': 'SUSPENSION PROVISIONAL'
};

@Component({
  selector: 'app-empresa-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatTabsModule
  ],
  providers: [DatePipe],
  template: `
    <div class="page-container">
      <!-- HEADER ACTIONS -->
      <div class="page-header-actions">
        <button mat-stroked-button (click)="volver()" class="action-btn">
          <mat-icon>arrow_back</mat-icon> Volver a Empresas
        </button>
        <button mat-raised-button color="primary" (click)="editar()" [disabled]="!empresa()" class="action-btn">
          <mat-icon>edit</mat-icon> Editar Empresa
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-wrapper">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Cargando detalle de la empresa...</span>
        </div>
      } @else if (!empresa()) {
        <mat-card class="error-card">
          <mat-icon class="error-icon color-warn">error_outline</mat-icon>
          <h3>No se encontró la empresa</h3>
          <p>La empresa solicitada no existe o fue dada de baja.</p>
          <button mat-stroked-button color="primary" (click)="volver()">
            <mat-icon>arrow_back</mat-icon> Regresar al listado
          </button>
        </mat-card>
      } @else {
        @if (empresa(); as emp) {
          <!-- HEADER COMPACTO Y MODERNO -->
          <div class="company-header-compact mat-elevation-z2">
            <div class="ch-left">
              <div class="ch-avatar">
                <mat-icon>business</mat-icon>
              </div>
              <div class="ch-titles">
                <div class="ch-overline">
                  <span class="ruc-pill-tag">RUC: <strong>{{ emp.ruc }}</strong></span>
                  <span class="ch-separator">•</span>
                  <span class="system-status" [class.active]="emp.estaActivo">
                    {{ emp.estaActivo ? 'Sistema: Activo' : 'Sistema: Inactivo' }}
                  </span>
                </div>
                <h1 class="ch-title">{{ emp.razonSocial.principal }}</h1>
                
                <!-- BADGES: ESTADO LEGAL + SERVICIOS AUTORIZADOS ARRIBA JUNTOS -->
                <div class="ch-badges-row">
                  <span [class]="'status-chip chip-' + (emp.estado ? emp.estado.toLowerCase() : 'autorizada')">
                    <mat-icon class="chip-icon">{{ getEstadoIcon(emp.estado) }}</mat-icon>
                    <span>{{ getEstadoDisplayName(emp.estado) }}</span>
                  </span>

                  <!-- SERVICIOS AUTORIZADOS AL LADO DE AUTORIZADA -->
                  @if (emp.tiposServicio && emp.tiposServicio.length > 0) {
                    @for (srv of emp.tiposServicio; track srv) {
                      <span class="service-header-chip" [matTooltip]="'Modalidad autorizada: ' + srv">
                        <mat-icon class="chip-icon">directions_bus</mat-icon>
                        <span>{{ srv }}</span>
                      </span>
                    }
                  } @else {
                    <span class="service-header-chip chip-muted">
                      <mat-icon class="chip-icon">help_outline</mat-icon>
                      <span>SIN SERVICIOS ESPECIFICADOS</span>
                    </span>
                  }
                </div>
              </div>
            </div>
            
            <div class="ch-right">
               <div class="ch-dates">
                 <div><span class="lbl">Registrado:</span> {{ emp.fechaRegistro | date:'mediumDate' }}</div>
                 @if (emp.fechaActualizacion) {
                   <div><span class="lbl">Actualizado:</span> {{ emp.fechaActualizacion | date:'mediumDate' }}</div>
                 }
               </div>
            </div>
          </div>

          <!-- CONTENIDO PRINCIPAL EN TABS -->
          <mat-card class="main-content-card mat-elevation-z2">
            <mat-tab-group animationDuration="0ms" class="custom-tab-group">
              
              <!-- TAB 1: DATOS GENERALES -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="tab-icon">domain</mat-icon>
                  <span>Datos Generales</span>
                </ng-template>

                <div class="tab-content">
                  <div class="grid-layout">
                    
                    <!-- INFO EMPRESARIAL / IDENTIDAD Y REGISTRO (CON LOS 3 NOMBRES) -->
                    <div class="info-block">
                      <h3 class="block-title"><mat-icon color="primary">badge</mat-icon> Identidad y Registro</h3>
                      <mat-divider></mat-divider>
                      <div class="detail-grid">
                        <div class="detail-item full-width highlight-item">
                          <span class="d-label">1. Razón Social Principal</span>
                          <span class="d-value fw-700 color-primary fs-large">{{ emp.razonSocial.principal }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="d-label">2. Razón Social SUNAT</span>
                          <span class="d-value fw-600">
                            {{ emp.razonSocial.sunat || (sunatData()?.ddp_nombre) || 'Sin registrar en SUNAT' }}
                          </span>
                        </div>
                        <div class="detail-item">
                          <span class="d-label">3. Razón Social Mínima / Corta</span>
                          <span class="d-value fw-600">{{ emp.razonSocial.minimo || '—' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="d-label">4. Partida Registral (SUNARP)</span>
                          <span class="d-value fw-600" style="font-family:monospace;color:#2563eb;">{{ emp.partidaRegistral || 'Sin registrar' }}</span>
                        </div>
                        <div class="detail-item full-width">
                          <span class="d-label">Observaciones y Registro</span>
                          <span class="d-value">{{ emp.observaciones || 'Sin observaciones registradas' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- CONTACTO DE EMPRESA (CON DIRECCIÓN FISCAL) -->
                    <div class="info-block">
                      <h3 class="block-title"><mat-icon color="primary">contact_mail</mat-icon> Contacto de Empresa</h3>
                      <mat-divider></mat-divider>
                      <div class="detail-grid">
                        <!-- DIRECCIÓN FISCAL DESTACADA -->
                        <div class="detail-item full-width address-item">
                          <span class="d-label">Dirección Fiscal de la Empresa</span>
                          <div class="address-content">
                            <mat-icon class="loc-icon">location_on</mat-icon>
                            <span class="d-value fw-600 address-text">{{ emp.direccionFiscal || 'Dirección fiscal no registrada' }}</span>
                            @if (emp.direccionFiscal) {
                              <button mat-icon-button (click)="copiarTexto(emp.direccionFiscal, 'Dirección fiscal')" matTooltip="Copiar dirección" class="copy-btn">
                                <mat-icon>content_copy</mat-icon>
                              </button>
                            }
                          </div>
                        </div>

                        <div class="detail-item">
                          <span class="d-label">Correo Electrónico</span>
                          <span class="d-value">
                            <mat-icon class="inline-icon color-primary">email</mat-icon> 
                            @if (emp.emailContacto) {
                              <a [href]="'mailto:' + emp.emailContacto" class="contact-link">{{ emp.emailContacto }}</a>
                            } @else { — }
                          </span>
                        </div>
                        <div class="detail-item">
                          <span class="d-label">Teléfono de Contacto</span>
                          <span class="d-value">
                            <mat-icon class="inline-icon color-primary">phone</mat-icon> 
                            @if (emp.telefonoContacto) {
                              <a [href]="'tel:' + emp.telefonoContacto" class="contact-link">{{ emp.telefonoContacto }}</a>
                            } @else { — }
                          </span>
                        </div>
                        <div class="detail-item full-width">
                          <span class="d-label">Sitio Web Oficial</span>
                          <span class="d-value">
                            <mat-icon class="inline-icon color-primary">language</mat-icon> 
                            @if (emp.sitioWeb) {
                              <a [href]="emp.sitioWeb" target="_blank" class="contact-link external-link">
                                {{ emp.sitioWeb }} <mat-icon class="ext-icon">open_in_new</mat-icon>
                              </a>
                            } @else { — }
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- VALIDACIÓN SUNAT -->
                    <div class="info-block full-width bg-light">
                      <div class="sunat-header">
                        <h3 class="block-title"><mat-icon color="warn">fact_check</mat-icon> Validación SUNAT en Línea</h3>
                        <button mat-stroked-button color="primary" size="small" (click)="consultarSunat(emp.ruc)" [disabled]="isConsultandoSunat()">
                          <mat-icon>sync</mat-icon> Consultar SUNAT
                        </button>
                      </div>
                      <mat-divider></mat-divider>
                      <div class="sunat-body mt-2">
                        @if (isConsultandoSunat()) {
                          <div class="flex-center py-2">
                            <mat-spinner diameter="24"></mat-spinner>
                            <span class="ml-2">Consultando padrón SUNAT...</span>
                          </div>
                        } @else if (sunatData()) {
                          <div class="sunat-results">
                            <div class="detail-grid">
                              <div class="detail-item">
                                <span class="d-label">Estado Tributario</span>
                                <span class="d-value fw-700" [ngClass]="sunatData()!.esActivo ? 'color-success' : 'color-warn'">
                                  <mat-icon class="inline-icon">{{ sunatData()!.esActivo ? 'check_circle' : 'cancel' }}</mat-icon> 
                                  {{ getSunatEstadoDesc(sunatData()!.ddp_estado) || sunatData()!.desc_estado }}
                                </span>
                              </div>
                              <div class="detail-item">
                                <span class="d-label">Condición de Domicilio</span>
                                <span class="d-value fw-700" [ngClass]="sunatData()!.esHabido ? 'color-primary' : 'color-warn'">
                                  <mat-icon class="inline-icon">{{ sunatData()!.esHabido ? 'location_on' : 'location_off' }}</mat-icon> 
                                  {{ sunatData()!.esHabido ? 'HABIDO' : 'NO HABIDO' }}
                                </span>
                              </div>
                              <div class="detail-item full-width">
                                <span class="d-label">Razón Social en Padrón SUNAT</span>
                                <span class="d-value fw-600">{{ sunatData()!.ddp_nombre }}</span>
                              </div>
                            </div>
                          </div>
                        } @else if (emp.razonSocial.sunat) {
                           <div class="sunat-results">
                             <div class="detail-grid">
                               <div class="detail-item full-width">
                                 <span class="d-label">Razón Social en SUNAT (Guardada)</span>
                                 <span class="d-value">{{ emp.razonSocial.sunat }}</span>
                                 <span class="text-muted text-xs">Haz clic en 'Consultar SUNAT' para actualizar en tiempo real el estado tributario.</span>
                                </div>
                             </div>
                           </div>
                        } @else {
                          <div class="text-muted text-center py-2">
                            No se ha realizado consulta SUNAT en esta sesión. Haz clic en "Consultar SUNAT" para verificar.
                          </div>
                        }
                      </div>
                    </div>

                  </div>
                </div>
              </mat-tab>

              <!-- TAB 2: EXPEDIENTE OPERATIVO Y ESTADÍSTICAS (NUEVO) -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="tab-icon">analytics</mat-icon>
                  <span>Expediente Operativo y Estadísticas</span>
                </ng-template>

                <div class="tab-content">
                  <!-- BANNER DE KPIS ESTADÍSTICOS -->
                  <div class="kpi-banner-grid">
                    <div class="kpi-stat-card card-blue">
                      <div class="kpi-icon-box">
                        <mat-icon>gavel</mat-icon>
                      </div>
                      <div class="kpi-stat-info">
                        <span class="kpi-count">{{ expediente()?.kpis?.total_primigenias || 0 }}</span>
                        <span class="kpi-label">Resoluciones Primigenias</span>
                      </div>
                    </div>

                    <div class="kpi-stat-card card-indigo">
                      <div class="kpi-icon-box">
                        <mat-icon>alt_route</mat-icon>
                      </div>
                      <div class="kpi-stat-info">
                        <span class="kpi-count">{{ expediente()?.kpis?.total_rutas || 0 }}</span>
                        <span class="kpi-label">Rutas Autorizadas</span>
                      </div>
                    </div>

                    <div class="kpi-stat-card card-emerald">
                      <div class="kpi-icon-box">
                        <mat-icon>directions_bus</mat-icon>
                      </div>
                      <div class="kpi-stat-info">
                        <span class="kpi-count">{{ expediente()?.kpis?.total_vehiculos_habilitados || 0 }}</span>
                        <span class="kpi-label">Flota Habilitada</span>
                      </div>
                    </div>

                    <div class="kpi-stat-card card-amber">
                      <div class="kpi-icon-box">
                        <mat-icon>description</mat-icon>
                      </div>
                      <div class="kpi-stat-info">
                        <span class="kpi-count">{{ expediente()?.kpis?.total_modificatorias || 0 }}</span>
                        <span class="kpi-label">Modificatorias (Hijas)</span>
                      </div>
                    </div>
                  </div>

                  <!-- SECCIÓN DE RESOLUCIONES PRIMIGENIAS -->
                  <div class="primigenias-section mt-4">
                    <div class="section-title-row">
                      <div class="title-with-badge">
                        <h3 class="section-heading">
                          <mat-icon color="primary">account_balance</mat-icon> Resoluciones Originarias y Operaciones
                        </h3>
                        <span class="section-counter-badge">{{ expediente()?.primigenias?.length || 0 }} resoluciones</span>
                      </div>
                      <span class="section-subtitle">
                        Desglose de resoluciones primigenias, rutas concedidas, vehículos habilitados y modificaciones posteriores.
                      </span>
                    </div>

                    @if (isLoadingExpediente()) {
                      <div class="loading-wrapper py-4">
                        <mat-spinner diameter="32"></mat-spinner>
                        <span>Cargando resoluciones y expediente operativo...</span>
                      </div>
                    } @else if (!expediente()?.primigenias?.length) {
                      <div class="empty-state py-4">
                        <mat-icon>folder_open</mat-icon>
                        <h4>Sin Resoluciones Registradas</h4>
                        <p>No se encontraron resoluciones primigenias ni rutas vinculadas a esta empresa.</p>
                      </div>
                    } @else {
                      <div class="primigenias-list">
                        @for (prim of expediente()!.primigenias; track prim.nro_resolucion) {
                          <div class="primigenia-card mat-elevation-z1">
                            <!-- HEADER PRIMIGENIA -->
                            <div class="primigenia-header">
                              <div class="ph-left">
                                <div class="ph-badge-box">
                                  <span class="res-tag">RESOLUCIÓN PRIMIGENIA</span>
                                  <h4 class="res-num">{{ prim.nro_resolucion }}</h4>
                                  @if (prim.siglas) {
                                    <span class="res-siglas">{{ prim.siglas }}</span>
                                  }
                                </div>
                                <div class="ph-meta-chips">
                                  <span [class]="'state-pill state-' + (prim.estado ? prim.estado.toLowerCase() : 'vigente')">
                                    {{ prim.estado }}
                                  </span>
                                  <span class="auth-type-pill">
                                    <mat-icon>commute</mat-icon> {{ prim.tipo_autorizacion }}
                                  </span>
                                  @if (prim.es_detectada) {
                                    <span class="detected-pill" matTooltip="Resolución identificada a partir de las rutas autorizadas">
                                      <mat-icon>auto_awesome</mat-icon> Desde Rutas
                                    </span>
                                  }
                                </div>
                              </div>

                              <div class="ph-right">
                                @if (prim.fecha_inicio_vigencia || prim.fecha_fin_vigencia) {
                                  <div class="validity-box">
                                    <span class="vb-title">VIGENCIA ({{ prim.anios_vigencia || 10 }} AÑOS)</span>
                                    <span class="vb-dates">
                                      {{ (prim.fecha_inicio_vigencia | date:'dd/MM/yyyy') || '—' }} al {{ (prim.fecha_fin_vigencia | date:'dd/MM/yyyy') || '—' }}
                                    </span>
                                  </div>
                                }
                                @if (prim.link_documento) {
                                  <a [href]="prim.link_documento" target="_blank" mat-stroked-button color="primary" class="doc-link-btn">
                                    <mat-icon>picture_as_pdf</mat-icon> Ver Documento
                                  </a>
                                }
                              </div>
                            </div>

                            <!-- RESUMEN EN CIFRAS DE LA PRIMIGENIA -->
                            <div class="prim-metrics-bar">
                              <div class="pm-item">
                                <mat-icon class="text-indigo">alt_route</mat-icon>
                                <span><strong>{{ prim.rutas.length }}</strong> Rutas autorizadas</span>
                              </div>
                              <div class="pm-item">
                                <mat-icon class="text-emerald">directions_bus</mat-icon>
                                <span><strong>{{ getVehiculosHabilitadosCount(prim) }}</strong> Vehículos habilitados</span>
                                @if (getVehiculosInhabilitadosCount(prim) > 0) {
                                  <span class="inhab-metric-tag" [matTooltip]="getVehiculosInhabilitadosCount(prim) + ' vehículos inhabilitados o dados de baja'">
                                    ({{ getVehiculosInhabilitadosCount(prim) }} inhabilitados)
                                  </span>
                                }
                              </div>
                              <div class="pm-item">
                                <mat-icon class="text-amber">history_edu</mat-icon>
                                <span><strong>{{ prim.modificatorias.length }}</strong> Modificatorias (Hijas)</span>
                              </div>
                            </div>

                            <!-- SUB-SECCIONES: RUTAS, FLOTA, MODIFICATORIAS -->
                            <div class="primigenia-sections">
                              
                              <!-- 1. RUTAS DE ESTA RESOLUCIÓN -->
                              <div class="sub-block">
                                <div class="sub-block-title">
                                  <mat-icon color="primary">alt_route</mat-icon>
                                  <span>Rutas Autorizadas en esta Resolución ({{ prim.rutas.length }})</span>
                                </div>
                                @if (prim.rutas.length === 0) {
                                  <p class="empty-sub-text">No hay rutas registradas bajo este número de resolución.</p>
                                } @else {
                                  <div class="rutas-grid">
                                    @for (r of prim.rutas; track r.id) {
                                      <div class="ruta-mini-card">
                                        <div class="rmc-header">
                                          <span class="ruta-code-badge">RUTA {{ r.codigoRuta || 'N/A' }}</span>
                                          <span class="ruta-status-badge">{{ r.estado || 'ACTIVA' }}</span>
                                        </div>
                                        <div class="rmc-path">
                                          <span class="orig">{{ r.origen || 'Origen' }}</span>
                                          <mat-icon class="arrow">arrow_forward</mat-icon>
                                          <span class="dest">{{ r.destino || 'Destino' }}</span>
                                        </div>
                                        @if (r.itinerario && r.itinerario.length > 0) {
                                          <div class="rmc-itin">
                                            <span class="itin-label">Escalas:</span>
                                            <span class="itin-points">{{ r.itinerario.join(' • ') }}</span>
                                          </div>
                                        }
                                      </div>
                                    }
                                  </div>
                                }
                              </div>

                              <!-- 2. FLOTA VEHICULAR DE ESTA RESOLUCIÓN -->
                              <div class="sub-block">
                                <div class="sub-block-title">
                                  <mat-icon style="color:#059669;">directions_bus</mat-icon>
                                  <span>Flota Vehicular Habilitada ({{ getVehiculosHabilitadosCount(prim) }})</span>
                                  @if (getVehiculosInhabilitadosCount(prim) > 0) {
                                    <span class="inhab-counter-pill">
                                      <mat-icon class="pill-icon">do_not_disturb_on</mat-icon>
                                      {{ getVehiculosInhabilitadosCount(prim) }} Inhabilitados
                                    </span>
                                  }
                                </div>
                                @if (prim.flota.length === 0) {
                                  <p class="empty-sub-text">No hay vehículos con padrón asignado a esta resolución.</p>
                                } @else {
                                  @if (getVehiculosHabilitadosCount(prim) === 0) {
                                    <p class="empty-sub-text">No cuenta con vehículos activos/habilitados vigentes en esta resolución.</p>
                                  } @else {
                                    <div class="flota-chips-grid">
                                      @for (veh of getVehiculosHabilitados(prim); track veh.placa) {
                                        <div class="vehiculo-mini-item veh-habilitado">
                                          <span class="veh-placa">{{ veh.placa }}</span>
                                          <span class="veh-meta">{{ veh.marca || '' }} {{ veh.modelo || '' }} {{ veh.anio_fabricacion ? '(' + veh.anio_fabricacion + ')' : '' }}</span>
                                          @if (veh.nro_tuc) {
                                            <span class="veh-tuc" matTooltip="N° TUC">TUC: {{ veh.nro_tuc }}</span>
                                          }
                                        </div>
                                      }
                                    </div>
                                  }

                                  <!-- HISTORIAL DE UNIDADES INHABILITADAS / BAJAS -->
                                  @if (getVehiculosInhabilitadosCount(prim) > 0) {
                                    <div class="inhabilitados-section mt-3">
                                      <div class="inhab-section-header">
                                        <mat-icon class="inhab-warn-icon">history_toggle_off</mat-icon>
                                        <span class="inhab-section-title">Historial de Unidades Inhabilitadas / Sustituidas ({{ getVehiculosInhabilitadosCount(prim) }})</span>
                                      </div>
                                      <div class="flota-chips-grid">
                                        @for (veh of getVehiculosInhabilitados(prim); track veh.placa) {
                                          <div class="vehiculo-mini-item veh-inhabilitado">
                                            <span class="veh-placa-inhab">{{ veh.placa }}</span>
                                            <span class="veh-meta">{{ veh.marca || '' }} {{ veh.modelo || '' }} {{ veh.anio_fabricacion ? '(' + veh.anio_fabricacion + ')' : '' }}</span>
                                            <span class="veh-inhab-badge">{{ veh.estado || 'INHABILITADO' }}</span>
                                          </div>
                                        }
                                      </div>
                                    </div>
                                  }
                                }
                              </div>

                              <!-- 3. MODIFICATORIAS (RESOLUCIONES HIJAS) -->
                              <div class="sub-block">
                                <div class="sub-block-title">
                                  <mat-icon style="color:#d97706;">description</mat-icon>
                                  <span>Modificatorias y Actos Posteriores ({{ prim.modificatorias.length }})</span>
                                </div>
                                @if (prim.modificatorias.length === 0) {
                                  <p class="empty-sub-text">Sin actos modificatorios registrados (cambio de representante, sustitución, etc.).</p>
                                } @else {
                                  <div class="modificatorias-timeline">
                                    @for (mod of prim.modificatorias; track mod.nro_resolucion) {
                                      <div class="mod-timeline-item">
                                        <div class="mod-item-left">
                                          <span class="mod-chip">{{ getTipoActoLabel(mod.tipo_acto) }}</span>
                                          <strong class="mod-res-num">{{ mod.nro_resolucion }}</strong>
                                          <span class="mod-date">{{ mod.fecha_resolucion | date:'dd/MM/yyyy' }}</span>
                                        </div>
                                        <div class="mod-item-desc">
                                          <p class="mod-obs">{{ mod.observaciones || mod.tipo_tramite_origen || 'Acto administrativo registrado' }}</p>
                                          @if (mod.vehiculos_ingresantes && mod.vehiculos_ingresantes.length > 0) {
                                            <div class="mod-badges">
                                              <span class="lbl-inc">Alta Vehículos:</span>
                                              @for (p of mod.vehiculos_ingresantes; track p) {
                                                <span class="plate-inc">+{{ p }}</span>
                                              }
                                            </div>
                                          }
                                          @if (mod.vehiculos_salientes && mod.vehiculos_salientes.length > 0) {
                                            <div class="mod-badges">
                                              <span class="lbl-baj">Baja Vehículos:</span>
                                              @for (p of mod.vehiculos_salientes; track p) {
                                                <span class="plate-baj">-{{ p }}</span>
                                              }
                                            </div>
                                          }
                                        </div>
                                      </div>
                                    }
                                  </div>
                                }
                              </div>

                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </mat-tab>

              <!-- TAB 3: SOCIOS Y REPRESENTANTES -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="tab-icon">groups</mat-icon>
                  <span>Representantes y Socios</span>
                </ng-template>

                <div class="tab-content">
                  @if (emp.socios && emp.socios.length > 0) {
                    <div class="socios-grid">
                      @for (socio of emp.socios; track socio.dni) {
                        <div class="socio-card mat-elevation-z1" [class.border-primary]="socio.tipoSocio === 'REPRESENTANTE_LEGAL'">
                          <div class="sc-header">
                            <div class="sc-avatar">
                              {{ socio.nombres.charAt(0) }}{{ socio.apellidos.charAt(0) }}
                            </div>
                            <div class="sc-title">
                              <h4>{{ socio.nombres }} {{ socio.apellidos }}</h4>
                              <span class="sc-role">{{ getLabelCargo(socio.tipoSocio) }}</span>
                            </div>
                          </div>
                          <mat-divider></mat-divider>
                          <div class="sc-body">
                            <div class="s-detail">
                              <mat-icon>badge</mat-icon>
                              <span><strong>DNI:</strong> {{ socio.dni }}</span>
                            </div>
                            @if (socio.email) {
                              <div class="s-detail">
                                <mat-icon>email</mat-icon>
                                <span>{{ socio.email }}</span>
                              </div>
                            }
                            @if (socio.telefono) {
                              <div class="s-detail">
                                <mat-icon>phone</mat-icon>
                                <span>{{ socio.telefono }}</span>
                              </div>
                            }
                            @if (socio.direccion) {
                              <div class="s-detail">
                                <mat-icon>location_on</mat-icon>
                                <span class="truncate" [matTooltip]="socio.direccion">{{ socio.direccion }}</span>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="empty-state">
                      <mat-icon>groups</mat-icon>
                      <p>No hay socios o representantes registrados para esta empresa.</p>
                    </div>
                  }
                </div>
              </mat-tab>

            </mat-tab-group>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;

      .action-btn {
        border-radius: 8px;
        font-weight: 600;
        mat-icon { margin-right: 6px; }
      }
    }

    .loading-wrapper, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
      color: #64748b;
      background: #ffffff;
      border-radius: 12px;
      border: 1px dashed #cbd5e1;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; }

    .error-card {
      text-align: center;
      padding: 40px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 12px;
    }
    .error-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }

    /* HEADER COMPACTO */
    .company-header-compact {
      background: #ffffff;
      border-radius: 12px;
      padding: 22px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      border-left: 6px solid #4f46e5;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .ch-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .ch-avatar {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      color: #4f46e5;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
      mat-icon { font-size: 34px; width: 34px; height: 34px; }
    }
    .ch-titles {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ch-overline {
      font-size: 0.85rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ruc-pill-tag {
      background-color: #f1f5f9;
      color: #334155;
      padding: 2px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .system-status {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #64748b;
      &.active { background: #dcfce7; color: #166534; font-weight: 600; }
    }
    .ch-title {
      margin: 0;
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }

    /* BADGES ROW CON ESTADO Y SERVICIOS */
    .ch-badges-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;

      .chip-icon { font-size: 14px; width: 14px; height: 14px; }
      &.chip-autorizada { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
      &.chip-en_tramite { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
      &.chip-suspendida { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
      &.chip-cancelada { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    }

    .service-header-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.78rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.3px;

      .chip-icon { font-size: 14px; width: 14px; height: 14px; color: #4f46e5; }
      &.chip-muted { background: #f8fafc; color: #94a3b8; border-style: dashed; }
    }

    .ch-right {
      text-align: right;
    }
    .ch-dates {
      font-size: 0.85rem;
      color: #64748b;
      display: flex;
      flex-direction: column;
      gap: 4px;
      .lbl { font-weight: 600; color: #475569; }
    }

    /* MAIN CONTENT */
    .main-content-card {
      border-radius: 12px !important;
      overflow: hidden;
      background: #ffffff;
    }
    .tab-content {
      padding: 24px;
    }

    .custom-tab-group {
      .tab-icon { margin-right: 8px; }
    }

    .grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 860px) {
      .grid-layout { grid-template-columns: 1fr; }
    }
    .full-width { grid-column: 1 / -1; }

    .info-block {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px;
      &.bg-light { background: #f8fafc; }
    }
    .block-title {
      margin: 0 0 14px 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 10px;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-top: 16px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
      .d-label { font-size: 0.78rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
      .d-value { font-size: 0.95rem; color: #1e293b; display: flex; align-items: center; gap: 8px; }
      &.full-width { grid-column: 1 / -1; }
      
      &.highlight-item {
        background: #f8fafc;
        padding: 12px 14px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
    }

    /* DIRECCIÓN FISCAL ITEM */
    .address-item {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 12px 14px;
      border-radius: 8px;
      
      .address-content {
        display: flex;
        align-items: center;
        gap: 8px;
        .loc-icon { color: #16a34a; font-size: 22px; width: 22px; height: 22px; }
        .address-text { color: #14532d; font-size: 1rem; line-height: 1.35; }
        .copy-btn { width: 28px; height: 28px; line-height: 28px; mat-icon { font-size: 16px; } }
      }
    }

    .contact-link {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
      &:hover { text-decoration: underline; }
      &.external-link { display: inline-flex; align-items: center; gap: 4px; }
      .ext-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* BANNER KPIS ESTADÍSTICOS */
    .kpi-banner-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .kpi-stat-card {
      padding: 18px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
      }

      .kpi-icon-box {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        mat-icon { font-size: 26px; width: 26px; height: 26px; }
      }

      .kpi-stat-info {
        display: flex;
        flex-direction: column;
        .kpi-count { font-size: 1.7rem; font-weight: 800; line-height: 1.1; }
        .kpi-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px; }
      }

      &.card-blue {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        .kpi-icon-box { background: #dbeafe; color: #1d4ed8; }
        .kpi-count { color: #1e40af; }
        .kpi-label { color: #3b82f6; }
      }
      &.card-indigo {
        background: #eef2ff;
        border: 1px solid #c7d2fe;
        .kpi-icon-box { background: #e0e7ff; color: #4338ca; }
        .kpi-count { color: #3730a3; }
        .kpi-label { color: #6366f1; }
      }
      &.card-emerald {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        .kpi-icon-box { background: #d1fae5; color: #047857; }
        .kpi-count { color: #065f46; }
        .kpi-label { color: #10b981; }
      }
      &.card-amber {
        background: #fffbeb;
        border: 1px solid #fde68a;
        .kpi-icon-box { background: #fef3c7; color: #b45309; }
        .kpi-count { color: #92400e; }
        .kpi-label { color: #f59e0b; }
      }
    }

    /* SECCIÓN PRIMIGENIAS */
    .primigenias-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .section-title-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;

      .title-with-badge {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .section-heading {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-counter-badge {
        background: #e0e7ff;
        color: #3730a3;
        font-size: 0.78rem;
        font-weight: 700;
        padding: 2px 10px;
        border-radius: 12px;
      }
      .section-subtitle {
        font-size: 0.85rem;
        color: #64748b;
      }
    }

    .primigenias-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .primigenia-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      border-top: 4px solid #4f46e5;
    }

    .primigenia-header {
      padding: 18px 24px;
      background: #fafafa;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;

      .ph-left {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .ph-badge-box {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;

          .res-tag {
            font-size: 0.7rem;
            font-weight: 800;
            background: #4f46e5;
            color: #ffffff;
            padding: 2px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
          }
          .res-num {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 800;
            color: #1e293b;
            font-family: monospace;
          }
          .res-siglas {
            font-size: 0.8rem;
            color: #64748b;
            font-weight: 600;
          }
        }

        .ph-meta-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;

          .state-pill {
            font-size: 0.75rem;
            font-weight: 700;
            padding: 2px 10px;
            border-radius: 12px;
            text-transform: uppercase;
            &.state-vigente { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            &.state-vencida { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
            &.state-cancelada { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
            &.state-suspendida { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
            &.state-inactiva, &.state-renovada { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
          }
          .auth-type-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            background: #f1f5f9;
            color: #475569;
            padding: 2px 10px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            mat-icon { font-size: 14px; width: 14px; height: 14px; }
          }
          .detected-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.72rem;
            font-weight: 600;
            background: #fdf4ff;
            color: #a21caf;
            padding: 2px 8px;
            border-radius: 10px;
            border: 1px solid #f0abfc;
            mat-icon { font-size: 13px; width: 13px; height: 13px; }
          }
        }
      }

      .ph-right {
        display: flex;
        align-items: center;
        gap: 16px;

        .validity-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          .vb-title { font-size: 0.7rem; font-weight: 700; color: #64748b; letter-spacing: 0.4px; }
          .vb-dates { font-size: 0.88rem; font-weight: 600; color: #1e293b; }
        }
        .doc-link-btn {
          border-radius: 8px;
          font-weight: 600;
          mat-icon { margin-right: 4px; }
        }
      }
    }

    .prim-metrics-bar {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 10px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;

      .pm-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: #475569;
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
      }
    }

    .primigenia-sections {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;

      .sub-block {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .sub-block-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
          mat-icon { font-size: 20px; width: 20px; height: 20px; }
        }
        .empty-sub-text {
          margin: 0;
          font-size: 0.85rem;
          color: #94a3b8;
          font-style: italic;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 6px;
        }
      }
    }

    /* RUTAS GRID */
    .rutas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    .ruta-mini-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all 0.15s ease;

      &:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }

      .rmc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .ruta-code-badge {
          font-size: 0.72rem;
          font-weight: 800;
          background: #e0e7ff;
          color: #3730a3;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }
        .ruta-status-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: #16a34a;
        }
      }

      .rmc-path {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f172a;
        .orig { color: #1e293b; }
        .dest { color: #4338ca; }
        .arrow { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
      }

      .rmc-itin {
        font-size: 0.78rem;
        color: #64748b;
        line-height: 1.3;
        .itin-label { font-weight: 600; margin-right: 4px; }
      }
    }

    /* FLOTA CHIPS GRID & INHABILITADOS */
    .inhab-metric-tag {
      font-size: 0.76rem;
      color: #b45309;
      background: #fef3c7;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 600;
      margin-left: 6px;
    }

    .inhab-counter-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: 8px;

      .pill-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .flota-chips-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .vehiculo-mini-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      transition: all 0.2s ease;

      &.veh-habilitado {
        border-color: #cbd5e1;
        &:hover {
          border-color: #93c5fd;
          background: #f0fdf4;
        }
      }

      &.veh-inhabilitado {
        background: #fafafa;
        border: 1px dashed #d1d5db;
        opacity: 0.85;

        .veh-placa-inhab {
          font-family: monospace;
          font-weight: 700;
          font-size: 0.84rem;
          background: #f3f4f6;
          color: #6b7280;
          padding: 2px 6px;
          border-radius: 4px;
          text-decoration: line-through;
        }

        .veh-inhab-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: #b91c1c;
          background: #fee2e2;
          padding: 1px 5px;
          border-radius: 4px;
          text-transform: uppercase;
        }
      }

      .veh-placa {
        font-family: monospace;
        font-weight: 800;
        font-size: 0.88rem;
        background: #eef2ff;
        color: #3730a3;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .veh-meta {
        font-size: 0.78rem;
        color: #475569;
        font-weight: 500;
      }
      .veh-tuc {
        font-size: 0.7rem;
        color: #047857;
        background: #d1fae5;
        padding: 1px 5px;
        border-radius: 4px;
        font-weight: 600;
      }
    }

    .inhabilitados-section {
      background: #fdfaf5;
      border: 1px dashed #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;

      .inhab-section-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        font-size: 0.82rem;
        font-weight: 700;
        color: #92400e;

        .inhab-warn-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: #d97706;
        }
      }
    }

    /* MODIFICATORIAS TIMELINE */
    .modificatorias-timeline {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .mod-timeline-item {
      display: flex;
      gap: 16px;
      padding: 12px 16px;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      align-items: flex-start;

      .mod-item-left {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 140px;

        .mod-chip {
          font-size: 0.7rem;
          font-weight: 800;
          color: #b45309;
          text-transform: uppercase;
        }
        .mod-res-num {
          font-family: monospace;
          font-size: 0.95rem;
          color: #1e293b;
        }
        .mod-date {
          font-size: 0.75rem;
          color: #64748b;
        }
      }

      .mod-item-desc {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;

        .mod-obs {
          margin: 0;
          font-size: 0.88rem;
          color: #334155;
          line-height: 1.35;
        }
        .mod-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 0.75rem;

          .lbl-inc { font-weight: 700; color: #15803d; }
          .plate-inc {
            background: #dcfce7;
            color: #166534;
            font-family: monospace;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 4px;
          }
          .lbl-baj { font-weight: 700; color: #b91c1c; }
          .plate-baj {
            background: #fee2e2;
            color: #991b1b;
            font-family: monospace;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 4px;
          }
        }
      }
    }

    /* SOCIOS */
    .socios-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .socio-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      &.border-primary { border-left: 4px solid #4f46e5; }
    }
    .sc-header {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sc-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: #e2e8f0; color: #475569;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.1rem;
    }
    .sc-title {
      display: flex; flex-direction: column;
      h4 { margin: 0; font-size: 1rem; color: #1e293b; font-weight: 600; }
      .sc-role { font-size: 0.75rem; color: #64748b; font-weight: 600; }
    }
    .sc-body {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .s-detail {
      display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #475569;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
      .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
    }

    /* UTILS */
    .mt-2 { margin-top: 16px; }
    .mt-4 { margin-top: 24px; }
    .py-2 { padding-top: 16px; padding-bottom: 16px; }
    .py-4 { padding-top: 32px; padding-bottom: 32px; }
    .inline-icon { font-size: 18px; width: 18px; height: 18px; }
    .fw-600 { font-weight: 600; }
    .fw-700 { font-weight: 700; }
    .color-primary { color: #4f46e5; }
    .color-warn { color: #ef4444; }
    .color-success { color: #10b981; }
    .text-indigo { color: #4f46e5; }
    .text-emerald { color: #059669; }
    .text-amber { color: #d97706; }
    .text-muted { color: #94a3b8; }
    .text-xs { font-size: 0.75rem; }
    .text-center { text-align: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .sunat-header { display: flex; justify-content: space-between; align-items: center; }
    .fs-large { font-size: 1.05rem; }

    /* =================================================================
       STITCH MODO OSCURO - DETALLE DE EMPRESA
       ================================================================= */
    :host-context([data-theme="dark"]), :host-context(.dark-theme) {
      .page-container {
        color: #f8fafc;
      }

      .page-header-actions button[mat-stroked-button] {
        background-color: #1e293b;
        border-color: #334155;
        color: #e2e8f0;
        &:hover { background-color: #334155; }
      }

      .company-header-compact {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-left: 6px solid #3b82f6;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

        .ch-avatar {
          background: #1e293b;
          color: #60a5fa;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
        }

        .ch-title { color: #f8fafc; }
        .ch-overline { color: #94a3b8; }
        .ruc-pill-tag {
          background-color: #1e293b;
          color: #93c5fd;
          border: 1px solid #334155;
        }

        .service-header-chip {
          background: #1e293b;
          color: #cbd5e1;
          border-color: #334155;
          .chip-icon { color: #60a5fa; }
          &.chip-muted { background: #111827; color: #64748b; }
        }

        .ch-dates {
          color: #94a3b8;
          .lbl { color: #cbd5e1; }
        }
      }

      .main-content-card {
        background: #0f172a !important;
        border: 1px solid #1e293b !important;
        color: #f8fafc;
      }

      .info-block {
        background: #0f172a;
        border-color: #1e293b;

        &.bg-light {
          background: #111827;
          border-color: #1e293b;
        }

        .block-title {
          color: #f8fafc;
          mat-icon { color: #60a5fa; }
        }
      }

      .detail-item {
        .d-label { color: #94a3b8; }
        .d-value { color: #f8fafc; }

        &.highlight-item {
          background: #111827;
          border-color: #1e293b;
        }
      }

      .address-item {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(5, 150, 105, 0.4);

        .address-content {
          .loc-icon { color: #34d399; }
          .address-text { color: #6ee7b7; }
        }
      }

      .contact-link {
        color: #60a5fa;
      }

      .kpi-stat-card {
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);

        &.card-blue {
          background: rgba(30, 58, 138, 0.25);
          border-color: rgba(59, 130, 246, 0.35);
          .kpi-icon-box { background: #1e293b; color: #60a5fa; }
          .kpi-count { color: #93c5fd; }
          .kpi-label { color: #60a5fa; }
        }
        &.card-indigo {
          background: rgba(49, 46, 129, 0.25);
          border-color: rgba(99, 102, 241, 0.35);
          .kpi-icon-box { background: #1e293b; color: #818cf8; }
          .kpi-count { color: #c7d2fe; }
          .kpi-label { color: #818cf8; }
        }
        &.card-emerald {
          background: rgba(6, 78, 59, 0.25);
          border-color: rgba(16, 185, 129, 0.35);
          .kpi-icon-box { background: #064e3b; color: #34d399; }
          .kpi-count { color: #a7f3d0; }
          .kpi-label { color: #34d399; }
        }
        &.card-amber {
          background: rgba(120, 53, 15, 0.25);
          border-color: rgba(245, 158, 11, 0.35);
          .kpi-icon-box { background: #451a03; color: #fbbf24; }
          .kpi-count { color: #fde68a; }
          .kpi-label { color: #fbbf24; }
        }
      }

      .section-title-row {
        .section-heading { color: #f8fafc; }
        .section-counter-badge {
          background: rgba(37, 99, 235, 0.25);
          color: #93c5fd;
        }
        .section-subtitle { color: #94a3b8; }
      }

      .primigenia-card {
        background: #0f172a;
        border-color: #1e293b;
        border-top: 4px solid #3b82f6;

        .primigenia-header {
          background: #111827;
          border-bottom-color: #1e293b;

          .res-num { color: #f8fafc; }
          .res-siglas { color: #94a3b8; }

          .auth-type-pill {
            background: #1e293b;
            color: #cbd5e1;
            border-color: #334155;
          }
        }
      }

      .inhab-metric-tag {
        background: rgba(245, 158, 11, 0.15);
        color: #fcd34d;
      }
      .inhab-counter-pill {
        background: rgba(245, 158, 11, 0.15);
        border-color: rgba(245, 158, 11, 0.3);
        color: #fcd34d;
      }
      .inhabilitados-section {
        background: rgba(15, 23, 42, 0.6);
        border-color: #334155;
        .inhab-section-header { color: #fcd34d; }
      }

      .vehiculo-mini-item {
        &.veh-habilitado {
          background: #111827;
          border-color: #1e293b;
          &:hover {
            border-color: #38bdf8;
            background: #1e293b;
          }
          .veh-placa {
            background: #1e293b;
            color: #93c5fd;
          }
          .veh-meta { color: #cbd5e1; }
          .veh-tuc {
            background: rgba(16, 185, 129, 0.2);
            color: #34d399;
          }
        }
        &.veh-inhabilitado {
          background: #0b0f19;
          border-color: #334155;
          .veh-placa-inhab {
            background: #1e293b;
            color: #94a3b8;
          }
          .veh-meta { color: #64748b; }
          .veh-inhab-badge {
            background: rgba(239, 68, 68, 0.2);
            color: #f87171;
          }
        }
      }

      .mod-timeline-item {
        background: #181307;
        border-color: #78350f;
        border-left: 4px solid #f59e0b;

        .mod-item-left {
          .mod-res-num { color: #f8fafc; }
          .mod-date { color: #94a3b8; }
        }

        .mod-item-desc .mod-obs {
          color: #cbd5e1;
        }
      }

      .socio-card {
        background: #0f172a;
        border-color: #1e293b;

        &.border-primary { border-left-color: #3b82f6; }

        .sc-avatar {
          background: #1e293b;
          color: #93c5fd;
        }

        .sc-title {
          h4 { color: #f8fafc; }
          .sc-role { color: #94a3b8; }
        }

        .s-detail {
          color: #cbd5e1;
          mat-icon { color: #64748b; }
        }
      }

      .empty-state, .loading-wrapper {
        background: #0f172a;
        border-color: #334155;
        color: #94a3b8;
      }
    }
  `]
})
export class EmpresaDetailComponent implements OnInit {
  isLoading = signal(true);
  empresa = signal<Empresa | null>(null);
  
  isConsultandoSunat = signal(false);
  sunatData = signal<SunatData | null>(null);

  // Expediente Operativo
  isLoadingExpediente = signal(false);
  expediente = signal<ExpedienteOperativoEmpresa | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const empresaId = this.route.snapshot.params['id'];
    if (empresaId) {
      this.cargarEmpresa(empresaId);
      this.cargarExpedienteOperativo(empresaId);
    }
  }

  cargarEmpresa(empresaId: string): void {
    this.empresaService.getEmpresa(empresaId).subscribe({
      next: (empresa) => {
        this.empresa.set(empresa);
        if (empresa.datosSunat) {
          this.sunatData.set(empresa.datosSunat);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.snackBar.open('Error al cargar la empresa', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  cargarExpedienteOperativo(empresaId: string): void {
    this.isLoadingExpediente.set(true);
    this.empresaService.getExpedienteOperativo(empresaId).subscribe({
      next: (data) => {
        this.expediente.set(data);
        this.isLoadingExpediente.set(false);
      },
      error: (error) => {
        console.warn('No se pudo cargar el expediente operativo:', error);
        this.isLoadingExpediente.set(false);
      }
    });
  }

  consultarSunat(ruc: string): void {
    const emp = this.empresa();
    if (!emp || this.isConsultandoSunat()) return;
    
    this.isConsultandoSunat.set(true);
    this.empresaService.actualizarSunat(emp.id).pipe(
      finalize(() => this.isConsultandoSunat.set(false))
    ).subscribe({
      next: (empresaActualizada) => {
        if (empresaActualizada && empresaActualizada.datosSunat) {
          this.sunatData.set(empresaActualizada.datosSunat);
          this.empresa.set(empresaActualizada);
          this.snackBar.open(`Validación SUNAT actualizada y guardada en BD.`, 'OK', { duration: 4000 });
        } else {
          this.snackBar.open(`No se obtuvo información de SUNAT.`, 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        console.warn('Error endpoint actualizarSunat, intentando fallback:', err);
        this.empresaService.consultarSunat(ruc).pipe(
          finalize(() => this.isConsultandoSunat.set(false))
        ).subscribe({
          next: (resp) => {
            const data = resp?.data;
            if (data) {
              this.sunatData.set({
                ddp_nombre: data.ddp_nombre || '',
                ddp_estado: data.ddp_estado || '',
                desc_estado: data.desc_estado || '',
                esActivo: data.esActivo === true,
                esHabido: data.esHabido === true
              });
              this.snackBar.open(`Validación SUNAT completada.`, 'OK', { duration: 3000 });
            }
          },
          error: (proxyErr) => {
            console.error('Error en proxy SUNAT:', proxyErr);
            this.snackBar.open(`Error al conectar con SUNAT.`, 'Cerrar', { duration: 4000 });
          }
        });
      }
    });
  }

  copiarTexto(texto: string, label: string): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      this.snackBar.open(`✅ ${label} copiada al portapapeles`, 'OK', { duration: 2500 });
    }).catch(() => {
      this.snackBar.open('No se pudo copiar el texto', 'Cerrar', { duration: 2000 });
    });
  }

  getTipoActoLabel(tipo: string | undefined): string {
    if (!tipo) return 'Modificación';
    const labels: Record<string, string> = {
      'INCREMENTO_FLOTA': 'Incremento de Flota',
      'SUSTITUCION_VEHICULAR': 'Sustitución Vehicular',
      'BAJA_VEHICULAR': 'Baja Vehicular',
      'CAMBIO_REPRESENTANTE': 'Cambio de Representante Legal',
      'CANCELACION_PARCIAL': 'Cancelación Parcial de Ruta',
      'MODIFICACION_RUTA': 'Modificación de Ruta',
      'RENOVACION': 'Renovación de Autorización',
      'FE_DE_ERRATAS': 'Fe de Erratas',
      'SUSPENSION_TEMPORAL': 'Suspensión Temporal',
      'OTROS': 'Acto Modificatorio'
    };
    return labels[tipo] || tipo.replace(/_/g, ' ');
  }

  getSunatEstadoDesc(codigo: string | undefined): string {
    if (!codigo) return '';
    return ESTADOS_RUC[codigo] || '';
  }

  getLabelCargo(tipoSocio: string): string {
    const labels: Record<string, string> = {
      'REPRESENTANTE_LEGAL': 'Representante Legal',
      'GERENTE_GENERAL': 'Gerente General',
      'SOCIO': 'Socio Titular',
      'PRESIDENTE': 'Presidente',
      'DIRECTOR': 'Director',
      'APODERADO': 'Apoderado',
      'GERENTE': 'Gerente',
      'SECRETARIO': 'Secretario',
      'TESORERO': 'Tesorero'
    };
    return labels[tipoSocio] || tipoSocio;
  }

  getEstadoDisplayName(estado: string | undefined): string {
    if (!estado) return 'Autorizada';
    const estados: { [key: string]: string } = {
      'AUTORIZADA': 'Autorizada',
      'EN_TRAMITE': 'En Trámite',
      'SUSPENDIDA': 'Suspendida',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  getEstadoIcon(estado: string | undefined): string {
    switch(estado?.toUpperCase()) {
      case 'AUTORIZADA': return 'verified';
      case 'EN_TRAMITE': return 'pending_actions';
      case 'SUSPENDIDA': return 'block';
      case 'CANCELADA': return 'cancel';
      default: return 'verified';
    }
  }

  isVehiculoHabilitado(veh: VehiculoPrimigeniaItem): boolean {
    if (veh.es_habilitado !== undefined) return veh.es_habilitado;
    const est = (veh.estado || '').toUpperCase();
    return est === 'HABILITADO' || est === 'ACTIVO' || est === 'VIGENTE';
  }

  getVehiculosHabilitados(prim: PrimigeniaDetalleItem): VehiculoPrimigeniaItem[] {
    return (prim?.flota || []).filter(v => this.isVehiculoHabilitado(v));
  }

  getVehiculosInhabilitados(prim: PrimigeniaDetalleItem): VehiculoPrimigeniaItem[] {
    return (prim?.flota || []).filter(v => !this.isVehiculoHabilitado(v));
  }

  getVehiculosHabilitadosCount(prim: PrimigeniaDetalleItem): number {
    if (prim?.total_vehiculos_habilitados !== undefined) return prim.total_vehiculos_habilitados;
    return this.getVehiculosHabilitados(prim).length;
  }

  getVehiculosInhabilitadosCount(prim: PrimigeniaDetalleItem): number {
    if (prim?.total_vehiculos_inhabilitados !== undefined) return prim.total_vehiculos_inhabilitados;
    return this.getVehiculosInhabilitados(prim).length;
  }

  editar(): void {
    const emp = this.empresa();
    if (emp) {
      this.router.navigate(['/empresas', emp.id, 'editar']);
    }
  }

  volver(): void {
    this.router.navigate(['/empresas']);
  }
}
