import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';

interface EstadisticasVehiculos {
  totalVehiculos: number;
  vehiculosActivos: number;
  vehiculosInactivos: number;
  vehiculosEnMantenimiento: number;
  vehiculosFueraDeServicio: number;
  vehiculosConTucVigente: number;
  vehiculosSinResolucion: number;
  promedioVehiculosPorEmpresa: number;
  distribucionPorCategoria: { [key: string]: number };
  distribucionPorMarca: { [key: string]: number };
  distribucionPorAnio: { [key: string]: number };
  distribucionPorSede: { [key: string]: number };
}

interface AlertaVehiculo {
  tipo: 'tuc_vencido' | 'sin_resolucion' | 'mantenimiento_pendiente' | 'documentos_faltantes';
  vehiculoId: string;
  placa: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja';
  fechaVencimiento?: string;
}

@Component({
  selector: 'app-vehiculos-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    SmartIconComponent
  ],
  template: `<div>Componente en mantenimiento - Template simplificado</div>`,  styles
: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .header-content h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 28px;
    }

    .header-content p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 24px;
      color: #666;
    }

    .metricas-principales {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .metrica-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }

    .metrica-card:hover {
      transform: translateY(-2px);
    }

    .metrica-card.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .metrica-card.activos {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .metrica-card.tuc-vigente {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    }

    .metrica-card.promedio {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    .metrica-icon {
      opacity: 0.9;
    }

    .metrica-info h2 {
      margin: 0 0 4px 0;
      font-size: 36px;
      font-weight: 700;
    }

    .metrica-info p {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 500;
      opacity: 0.9;
    }

    .metrica-info small {
      font-size: 12px;
      opacity: 0.8;
    }

    .alertas-card {
      margin-bottom: 32px;
    }

    .alertas-lista {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .alerta-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .alerta-item.prioridad-alta {
      background: #ffebee;
      border-left-color: #f44336;
    }

    .alerta-item.prioridad-media {
      background: #fff3e0;
      border-left-color: #ff9800;
    }

    .alerta-item.prioridad-baja {
      background: #e8f5e8;
      border-left-color: #4caf50;
    }

    .alerta-info {
      flex: 1;
    }

    .alerta-info h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .alerta-info p {
      margin: 0 0 4px 0;
      color: #666;
    }

    .alerta-info small {
      color: #999;
      font-size: 12px;
    }

    .ver-mas-alertas {
      text-align: center;
      padding: 16px;
    }

    .graficos-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .grafico-card {
      min-height: 300px;
    }

    .distribucion-estados {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .estado-item {
      position: relative;
    }

    .estado-barra {
      height: 8px;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .estado-item.activo .estado-barra {
      background: linear-gradient(90deg, #4caf50, #66bb6a);
    }

    .estado-item.inactivo .estado-barra {
      background: linear-gradient(90deg, #f44336, #ef5350);
    }

    .estado-item.mantenimiento .estado-barra {
      background: linear-gradient(90deg, #ff9800, #ffb74d);
    }

    .estado-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .estado-label {
      font-weight: 500;
    }

    .estado-valor {
      font-weight: 600;
      color: #1976d2;
    }

    .distribucion-categorias {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .categoria-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .categoria-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .categoria-barra {
      height: 6px;
      background: #f5f5f5;
      border-radius: 3px;
      overflow: hidden;
    }

    .categoria-progreso {
      height: 100%;
      background: linear-gradient(90deg, #1976d2, #42a5f5);
      transition: width 0.3s ease;
    }

    .distribuciones-adicionales {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .top-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .top-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .top-nombre {
      font-weight: 500;
    }

    .top-cantidad {
      font-weight: 600;
      color: #1976d2;
    }

    .sedes-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .sede-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .sede-nombre {
      flex: 1;
      font-weight: 500;
    }

    .acciones-card {
      margin-bottom: 32px;
    }

    .acciones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .acciones-grid button {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      height: auto;
      text-align: left;
    }

    .accion-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .accion-info span {
      font-weight: 500;
      font-size: 16px;
    }

    .accion-info small {
      color: rgba(255,255,255,0.8);
      font-size: 12px;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 16px;
      }

      .metricas-principales {
        grid-template-columns: 1fr;
      }

      .graficos-container {
        grid-template-columns: 1fr;
      }

      .distribuciones-adicionales {
        grid-template-columns: 1fr;
      }

      .acciones-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VehiculosDashboardComponent implements OnInit {
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);

  // Estado del componente
  cargando = signal(true);
  estadisticas = signal<EstadisticasVehiculos | null>(null);
  vehiculos = signal<Vehiculo[]>([]);
  empresas = signal<Empresa[]>([]);
  alertas = signal<AlertaVehiculo[]>([]);

  ngOnInit(): void {
    this.cargarDatos();
  }

  private async cargarDatos(): Promise<void> {
    this.cargando.set(true);
    
    try {
      // Cargar datos en paralelo
      const [vehiculos, empresas] = await (Promise as any).all([
        this.vehiculoService.getVehiculos().toPromise(),
        this.empresaService.getEmpresas().toPromise()
      ]);

      this.vehiculos.set(vehiculos || []);
      this.empresas.set(empresas || []);
      
      // Calcular estadísticas
      this.calcularEstadisticas();
      
      // Generar alertas
      this.generarAlertas();
      
    } catch (error) {
      (console as any).error('Error cargando datos del dashboard:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  private calcularEstadisticas(): void {
    const vehiculos = this.vehiculos();
    const empresas = this.empresas();

    const estadisticas: EstadisticasVehiculos = {
      totalVehiculos: (vehiculos as any).length,
      vehiculosActivos: (vehiculos as any).filter((v: any) => (v as any).estado === 'ACTIVO').length,
      vehiculosInactivos: (vehiculos as any).filter((v: any) => (v as any).estado === 'INACTIVO').length,
      vehiculosEnMantenimiento: (vehiculos as any).filter((v: any) => (v as any).estado === 'EN_MANTENIMIENTO').length,
      vehiculosFueraDeServicio: (vehiculos as any).filter((v: any) => (v as any).estado === 'FUERA_DE_SERVICIO').length,
      vehiculosConTucVigente: (vehiculos as any).filter((v: any) => (v as any).tuc && this.isTucVigente((v as any).tuc)).length,
      vehiculosSinResolucion: (vehiculos as any).filter((v: any) => !(v as any).resolucionId).length,
      promedioVehiculosPorEmpresa: (empresas as any).length > 0 ? (vehiculos as any).length / (empresas as any).length : 0,
      distribucionPorCategoria: this.calcularDistribucion(vehiculos, 'categoria'),
      distribucionPorMarca: this.calcularDistribucion(vehiculos, 'marca'),
      distribucionPorAnio: this.calcularDistribucion(vehiculos, 'anioFabricacion'),
      distribucionPorSede: this.calcularDistribucion(vehiculos, 'sedeRegistro')
    };

    this.estadisticas.set(estadisticas);
  }

  private calcularDistribucion(vehiculos: Vehiculo[], campo: keyof Vehiculo): { [key: string]: number } {
    const distribucion: { [key: string]: number } = {};
    
    (vehiculos as any).forEach((vehiculo: any) => {
      const valor = String(vehiculo[campo] || 'Sin especificar');
      distribucion[valor] = (distribucion[valor] || 0) + 1;
    });

    return distribucion;
  }

  private isTucVigente(tuc: unknown): boolean {
    if (!tuc || !(tuc as any).fechaEmision) return false;
    
    const fechaEmision = new Date((tuc as any).fechaEmision);
    const fechaVencimiento = new Date(fechaEmision);
    (fechaVencimiento as any).setFullYear((fechaVencimiento as any).getFullYear() + 1); // TUC válido por 1 año
    
    return fechaVencimiento > new Date();
  }

  private generarAlertas(): void {
    const vehiculos = this.vehiculos();
    const alertas: AlertaVehiculo[] = [];

    (vehiculos as any).forEach((vehiculo: any) => {
      // TUC vencido o próximo a vencer
      if ((vehiculo as any).tuc) {
        const fechaVencimiento = this.calcularFechaVencimientoTuc((vehiculo as any).tuc);
        const diasParaVencer = this.calcularDiasParaVencer(fechaVencimiento);
        
        if (diasParaVencer < 0) {
          (alertas as any).push({
            tipo: 'tuc_vencido',
            vehiculoId: (vehiculo as any).id,
            placa: (vehiculo as any).placa,
            descripcion: 'TUC vencido',
            prioridad: 'alta',
            fechaVencimiento: (fechaVencimiento as any).toISOString()
          });
        } else if (diasParaVencer <= 30) {
          (alertas as any).push({
            tipo: 'tuc_vencido',
            vehiculoId: (vehiculo as any).id,
            placa: (vehiculo as any).placa,
            descripcion: `TUC vence en ${diasParaVencer} días`,
            prioridad: diasParaVencer <= 7 ? 'alta' : 'media',
            fechaVencimiento: (fechaVencimiento as any).toISOString()
          });
        }
      }

      // Sin resolución
      if (!(vehiculo as any).resolucionId) {
        (alertas as any).push({
          tipo: 'sin_resolucion',
          vehiculoId: (vehiculo as any).id,
          placa: (vehiculo as any).placa,
          descripcion: 'Vehículo sin resolución asignada',
          prioridad: 'media'
        });
      }

      // En mantenimiento por mucho tiempo
      if ((vehiculo as any).estado === 'EN_MANTENIMIENTO') {
        (alertas as any).push({
          tipo: 'mantenimiento_pendiente',
          vehiculoId: (vehiculo as any).id,
          placa: (vehiculo as any).placa,
          descripcion: 'Vehículo en mantenimiento',
          prioridad: 'baja'
        });
      }
    });

    // Ordenar por prioridad
    (alertas as any).sort((a: any, b: any) => {
      const prioridades = { 'alta': 3, 'media': 2, 'baja': 1 };
      return prioridades[(b as any).prioridad as keyof typeof prioridades] - prioridades[(a as any).prioridad as keyof typeof prioridades];
    });

    this.alertas.set(alertas);
  }

  private calcularFechaVencimientoTuc(tuc: unknown): Date {
    const fechaEmision = new Date((tuc as any).fechaEmision);
    const fechaVencimiento = new Date(fechaEmision);
    (fechaVencimiento as any).setFullYear((fechaVencimiento as any).getFullYear() + 1);
    return fechaVencimiento;
  }

  private calcularDiasParaVencer(fechaVencimiento: Date): number {
    const hoy = new Date();
    const diferencia = (fechaVencimiento as any).getTime() - (hoy as any).getTime();
    return (Math as any).ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  // Métodos de utilidad para la UI
  calcularPorcentaje(valor: number): number {
    const total = this.estadisticas()?.totalVehiculos || 1;
    return (Math as any).round((valor / total) * 100);
  }

  calcularCrecimiento(tipo: string): string {
    // Retornar mensaje sin datos simulados hasta implementar históricos reales
    return 'Datos históricos no disponibles';
  }

  getCategorias(): Array<{nombre: string, cantidad: number, porcentaje: number}> {
    const distribucion = this.estadisticas()?.distribucionPorCategoria || {};
    const total = this.estadisticas()?.totalVehiculos || 1;
    
    return (Object as any).entries(distribucion)
      .map(([nombre, cantidad]: any[]) => ({
        nombre,
        cantidad,
        porcentaje: (Math as any).round((cantidad / total) * 100)
      }))
      .sort((a: any, b: any) => (b as any).cantidad - (a as any).cantidad);
  }

  getTopMarcas(): Array<{nombre: string, cantidad: number}> {
    const distribucion = this.estadisticas()?.distribucionPorMarca || {};
    
    return (Object as any).entries(distribucion)
      .map(([nombre, cantidad]: any[]) => ({ nombre, cantidad }))
      .sort((a: any, b: any) => (b as any).cantidad - (a as any).cantidad)
      .slice(0, 5);
  }

  getSedes(): Array<{nombre: string, cantidad: number}> {
    const distribucion = this.estadisticas()?.distribucionPorSede || {};
    
    return (Object as any).entries(distribucion)
      .map(([nombre, cantidad]: any[]) => ({ nombre, cantidad }))
      .sort((a: any, b: any) => (b as any).cantidad - (a as any).cantidad);
  }

  getIconoAlerta(tipo: string): string {
    const iconos = {
      'tuc_vencido': 'schedule',
      'sin_resolucion': 'description',
      'mantenimiento_pendiente': 'build',
      'documentos_faltantes': 'folder_open'
    };
    return iconos[tipo as keyof typeof iconos] || 'warning';
  }

  getColorPrioridad(prioridad: string): string {
    const colores = {
      'alta': 'warn',
      'media': 'accent',
      'baja': 'primary'
    };
    return colores[prioridad as keyof typeof colores] || 'basic';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Métodos de acción
  actualizarDatos(): void {
    this.cargarDatos();
  }

  exportarReporte(formato: 'pdf' | 'excel'): void {
    // Implementar exportación
  }

  abrirCargaMasiva(): void {
    // Implementar apertura de modal de carga masiva
  }

  generarReporteCompleto(): void {
    // Implementar generación de reporte
  }

  configurarAlertas(): void {
    // Implementar configuración de alertas
  }

  exportarDatos(): void {
    // Implementar exportación de datos
  }

  verTodasLasAlertas(): void {
    // Implementar vista de todas las alertas
  }
}