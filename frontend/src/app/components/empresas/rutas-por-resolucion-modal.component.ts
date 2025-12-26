import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { RutaService } from '../../services/ruta.service';
import { ResolucionService } from '../../services/resolucion.service';
import { Empresa } from '../../models/empresa.model';
import { Ruta } from '../../models/ruta.model';
import { Resolucion } from '../../models/resolucion.model';

export interface RutasPorResolucionData {
  empresa: Empresa;
}

interface RutaConResolucion extends Ruta {
  resolucion?: Resolucion;
}

interface ResolucionConRutas {
  resolucion: Resolucion;
  rutas: RutaConResolucion[];
  totalRutas: number;
}

@Component({
  selector: 'app-rutas-por-resolucion-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatBadgeModule,
    SmartIconComponent
  ],
  templateUrl: './rutas-por-resolucion-modal.component.html',
  styleUrls: ['./rutas-por-resolucion-modal.component.scss']
})
export class RutasPorResolucionModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<RutasPorResolucionModalComponent>);
  data = inject<RutasPorResolucionData>(MAT_DIALOG_DATA);
  private rutaService = inject(RutaService);
  private resolucionService = inject(ResolucionService);

  // Signals
  isLoading = signal(true);
  resolucionesConRutas = signal<ResolucionConRutas[]>([]);

  // Computed
  totalRutas = computed(() => 
    this.resolucionesConRutas().reduce((total, item) => total + item.totalRutas, 0)
  );

  // Table columns
  displayedColumns = ['codigo', 'nombre', 'origen-destino', 'distancia', 'tarifa', 'estado', 'acciones'];

  ngOnInit(): void {
    this.cargarRutasPorResolucion();
  }

  private cargarRutasPorResolucion(): void {
    this.isLoading.set(true);

    // Cargar rutas de la empresa
    this.rutaService.getRutasPorEmpresa(this.data.empresa.id).subscribe({
      next: (rutas) => {
        console.log('🔍 Rutas cargadas:', rutas);
        this.organizarRutasPorResolucion(rutas);
      },
      error: (error) => {
        console.error('❌ Error cargando rutas:', error);
        this.isLoading.set(false);
      }
    });
  }

  private organizarRutasPorResolucion(rutas: Ruta[]): void {
    // Agrupar rutas por resolución
    const rutasPorResolucion = new Map<string, RutaConResolucion[]>();

    rutas.forEach(ruta => {
      const resolucionId = ruta.resolucionId;
      if (resolucionId) {
        if (!rutasPorResolucion.has(resolucionId)) {
          rutasPorResolucion.set(resolucionId, []);
        }
        rutasPorResolucion.get(resolucionId)!.push(ruta);
      }
    });

    // Cargar información de las resoluciones
    const resolucionIds = Array.from(rutasPorResolucion.keys());
    
    if (resolucionIds.length === 0) {
      this.isLoading.set(false);
      return;
    }

    // Cargar resoluciones
    this.resolucionService.getResoluciones().subscribe({
      next: (resoluciones) => {
        const resolucionesConRutasData: ResolucionConRutas[] = [];

        resolucionIds.forEach(resolucionId => {
          const resolucion = resoluciones.find(r => r.id === resolucionId);
          const rutasDeResolucion = rutasPorResolucion.get(resolucionId) || [];

          if (resolucion) {
            resolucionesConRutasData.push({
              resolucion,
              rutas: rutasDeResolucion,
              totalRutas: rutasDeResolucion.length
            });
          }
        });

        // Ordenar por fecha de emisión (más reciente primero)
        resolucionesConRutasData.sort((a, b) => 
          new Date(b.resolucion.fechaEmision).getTime() - new Date(a.resolucion.fechaEmision).getTime()
        );

        this.resolucionesConRutas.set(resolucionesConRutasData);
        this.isLoading.set(false);
        console.log('✅ Rutas organizadas por resolución:', resolucionesConRutasData);
      },
      error: (error) => {
        console.error('❌ Error cargando resoluciones:', error);
        this.isLoading.set(false);
      }
    });
  }

  getEstadoColor(estado: string): 'primary' | 'accent' | 'warn' {
    switch (estado?.toUpperCase()) {
      case 'VIGENTE':
      case 'APROBADA':
        return 'primary';
      case 'PENDIENTE':
      case 'EN_TRAMITE':
        return 'accent';
      case 'VENCIDA':
      case 'ANULADA':
      case 'RECHAZADA':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getEstadoRutaColor(estado: string): 'primary' | 'accent' | 'warn' {
    switch (estado?.toUpperCase()) {
      case 'ACTIVA':
        return 'primary';
      case 'INACTIVA':
      case 'SUSPENDIDA':
        return 'warn';
      case 'EN_MANTENIMIENTO':
        return 'accent';
      default:
        return 'primary';
    }
  }

  formatFecha(fecha: string | Date): string {
    if (!fecha) return 'No disponible';
    
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  verDetalleRuta(ruta: Ruta): void {
    console.log('Ver detalle de ruta:', ruta);
    // Aquí podrías abrir otro modal o navegar a la vista de detalle
  }

  editarRuta(ruta: Ruta): void {
    console.log('Editar ruta:', ruta);
    // Aquí podrías abrir un modal de edición
  }

  exportarRutas(): void {
    const data = this.resolucionesConRutas();
    console.log('Exportar rutas:', data);
    // Implementar exportación a Excel/PDF
  }
}