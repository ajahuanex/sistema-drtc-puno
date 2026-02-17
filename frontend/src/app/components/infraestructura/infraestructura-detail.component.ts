import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { InfraestructuraService } from '../../services/infraestructura.service';
import { Infraestructura, InfraestructuraUtils, TipoInfraestructura, EstadoInfraestructura } from '../../models/infraestructura.model';

@Component({
  selector: 'app-infraestructura-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatListModule,
    MatBadgeModule
  ],
  template: `
    <div class="infraestructura-detail-container">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <h3>Cargando infraestructura...</h3>
        </div>
      } @else if (infraestructura()) {
        <!-- Header -->
        <div class="detail-header">
          <div class="header-actions">
            <button mat-icon-button (click)="goBack()" matTooltip="Volver">
              <mat-icon>arrow_back</mat-icon>
            </button>
          </div>
          
          <div class="header-info">
            <div class="infraestructura-title">
              <mat-icon class="title-icon">{{ getTipoIcon(infraestructura()!.tipoInfraestructura) }}</mat-icon>
              <h1>{{ infraestructura()!.razonSocial.principal }}</h1>
              <mat-chip-set>
                <mat-chip [class]="'estado-' + infraestructura()!.estado.toLowerCase()">
                  {{ getEstadoLabel(infraestructura()!.estado) }}
                </mat-chip>
              </mat-chip-set>
            </div>
            
            <div class="infraestructura-subtitle">
              <span class="ruc">RUC: {{ infraestructura()!.ruc }}</span>
              <span class="tipo">{{ getTipoLabel(infraestructura()!.tipoInfraestructura) }}</span>
            </div>
          </div>

          <div class="header-stats">
            <div class="stat-card">
              <mat-icon>business</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ infraestructura()!.especificaciones.capacidadMaxima || 'N/A' }}</span>
                <span class="stat-label">Capacidad</span>
              </div>
            </div>
            
            <div class="stat-card">
              <mat-icon>description</mat-icon>
              <div class="stat-info">
                <span class="stat-value">{{ infraestructura()!.documentos.length }}</span>
                <span class="stat-label">Documentos</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs Content -->
        <mat-tab-group class="detail-tabs" animationDuration="300ms">
          
          <!-- Información General -->
          <mat-tab label="Información General">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="info-grid">
                  
                  <!-- Datos Básicos -->
                  <mat-card class="info-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>info</mat-icon>
                        Datos Básicos
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="info-row">
                        <span class="label">RUC:</span>
                        <span class="value">{{ infraestructura()!.ruc }}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Razón Social:</span>
                        <span class="value">{{ infraestructura()!.razonSocial.principal }}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Tipo:</span>
                        <span class="value">{{ getTipoLabel(infraestructura()!.tipoInfraestructura) }}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Estado:</span>
                        <mat-chip [class]="'estado-' + infraestructura()!.estado.toLowerCase()">
                          {{ getEstadoLabel(infraestructura()!.estado) }}
                        </mat-chip>
                      </div>
                      <div class="info-row">
                        <span class="label">Dirección Fiscal:</span>
                        <span class="value">{{ infraestructura()!.direccionFiscal }}</span>
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
                      <div class="info-row">
                        <span class="label">DNI:</span>
                        <span class="value">{{ infraestructura()!.representanteLegal.dni }}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Nombres:</span>
                        <span class="value">{{ infraestructura()!.representanteLegal.nombres }}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Apellidos:</span>
                        <span class="value">{{ infraestructura()!.representanteLegal.apellidos }}</span>
                      </div>
                      @if (infraestructura()!.representanteLegal.email) {
                        <div class="info-row">
                          <span class="label">Email:</span>
                          <span class="value">{{ infraestructura()!.representanteLegal.email }}</span>
                        </div>
                      }
                      @if (infraestructura()!.representanteLegal.telefono) {
                        <div class="info-row">
                          <span class="label">Teléfono:</span>
                          <span class="value">{{ infraestructura()!.representanteLegal.telefono }}</span>
                        </div>
                      }
                    </mat-card-content>
                  </mat-card>

                  <!-- Especificaciones -->
                  <mat-card class="info-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>settings</mat-icon>
                        Especificaciones
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      @if (infraestructura()!.especificaciones.capacidadMaxima) {
                        <div class="info-row">
                          <span class="label">Capacidad Máxima:</span>
                          <span class="value">{{ infraestructura()!.especificaciones.capacidadMaxima }} personas</span>
                        </div>
                      }
                      @if (infraestructura()!.especificaciones.areaTotal) {
                        <div class="info-row">
                          <span class="label">Área Total:</span>
                          <span class="value">{{ infraestructura()!.especificaciones.areaTotal }} m²</span>
                        </div>
                      }
                      @if (infraestructura()!.especificaciones.numeroAndenes) {
                        <div class="info-row">
                          <span class="label">Número de Andenes:</span>
                          <span class="value">{{ infraestructura()!.especificaciones.numeroAndenes }}</span>
                        </div>
                      }
                      @if (infraestructura()!.especificaciones.numeroPlataformas) {
                        <div class="info-row">
                          <span class="label">Número de Plataformas:</span>
                          <span class="value">{{ infraestructura()!.especificaciones.numeroPlataformas }}</span>
                        </div>
                      }
                    </mat-card-content>
                  </mat-card>

                  <!-- Datos SUNAT -->
                  <mat-card class="info-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>verified</mat-icon>
                        Validación SUNAT
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="info-row">
                        <span class="label">Estado:</span>
                        <mat-chip [class]="infraestructura()!.datosSunat.valido ? 'estado-valido' : 'estado-invalido'">
                          {{ infraestructura()!.datosSunat.valido ? 'Válido' : 'Inválido' }}
                        </mat-chip>
                      </div>
                      @if (infraestructura()!.datosSunat.razonSocial) {
                        <div class="info-row">
                          <span class="label">Razón Social SUNAT:</span>
                          <span class="value">{{ infraestructura()!.datosSunat.razonSocial }}</span>
                        </div>
                      }
                      @if (infraestructura()!.datosSunat.estado) {
                        <div class="info-row">
                          <span class="label">Estado SUNAT:</span>
                          <span class="value">{{ infraestructura()!.datosSunat.estado }}</span>
                        </div>
                      }
                      <div class="info-row">
                        <span class="label">Última Validación:</span>
                        <span class="value">{{ formatDate(infraestructura()!.ultimaValidacionSunat) }}</span>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </ng-template>
          </mat-tab>

          <!-- Documentos -->
          <mat-tab label="Documentos">
            <ng-template matTabContent>
              <div class="tab-content">
                @if (infraestructura()!.documentos.length > 0) {
                  <div class="documentos-grid">
                    @for (documento of infraestructura()!.documentos; track documento.id) {
                      <mat-card class="documento-card">
                        <mat-card-header>
                          <mat-card-title>{{ documento.tipo }}</mat-card-title>
                          <mat-card-subtitle>{{ documento.numero }}</mat-card-subtitle>
                        </mat-card-header>
                        <mat-card-content>
                          <div class="documento-info">
                            <div class="info-row">
                              <span class="label">Fecha Emisión:</span>
                              <span class="value">{{ formatDate(documento.fechaEmision) }}</span>
                            </div>
                            @if (documento.fechaVencimiento) {
                              <div class="info-row">
                                <span class="label">Fecha Vencimiento:</span>
                                <span class="value" [class.vencido]="isDocumentoVencido(documento.fechaVencimiento)">
                                  {{ formatDate(documento.fechaVencimiento) }}
                                </span>
                              </div>
                            }
                            <div class="info-row">
                              <span class="label">Entidad Emisora:</span>
                              <span class="value">{{ documento.entidadEmisora }}</span>
                            </div>
                          </div>
                        </mat-card-content>
                        <mat-card-actions>
                          @if (documento.urlArchivo) {
                            <button mat-button color="primary" (click)="descargarDocumento(documento.urlArchivo!)">
                              <mat-icon>download</mat-icon>
                              Descargar
                            </button>
                          }
                        </mat-card-actions>
                      </mat-card>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <mat-icon class="empty-icon">description</mat-icon>
                    <h3>No hay documentos registrados</h3>
                    <p>Esta infraestructura no tiene documentos asociados.</p>
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>

          <!-- Historial -->
          <mat-tab label="Historial">
            <ng-template matTabContent>
              <div class="tab-content">
                @if (infraestructura()!.historialEstados.length > 0) {
                  <mat-list class="historial-list">
                    @for (historial of infraestructura()!.historialEstados; track $index) {
                      <mat-list-item class="historial-item">
                        <mat-icon matListItemIcon [class]="'estado-' + historial.estadoNuevo.toLowerCase()">
                          {{ getEstadoIcon(historial.estadoNuevo) }}
                        </mat-icon>
                        <div matListItemTitle class="historial-title">
                          Cambio a {{ getEstadoLabel(historial.estadoNuevo) }}
                        </div>
                        <div matListItemLine class="historial-subtitle">
                          {{ formatDate(historial.fechaCambio) }} - {{ historial.motivo }}
                        </div>
                      </mat-list-item>
                      @if ($index < infraestructura()!.historialEstados.length - 1) {
                        <mat-divider></mat-divider>
                      }
                    }
                  </mat-list>
                } @else {
                  <div class="empty-state">
                    <mat-icon class="empty-icon">history</mat-icon>
                    <h3>No hay historial disponible</h3>
                    <p>No se han registrado cambios de estado para esta infraestructura.</p>
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <div class="error-state">
          <mat-icon class="error-icon">error</mat-icon>
          <h3>Infraestructura no encontrada</h3>
          <p>La infraestructura solicitada no existe o no tienes permisos para verla.</p>
          <button mat-raised-button color="primary" (click)="goBack()">
            Volver al listado
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './infraestructura-detail.component.scss'
})
export class InfraestructuraDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private infraestructuraService = inject(InfraestructuraService);
  private snackBar = inject(MatSnackBar);

  // Signals
  infraestructura = signal<Infraestructura | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInfraestructura(id);
    } else {
      this.goBack();
    }
  }

  loadInfraestructura(id: string): void {
    this.isLoading.set(true);
    this.infraestructuraService.getInfraestructuraById(id).subscribe({
      next: (infraestructura) => {
        this.infraestructura.set(infraestructura);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando infraestructura:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar la infraestructura: ' + error.message, 'CERRAR', {
          duration: 5000
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/infraestructura']);
  }

  getTipoLabel(tipo: TipoInfraestructura): string {
    return InfraestructuraUtils.getTipoInfraestructuraLabel(tipo);
  }

  getTipoIcon(tipo: TipoInfraestructura): string {
    return InfraestructuraUtils.getTipoInfraestructuraIcon(tipo);
  }

  getEstadoLabel(estado: EstadoInfraestructura): string {
    return InfraestructuraUtils.getEstadoInfraestructuraLabel(estado);
  }

  getEstadoIcon(estado: EstadoInfraestructura): string {
    const icons = {
      [EstadoInfraestructura.AUTORIZADA]: 'check_circle',
      [EstadoInfraestructura.EN_TRAMITE]: 'schedule',
      [EstadoInfraestructura.SUSPENDIDA]: 'pause_circle',
      [EstadoInfraestructura.CANCELADA]: 'cancel'
    };
    return icons[estado] || 'help';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isDocumentoVencido(fechaVencimiento: string): boolean {
    return new Date(fechaVencimiento) < new Date();
  }

  descargarDocumento(url: string): void {
    window.open(url, '_blank');
  }
}