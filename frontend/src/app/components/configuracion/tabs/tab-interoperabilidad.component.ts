import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ParametrosService } from '../../../services/parametros.service';
import { PermisosService } from '../../../services/permisos.service';
import { ParametroSistema } from '../../../models/parametro.model';
import { EndpointInteroperabilidadInfo, TestInteroperabilidadResponse } from '../../../models/permisos.model';

@Component({
  selector: 'app-tab-interoperabilidad',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
    FormsModule
  ],
  template: `
    <div class="tab-header">
      <div class="header-text">
        <h2>Interoperabilidad y Conexión de APIs</h2>
        <p>Gestiona el dominio del servidor de interoperabilidad, inspecciona los endpoints externos y controla las contingencias.</p>
      </div>
    </div>

    <!-- 1. SECCIÓN: SERVIDOR / DOMINIO BASE -->
    <div class="domain-card mat-elevation-z1">
      <div class="card-top">
        <div class="card-icon-title">
          <div class="domain-icon-box">
            <mat-icon>dns</mat-icon>
          </div>
          <div>
            <h3>Servidor / Dominio Base de Interoperabilidad</h3>
            <p>Host principal al que se concatenan las llamadas a las APIs de SUNAT, SUNARP y RENIEC.</p>
          </div>
        </div>

        <div class="status-indicator" *ngIf="resultadoPrueba()">
          <span class="status-pill" [class.success]="resultadoPrueba()?.success" [class.error]="!resultadoPrueba()?.success">
            <mat-icon>{{ resultadoPrueba()?.success ? 'check_circle' : 'error' }}</mat-icon>
            {{ resultadoPrueba()?.mensaje }}
          </span>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group field-domain">
          <label>Dominio Base (URL del Proveedor)</label>
          <div class="input-wrapper">
            <mat-icon class="input-icon">language</mat-icon>
            <input 
              type="text" 
              class="custom-input" 
              [(ngModel)]="dominioBase" 
              placeholder="https://pcm.guillermo.pe" 
              [disabled]="guardandoDominio() || probandoConexion()"
            />
          </div>
          <span class="field-hint">Incluye el protocolo (https://). Los endpoints se conectarán a esta raíz.</span>
        </div>

        <div class="form-group field-token">
          <label>API Key / Token Bearer (Opcional)</label>
          <div class="input-wrapper">
            <mat-icon class="input-icon">vpn_key</mat-icon>
            <input 
              type="password" 
              class="custom-input" 
              [(ngModel)]="apiKey" 
              placeholder="Bearer Token si el host lo requiere" 
              [disabled]="guardandoDominio() || probandoConexion()"
            />
          </div>
          <span class="field-hint">Solo si el endpoint externo requiere encabezado de autorización.</span>
        </div>
      </div>

      <div class="card-actions">
        <button 
          mat-button 
          class="btn-test" 
          (click)="probarConexion()" 
          [disabled]="!dominioBase || probandoConexion() || guardandoDominio()">
          <mat-icon>{{ probandoConexion() ? 'sync' : 'network_check' }}</mat-icon>
          {{ probandoConexion() ? 'Probando...' : 'Probar Conectividad' }}
        </button>

        <button 
          mat-raised-button 
          color="primary" 
          class="btn-save" 
          (click)="guardarConfiguracionDominio()" 
          [disabled]="guardandoDominio() || probandoConexion()">
          <mat-icon>{{ guardandoDominio() ? 'hourglass_top' : 'save' }}</mat-icon>
          {{ guardandoDominio() ? 'Guardando...' : 'Guardar Dominio' }}
        </button>
      </div>
    </div>

    <!-- 2. SECCIÓN: ENDPOINTS DEFINIDOS EN EL SISTEMA -->
    <div class="endpoints-card mat-elevation-z1">
      <div class="endpoints-header">
        <div class="header-icon-title">
          <mat-icon class="section-icon">api</mat-icon>
          <div>
            <h3>Endpoints Definidos en SIRRETT</h3>
            <p>Rutas relativas registradas para la consulta de información estatal en tiempo real.</p>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="endpoints-table">
          <thead>
            <tr>
              <th style="width: 110px;">Servicio</th>
              <th style="width: 80px;">Método</th>
              <th>Endpoint / Path Relativo</th>
              <th>Descripción Funcional</th>
              <th>Parámetros</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ep of endpointsDefinidos">
              <td>
                <span class="service-badge" [ngClass]="ep.servicio.toLowerCase()">
                  {{ ep.servicio }}
                </span>
              </td>
              <td>
                <span class="method-badge">{{ ep.metodo }}</span>
              </td>
              <td>
                <div class="endpoint-path">
                  <code>{{ dominioBase || 'https://pcm.guillermo.pe' }}{{ ep.pathRelativo }}</code>
                </div>
              </td>
              <td>
                <div class="endpoint-meta">
                  <strong>{{ ep.nombre }}</strong>
                  <span>{{ ep.descripcion }}</span>
                </div>
              </td>
              <td>
                <code class="param-code">{{ ep.parametros }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. SECCIÓN: CONTINGENCIA (TOGGLES DE SINCRONIZACIÓN) -->
    <div class="toggles-section">
      <div class="section-title">
        <h3>Mecanismos de Contingencia</h3>
        <p>Permite apagar la consulta automática en caso de caída o mantenimiento de servidores externos.</p>
      </div>

      <div class="toggles-grid">
        <ng-container *ngFor="let param of parametrosContingencia()">
          <mat-card class="toggle-card" [class.active-card]="param.valor">
            <mat-card-content class="toggle-content">
              <div class="toggle-info">
                <div class="toggle-icon-box" [class.active-icon]="param.valor">
                  <mat-icon>{{ getIcon(param.clave) }}</mat-icon>
                </div>
                <div class="toggle-text">
                  <h3>{{ param.nombre }}</h3>
                  <p>{{ param.descripcion }}</p>
                </div>
              </div>
              
              <div class="toggle-action">
                <mat-slide-toggle 
                  color="primary"
                  [checked]="param.valor"
                  (change)="toggleParametro(param, $event.checked)">
                  {{ param.valor ? 'ACTIVADO' : 'DESACTIVADO' }}
                </mat-slide-toggle>
              </div>
            </mat-card-content>
          </mat-card>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .tab-header {
      margin-bottom: 1.5rem;
    }
    .header-text h2 {
      margin: 0 0 4px 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
    }
    .header-text p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    /* Card Dominio */
    .domain-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 2rem;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .card-icon-title {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .domain-icon-box {
      width: 48px;
      height: 48px;
      background: #eff6ff;
      color: #1e40af;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon-title h3 {
      margin: 0 0 4px 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }

    .card-icon-title p {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-pill.success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .status-pill.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .status-pill mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    @media (max-width: 800px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-group label {
      display: block;
      font-size: 0.84rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .custom-input {
      width: 100%;
      height: 42px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0 12px 0 40px;
      font-size: 0.9rem;
      font-family: inherit;
      color: #0f172a;
      transition: all 0.2s;
    }

    .custom-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .field-hint {
      display: block;
      margin-top: 4px;
      font-size: 0.75rem;
      color: #64748b;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }

    .btn-test {
      border: 1px solid #cbd5e1 !important;
      color: #334155 !important;
      border-radius: 8px;
      font-weight: 600;
    }

    .btn-save {
      background: #1e3a8a !important;
      color: #ffffff !important;
      border-radius: 8px;
      font-weight: 600;
    }

    /* Card Endpoints */
    .endpoints-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .endpoints-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-icon-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-icon {
      color: #1e3a8a;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .endpoints-header h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }

    .endpoints-header p {
      margin: 2px 0 0 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .table-responsive {
      overflow-x: auto;
      width: 100%;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f8fafc;
    }

    .table-responsive::-webkit-scrollbar {
      height: 8px;
    }

    .table-responsive::-webkit-scrollbar-track {
      background: #f8fafc;
    }

    .table-responsive::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .endpoints-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1100px;
    }

    .endpoints-table th {
      background: #f8fafc;
      padding: 14px 16px;
      text-align: left;
      font-size: 0.84rem;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }

    .endpoints-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .endpoints-table tr:hover td {
      background-color: #fafbfc;
    }

    .service-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-align: center;
    }

    .service-badge.sunat { background: #fee2e2; color: #991b1b; }
    .service-badge.sunarp { background: #fef3c7; color: #92400e; }
    .service-badge.reniec { background: #dbeafe; color: #1e40af; }
    .service-badge.sutran { background: #f3e8ff; color: #6b21a8; }

    .method-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 6px;
      border-radius: 4px;
      background: #e2e8f0;
      color: #0f172a;
      font-family: monospace;
    }

    .endpoint-path code {
      font-size: 0.82rem;
      color: #0369a1;
      background: #f0f9ff;
      padding: 4px 8px;
      border-radius: 4px;
      word-break: break-all;
    }

    .endpoint-meta strong {
      display: block;
      font-size: 0.88rem;
      color: #0f172a;
    }

    .endpoint-meta span {
      display: block;
      font-size: 0.78rem;
      color: #64748b;
    }

    .param-code {
      font-size: 0.75rem;
      color: #475569;
      background: #f8fafc;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Contingencia Toggles */
    .toggles-section {
      margin-top: 1rem;
    }

    .section-title h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }

    .section-title p {
      margin: 2px 0 16px 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .toggles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .toggle-card {
      border: 1px solid #e2e8f0;
      box-shadow: none !important;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .toggle-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem !important;
    }

    .toggle-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .toggle-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-icon-box.active-icon {
      background: #eff6ff;
      color: #1e3a8a;
    }

    .toggle-text h3 {
      margin: 0 0 2px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
    }

    .toggle-text p {
      margin: 0;
      color: #64748b;
      font-size: 0.82rem;
    }

    :host-context([data-theme="dark"]),
    :host-context(.dark-theme) {
      .header-text h2,
      .card-icon-title h3,
      .endpoints-header h3,
      .section-title h3,
      .toggle-text h3 {
        color: #f8fafc !important;
      }
      .header-text p,
      .card-icon-title p,
      .endpoints-header p,
      .section-title p,
      .toggle-text p,
      .field-hint {
        color: #94a3b8 !important;
      }
      .domain-card,
      .endpoints-card,
      .contingency-card {
        background: #0f172a !important;
        border-color: #1e293b !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
      }
      .endpoints-header {
        border-bottom-color: #1e293b !important;
      }
      .domain-icon-box {
        background: #1e293b !important;
        color: #60a5fa !important;
      }
      .form-group label {
        color: #cbd5e1 !important;
      }
      .custom-input {
        background: #1e293b !important;
        border-color: #334155 !important;
        color: #f8fafc !important;
      }
      .custom-input:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
      }
      .input-icon {
        color: #64748b !important;
      }
      .card-actions {
        border-top-color: #1e293b !important;
      }
      .btn-test {
        border-color: #334155 !important;
        color: #cbd5e1 !important;
      }
      .btn-save {
        background: #2563eb !important;
      }
      .table-responsive {
        scrollbar-color: #334155 #0f172a !important;
      }
      .table-responsive::-webkit-scrollbar-track {
        background: #0f172a !important;
      }
      .table-responsive::-webkit-scrollbar-thumb {
        background: #334155 !important;
      }
      .endpoints-table th {
        background: #1e293b !important;
        color: #cbd5e1 !important;
        border-bottom-color: #334155 !important;
      }
      .endpoints-table td {
        border-bottom-color: #1e293b !important;
        color: #f8fafc !important;
      }
      .endpoints-table tr:hover td {
        background-color: #131d33 !important;
      }
      .endpoint-path code {
        background: #1e293b !important;
        color: #38bdf8 !important;
        border: 1px solid #334155 !important;
      }
      .endpoint-meta strong {
        color: #f8fafc !important;
      }
      .endpoint-meta span {
        color: #94a3b8 !important;
      }
      .param-code {
        background: #1e293b !important;
        color: #cbd5e1 !important;
        border: 1px solid #334155 !important;
      }
      .toggle-icon-box {
        background: #1e293b !important;
        color: #94a3b8 !important;
      }
      .toggle-icon-box.active-icon {
        background: #1e3a8a !important;
        color: #60a5fa !important;
      }
    }
  `]
})
export class TabInteroperabilidadComponent implements OnInit {
  private parametrosService = inject(ParametrosService);
  private permisosService = inject(PermisosService);
  private snackBar = inject(MatSnackBar);

  parametros = signal<ParametroSistema[]>([]);
  
  // Parámetros de Dominio Base
  parametroDominio: ParametroSistema | null = null;
  parametroApiKey: ParametroSistema | null = null;
  
  dominioBase = '';
  apiKey = '';
  
  guardandoDominio = signal<boolean>(false);
  probandoConexion = signal<boolean>(false);
  resultadoPrueba = signal<TestInteroperabilidadResponse | null>(null);

  endpointsDefinidos: EndpointInteroperabilidadInfo[] = [];

  parametrosContingencia = computed(() => {
    return this.parametros().filter(p => p.categoria === 'interoperabilidad' && p.tipo === 'booleano');
  });

  ngOnInit() {
    this.endpointsDefinidos = this.permisosService.getEndpointsDefinidos();
    this.cargarParametros();
  }

  cargarParametros() {
    this.parametrosService.obtenerParametros().subscribe({
      next: (data) => {
        this.parametros.set(data);

        // Localizar INTEROPERABILIDAD_BASE_URL
        const pDom = data.find(p => p.clave === 'INTEROPERABILIDAD_BASE_URL');
        if (pDom) {
          this.parametroDominio = pDom;
          this.dominioBase = pDom.valor || 'https://pcm.guillermo.pe';
        } else {
          this.dominioBase = 'https://pcm.guillermo.pe';
        }

        // Localizar INTEROPERABILIDAD_API_KEY
        const pKey = data.find(p => p.clave === 'INTEROPERABILIDAD_API_KEY');
        if (pKey) {
          this.parametroApiKey = pKey;
          this.apiKey = pKey.valor || '';
        }
      },
      error: () => {
        this.snackBar.open('Error al cargar parámetros de interoperabilidad', 'Cerrar', { duration: 3000 });
      }
    });
  }

  probarConexion() {
    if (!this.dominioBase) return;
    this.probandoConexion.set(true);
    this.resultadoPrueba.set(null);

    this.permisosService.probarConexionInteroperabilidad(this.dominioBase, this.apiKey).subscribe({
      next: (res) => {
        this.probandoConexion.set(false);
        this.resultadoPrueba.set(res);
        if (res.success) {
          this.snackBar.open(`✓ Conexión exitosa (${res.tiempoMs} ms)`, 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open(`⚠️ ${res.mensaje}`, 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        this.probandoConexion.set(false);
        this.resultadoPrueba.set({
          success: false,
          url: this.dominioBase,
          mensaje: 'Error de red al conectar con el servidor de pruebas'
        });
      }
    });
  }

  guardarConfiguracionDominio() {
    if (!this.dominioBase) return;
    this.guardandoDominio.set(true);

    const updateDominio$ = this.parametroDominio 
      ? this.parametrosService.actualizarParametro(this.parametroDominio.id, { valor: this.dominioBase.trim() })
      : null;

    if (updateDominio$) {
      updateDominio$.subscribe({
        next: (pActualizado) => {
          this.parametroDominio = pActualizado;
          
          // Actualizar apiKey si existe
          if (this.parametroApiKey) {
            this.parametrosService.actualizarParametro(this.parametroApiKey.id, { valor: this.apiKey }).subscribe();
          }

          this.guardandoDominio.set(false);
          this.snackBar.open('✓ Dominio de interoperabilidad actualizado exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.guardandoDominio.set(false);
          this.snackBar.open('Error al guardar el dominio de interoperabilidad', 'Cerrar', { duration: 4000 });
        }
      });
    } else {
      this.guardandoDominio.set(false);
      this.snackBar.open('Parámetro INTEROPERABILIDAD_BASE_URL no encontrado en BD', 'Cerrar', { duration: 3000 });
    }
  }

  toggleParametro(param: ParametroSistema, newValue: boolean) {
    const previousValue = param.valor;
    param.valor = newValue;
    
    this.parametrosService.actualizarParametro(param.id, { valor: newValue }).subscribe({
      next: () => {
        this.snackBar.open(`${param.nombre} actualizado`, 'Cerrar', { duration: 2000 });
      },
      error: () => {
        param.valor = previousValue;
        this.snackBar.open(`Error actualizando ${param.nombre}`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  getIcon(clave: string): string {
    if (clave.includes('SUNAT')) return 'storefront';
    if (clave.includes('RENIEC')) return 'badge';
    return 'api';
  }
}
