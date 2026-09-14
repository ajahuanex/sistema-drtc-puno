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
import { Empresa, SunatData } from '../../models/empresa.model';

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
        <button mat-stroked-button (click)="volver()">
          <mat-icon>arrow_back</mat-icon> Volver
        </button>
        <button mat-raised-button color="primary" (click)="editar()" [disabled]="!empresa()">
          <mat-icon>edit</mat-icon> Editar Empresa
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-wrapper">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Cargando detalle de empresa...</span>
        </div>
      } @else if (!empresa()) {
        <mat-card class="error-card">
          <mat-icon class="error-icon color-warn">error_outline</mat-icon>
          <h3>No se encontró la empresa</h3>
          <p>La empresa solicitada no existe o fue eliminada.</p>
        </mat-card>
      } @else {
        @if (empresa(); as emp) {
          <!-- HEADER COMPACTO -->
          <div class="company-header-compact mat-elevation-z2">
            <div class="ch-left">
              <div class="ch-avatar">
                <mat-icon>business</mat-icon>
              </div>
              <div class="ch-titles">
                <div class="ch-overline">
                  RUC: <strong>{{ emp.ruc }}</strong>
                  <span class="ch-separator">•</span>
                  <span class="system-status" [class.active]="emp.estaActivo">
                    {{ emp.estaActivo ? 'Sistema: Activo' : 'Sistema: Inactivo' }}
                  </span>
                </div>
                <h1 class="ch-title">{{ emp.razonSocial.principal }}</h1>
                <div class="ch-badges">
                  <span [class]="'status-chip chip-' + (emp.estado.toLowerCase() || 'autorizada')">
                    <mat-icon>{{ getEstadoIcon(emp.estado) }}</mat-icon> {{ getEstadoDisplayName(emp.estado) }}
                  </span>
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
          <mat-card class="main-content-card">
            <mat-tab-group animationDuration="0ms">
              
              <!-- TAB 1: DATOS GENERALES -->
              <mat-tab label="Datos Generales">
                <div class="tab-content">
                  <div class="grid-layout">
                    
                    <!-- INFO EMPRESARIAL -->
                    <div class="info-block">
                      <h3 class="block-title"><mat-icon>badge</mat-icon> Identidad y Registro</h3>
                      <mat-divider></mat-divider>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="d-label">Razón Social Principal</span>
                          <span class="d-value fw-600">{{ emp.razonSocial.principal }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="d-label">Nombre Comercial / Corto</span>
                          <span class="d-value">{{ emp.razonSocial.minimo || '—' }}</span>
                        </div>
                        <div class="detail-item full-width">
                          <span class="d-label">Dirección Fiscal</span>
                          <span class="d-value">{{ emp.direccionFiscal || '—' }}</span>
                        </div>
                        <div class="detail-item full-width">
                          <span class="d-label">Observaciones</span>
                          <span class="d-value">{{ emp.observaciones || '—' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- CONTACTO -->
                    <div class="info-block">
                      <h3 class="block-title"><mat-icon>contact_mail</mat-icon> Contacto de Empresa</h3>
                      <mat-divider></mat-divider>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="d-label">Correo Electrónico</span>
                          <span class="d-value">
                            <mat-icon class="inline-icon" color="primary">email</mat-icon> 
                            {{ emp.emailContacto || '—' }}
                          </span>
                        </div>
                        <div class="detail-item">
                          <span class="d-label">Teléfono</span>
                          <span class="d-value">
                            <mat-icon class="inline-icon" color="primary">phone</mat-icon> 
                            {{ emp.telefonoContacto || '—' }}
                          </span>
                        </div>
                        <div class="detail-item full-width">
                          <span class="d-label">Sitio Web</span>
                          <span class="d-value">
                            <mat-icon class="inline-icon" color="primary">language</mat-icon> 
                            @if(emp.sitioWeb) { <a [href]="emp.sitioWeb" target="_blank">{{emp.sitioWeb}}</a> } @else { — }
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- SERVICIOS AUTORIZADOS -->
                    <div class="info-block full-width">
                      <h3 class="block-title"><mat-icon>local_shipping</mat-icon> Servicios Autorizados</h3>
                      <mat-divider></mat-divider>
                      <div class="services-chips mt-2">
                        @if (emp.tiposServicio && emp.tiposServicio.length > 0) {
                          <mat-chip-set>
                            @for (tipo of emp.tiposServicio; track tipo) {
                              <mat-chip color="accent" highlighted>{{ tipo }}</mat-chip>
                            }
                          </mat-chip-set>
                        } @else {
                          <span class="text-muted">No hay servicios autorizados.</span>
                        }
                      </div>
                    </div>

                    <!-- VALIDACIÓN SUNAT -->
                    <div class="info-block full-width bg-light">
                      <div class="sunat-header">
                        <h3 class="block-title"><mat-icon color="warn">fact_check</mat-icon> Validación SUNAT</h3>
                        <button mat-stroked-button color="primary" size="small" (click)="consultarSunat(emp.ruc)" [disabled]="isConsultandoSunat()">
                          <mat-icon>sync</mat-icon> Consultar SUNAT
                        </button>
                      </div>
                      <mat-divider></mat-divider>
                      <div class="sunat-body mt-2">
                        @if (isConsultandoSunat()) {
                          <div class="flex-center">
                            <mat-spinner diameter="24"></mat-spinner>
                            <span class="ml-2">Conectando...</span>
                          </div>
                        } @else if (sunatData()) {
                          <div class="sunat-results">
                            <div class="detail-grid">
                              <div class="detail-item">
                                <span class="d-label">Estado SUNAT</span>
                                <span class="d-value fw-600" [ngClass]="sunatData()!.esActivo ? 'color-success' : 'color-warn'">
                                  <mat-icon class="inline-icon">{{ sunatData()!.esActivo ? 'check_circle' : 'cancel' }}</mat-icon> 
                                  {{ getSunatEstadoDesc(sunatData()!.ddp_estado) || sunatData()!.desc_estado }}
                                </span>
                              </div>
                              <div class="detail-item">
                                <span class="d-label">Condición de Domicilio</span>
                                <span class="d-value fw-600" [ngClass]="sunatData()!.esHabido ? 'color-primary' : 'color-warn'">
                                  <mat-icon class="inline-icon">{{ sunatData()!.esHabido ? 'location_on' : 'location_off' }}</mat-icon> 
                                  {{ sunatData()!.esHabido ? 'HABIDO' : 'NO HABIDO' }}
                                </span>
                              </div>
                              <div class="detail-item full-width">
                                <span class="d-label">Razón Social en SUNAT</span>
                                <span class="d-value">{{ sunatData()!.ddp_nombre }}</span>
                              </div>
                            </div>
                          </div>
                        } @else if (emp.razonSocial.sunat) {
                           <div class="sunat-results">
                             <div class="detail-grid">
                               <div class="detail-item full-width">
                                 <span class="d-label">Razón Social Histórica (Guardada)</span>
                                 <span class="d-value">{{ emp.razonSocial.sunat }}</span>
                                 <span class="text-muted text-xs">Haz clic en 'Consultar SUNAT' para ver el estado actual.</span>
                               </div>
                             </div>
                           </div>
                        } @else {
                          <div class="text-muted text-center py-2">
                            No se ha realizado consulta SUNAT en esta sesión.
                          </div>
                        }
                      </div>
                    </div>

                  </div>
                </div>
              </mat-tab>

              <!-- TAB 2: SOCIOS Y REPRESENTANTES -->
              <mat-tab label="Representantes y Socios">
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
                      <p>No hay socios o representantes registrados en el sistema.</p>
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
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .page-header-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .loading-wrapper, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
      color: #64748b;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; }

    .error-card {
      text-align: center;
      padding: 40px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
    }
    .error-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }

    /* HEADER COMPACTO */
    .company-header-compact {
      background: #ffffff;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      border-left: 5px solid #3f51b5;
    }
    .ch-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .ch-avatar {
      width: 60px;
      height: 60px;
      background: #eef2ff;
      color: #3f51b5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 32px; width: 32px; height: 32px; }
    }
    .ch-titles {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ch-overline {
      font-size: 0.85rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .system-status {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #64748b;
      &.active { background: #dcfce7; color: #166534; }
    }
    .ch-title {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }
    .ch-badges {
      margin-top: 4px;
    }
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 600;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &.chip-autorizada { background: #dcfce7; color: #166534; }
      &.chip-en_tramite { background: #fef9c3; color: #854d0e; }
      &.chip-suspendida { background: #fee2e2; color: #991b1b; }
      &.chip-cancelada { background: #f1f5f9; color: #475569; }
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
      padding: 0;
      overflow: hidden;
    }
    .tab-content {
      padding: 20px;
    }

    .grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 768px) {
      .grid-layout { grid-template-columns: 1fr; }
    }
    .full-width { grid-column: 1 / -1; }

    .info-block {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      &.bg-light { background: #f8fafc; }
    }
    .block-title {
      margin: 0 0 12px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 8px;
      mat-icon { color: #64748b; }
    }
    
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      .d-label { font-size: 0.8rem; color: #64748b; font-weight: 500; text-transform: uppercase; }
      .d-value { font-size: 0.95rem; color: #1e293b; display: flex; align-items: center; gap: 6px; }
      &.full-width { grid-column: 1 / -1; }
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
      &.border-primary { border-left: 4px solid #3f51b5; }
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
      font-weight: 600; font-size: 1.1rem;
    }
    .sc-title {
      display: flex; flex-direction: column;
      h4 { margin: 0; font-size: 1rem; color: #1e293b; font-weight: 600; }
      .sc-role { font-size: 0.75rem; color: #64748b; font-weight: 500; }
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
    .py-2 { padding-top: 16px; padding-bottom: 16px; }
    .inline-icon { font-size: 18px; width: 18px; height: 18px; }
    .fw-600 { font-weight: 600; }
    .color-primary { color: #3f51b5; }
    .color-warn { color: #f44336; }
    .color-success { color: #4caf50; }
    .text-muted { color: #94a3b8; }
    .text-xs { font-size: 0.75rem; }
    .text-center { text-align: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .sunat-header { display: flex; justify-content: space-between; align-items: center; }
  `]
})
export class EmpresaDetailComponent implements OnInit {
  isLoading = signal(true);
  empresa = signal<Empresa | null>(null);
  
  isConsultandoSunat = signal(false);
  sunatData = signal<SunatData | null>(null);

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
        // Fallback a proxy
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
    if (!estado) return 'Desconocido';
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
      default: return 'help_outline';
    }
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
