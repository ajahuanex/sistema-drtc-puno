import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../models/empresa.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header del Dashboard -->
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1 class="welcome-title">Bienvenido, {{ currentUser?.nombres }} {{ currentUser?.apellidos }}</h1>
          <p class="welcome-subtitle">{{ getRoleDisplayName(currentUser?.rolId) }} • Sistema DRTC Puno</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="nuevaEmpresa()">
            <mat-icon>add_business</mat-icon>
            Nueva Empresa
          </button>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="stats-section">
        <h2 class="section-title">Resumen del Sistema</h2>
        <div class="stats-grid">
          <mat-card class="stat-card primary-card">
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>business</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ empresas.length }}</div>
                <div class="stat-label">Empresas Registradas</div>
              </div>
            </div>
          </mat-card>

          <mat-card class="stat-card success-card">
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ empresasHabilitadas }}</div>
                <div class="stat-label">Empresas Habilitadas</div>
              </div>
            </div>
          </mat-card>

          <mat-card class="stat-card warning-card">
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>pending</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ empresasEnTramite }}</div>
                <div class="stat-label">En Trámite</div>
              </div>
            </div>
          </mat-card>

          <mat-card class="stat-card info-card">
            <div class="stat-content">
              <div class="stat-icon">
                <mat-icon>security</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">0</div>
                <div class="stat-label">Fiscalizaciones Hoy</div>
              </div>
            </div>
          </mat-card>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="actions-section">
        <h2 class="section-title">Acciones Rápidas</h2>
        <div class="actions-grid">
          <button mat-raised-button class="action-btn" (click)="verEmpresas()">
            <mat-icon>business</mat-icon>
            <span>Ver Empresas</span>
          </button>
          <button mat-raised-button class="action-btn" (click)="verFiscalizaciones()">
            <mat-icon>security</mat-icon>
            <span>Fiscalizaciones</span>
          </button>
          <button mat-raised-button class="action-btn" (click)="verReportes()">
            <mat-icon>assessment</mat-icon>
            <span>Reportes</span>
          </button>
          <button mat-raised-button class="action-btn" (click)="verConfiguracion()">
            <mat-icon>settings</mat-icon>
            <span>Configuración</span>
          </button>
        </div>
      </div>

      <!-- Empresas Recientes -->
      <div class="recent-section" *ngIf="empresas.length > 0">
        <h2 class="section-title">Empresas Recientes</h2>
        <div class="empresas-grid">
          <mat-card *ngFor="let empresa of empresas.slice(0, 3)" class="empresa-card">
            <mat-card-header>
              <mat-card-title class="empresa-title">{{ empresa.razonSocial.principal }}</mat-card-title>
              <mat-card-subtitle class="empresa-subtitle">RUC: {{ empresa.ruc }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="empresa-info">
                <div class="info-item">
                  <mat-icon class="info-icon">location_on</mat-icon>
                  <span>{{ empresa.direccionFiscal }}</span>
                </div>
                <div class="info-item">
                  <mat-icon class="info-icon">person</mat-icon>
                  <span>{{ empresa.representanteLegal.nombres }}</span>
                </div>
                <div class="info-item">
                  <mat-icon class="info-icon">circle</mat-icon>
                  <span class="status-badge" [class]="'status-' + empresa.estado.toLowerCase()">
                    {{ empresa.estado }}
                  </span>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" (click)="verEmpresa(empresa.id)">
                <mat-icon>visibility</mat-icon>
                Ver Detalles
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .welcome-title {
      margin: 0 0 8px 0;
      font-size: 2.2em;
      font-weight: 700;
      color: #2c3e50;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .welcome-subtitle {
      margin: 0;
      font-size: 1.1em;
      color: #6c757d;
      font-weight: 500;
    }

    .header-actions button {
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
    }

    .section-title {
      font-size: 1.5em;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 24px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e9ecef;
    }

    .stats-section {
      margin-bottom: 40px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .stat-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: none;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .stat-content {
      display: flex;
      align-items: center;
      padding: 24px;
    }

    .stat-icon {
      margin-right: 20px;
    }

    .stat-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .stat-info {
      flex: 1;
    }

    .stat-number {
      font-size: 2.5em;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 1em;
      color: #6c757d;
      font-weight: 500;
    }

    .primary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .success-card {
      background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
      color: white;
    }

    .warning-card {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .info-card {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .actions-section {
      margin-bottom: 40px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .action-btn {
      padding: 16px 24px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      transition: all 0.3s ease;
      height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    }

    .action-btn mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .recent-section {
      margin-bottom: 40px;
    }

    .empresas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    }

    .empresa-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: none;
    }

    .empresa-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .empresa-title {
      font-size: 1.2em;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .empresa-subtitle {
      color: #6c757d;
      font-weight: 500;
    }

    .empresa-info {
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.9em;
    }

    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
      color: #6c757d;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-habilitada {
      background-color: #d4edda;
      color: #155724;
    }

    .status-en_tramite {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-suspendida {
      background-color: #f8d7da;
      color: #721c24;
    }

    mat-card-actions {
      padding: 16px;
      text-align: right;
    }

    mat-card-actions button {
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .welcome-title {
        font-size: 1.8em;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .empresas-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .actions-grid {
        grid-template-columns: 1fr;
      }

      .welcome-title {
        font-size: 1.5em;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private empresaService = inject(EmpresaService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  currentUser: any;
  empresas: Empresa[] = [];
  empresasHabilitadas = 0;
  empresasEnTramite = 0;

  constructor() {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas = empresas;
        this.empresasHabilitadas = empresas.filter(e => e.estado === 'HABILITADA').length;
        this.empresasEnTramite = empresas.filter(e => e.estado === 'EN_TRAMITE').length;
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getRoleDisplayName(roleId?: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'fiscalizador': 'Fiscalizador',
      'usuario': 'Usuario'
    };
    return roles[roleId || ''] || 'Usuario';
  }

  verEmpresas(): void {
    this.router.navigate(['/empresas']);
  }

  nuevaEmpresa(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  verFiscalizaciones(): void {
    this.router.navigate(['/fiscalizaciones']);
  }

  verReportes(): void {
    this.router.navigate(['/reportes']);
  }

  verConfiguracion(): void {
    this.router.navigate(['/configuracion']);
  }

  verEmpresa(id: string): void {
    this.router.navigate(['/empresas', id]);
  }
} 