import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  // Ya no necesitamos campos adicionales porque la resolución está embebida
}

interface ResolucionConRutas {
  resolucionId: string;
  nroResolucion: string;
  tipoResolucion: string;
  tipoTramite: string;
  estado: string;
  empresa: {
    id: string;
    ruc: string;
    razonSocial: string;
  };
  rutas: Ruta[];
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
    // Agrupar rutas por resolución usando la resolución embebida
    const rutasPorResolucion = new Map<string, Ruta[]>();

    rutas.forEach(ruta => {
      const resolucionId = ruta.resolucion?.id;
      if (resolucionId) {
        if (!rutasPorResolucion.has(resolucionId)) {
          rutasPorResolucion.set(resolucionId, []);
        }
        rutasPorResolucion.get(resolucionId)!.push(ruta);
      }
    });

    // Crear estructura de resoluciones con rutas usando datos embebidos
    const resolucionesConRutas: ResolucionConRutas[] = [];
    
    rutasPorResolucion.forEach((rutasDeResolucion, resolucionId) => {
      if (rutasDeResolucion.length > 0) {
        // Usar datos de la primera ruta para obtener información de la resolución
        const primeraRuta = rutasDeResolucion[0];
        
        resolucionesConRutas.push({
          resolucionId: resolucionId,
          nroResolucion: primeraRuta.resolucion.nroResolucion,
          tipoResolucion: primeraRuta.resolucion.tipoResolucion,
          tipoTramite: primeraRuta.resolucion.tipoResolucion,
          estado: primeraRuta.resolucion.estado,
          empresa: primeraRuta.empresa,
          rutas: rutasDeResolucion,
          totalRutas: rutasDeResolucion.length
        });
      }
    });

    // Ordenar por número de resolución
    resolucionesConRutas.sort((a, b) => 
      a.nroResolucion.localeCompare(b.nroResolucion)
    );

    this.resolucionesConRutas.set(resolucionesConRutas);
    this.isLoading.set(false);
    
    console.log('✅ Rutas organizadas por resolución:', resolucionesConRutas);
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
    // Navegar al módulo de rutas con la ruta específica
    this.dialogRef.close();
    
    const router = inject(Router);
    router.navigate(['/rutas'], {
      queryParams: {
        empresaId: this.data.empresa.id,
        empresaRuc: this.data.empresa.ruc,
        empresaNombre: this.data.empresa.razonSocial.principal,
        rutaId: ruta.id,
        accion: 'ver-detalle'
      }
    });
  }

  editarRuta(ruta: Ruta): void {
    console.log('Editar ruta:', ruta);
    // Navegar al módulo de rutas para editar
    this.dialogRef.close();
    
    const router = inject(Router);
    router.navigate(['/rutas'], {
      queryParams: {
        empresaId: this.data.empresa.id,
        empresaRuc: this.data.empresa.ruc,
        empresaNombre: this.data.empresa.razonSocial.principal,
        rutaId: ruta.id,
        accion: 'editar'
      }
    });
  }

  irAModuloRutas(): void {
    // Cerrar modal y navegar al módulo de rutas
    this.dialogRef.close();
    
    const router = inject(Router);
    router.navigate(['/rutas'], {
      queryParams: {
        empresaId: this.data.empresa.id,
        empresaRuc: this.data.empresa.ruc,
        empresaNombre: this.data.empresa.razonSocial.principal
      }
    });
  }

  exportarRutas(): void {
    const data = this.resolucionesConRutas();
    console.log('Exportar rutas:', data);
    // Implementar exportación a Excel/PDF
  }
}