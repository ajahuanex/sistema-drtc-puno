import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../models/ruta.model';
import { MapaRutasComponent } from './mapa-rutas.component';

/**
 * Componente independiente para la pestaña de mapa de rutas.
 * Carga sus propias rutas y renderiza el mapa completo.
 * 
 * Separado de RutasEstadisticasComponent para facilitar el mantenimiento.
 */
@Component({
  selector: 'app-mapa-tab',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MapaRutasComponent],
  template: `
    <div class="mapa-tab-wrapper">
      @if (cargando) {
        <div class="loading-overlay">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando mapa...</p>
        </div>
      } @else {
        <app-mapa-rutas [rutas]="rutas" style="width: 100%; height: 100%; display: block;"></app-mapa-rutas>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .mapa-tab-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
      color: #666;
    }
  `]
})
export class MapaTabComponent implements OnInit, OnDestroy {
  private rutaService = inject(RutaService);

  rutas: Ruta[] = [];
  cargando = true;

  ngOnInit() {
    this.cargarRutas();
  }

  ngOnDestroy() {
    this.rutas = [];
  }

  private cargarRutas() {
    this.cargando = true;
    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        this.rutas = rutas;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando rutas para el mapa:', err);
        this.cargando = false;
      }
    });
  }
}
