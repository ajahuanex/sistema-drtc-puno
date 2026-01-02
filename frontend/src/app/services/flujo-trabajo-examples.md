# FlujoTrabajoService - Ejemplos de Uso

Este documento contiene ejemplos prácticos de cómo usar el `FlujoTrabajoService` en diferentes escenarios del sistema SIRRET.

## Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Gestión de Flujos de Trabajo](#gestión-de-flujos-de-trabajo)
3. [Movimiento de Expedientes](#movimiento-de-expedientes)
4. [Seguimiento de Estados](#seguimiento-de-estados)
5. [Reportes y Analytics](#reportes-y-analytics)
6. [Integración con Componentes](#integración-con-componentes)
7. [Casos de Uso Avanzados](#casos-de-uso-avanzados)

## Configuración Inicial

### Inyección del Servicio

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { FlujoTrabajoService, FlujoTrabajo, EstadoFlujo } from '../services/flujo-trabajo.service';

@Component({
  selector: 'app-expedientes',
  templateUrl: './expedientes.component.html'
})
export class ExpedientesComponent implements OnInit {
  private flujoService = inject(FlujoTrabajoService);
  
  flujos: FlujoTrabajo[] = [];
  flujoActivo: FlujoTrabajo | null = null;
  
  ngOnInit() {
    this.cargarFlujos();
  }
  
  private cargarFlujos() {
    this.flujoService.getFlujos({ activo: true }).subscribe({
      next: (flujos) => {
        this.flujos = flujos;
        console.log('Flujos cargados:', flujos.length);
      },
      error: (error) => {
        console.error('Error al cargar flujos:', error);
      }
    });
  }
}
```

## Gestión de Flujos de Trabajo

### Crear un Nuevo Flujo

```typescript
async crearFlujoLicenciaConducir() {
  const nuevoFlujo = {
    nombre: 'Proceso de Licencia de Conducir',
    descripcion: 'Flujo completo para la obtención de licencia de conducir',
    tipoTramite: 'LICENCIA_CONDUCIR',
    activo: true,
    oficinas: [
      {
        id: 'OF-001',
        oficinaId: 'MESA_PARTES',
        orden: 1,
        tiempoEstimado: 30, // 30 minutos
        esObligatoria: true,
        puedeRechazar: true,
        puedeDevolver: false,
        documentosRequeridos: ['DNI', 'FOTO', 'PAGO_DERECHO'],
        condiciones: ['Documentos completos', 'Pago verificado'],
        notificaciones: [
          {
            tipo: 'EMAIL',
            destinatario: 'solicitante',
            momento: 'AL_LLEGAR',
            plantilla: 'expediente_recibido',
            activa: true
          }
        ]
      },
      {
        id: 'OF-002',
        oficinaId: 'REVISION_TECNICA',
        orden: 2,
        tiempoEstimado: 45,
        esObligatoria: true,
        puedeRechazar: true,
        puedeDevolver: true,
        documentosRequeridos: ['CERTIFICADO_MEDICO', 'EXAMEN_PSICOLOGICO'],
        condiciones: ['Certificados vigentes', 'Exámenes aprobados'],
        notificaciones: [
          {
            tipo: 'SISTEMA',
            destinatario: 'responsable_oficina',
            momento: 'AL_LLEGAR',
            plantilla: 'expediente_para_revision',
            activa: true
          }
        ]
      },
      {
        id: 'OF-003',
        oficinaId: 'EMISION_LICENCIA',
        orden: 3,
        tiempoEstimado: 20,
        esObligatoria: true,
        puedeRechazar: false,
        puedeDevolver: false,
        documentosRequeridos: [],
        condiciones: ['Revisión técnica aprobada'],
        notificaciones: [
          {
            tipo: 'EMAIL',
            destinatario: 'solicitante',
            momento: 'AL_SALIR',
            plantilla: 'licencia_lista',
            activa: true
          }
        ]
      }
    ]
  };

  try {
    const flujoCreado = await this.flujoService.crearFlujo(nuevoFlujo).toPromise();
    console.log('Flujo creado exitosamente:', flujoCreado.id);
    
    // Activar el flujo recién creado
    await this.flujoService.activarFlujo(flujoCreado.id).toPromise();
    console.log('Flujo activado');
    
    // Recargar lista de flujos
    this.cargarFlujos();
    
  } catch (error) {
    console.error('Error al crear flujo:', error);
  }
}
```

### Consultar Flujos con Filtros

```typescript
async consultarFlujos() {
  // Obtener todos los flujos activos
  const flujosActivos = await this.flujoService.getFlujos({ 
    activo: true 
  }).toPromise();
  
  // Obtener flujos de un tipo específico
  const flujosLicencias = await this.flujoService.getFlujos({
    tipoTramite: 'LICENCIA_CONDUCIR',
    activo: true
  }).toPromise();
  
  // Obtener flujos creados en el último mes
  const fechaDesde = new Date();
  fechaDesde.setMonth(fechaDesde.getMonth() - 1);
  
  const flujosRecientes = await this.flujoService.getFlujos({
    fechaCreacionDesde: fechaDesde,
    activo: true
  }).toPromise();
  
  console.log('Flujos activos:', flujosActivos.length);
  console.log('Flujos de licencias:', flujosLicencias.length);
  console.log('Flujos recientes:', flujosRecientes.length);
}
```

## Movimiento de Expedientes

### Mover Expediente a la Siguiente Oficina

```typescript
async moverExpedienteASiguienteOficina(expedienteId: string, flujoId: string, oficinaActualId: string) {
  try {
    // Obtener el flujo para determinar la siguiente oficina
    const flujo = await this.flujoService.getFlujoById(flujoId).toPromise();
    const siguienteOficina = this.flujoService.obtenerOficinaSiguiente(flujo, oficinaActualId);
    
    if (!siguienteOficina) {
      console.log('El expediente está en la última oficina del flujo');
      return;
    }
    
    // Crear el movimiento
    const movimiento = {
      expedienteId: expedienteId,
      flujoId: flujoId,
      oficinaOrigenId: oficinaActualId,
      oficinaDestinoId: siguienteOficina.oficinaId,
      usuarioId: this.authService.getCurrentUser().id,
      usuarioNombre: this.authService.getCurrentUser().nombre,
      motivo: 'Documentos revisados y aprobados',
      observaciones: 'Expediente cumple con todos los requisitos',
      documentosRequeridos: siguienteOficina.documentosRequeridos,
      documentosEntregados: siguienteOficina.documentosRequeridos, // Todos entregados
      tiempoEstimado: siguienteOficina.tiempoEstimado,
      prioridad: 'NORMAL',
      urgencia: 'BAJA',
      estado: 'PENDIENTE',
      fechaLimite: this.calcularFechaLimite(siguienteOficina.tiempoEstimado)
    };
    
    const resultado = await this.flujoService.moverExpediente(movimiento).toPromise();
    console.log('Expediente movido exitosamente:', resultado.id);
    
    // Mostrar notificación al usuario
    this.snackBar.open(
      `Expediente enviado a ${siguienteOficina.oficinaId}`, 
      'Cerrar', 
      { duration: 3000 }
    );
    
    // Actualizar estado local
    this.actualizarEstadoExpediente(expedienteId);
    
  } catch (error) {
    console.error('Error al mover expediente:', error);
    this.snackBar.open('Error al mover expediente', 'Cerrar', { duration: 3000 });
  }
}

private calcularFechaLimite(tiempoEstimadoMinutos: number): Date {
  const fechaLimite = new Date();
  fechaLimite.setMinutes(fechaLimite.getMinutes() + tiempoEstimadoMinutos);
  return fechaLimite;
}
```

### Rechazar un Expediente

```typescript
async rechazarExpediente(expedienteId: string, flujoId: string, oficinaActualId: string, motivo: string) {
  try {
    const movimiento = {
      expedienteId: expedienteId,
      flujoId: flujoId,
      oficinaOrigenId: oficinaActualId,
      oficinaDestinoId: 'MESA_PARTES', // Devolver a mesa de partes
      usuarioId: this.authService.getCurrentUser().id,
      usuarioNombre: this.authService.getCurrentUser().nombre,
      motivo: motivo,
      observaciones: 'Expediente rechazado por documentación incompleta',
      documentosRequeridos: ['DOCUMENTOS_FALTANTES'],
      documentosEntregados: [],
      tiempoEstimado: 0,
      prioridad: 'ALTA', // Alta prioridad para corrección
      urgencia: 'ALTA',
      estado: 'RECHAZADO',
      fechaLimite: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas para corregir
    };
    
    const resultado = await this.flujoService.moverExpediente(movimiento).toPromise();
    console.log('Expediente rechazado:', resultado.id);
    
    // Enviar notificación al solicitante
    await this.flujoService.enviarNotificacion({
      tipo: 'EMAIL',
      destinatario: 'solicitante',
      asunto: 'Expediente Rechazado',
      mensaje: `Su expediente ${expedienteId} ha sido rechazado. Motivo: ${motivo}`,
      expedienteId: expedienteId
    }).toPromise();
    
  } catch (error) {
    console.error('Error al rechazar expediente:', error);
  }
}
```

## Seguimiento de Estados

### Mostrar Estado Actual de un Expediente

```typescript
async mostrarEstadoExpediente(expedienteId: string) {
  try {
    const estado = await this.flujoService.getEstadoFlujo(expedienteId).toPromise();
    
    console.log('=== ESTADO DEL EXPEDIENTE ===');
    console.log(`Expediente: ${estado.expedienteId}`);
    console.log(`Oficina actual: ${estado.oficinaActualId}`);
    console.log(`Progreso: ${estado.porcentajeCompletado}%`);
    console.log(`Paso ${estado.pasoActual} de ${estado.totalPasos}`);
    console.log(`Estado: ${estado.estado}`);
    console.log(`Tiempo transcurrido: ${estado.tiempoTranscurrido} minutos`);
    console.log(`Tiempo estimado restante: ${estado.tiempoEstimado - estado.tiempoTranscurrido} minutos`);
    
    // Mostrar historial
    console.log('\n=== HISTORIAL ===');
    estado.historial.forEach((paso, index) => {
      console.log(`${index + 1}. ${paso.oficinaNombre}`);
      console.log(`   Entrada: ${paso.fechaEntrada}`);
      console.log(`   Salida: ${paso.fechaSalida || 'En proceso'}`);
      console.log(`   Tiempo: ${paso.tiempoEnOficina} minutos`);
      console.log(`   Usuario: ${paso.usuarioNombre}`);
      console.log(`   Acción: ${paso.accion}`);
      if (paso.comentarios) {
        console.log(`   Comentarios: ${paso.comentarios}`);
      }
      console.log('');
    });
    
    // Mostrar recordatorios activos
    if (estado.recordatorios.length > 0) {
      console.log('=== RECORDATORIOS ACTIVOS ===');
      estado.recordatorios.forEach(recordatorio => {
        if (recordatorio.activo) {
          console.log(`- ${recordatorio.mensaje}`);
          console.log(`  Próximo: ${recordatorio.fechaProximo}`);
        }
      });
    }
    
    return estado;
    
  } catch (error) {
    console.error('Error al obtener estado:', error);
    return null;
  }
}
```

### Componente de Seguimiento en Tiempo Real

```typescript
@Component({
  selector: 'app-seguimiento-expediente',
  template: `
    <div class="seguimiento-container">
      <h3>Seguimiento de Expediente: {{ expedienteId }}</h3>
      
      <div class="progreso-bar">
        <mat-progress-bar 
          mode="determinate" 
          [value]="estado?.porcentajeCompletado || 0">
        </mat-progress-bar>
        <span>{{ estado?.porcentajeCompletado || 0 }}% completado</span>
      </div>
      
      <div class="estado-actual" *ngIf="estado">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Estado Actual</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p><strong>Oficina:</strong> {{ estado.oficinaActualId }}</p>
            <p><strong>Estado:</strong> 
              <mat-chip [color]="getEstadoColor(estado.estado)">
                {{ estado.estado }}
              </mat-chip>
            </p>
            <p><strong>Tiempo transcurrido:</strong> {{ estado.tiempoTranscurrido }} min</p>
            <p><strong>Tiempo estimado:</strong> {{ estado.tiempoEstimado }} min</p>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="historial" *ngIf="estado?.historial">
        <h4>Historial de Movimientos</h4>
        <mat-timeline>
          <mat-timeline-item *ngFor="let paso of estado.historial">
            <mat-timeline-marker>
              <mat-icon>{{ getIconoPaso(paso.estado) }}</mat-icon>
            </mat-timeline-marker>
            <mat-timeline-content>
              <h5>{{ paso.oficinaNombre }}</h5>
              <p>{{ paso.accion }}</p>
              <small>{{ paso.fechaEntrada | date:'short' }} - {{ paso.usuarioNombre }}</small>
            </mat-timeline-content>
          </mat-timeline-item>
        </mat-timeline>
      </div>
    </div>
  `
})
export class SeguimientoExpedienteComponent implements OnInit, OnDestroy {
  @Input() expedienteId!: string;
  
  private flujoService = inject(FlujoTrabajoService);
  private destroy$ = new Subject<void>();
  
  estado: EstadoFlujo | null = null;
  
  ngOnInit() {
    this.cargarEstado();
    
    // Actualizar cada 30 segundos
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarEstado());
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private cargarEstado() {
    this.flujoService.getEstadoFlujo(this.expedienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estado) => {
          this.estado = estado;
        },
        error: (error) => {
          console.error('Error al cargar estado:', error);
        }
      });
  }
  
  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'COMPLETADO': return 'primary';
      case 'EN_PROCESO': return 'accent';
      case 'RECHAZADO': return 'warn';
      case 'PAUSADO': return 'warn';
      default: return '';
    }
  }
  
  getIconoPaso(estado: string): string {
    switch (estado) {
      case 'COMPLETADO': return 'check_circle';
      case 'EN_PROCESO': return 'schedule';
      case 'RECHAZADO': return 'cancel';
      default: return 'radio_button_unchecked';
    }
  }
}
```

## Reportes y Analytics

### Dashboard de Flujos de Trabajo

```typescript
@Component({
  selector: 'app-dashboard-flujos',
  templateUrl: './dashboard-flujos.component.html'
})
export class DashboardFlujosComponent implements OnInit {
  private flujoService = inject(FlujoTrabajoService);
  
  dashboardData: any = null;
  metricas: any = {};
  
  ngOnInit() {
    this.cargarDashboard();
  }
  
  async cargarDashboard() {
    try {
      // Cargar datos del dashboard
      this.dashboardData = await this.flujoService.getDashboardFlujos().toPromise();
      
      console.log('=== DASHBOARD FLUJOS DE TRABAJO ===');
      console.log(`Expedientes activos: ${this.dashboardData.expedientesActivos}`);
      console.log(`Expedientes completados hoy: ${this.dashboardData.completadosHoy}`);
      console.log(`Tiempo promedio de procesamiento: ${this.dashboardData.tiempoPromedio} min`);
      console.log(`Oficinas con mayor carga: ${this.dashboardData.oficinasMasCargadas.join(', ')}`);
      
      // Mostrar alertas
      if (this.dashboardData.alertas.length > 0) {
        console.log('\n=== ALERTAS ===');
        this.dashboardData.alertas.forEach((alerta: any) => {
          console.log(`⚠️ ${alerta.mensaje} (${alerta.tipo})`);
        });
      }
      
      // Cargar métricas específicas por flujo
      await this.cargarMetricasPorFlujo();
      
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    }
  }
  
  private async cargarMetricasPorFlujo() {
    const flujos = await this.flujoService.getFlujos({ activo: true }).toPromise();
    
    for (const flujo of flujos) {
      try {
        const metricas = await this.flujoService.getMetricasFlujo(flujo.id).toPromise();
        this.metricas[flujo.id] = metricas;
        
        console.log(`\n=== MÉTRICAS: ${flujo.nombre} ===`);
        console.log(`Expedientes en proceso: ${metricas.expedientesEnProceso}`);
        console.log(`Tiempo promedio: ${metricas.tiempoPromedio} min`);
        console.log(`Eficiencia: ${metricas.eficiencia}%`);
        console.log(`Cuellos de botella: ${metricas.cuellosBotella.join(', ')}`);
        
      } catch (error) {
        console.error(`Error al cargar métricas para flujo ${flujo.id}:`, error);
      }
    }
  }
}
```

### Generar Reporte Mensual

```typescript
async generarReporteMensual(flujoId: string, mes: number, año: number) {
  try {
    const fechaDesde = new Date(año, mes - 1, 1);
    const fechaHasta = new Date(año, mes, 0, 23, 59, 59);
    
    console.log(`Generando reporte para ${mes}/${año}`);
    console.log(`Período: ${fechaDesde.toLocaleDateString()} - ${fechaHasta.toLocaleDateString()}`);
    
    const reporte = await this.flujoService.getReporteFlujo(flujoId, fechaDesde, fechaHasta).toPromise();
    
    console.log('=== REPORTE MENSUAL ===');
    console.log(`Total expedientes procesados: ${reporte.totalExpedientes}`);
    console.log(`Expedientes completados: ${reporte.expedientesCompletados}`);
    console.log(`Expedientes pendientes: ${reporte.expedientesPendientes}`);
    console.log(`Expedientes rechazados: ${reporte.expedientesRechazados}`);
    console.log(`Tiempo promedio de procesamiento: ${reporte.tiempoPromedio} min`);
    console.log(`Tiempo máximo registrado: ${reporte.tiempoMaximo} min`);
    console.log(`Tiempo mínimo registrado: ${reporte.tiempoMinimo} min`);
    
    // Análisis por oficina
    console.log('\n=== ANÁLISIS POR OFICINA ===');
    reporte.analisisPorOficina.forEach((oficina: any) => {
      console.log(`${oficina.nombre}:`);
      console.log(`  - Expedientes procesados: ${oficina.expedientes}`);
      console.log(`  - Tiempo promedio: ${oficina.tiempoPromedio} min`);
      console.log(`  - Eficiencia: ${oficina.eficiencia}%`);
    });
    
    // Exportar a Excel
    await this.exportarReporteExcel(reporte, `reporte-${mes}-${año}`);
    
    return reporte;
    
  } catch (error) {
    console.error('Error al generar reporte:', error);
    return null;
  }
}

private async exportarReporteExcel(reporte: any, nombreArchivo: string) {
  try {
    const blob = await this.flujoService.exportarReporte(reporte, 'EXCEL').toPromise();
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombreArchivo}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`Reporte exportado: ${nombreArchivo}.xlsx`);
    
  } catch (error) {
    console.error('Error al exportar reporte:', error);
  }
}
```

## Integración con Componentes

### Servicio de Estado Reactivo

```typescript
@Injectable({
  providedIn: 'root'
})
export class ExpedienteStateService {
  private flujoService = inject(FlujoTrabajoService);
  
  // Estados reactivos
  private expedientesSubject = new BehaviorSubject<any[]>([]);
  private estadosSubject = new BehaviorSubject<Map<string, EstadoFlujo>>(new Map());
  
  expedientes$ = this.expedientesSubject.asObservable();
  estados$ = this.estadosSubject.asObservable();
  
  // Cargar expedientes y sus estados
  async cargarExpedientes(filtros?: any) {
    try {
      const expedientes = await this.expedienteService.getExpedientes(filtros).toPromise();
      this.expedientesSubject.next(expedientes);
      
      // Cargar estados de cada expediente
      const estadosMap = new Map<string, EstadoFlujo>();
      
      for (const expediente of expedientes) {
        try {
          const estado = await this.flujoService.getEstadoFlujo(expediente.id).toPromise();
          estadosMap.set(expediente.id, estado);
        } catch (error) {
          console.warn(`No se pudo cargar estado para expediente ${expediente.id}`);
        }
      }
      
      this.estadosSubject.next(estadosMap);
      
    } catch (error) {
      console.error('Error al cargar expedientes:', error);
    }
  }
  
  // Actualizar estado de un expediente específico
  async actualizarEstadoExpediente(expedienteId: string) {
    try {
      const estado = await this.flujoService.getEstadoFlujo(expedienteId).toPromise();
      const estadosActuales = this.estadosSubject.value;
      estadosActuales.set(expedienteId, estado);
      this.estadosSubject.next(new Map(estadosActuales));
    } catch (error) {
      console.error(`Error al actualizar estado de expediente ${expedienteId}:`, error);
    }
  }
  
  // Obtener estado de un expediente específico
  getEstadoExpediente(expedienteId: string): EstadoFlujo | null {
    return this.estadosSubject.value.get(expedienteId) || null;
  }
}
```

### Componente de Lista de Expedientes con Estados

```typescript
@Component({
  selector: 'app-lista-expedientes',
  template: `
    <div class="expedientes-container">
      <h2>Lista de Expedientes</h2>
      
      <mat-table [dataSource]="dataSource" class="expedientes-table">
        <!-- Columna ID -->
        <ng-container matColumnDef="id">
          <mat-header-cell *matHeaderCellDef>ID</mat-header-cell>
          <mat-cell *matCellDef="let expediente">{{ expediente.id }}</mat-cell>
        </ng-container>
        
        <!-- Columna Tipo -->
        <ng-container matColumnDef="tipo">
          <mat-header-cell *matHeaderCellDef>Tipo</mat-header-cell>
          <mat-cell *matCellDef="let expediente">{{ expediente.tipo }}</mat-cell>
        </ng-container>
        
        <!-- Columna Estado del Flujo -->
        <ng-container matColumnDef="estadoFlujo">
          <mat-header-cell *matHeaderCellDef>Estado</mat-header-cell>
          <mat-cell *matCellDef="let expediente">
            <mat-chip 
              [color]="getEstadoColor(getEstado(expediente.id)?.estado)"
              *ngIf="getEstado(expediente.id)">
              {{ getEstado(expediente.id)?.estado }}
            </mat-chip>
            <mat-spinner diameter="20" *ngIf="!getEstado(expediente.id)"></mat-spinner>
          </mat-cell>
        </ng-container>
        
        <!-- Columna Oficina Actual -->
        <ng-container matColumnDef="oficinaActual">
          <mat-header-cell *matHeaderCellDef>Oficina Actual</mat-header-cell>
          <mat-cell *matCellDef="let expediente">
            {{ getEstado(expediente.id)?.oficinaActualId || 'Cargando...' }}
          </mat-cell>
        </ng-container>
        
        <!-- Columna Progreso -->
        <ng-container matColumnDef="progreso">
          <mat-header-cell *matHeaderCellDef>Progreso</mat-header-cell>
          <mat-cell *matCellDef="let expediente">
            <div class="progreso-cell" *ngIf="getEstado(expediente.id)">
              <mat-progress-bar 
                mode="determinate" 
                [value]="getEstado(expediente.id)?.porcentajeCompletado">
              </mat-progress-bar>
              <span>{{ getEstado(expediente.id)?.porcentajeCompletado }}%</span>
            </div>
          </mat-cell>
        </ng-container>
        
        <!-- Columna Acciones -->
        <ng-container matColumnDef="acciones">
          <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
          <mat-cell *matCellDef="let expediente">
            <button mat-icon-button (click)="verDetalle(expediente.id)">
              <mat-icon>visibility</mat-icon>
            </button>
            <button mat-icon-button (click)="moverExpediente(expediente.id)">
              <mat-icon>forward</mat-icon>
            </button>
          </mat-cell>
        </ng-container>
        
        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
      </mat-table>
    </div>
  `
})
export class ListaExpedientesComponent implements OnInit, OnDestroy {
  private expedienteStateService = inject(ExpedienteStateService);
  private destroy$ = new Subject<void>();
  
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns = ['id', 'tipo', 'estadoFlujo', 'oficinaActual', 'progreso', 'acciones'];
  estados = new Map<string, EstadoFlujo>();
  
  ngOnInit() {
    // Suscribirse a expedientes
    this.expedienteStateService.expedientes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(expedientes => {
        this.dataSource.data = expedientes;
      });
    
    // Suscribirse a estados
    this.expedienteStateService.estados$
      .pipe(takeUntil(this.destroy$))
      .subscribe(estados => {
        this.estados = estados;
      });
    
    // Cargar datos iniciales
    this.expedienteStateService.cargarExpedientes();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  getEstado(expedienteId: string): EstadoFlujo | null {
    return this.estados.get(expedienteId) || null;
  }
  
  getEstadoColor(estado?: string): string {
    switch (estado) {
      case 'COMPLETADO': return 'primary';
      case 'EN_PROCESO': return 'accent';
      case 'RECHAZADO': return 'warn';
      default: return '';
    }
  }
  
  verDetalle(expedienteId: string) {
    // Navegar a detalle del expediente
    this.router.navigate(['/expedientes', expedienteId]);
  }
  
  moverExpediente(expedienteId: string) {
    // Abrir modal para mover expediente
    const dialogRef = this.dialog.open(MoverExpedienteDialogComponent, {
      data: { expedienteId }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Actualizar estado del expediente
        this.expedienteStateService.actualizarEstadoExpediente(expedienteId);
      }
    });
  }
}
```

## Casos de Uso Avanzados

### Validación de Flujo Antes de Crear

```typescript
async validarYCrearFlujo(datosFlujo: any) {
  try {
    // Primero validar el flujo
    const validacion = await this.flujoService.validarFlujo(datosFlujo).toPromise();
    
    if (!validacion.valido) {
      console.error('Errores de validación:');
      validacion.errores.forEach(error => {
        console.error(`- ${error}`);
      });
      
      // Mostrar errores al usuario
      this.mostrarErroresValidacion(validacion.errores);
      return null;
    }
    
    // Si la validación es exitosa, crear el flujo
    const flujoCreado = await this.flujoService.crearFlujo(datosFlujo).toPromise();
    console.log('Flujo creado y validado exitosamente:', flujoCreado.id);
    
    return flujoCreado;
    
  } catch (error) {
    console.error('Error en validación/creación de flujo:', error);
    return null;
  }
}

private mostrarErroresValidacion(errores: string[]) {
  const mensaje = errores.join('\n');
  this.dialog.open(ErrorDialogComponent, {
    data: {
      titulo: 'Errores de Validación',
      mensaje: mensaje
    }
  });
}
```

### Sistema de Notificaciones Automáticas

```typescript
@Injectable({
  providedIn: 'root'
})
export class NotificacionesFlujosService {
  private flujoService = inject(FlujoTrabajoService);
  private notificationService = inject(NotificationService);
  
  // Verificar notificaciones pendientes cada 5 minutos
  iniciarMonitoreoNotificaciones() {
    interval(5 * 60 * 1000) // 5 minutos
      .subscribe(() => {
        this.procesarNotificacionesPendientes();
      });
  }
  
  private async procesarNotificacionesPendientes() {
    try {
      const notificaciones = await this.flujoService.getNotificacionesPendientes().toPromise();
      
      for (const notificacion of notificaciones) {
        await this.enviarNotificacion(notificacion);
      }
      
    } catch (error) {
      console.error('Error al procesar notificaciones:', error);
    }
  }
  
  private async enviarNotificacion(notificacion: any) {
    try {
      switch (notificacion.tipo) {
        case 'EMAIL':
          await this.enviarEmail(notificacion);
          break;
        case 'SMS':
          await this.enviarSMS(notificacion);
          break;
        case 'SISTEMA':
          await this.mostrarNotificacionSistema(notificacion);
          break;
      }
      
      console.log(`Notificación enviada: ${notificacion.tipo} - ${notificacion.asunto}`);
      
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  }
  
  private async enviarEmail(notificacion: any) {
    // Implementar envío de email
    return this.flujoService.enviarNotificacion({
      ...notificacion,
      canal: 'EMAIL'
    }).toPromise();
  }
  
  private async enviarSMS(notificacion: any) {
    // Implementar envío de SMS
    return this.flujoService.enviarNotificacion({
      ...notificacion,
      canal: 'SMS'
    }).toPromise();
  }
  
  private async mostrarNotificacionSistema(notificacion: any) {
    // Mostrar notificación en el sistema
    this.notificationService.show({
      title: notificacion.asunto,
      message: notificacion.mensaje,
      type: 'info',
      duration: 5000
    });
  }
}
```

### Métricas en Tiempo Real

```typescript
@Component({
  selector: 'app-metricas-tiempo-real',
  template: `
    <div class="metricas-container">
      <h2>Métricas en Tiempo Real</h2>
      
      <div class="metricas-grid">
        <mat-card class="metrica-card">
          <mat-card-header>
            <mat-card-title>Expedientes Activos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="numero-grande">{{ metricas?.expedientesActivos || 0 }}</div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="metrica-card">
          <mat-card-header>
            <mat-card-title>Tiempo Promedio</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="numero-grande">{{ metricas?.tiempoPromedio || 0 }} min</div>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="metrica-card">
          <mat-card-header>
            <mat-card-title>Eficiencia General</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="numero-grande">{{ metricas?.eficiencia || 0 }}%</div>
            <mat-progress-bar 
              mode="determinate" 
              [value]="metricas?.eficiencia || 0">
            </mat-progress-bar>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="alertas-section" *ngIf="alertas.length > 0">
        <h3>Alertas Activas</h3>
        <mat-list>
          <mat-list-item *ngFor="let alerta of alertas">
            <mat-icon matListIcon [color]="getAlertaColor(alerta.nivel)">
              {{ getAlertaIcon(alerta.nivel) }}
            </mat-icon>
            <h4 matLine>{{ alerta.titulo }}</h4>
            <p matLine>{{ alerta.mensaje }}</p>
          </mat-list-item>
        </mat-list>
      </div>
    </div>
  `
})
export class MetricasTiempoRealComponent implements OnInit, OnDestroy {
  private flujoService = inject(FlujoTrabajoService);
  private destroy$ = new Subject<void>();
  
  metricas: any = null;
  alertas: any[] = [];
  
  ngOnInit() {
    this.cargarMetricas();
    
    // Actualizar cada 30 segundos
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarMetricas());
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private async cargarMetricas() {
    try {
      const dashboard = await this.flujoService.getDashboardFlujos().toPromise();
      this.metricas = dashboard;
      this.alertas = dashboard.alertas || [];
      
    } catch (error) {
      console.error('Error al cargar métricas:', error);
    }
  }
  
  getAlertaColor(nivel: string): string {
    switch (nivel) {
      case 'CRITICA': return 'warn';
      case 'ALTA': return 'accent';
      case 'MEDIA': return 'primary';
      default: return '';
    }
  }
  
  getAlertaIcon(nivel: string): string {
    switch (nivel) {
      case 'CRITICA': return 'error';
      case 'ALTA': return 'warning';
      case 'MEDIA': return 'info';
      default: return 'notifications';
    }
  }
}
```

## Notas de Integración Futura

### Componentes Recomendados para Integración

1. **ExpedientesComponent**: Para mostrar flujos activos de cada expediente
2. **OficinasComponent**: Para gestionar expedientes en cada oficina
3. **DashboardComponent**: Para métricas generales del sistema
4. **ReportesComponent**: Para generar reportes de flujos
5. **NotificacionesComponent**: Para mostrar alertas y recordatorios

### Consideraciones de Performance

- Implementar cache local con TTL para reducir llamadas al backend
- Usar paginación para listas grandes de expedientes
- Implementar lazy loading para componentes de reportes
- Considerar WebSockets para actualizaciones en tiempo real

### Seguridad

- Validar permisos de usuario antes de mostrar flujos
- Implementar audit trail para todos los movimientos
- Encriptar datos sensibles en tránsito y reposo
- Implementar rate limiting para APIs

Este servicio está completamente preparado para su integración futura en el sistema SIRRET.