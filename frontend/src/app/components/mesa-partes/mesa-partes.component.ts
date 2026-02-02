import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';
import { NotificacionService } from '../../services/mesa-partes/notificacion.service';
import { RegistroDocumentoComponent } from './registro-documento.component';
import { ListaDocumentosComponent } from './lista-documentos.component';
import { BusquedaDocumentosComponent } from './busqueda-documentos.component';
import { DashboardMesaComponent } from './dashboard-mesa.component';
import { ConfiguracionIntegracionesComponent } from './configuracion-integraciones.component';
import { Documento } from '../../models/mesa-partes/documento.model';

@Component({
  selector: 'app-mesa-partes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule,
    RegistroDocumentoComponent,
    ListaDocumentosComponent,
    BusquedaDocumentosComponent,
    DashboardMesaComponent,
    ConfiguracionIntegracionesComponent
  ],
  template: `
    <div class="mesa-partes-container">
      <div class="header">
        <div class="header-content">
          <h1>
            <mat-icon>inbox</mat-icon>
            Mesa de Partes
          </h1>
          <p class="subtitle">Sistema de gestión documental y trámites administrativos</p>
        </div>
        
        <!-- Notification Badge -->
        <div class="header-actions">
          <button 
            mat-icon-button 
            class="notification-button"
            [matBadge]="notificacionesPendientes"
            [matBadgeHidden]="notificacionesPendientes === 0"
            matBadgeColor="warn"
            matBadgeSize="small"
            [matTooltip]="notificacionesPendientes === 0 ? 'Sin notificaciones' : notificacionesPendientes + ' notificación(es) pendiente(s)'"
            (click)="verNotificaciones()">
            <mat-icon>notifications</mat-icon>
          </button>
        </div>
      </div>

      <mat-tab-group 
        class="mesa-tabs" 
        animationDuration="300ms"
        [(selectedIndex)]="selectedTabIndex"
        (selectedIndexChange)="onTabChange($event)">
        
        <!-- Tab: Registro -->
        <mat-tab label="Registro">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">add_circle</mat-icon>
            <span class="tab-label">Registro</span>
          </ng-template>
          <div class="tab-content">
            <app-registro-documento 
              (documentoCreado)="onDocumentoCreado($event)">
            </app-registro-documento>
          </div>
        </mat-tab>

        <!-- Tab: Documentos -->
        <mat-tab label="Documentos">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">description</mat-icon>
            <span class="tab-label">Documentos</span>
          </ng-template>
          <div class="tab-content">
            <app-lista-documentos
              (documentoSeleccionado)="onDocumentoSeleccionado($event)"
              (derivarDocumento)="onDerivarDocumento($event)"
              (archivarDocumento)="onArchivarDocumento($event)">
            </app-lista-documentos>
          </div>
        </mat-tab>

        <!-- Tab: Búsqueda -->
        <mat-tab label="Búsqueda">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">search</mat-icon>
            <span class="tab-label">Búsqueda</span>
          </ng-template>
          <div class="tab-content">
            <app-busqueda-documentos></app-busqueda-documentos>
          </div>
        </mat-tab>

        <!-- Tab: Dashboard -->
        <mat-tab label="Dashboard">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">dashboard</mat-icon>
            <span class="tab-label">Dashboard</span>
          </ng-template>
          <div class="tab-content">
            <app-dashboard-mesa></app-dashboard-mesa>
          </div>
        </mat-tab>

        <!-- Tab: Configuración -->
        <mat-tab label="Configuración">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">settings</mat-icon>
            <span class="tab-label">Configuración</span>
          </ng-template>
          <div class="tab-content">
            <app-configuracion-integraciones></app-configuracion-integraciones>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .mesa-partes-container {
      padding: 24px;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #f5f7fa;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      background: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .header-content {
      flex: 1;
    }

    .header h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
    }

    .header h1 mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #667eea;
    }

    .subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .notification-button {
      color: #667eea;
    }

    .notification-button mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .mesa-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .mesa-tabs ::ng-deep .mat-mdc-tab-body-wrapper {
      flex: 1;
      padding: 0;
    }

    .mesa-tabs ::ng-deep .mat-mdc-tab-header {
      background: #fafbfc;
      border-bottom: 1px solid #e1e4e8;
    }

    .mesa-tabs ::ng-deep .mat-mdc-tab-labels {
      padding: 0 16px;
    }

    .mesa-tabs ::ng-deep .mat-mdc-tab {
      min-width: 120px;
      padding: 0 16px;
    }

    .mesa-tabs ::ng-deep .mat-mdc-tab.mat-mdc-tab-active {
      background: rgba(102, 126, 234, 0.08);
    }

    .tab-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .tab-label {
      font-size: 14px;
      font-weight: 500;
    }

    .tab-content {
      padding: 32px;
      height: 100%;
      overflow-y: auto;
    }

    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 24px;
      min-height: 400px;
    }

    .placeholder-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #cbd5e0;
      margin-bottom: 24px;
    }

    .placeholder-content h3 {
      margin: 0 0 12px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
    }

    .placeholder-content p {
      margin: 0 0 8px 0;
      color: #6c757d;
      font-size: 14px;
      max-width: 500px;
    }

    .status-text {
      color: #667eea !important;
      font-weight: 500;
      margin-top: 16px !important;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .mesa-partes-container {
        padding: 16px;
      }

      .header {
        padding: 16px 20px;
      }

      .tab-content {
        padding: 24px;
      }
    }

    @media (max-width: 768px) {
      .mesa-partes-container {
        padding: 12px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .header h1 {
        font-size: 24px;
      }

      .header h1 mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .mesa-tabs ::ng-deep .mat-mdc-tab-labels {
        padding: 0 8px;
      }

      .mesa-tabs ::ng-deep .mat-mdc-tab {
        min-width: 80px;
        padding: 0 8px;
      }

      .tab-label {
        display: none;
      }

      .tab-icon {
        margin-right: 0;
      }

      .tab-content {
        padding: 16px;
      }

      .placeholder-content {
        padding: 32px 16px;
        min-height: 300px;
      }

      .placeholder-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
      }

      .placeholder-content h3 {
        font-size: 20px;
      }
    }

    @media (max-width: 480px) {
      .mesa-partes-container {
        padding: 8px;
      }

      .header {
        padding: 12px;
        border-radius: 8px;
      }

      .mesa-tabs {
        border-radius: 8px;
      }

      .tab-content {
        padding: 12px;
      }

      .placeholder-content {
        padding: 24px 12px;
      }
    }
  `]
})
export class MesaPartesComponent implements OnInit, OnDestroy {
  private notificacionService = inject(NotificacionService);
  private destroy$ = new Subject<void>();

  // Estado del componente
  selectedTabIndex = 0;
  notificacionesPendientes = 0;

  // TODO: Obtener del servicio de autenticación
  private readonly MOCK_USER_ID = 'user-123';

  ngOnInit(): void {
    this.inicializarNotificaciones();
    this.cargarContadorNotificaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.notificacionService.desconectarWebSocket();
  }

  /**
   * Inicializar sistema de notificaciones en tiempo real
   * Requirements: 8.1, 8.3, 8.4
   */
  private inicializarNotificaciones(): void {
    // Suscribirse a notificaciones en tiempo real
    this.notificacionService.notificaciones$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notificacion => {
        // Incrementar contador cuando llega una nueva notificación
        this.notificacionesPendientes++;
        
        // Mostrar notificación del navegador si está habilitado
        this.notificacionService.mostrarNotificacionNavegador(notificacion);
      });

    // Conectar WebSocket (en producción, obtener token del auth service)
    // this.notificacionService.conectarWebSocket(this.MOCK_USER_ID, 'mock-token');
  }

  /**
   * Cargar contador de notificaciones pendientes
   * Requirements: 8.1
   */
  private cargarContadorNotificaciones(): void {
    // Actualizar contador cada 30 segundos
    interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => 
          this.notificacionService.obtenerContadorNoLeidas(this.MOCK_USER_ID)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (resultado) => {
          this.notificacionesPendientes = resultado.total;
        },
        error: (error) => {
          console.error('Error al cargar contador de notificaciones::', error);
        }
      });
  }

  /**
   * Manejar cambio de tab
   * Requirements: 1.1, 5.1
   */
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    console.log('Tab seleccionado:', this.getTabName(index));
  }

  /**
   * Obtener nombre del tab por índice
   */
  private getTabName(index: number): string {
    const tabs = ['Registro', 'Documentos', 'Búsqueda', 'Dashboard', 'Configuración'];
    return tabs[index] || 'Desconocido';
  }

  /**
   * Ver notificaciones (placeholder)
   * Requirements: 8.1, 8.2
   */
  verNotificaciones(): void {
    // console.log removed for production
    // TODO: Implementar modal o panel de notificaciones
    // Por ahora, solo registramos la acción
  }

  /**
   * Manejar evento de documento creado
   * Requirements: 1.1
   */
  onDocumentoCreado(documento: Documento): void {
    // console.log removed for production
    // Cambiar a la pestaña de documentos para ver el documento creado
    this.selectedTabIndex = 1;
    // TODO: Mostrar notificación de éxito
  }

  /**
   * Manejar selección de documento
   * Requirements: 5.4
   */
  onDocumentoSeleccionado(documento: Documento): void {
    // console.log removed for production
    // TODO: Abrir modal o vista de detalle del documento
  }

  /**
   * Manejar derivación de documento
   * Requirements: 3.1
   */
  onDerivarDocumento(documento: Documento): void {
    // console.log removed for production
    // TODO: Abrir modal de derivación
  }

  /**
   * Manejar archivado de documento
   * Requirements: 9.1
   */
  onArchivarDocumento(documento: Documento): void {
    // console.log removed for production
    // TODO: Confirmar y archivar documento
  }
}
