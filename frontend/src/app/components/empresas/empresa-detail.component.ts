import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../models/empresa.model';

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
    MatChipsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>{{ empresa()?.razonSocial?.principal || 'Cargando...' }}</h1>
          <div class="header-subtitle">
            <span class="ruc">RUC: {{ empresa()?.ruc || '...' }}</span>
            <span class="separator">•</span>
            <span class="estado" [class]="'estado-' + (empresa()?.estado?.toLowerCase() || '')">
              {{ getEstadoDisplayName(empresa()?.estado || '') }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-button color="accent" (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
          <button mat-raised-button color="primary" (click)="editar()">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
        </div>
      </div>

      <div class="content-section">
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando empresa...</p>
          </div>
        } @else if (!empresa()) {
          <mat-card class="error-state">
            <mat-card-content>
              <mat-icon class="error-icon">error</mat-icon>
              <h3>Empresa no encontrada</h3>
              <button mat-raised-button color="primary" (click)="volver()">
                <mat-icon>arrow_back</mat-icon>
                Volver
              </button>
            </mat-card-content>
          </mat-card>
        } @else {
          @if (empresa(); as emp) {
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
                    <span class="label">RUC:</span>
                    <span class="value">{{ emp.ruc }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Razón Social:</span>
                    <span class="value">{{ emp.razonSocial.principal }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Dirección:</span>
                    <span class="value">{{ emp.direccionFiscal }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Estado:</span>
                    <mat-chip [class]="'estado-' + emp.estado.toLowerCase()">
                      {{ getEstadoDisplayName(emp.estado) }}
                    </mat-chip>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Socios de la Empresa -->
            <mat-card class="info-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>people</mat-icon>
                  Socios de la Empresa
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (emp.socios && emp.socios.length > 0) {
                  <div class="info-list">
                    @for (socio of emp.socios; track socio.dni) {
                      <div class="socio-item">
                        <div class="info-item">
                          <span class="label">Rol:</span>
                          <span class="value badge" [ngClass]="'badge-' + socio.tipoSocio.toLowerCase()">{{ socio.tipoSocio }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">DNI:</span>
                          <span class="value">{{ socio.dni }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">Nombres:</span>
                          <span class="value">{{ socio.nombres }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">Apellidos:</span>
                          <span class="value">{{ socio.apellidos }}</span>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="no-data">No hay socios registrados</p>
                }
              </mat-card-content>
            </mat-card>

            <!-- Datos de Contacto -->
            <mat-card class="info-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>contact_mail</mat-icon>
                  Datos de Contacto
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-list">
                  @if (emp.emailContacto) {
                    <div class="info-item">
                      <span class="label">Email:</span>
                      <span class="value">{{ emp.emailContacto }}</span>
                    </div>
                  }
                  @if (emp.telefonoContacto) {
                    <div class="info-item">
                      <span class="label">Teléfono:</span>
                      <span class="value">{{ emp.telefonoContacto }}</span>
                    </div>
                  }
                  @if (emp.sitioWeb) {
                    <div class="info-item">
                      <span class="label">Sitio Web:</span>
                      <span class="value"><a [href]="emp.sitioWeb" target="_blank">{{ emp.sitioWeb }}</a></span>
                    </div>
                  }
                  @if (!emp.emailContacto && !emp.telefonoContacto && !emp.sitioWeb) {
                    <p class="no-data">No hay datos de contacto</p>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Servicios -->
            <mat-card class="info-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>local_shipping</mat-icon>
                  Tipos de Servicio
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="chips-container">
                  @for (tipo of emp.tiposServicio; track tipo) {
                    <mat-chip>{{ tipo }}</mat-chip>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 8px;

      .header-content h1 {
        margin: 0;
        font-size: 2rem;
      }

      .header-subtitle {
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        opacity: 0.9;
      }

      .header-actions {
        display: flex;
        gap: 1rem;
      }
    }

    .content-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
    }

    .error-state {
      text-align: center;
      padding: 3rem;

      .error-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: #f44336;
        margin-bottom: 1rem;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;

      .info-card {
        mat-card-header {
          margin-bottom: 1rem;

          mat-card-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;

          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;

            .label {
              font-weight: 600;
              color: #666;
              min-width: 120px;
            }

            .value {
              flex: 1;
              word-break: break-word;
            }
          }
        }

        .chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
      }
    }

    .personas-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .persona-item {
        padding: 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        background: #fafafa;

        .persona-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;

          .nombre {
            font-weight: 600;
            color: #333;
          }

          .cargo {
            font-size: 0.85rem;
            color: #666;
            background: #e3f2fd;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
          }
        }

        .persona-details {
          font-size: 0.9rem;
          color: #666;

          .dni {
            font-family: monospace;
          }
        }
      }
    }

    .no-data {
      color: #999;
      font-style: italic;
      margin: 0;
    }

    .estado-autorizada {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .estado-en_tramite {
      background-color: #ff9800 !important;
      color: white !important;
    }

    .estado-suspendida {
      background-color: #f44336 !important;
      color: white !important;
    }

    .estado-cancelada {
      background-color: #9e9e9e !important;
      color: white !important;
    }
  `]
})
export class EmpresaDetailComponent implements OnInit {
  isLoading = signal(true);
  empresa = signal<Empresa | null>(null);

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
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.snackBar.open('Error al cargar la empresa', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
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

  getEstadoDisplayName(estado: string): string {
    const estados: { [key: string]: string } = {
      'AUTORIZADA': 'Autorizada',
      'EN_TRAMITE': 'En Trámite',
      'SUSPENDIDA': 'Suspendida',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
  }
}
