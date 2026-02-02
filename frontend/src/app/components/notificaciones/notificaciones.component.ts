import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { NotificationService, Notificacion, TipoNotificacion, PrioridadNotificacion, CategoriaNotificacion } from '../../services/notification.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="notificaciones-container">
      <!-- Header -->
      <div class="header">
        <div class="title-section">
          <h1>Notificaciones</h1>
          <p>Gestiona todas las notificaciones del sistema</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="marcarTodasComoLeidas()" [disabled]="totalNoLeidas() === 0">
            <mat-icon>mark_email_read</mat-icon>
            Marcar todas como leídas
          </button>
          <button mat-raised-button color="warn" (click)="limpiarNotificaciones()" [disabled]="totalNotificaciones() === 0">
            <mat-icon>clear_all</mat-icon>
            Limpiar todas
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <mat-card class="filtros-card">
        <mat-card-content>
          <form [formGroup]="filtrosForm" class="filtros-form">
            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Tipo</mat-label>
                <mat-select formControlName="tipo">
                  <mat-option value="">Todos los tipos</mat-option>
                  <mat-option [value]="TipoNotificacion.SISTEMA">Sistema</mat-option>
                  <mat-option [value]="TipoNotificacion.EXPEDIENTE">Expediente</mat-option>
                  <mat-option [value]="TipoNotificacion.FISCALIZACION">Fiscalización</mat-option>
                  <mat-option [value]="TipoNotificacion.RECORDATORIO">Recordatorio</mat-option>
                  <mat-option [value]="TipoNotificacion.ALERTA">Alerta</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Categoría</mat-label>
                <mat-select formControlName="categoria">
                  <mat-option value="">Todas las categorías</mat-option>
                  <mat-option [value]="CategoriaNotificacion.GENERAL">General</mat-option>
                  <mat-option [value]="CategoriaNotificacion.ADMINISTRATIVA">Administrativa</mat-option>
                  <mat-option [value]="CategoriaNotificacion.OPERATIVA">Operativa</mat-option>
                  <mat-option [value]="CategoriaNotificacion.FINANCIERA">Financiera</mat-option>
                  <mat-option [value]="CategoriaNotificacion.LEGAL">Legal</mat-option>
                  <mat-option [value]="CategoriaNotificacion.TECNICA">Técnica</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Prioridad</mat-label>
                <mat-select formControlName="prioridad">
                  <mat-option value="">Todas las prioridades</mat-option>
                  <mat-option [value]="PrioridadNotificacion.BAJA">Baja</mat-option>
                  <mat-option [value]="PrioridadNotificacion.MEDIA">Media</mat-option>
                  <mat-option [value]="PrioridadNotificacion.ALTA">Alta</mat-option>
                  <mat-option [value]="PrioridadNotificacion.CRITICA">Crítica</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-checkbox formControlName="soloNoLeidas" class="checkbox-field">
                Solo no leídas
              </mat-checkbox>
            </div>

            <div class="filtros-row">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Fecha desde</mat-label>
                <input matInput [matDatepicker]="pickerDesde" formControlName="fechaDesde">
                <mat-datepicker-toggle matSuffix [for]="pickerDesde"></mat-datepicker-toggle>
                <mat-datepicker #pickerDesde></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Fecha hasta</mat-label>
                <input matInput [matDatepicker]="pickerHasta" formControlName="fechaHasta">
                <mat-datepicker-toggle matSuffix [for]="pickerHasta"></mat-datepicker-toggle>
                <mat-datepicker #pickerHasta></mat-datepicker>
              </mat-form-field>

              <button mat-raised-button color="primary" (click)="aplicarFiltros()" class="btn-filtrar">
                <mat-icon>filter_list</mat-icon>
                Aplicar Filtros
              </button>

              <button mat-button (click)="limpiarFiltros()" class="btn-limpiar">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Estadísticas -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-icon total">
            <mat-icon>notifications</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalNotificaciones() }}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon no-leidas">
            <mat-icon>mark_email_unread</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalNoLeidas() }}</div>
            <div class="stat-label">No Leídas</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon criticas">
            <mat-icon>priority_high</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalCriticas() }}</div>
            <div class="stat-label">Críticas</div>
          </div>
        </div>
      </div>

      <!-- Lista de Notificaciones -->
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando notificaciones...</p>
        </div>
      } @else if (notificacionesFiltradas().length === 0) {
        <mat-card class="no-data-card">
          <mat-card-content>
            <div class="no-data-content">
              <mat-icon class="no-data-icon">notifications_off</mat-icon>
              <h3>No hay notificaciones</h3>
              <p>No se encontraron notificaciones con los filtros aplicados</p>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="notificaciones-list">
          @for (notificacion of notificacionesFiltradas(); track notificacion.id) {
            <mat-card class="notificacion-card" [class.no-leida]="!notificacion.leida" [class.critica]="notificacion.prioridad === PrioridadNotificacion.CRITICA">
              <mat-card-content>
                <div class="notificacion-header">
                  <div class="notificacion-tipo">
                    <mat-icon [class]="getTipoIcon(notificacion.tipo)">
                      {{ getTipoIcon(notificacion.tipo) }}
                    </mat-icon>
                    <mat-chip [color]="getPrioridadColor(notificacion.prioridad)" selected>
                      {{ notificacion.prioridad }}
                    </mat-chip>
                  </div>
                  
                  <div class="notificacion-acciones">
                    @if (!notificacion.leida) {
                      <button mat-icon-button (click)="marcarComoLeida(notificacion.id)" matTooltip="Marcar como leída">
                        <mat-icon>mark_email_read</mat-icon>
                      </button>
                    }
                    <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Más opciones">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="verDetalle(notificacion)">
                        <mat-icon>visibility</mat-icon>
                        Ver detalle
                      </button>
                      @if (notificacion.accionUrl) {
                        <button mat-menu-item (click)="ejecutarAccion(notificacion)">
                          <mat-icon>launch</mat-icon>
                          {{ notificacion.accionTexto || 'Ejecutar acción' }}
                        </button>
                      }
                      <button mat-menu-item (click)="eliminarNotificacion(notificacion.id)">
                        <mat-icon>delete</mat-icon>
                        Eliminar
                      </button>
                    </mat-menu>
                  </div>
                </div>

                <div class="notificacion-content">
                  <h3 class="notificacion-titulo">{{ notificacion.titulo | uppercase }}</h3>
                  <p class="notificacion-mensaje">{{ notificacion.mensaje | uppercase }}</p>
                  
                  <div class="notificacion-metadata">
                    <div class="metadata-item">
                      <mat-icon>schedule</mat-icon>
                      <span>{{ notificacion.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    
                    @if (notificacion.remitenteNombre) {
                      <div class="metadata-item">
                        <mat-icon>person</mat-icon>
                        <span>{{ notificacion.remitenteNombre | uppercase }}</span>
                      </div>
                    }
                    
                    @if (notificacion.expiraEn) {
                      <div class="metadata-item">
                        <mat-icon>event</mat-icon>
                        <span>Expira: {{ notificacion.expiraEn | date:'dd/MM/yyyy' }}</span>
                      </div>
                    }
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notificaciones-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .title-section h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 600;
    }

    .title-section p {
      margin: 8px 0 0 0;
      color: #6c757d;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .filtros-card {
      margin-bottom: 24px;
    }

    .filtros-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filtros-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: end;
    }

    .filtro-field {
      width: 100%;
    }

    .checkbox-field {
      margin-top: 8px;
    }

    .btn-filtrar, .btn-limpiar {
      height: 56px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-icon.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-icon.no-leidas {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .stat-icon.criticas {
      background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    }

    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
    }

    .stat-label {
      font-size: 14px;
      color: #6c757d;
      margin-top: 4px;
    }

    .notificaciones-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notificacion-card {
      transition: all 0.2s ease-in-out;
      border-left: 4px solid transparent;
    }

    .notificacion-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .notificacion-card.no-leida {
      border-left-color: #667eea;
      background: #f8f9ff;
    }

    .notificacion-card.critica {
      border-left-color: #dc3545;
      background: #fff5f5;
    }

    .notificacion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .notificacion-tipo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .notificacion-tipo mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #6c757d;
    }

    .notificacion-acciones {
      display: flex;
      gap: 8px;
    }

    .notificacion-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notificacion-titulo {
      margin: 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
    }

    .notificacion-mensaje {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
      line-height: 1.5;
    }

    .notificacion-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 8px;
    }

    .metadata-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6c757d;
      font-size: 12px;
    }

    .metadata-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }

    .no-data-card {
      text-align: center;
      padding: 48px;
    }

    .no-data-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .no-data-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #6c757d;
    }

    .no-data-content h3 {
      margin: 0;
      color: #2c3e50;
    }

    .no-data-content p {
      margin: 0;
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .notificaciones-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .filtros-row {
        grid-template-columns: 1fr;
      }

      .stats-section {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Enums para el template
  TipoNotificacion = TipoNotificacion;
  PrioridadNotificacion = PrioridadNotificacion;
  CategoriaNotificacion = CategoriaNotificacion;

  // Signals
  loading = signal(false);
  notificaciones = signal<Notificacion[]>([]);

  // Computed properties
  totalNotificaciones = computed(() => this.notificationService.totalNotificaciones());
  totalNoLeidas = computed(() => this.notificationService.totalNoLeidas());
  totalCriticas = computed(() => this.notificationService.totalCriticas());

  notificacionesFiltradas = computed(() => {
    const notificaciones = this.notificaciones();
    const filtros = this.filtrosForm.value;
    
    return notificaciones.filter(notif => {
      if (filtros.tipo && notif.tipo !== filtros.tipo) return false;
      if (filtros.categoria && notif.categoria !== filtros.categoria) return false;
      if (filtros.prioridad && notif.prioridad !== filtros.prioridad) return false;
      if (filtros.soloNoLeidas && notif.leida) return false;
      if (filtros.fechaDesde && new Date(notif.fechaCreacion) < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && new Date(notif.fechaCreacion) > filtros.fechaHasta) return false;
      return true;
    });
  });

  // Formulario de filtros
  filtrosForm: FormGroup;

  constructor() {
    this.filtrosForm = this.fb.group({
      tipo: [''],
      categoria: [''],
      prioridad: [''],
      soloNoLeidas: [false],
      fechaDesde: [null],
      fechaHasta: [null]
    });
  }

  ngOnInit(): void {
    this.cargarNotificaciones();
    this.suscribirseANotificaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarNotificaciones(): void {
    this.loading.set(true);
    this.notificationService.getNotificaciones().subscribe({
      next: (notificaciones) => {
        this.notificaciones.set(notificaciones);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando notificaciones::', error);
        this.snackBar.open('Error al cargar las notificaciones', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  private suscribirseANotificaciones(): void {
    // Usar effect para reaccionar a cambios en los signals
    effect(() => {
      const notificaciones = this.notificationService.notificaciones();
      this.notificaciones.set(notificaciones);
    }, { allowSignalWrites: true });
  }

  aplicarFiltros(): void {
    // Los filtros se aplican automáticamente por el computed property
    this.snackBar.open('Filtros aplicados', 'Cerrar', { duration: 2000 });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.snackBar.open('Filtros limpiados', 'Cerrar', { duration: 2000 });
  }

  marcarComoLeida(id: string): void {
    this.notificationService.marcarComoLeida(id).subscribe({
      next: (notificacion) => {
        this.notificationService.actualizarNotificacionLocal(notificacion);
        this.snackBar.open('Notificación marcada como leída', 'Cerrar', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error marcando notificación::', error);
        this.snackBar.open('Error al marcar la notificación', 'Cerrar', { duration: 3000 });
      }
    });
  }

  marcarTodasComoLeidas(): void {
    this.notificationService.marcarTodasComoLeidas().subscribe({
      next: () => {
        this.cargarNotificaciones();
        this.snackBar.open('Todas las notificaciones marcadas como leídas', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error marcando notificaciones::', error);
        this.snackBar.open('Error al marcar las notificaciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarNotificacion(id: string): void {
    this.notificationService.deleteNotificacion(id).subscribe({
      next: () => {
        this.notificationService.eliminarNotificacionLocal(id);
        this.snackBar.open('Notificación eliminada', 'Cerrar', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error eliminando notificación::', error);
        this.snackBar.open('Error al eliminar la notificación', 'Cerrar', { duration: 3000 });
      }
    });
  }

  limpiarNotificaciones(): void {
    // Implementar lógica para limpiar todas las notificaciones
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  verDetalle(notificacion: Notificacion): void {
    // Implementar modal de detalle
    this.snackBar.open('Viendo detalle de notificación', 'Cerrar', { duration: 2000 });
  }

  ejecutarAccion(notificacion: Notificacion): void {
    if (notificacion.accionUrl) {
      this.router.navigate([notificacion.accionUrl]);
    }
  }

  getTipoIcon(tipo: TipoNotificacion): string {
    const iconos: { [key in TipoNotificacion]: string } = {
      [TipoNotificacion.SISTEMA]: 'computer',
      [TipoNotificacion.EXPEDIENTE]: 'folder',
      [TipoNotificacion.FISCALIZACION]: 'security',
      [TipoNotificacion.RECORDATORIO]: 'schedule',
      [TipoNotificacion.ALERTA]: 'warning',
      [TipoNotificacion.APROBACION]: 'check_circle',
      [TipoNotificacion.RECHAZO]: 'cancel'
    };
    return iconos[tipo] || 'notifications';
  }

  getPrioridadColor(prioridad: PrioridadNotificacion): string {
    const colores: { [key in PrioridadNotificacion]: string } = {
      [PrioridadNotificacion.BAJA]: 'primary',
      [PrioridadNotificacion.MEDIA]: 'accent',
      [PrioridadNotificacion.ALTA]: 'warn',
      [PrioridadNotificacion.CRITICA]: 'warn'
    };
    return colores[prioridad] || 'primary';
  }
} 