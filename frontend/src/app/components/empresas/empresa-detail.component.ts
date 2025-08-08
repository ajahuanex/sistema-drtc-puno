import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa, DocumentoEmpresa, AuditoriaEmpresa } from '../../models/empresa.model';

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
    MatDividerModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <div class="empresa-detail-container">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <button mat-icon-button (click)="volver()" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1>{{ empresa?.razonSocial?.principal || 'Cargando...' }}</h1>
            <p class="ruc-text">RUC: {{ empresa?.ruc || 'N/A' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="editarEmpresa()">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
          <button mat-raised-button color="accent" (click)="exportarEmpresa()">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="60"></mat-spinner>
        <h3>Cargando información de la empresa...</h3>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>Error al cargar la empresa</h3>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="cargarEmpresa()">
          Reintentar
        </button>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading && !error && empresa" class="content-section">
        <!-- Score de Riesgo -->
        <div class="risk-score-section">
          <mat-card class="risk-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon [class]="getRiskIconClass()">{{ getRiskIcon() }}</mat-icon>
                Score de Riesgo
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="risk-score-display">
                <div class="score-circle" [class]="getRiskClass()">
                  <span class="score-value">{{ empresa.scoreRiesgo || 0 }}</span>
                  <span class="score-label">/ 100</span>
                </div>
                <div class="risk-info">
                  <h3>{{ getRiskLevel() }}</h3>
                  <p>{{ getRiskDescription() }}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Tabs -->
        <mat-tab-group class="empresa-tabs">
          <!-- Información General -->
          <mat-tab label="Información General">
            <div class="tab-content">
              <div class="info-grid">
                <!-- Datos Básicos -->
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Datos Básicos</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-item">
                      <strong>RUC:</strong> {{ empresa.ruc }}
                    </div>
                    <div class="info-item">
                      <strong>Razón Social:</strong> {{ empresa.razonSocial.principal }}
                    </div>
                    <div class="info-item">
                      <strong>Dirección Fiscal:</strong> {{ empresa.direccionFiscal }}
                    </div>
                    <div class="info-item">
                      <strong>Estado:</strong>
                      <span class="status-badge" [class]="'status-' + empresa.estado.toLowerCase()">
                        {{ empresa.estado }}
                      </span>
                    </div>
                    <div class="info-item">
                      <strong>Fecha de Registro:</strong> {{ empresa.fechaRegistro | date:'dd/MM/yyyy' }}
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Representante Legal -->
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Representante Legal</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-item">
                      <strong>DNI:</strong> {{ empresa.representanteLegal.dni }}
                    </div>
                    <div class="info-item">
                      <strong>Nombres:</strong> {{ empresa.representanteLegal.nombres }}
                    </div>
                    <div class="info-item">
                      <strong>Apellidos:</strong> {{ empresa.representanteLegal.apellidos }}
                    </div>
                    <div class="info-item" *ngIf="empresa.representanteLegal.email">
                      <strong>Email:</strong> {{ empresa.representanteLegal.email }}
                    </div>
                    <div class="info-item" *ngIf="empresa.representanteLegal.telefono">
                      <strong>Teléfono:</strong> {{ empresa.representanteLegal.telefono }}
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Información de Contacto -->
                <mat-card class="info-card" *ngIf="empresa.emailContacto || empresa.telefonoContacto">
                  <mat-card-header>
                    <mat-card-title>Información de Contacto</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-item" *ngIf="empresa.emailContacto">
                      <strong>Email:</strong> {{ empresa.emailContacto }}
                    </div>
                    <div class="info-item" *ngIf="empresa.telefonoContacto">
                      <strong>Teléfono:</strong> {{ empresa.telefonoContacto }}
                    </div>
                    <div class="info-item" *ngIf="empresa.sitioWeb">
                      <strong>Sitio Web:</strong> {{ empresa.sitioWeb }}
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Documentos -->
          <mat-tab label="Documentos">
            <div class="tab-content">
              <div class="documents-section">
                <div class="section-header">
                  <h3>Documentos de la Empresa</h3>
                  <button mat-raised-button color="primary" (click)="agregarDocumento()">
                    <mat-icon>add</mat-icon>
                    Agregar Documento
                  </button>
                </div>

                <div class="documents-grid">
                  <mat-card *ngFor="let doc of empresa.documentos" class="document-card">
                    <mat-card-header>
                      <mat-card-title>{{ doc.tipo }}</mat-card-title>
                      <mat-card-subtitle>{{ doc.numero }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="document-info">
                        <div class="info-item">
                          <strong>Fecha de Emisión:</strong> {{ doc.fechaEmision | date:'dd/MM/yyyy' }}
                        </div>
                        <div class="info-item" *ngIf="doc.fechaVencimiento">
                          <strong>Fecha de Vencimiento:</strong> 
                          <span [class]="isDocumentExpired(doc) ? 'expired' : 'valid'">
                            {{ doc.fechaVencimiento | date:'dd/MM/yyyy' }}
                          </span>
                        </div>
                        <div class="info-item" *ngIf="doc.observaciones">
                          <strong>Observaciones:</strong> {{ doc.observaciones }}
                        </div>
                      </div>
                      <div class="document-actions">
                        <button mat-icon-button color="primary" *ngIf="doc.urlDocumento">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button mat-icon-button color="accent">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Auditoría -->
          <mat-tab label="Auditoría">
            <div class="tab-content">
              <div class="audit-section">
                <h3>Historial de Cambios</h3>
                <mat-list>
                  <mat-list-item *ngFor="let audit of empresa.auditoria" class="audit-item">
                    <div class="audit-content">
                      <div class="audit-header">
                        <span class="audit-type">{{ audit.tipoCambio }}</span>
                        <span class="audit-date">{{ audit.fechaCambio | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <div class="audit-details">
                        <p *ngIf="audit.campoAnterior"><strong>Anterior:</strong> {{ audit.campoAnterior }}</p>
                        <p *ngIf="audit.campoNuevo"><strong>Nuevo:</strong> {{ audit.campoNuevo }}</p>
                        <p *ngIf="audit.observaciones"><strong>Observaciones:</strong> {{ audit.observaciones }}</p>
                      </div>
                    </div>
                  </mat-list-item>
                </mat-list>
              </div>
            </div>
          </mat-tab>

          <!-- Relaciones -->
          <mat-tab label="Relaciones">
            <div class="tab-content">
              <div class="relations-section">
                <div class="relation-cards">
                  <!-- Vehículos -->
                  <mat-card class="relation-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>directions_car</mat-icon>
                        Vehículos Habilitados
                      </mat-card-title>
                      <mat-card-subtitle>{{ empresa.vehiculosHabilitadosIds.length }} vehículos</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="relation-list">
                        <div *ngFor="let vehiculoId of empresa.vehiculosHabilitadosIds" class="relation-item">
                          <span>{{ vehiculoId }}</span>
                          <button mat-icon-button color="warn">
                            <mat-icon>remove</mat-icon>
                          </button>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Conductores -->
                  <mat-card class="relation-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>person</mat-icon>
                        Conductores Habilitados
                      </mat-card-title>
                      <mat-card-subtitle>{{ empresa.conductoresHabilitadosIds.length }} conductores</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="relation-list">
                        <div *ngFor="let conductorId of empresa.conductoresHabilitadosIds" class="relation-item">
                          <span>{{ conductorId }}</span>
                          <button mat-icon-button color="warn">
                            <mat-icon>remove</mat-icon>
                          </button>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Rutas -->
                  <mat-card class="relation-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>route</mat-icon>
                        Rutas Autorizadas
                      </mat-card-title>
                      <mat-card-subtitle>{{ empresa.rutasAutorizadasIds.length }} rutas</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="relation-list">
                        <div *ngFor="let rutaId of empresa.rutasAutorizadasIds" class="relation-item">
                          <span>{{ rutaId }}</span>
                          <button mat-icon-button color="warn">
                            <mat-icon>remove</mat-icon>
                          </button>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .empresa-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .back-button {
      color: white;
    }

    .header-info h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .ruc-text {
      margin: 5px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .loading-container, .error-container {
      text-align: center;
      padding: 40px;
      background: #f9f9f9;
      border-radius: 8px;
      margin: 20px 0;
    }

    .error-icon {
      font-size: 48px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .risk-score-section {
      margin-bottom: 30px;
    }

    .risk-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .risk-score-display {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .score-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 4px solid rgba(255, 255, 255, 0.3);
    }

    .score-circle.low-risk {
      background: #4caf50;
    }

    .score-circle.medium-risk {
      background: #ff9800;
    }

    .score-circle.high-risk {
      background: #f44336;
    }

    .score-value {
      font-size: 24px;
      line-height: 1;
    }

    .score-label {
      font-size: 12px;
      opacity: 0.8;
    }

    .risk-info h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
    }

    .risk-info p {
      margin: 0;
      opacity: 0.9;
    }

    .empresa-tabs {
      margin-top: 20px;
    }

    .tab-content {
      padding: 20px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .info-card {
      height: fit-content;
    }

    .info-item {
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }

    .status-habilitada {
      background-color: #4caf50;
    }

    .status-en_tramite {
      background-color: #ff9800;
    }

    .status-suspendida {
      background-color: #f44336;
    }

    .status-cancelada {
      background-color: #9e9e9e;
    }

    .documents-section {
      margin-top: 20px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .document-card {
      position: relative;
    }

    .document-info {
      margin-bottom: 15px;
    }

    .document-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .expired {
      color: #f44336;
      font-weight: bold;
    }

    .valid {
      color: #4caf50;
    }

    .audit-section {
      margin-top: 20px;
    }

    .audit-item {
      margin-bottom: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
    }

    .audit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .audit-type {
      font-weight: bold;
      color: #333;
    }

    .audit-date {
      color: #666;
      font-size: 12px;
    }

    .audit-details p {
      margin: 5px 0;
      font-size: 14px;
    }

    .relations-section {
      margin-top: 20px;
    }

    .relation-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .relation-card {
      height: fit-content;
    }

    .relation-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .relation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .relation-item:last-child {
      border-bottom: none;
    }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .header-actions {
        width: 100%;
        justify-content: center;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .documents-grid {
        grid-template-columns: 1fr;
      }

      .relation-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EmpresaDetailComponent implements OnInit {
  empresa?: Empresa;
  isLoading = false;
  error?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEmpresa();
  }

  cargarEmpresa(): void {
    const empresaId = this.route.snapshot.paramMap.get('id');
    if (!empresaId) {
      this.error = 'ID de empresa no válido';
      return;
    }

    this.isLoading = true;
    this.error = undefined;

    this.empresaService.getEmpresaById(empresaId).subscribe({
      next: (empresa) => {
        this.empresa = empresa;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.error = 'Error al cargar la empresa';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/empresas']);
  }

  editarEmpresa(): void {
    if (this.empresa) {
      this.router.navigate(['/empresas', this.empresa.id, 'editar']);
    }
  }

  exportarEmpresa(): void {
    if (this.empresa) {
      this.empresaService.exportarEmpresas('pdf').subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `empresa_${this.empresa?.ruc}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          
          this.snackBar.open('Empresa exportada exitosamente', 'Cerrar', {
            duration: 3000
          });
        },
        error: (error: any) => {
          console.error('Error exportando empresa:', error);
          this.snackBar.open('Error al exportar empresa', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }
  }

  agregarDocumento(): void {
    // Implementar modal para agregar documento
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', {
      duration: 2000
    });
  }

  isDocumentExpired(doc: DocumentoEmpresa): boolean {
    if (!doc.fechaVencimiento) return false;
    return new Date(doc.fechaVencimiento) < new Date();
  }

  getRiskClass(): string {
    const score = this.empresa?.scoreRiesgo || 0;
    if (score <= 30) return 'low-risk';
    if (score <= 70) return 'medium-risk';
    return 'high-risk';
  }

  getRiskIcon(): string {
    const score = this.empresa?.scoreRiesgo || 0;
    if (score <= 30) return 'check_circle';
    if (score <= 70) return 'warning';
    return 'error';
  }

  getRiskIconClass(): string {
    const score = this.empresa?.scoreRiesgo || 0;
    if (score <= 30) return 'low-risk-icon';
    if (score <= 70) return 'medium-risk-icon';
    return 'high-risk-icon';
  }

  getRiskLevel(): string {
    const score = this.empresa?.scoreRiesgo || 0;
    if (score <= 30) return 'Riesgo Bajo';
    if (score <= 70) return 'Riesgo Medio';
    return 'Riesgo Alto';
  }

  getRiskDescription(): string {
    const score = this.empresa?.scoreRiesgo || 0;
    if (score <= 30) return 'La empresa presenta un perfil de riesgo bajo.';
    if (score <= 70) return 'La empresa requiere monitoreo adicional.';
    return 'La empresa presenta un perfil de riesgo alto. Se requiere revisión manual.';
  }
} 