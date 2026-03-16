# 📊 Análisis: Módulo de Estadísticas de Rutas con Mapa

## 🔴 Problemas Identificados

### 1. **Ruta No Existe**
- **Ubicación**: `frontend/src/app/app.routes.ts`
- **Problema**: No existe la ruta `/rutas/estadisticas`
- **Síntoma**: El botón en `rutas.component.html` (línea 111) apunta a `/rutas/estadisticas` pero no hay componente
- **Impacto**: Al hacer click, la navegación falla

### 2. **Componente No Existe**
- **Archivo esperado**: `frontend/src/app/components/rutas/rutas-estadisticas.component.ts`
- **Estado**: No existe
- **Referencias encontradas**: 
  - En documentación: `INSTRUCCIONES_MAPA_PUNO.md`
  - En documentación: `RESUMEN_FINAL_MAPA_PUNO.md`
  - En documentación: `RESUMEN_MAPA_PUNO.md`

### 3. **Mapa No Implementado**
- **Archivo esperado**: `frontend/src/app/components/rutas/mapa-rutas-puno.component.ts`
- **Estado**: No existe
- **Referencias encontradas**: En documentación como componente que debería existir

### 4. **Inconsistencia de Datos**
- **Problema**: Las rutas no cargan coordenadas completas (ya corregido en `ruta.service.ts`)
- **Impacto**: El mapa no puede renderizar rutas sin coordenadas

---

## ✅ Soluciones Recomendadas

### Solución 1: Crear Componente de Estadísticas de Rutas

**Archivo**: `frontend/src/app/components/rutas/rutas-estadisticas.component.ts`

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../models/ruta.model';

@Component({
  selector: 'app-rutas-estadisticas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  template: `
    <div class="estadisticas-container">
      <div class="page-header">
        <h1>
          <mat-icon>analytics</mat-icon>
          Estadísticas de Rutas
        </h1>
        <p>Análisis y visualización de rutas del sistema</p>
      </div>

      <mat-tab-group>
        <!-- Tab 1: Resumen General -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>dashboard</mat-icon>
            <span>Resumen General</span>
          </ng-template>
          
          <div class="tab-content">
            <div class="stats-grid">
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-value">{{ totalRutas }}</div>
                  <div class="stat-label">Total de Rutas</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card success">
                <mat-card-content>
                  <div class="stat-value">{{ rutasConCoordenadas }}</div>
                  <div class="stat-label">Con Coordenadas</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card error">
                <mat-card-content>
                  <div class="stat-value">{{ rutasSinCoordenadas }}</div>
                  <div class="stat-label">Sin Coordenadas</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-value">{{ porcentajeCoordenadas.toFixed(1) }}%</div>
                  <div class="stat-label">Completitud</div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 2: Mapa -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>map</mat-icon>
            <span>Mapa de Rutas</span>
          </ng-template>
          
          <div class="tab-content">
            <div class="mapa-container">
              <p>Mapa de rutas (próximamente)</p>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 3: Detalles -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>list</mat-icon>
            <span>Detalles</span>
          </ng-template>
          
          <div class="tab-content">
            <p>Detalles de rutas (próximamente)</p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .estadisticas-container {
      padding: 24px;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px;
      margin: -24px -24px 32px -24px;
      border-radius: 0 0 16px 16px;
    }

    .page-header h1 {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }

    .page-header p {
      margin: 8px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }

    .tab-content {
      padding: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
    }

    .stat-card {
      text-align: center;
      padding: 24px;
      border-radius: 12px;
      background: white;
      border: 1px solid #e8eaed;
    }

    .stat-card.success {
      background: #e8f5e9;
      border-color: #4caf50;
    }

    .stat-card.error {
      background: #ffebee;
      border-color: #f44336;
    }

    .stat-value {
      font-size: 48px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 8px;
    }

    .stat-card.success .stat-value {
      color: #4caf50;
    }

    .stat-card.error .stat-value {
      color: #f44336;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .mapa-container {
      height: 600px;
      background: #f5f5f5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
  `]
})
export class RutasEstadisticasComponent implements OnInit {
  private rutaService = inject(RutaService);

  totalRutas = 0;
  rutasConCoordenadas = 0;
  rutasSinCoordenadas = 0;
  porcentajeCoordenadas = 0;

  ngOnInit() {
    this.cargarEstadisticas();
  }

  private cargarEstadisticas() {
    this.rutaService.getRutas().subscribe({
      next: (rutas: Ruta[]) => {
        this.totalRutas = rutas.length;
        
        this.rutasConCoordenadas = rutas.filter(r => 
          r.origen?.coordenadas && r.destino?.coordenadas
        ).length;
        
        this.rutasSinCoordenadas = this.totalRutas - this.rutasConCoordenadas;
        
        this.porcentajeCoordenadas = this.totalRutas > 0 
          ? (this.rutasConCoordenadas / this.totalRutas) * 100 
          : 0;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }
}
```

### Solución 2: Agregar Ruta en `app.routes.ts`

```typescript
// En el array de rutas, agregar:
{ path: 'rutas/estadisticas', loadComponent: () => import('./components/rutas/rutas-estadisticas.component').then(m => m.RutasEstadisticasComponent) },
```

### Solución 3: Crear Componente de Mapa de Rutas (Futuro)

**Archivo**: `frontend/src/app/components/rutas/mapa-rutas.component.ts`

```typescript
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../models/ruta.model';

@Component({
  selector: 'app-mapa-rutas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div id="mapa-rutas" class="mapa-container"></div>
  `,
  styles: [`
    .mapa-container {
      width: 100%;
      height: 600px;
      border-radius: 8px;
      overflow: hidden;
    }
  `]
})
export class MapaRutasComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | null = null;
  private rutas: Ruta[] = [];

  constructor(private rutaService: RutaService) {}

  ngOnInit() {
    this.cargarRutas();
  }

  ngAfterViewInit() {
    this.inicializarMapa();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private cargarRutas() {
    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        this.rutas = rutas;
        if (this.map) {
          this.renderizarRutas();
        }
      },
      error: (error) => console.error('Error cargando rutas:', error)
    });
  }

  private inicializarMapa() {
    this.map = L.map('mapa-rutas').setView([-15.5, -70.1], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.renderizarRutas();
  }

  private renderizarRutas() {
    if (!this.map) return;

    this.rutas.forEach(ruta => {
      if (ruta.origen?.coordenadas && ruta.destino?.coordenadas) {
        const latlngs: L.LatLngExpression[] = [
          [ruta.origen.coordenadas.latitud, ruta.origen.coordenadas.longitud],
          [ruta.destino.coordenadas.latitud, ruta.destino.coordenadas.longitud]
        ];

        L.polyline(latlngs, {
          color: '#667eea',
          weight: 2,
          opacity: 0.7
        }).addTo(this.map!);

        // Marcadores
        L.circleMarker(latlngs[0], {
          radius: 6,
          fillColor: '#4caf50',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).bindPopup(`Origen: ${ruta.origen.nombre}`).addTo(this.map!);

        L.circleMarker(latlngs[1], {
          radius: 6,
          fillColor: '#f44336',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).bindPopup(`Destino: ${ruta.destino.nombre}`).addTo(this.map!);
      }
    });
  }
}
```

---

## 📋 Checklist de Implementación

- [ ] Crear `rutas-estadisticas.component.ts`
- [ ] Agregar ruta en `app.routes.ts`
- [ ] Probar navegación a `/rutas/estadisticas`
- [ ] Verificar que se cargan estadísticas correctamente
- [ ] Crear `mapa-rutas.component.ts` (futuro)
- [ ] Integrar mapa en estadísticas (futuro)
- [ ] Validar que las coordenadas se cargan correctamente

---

## 🎯 Impacto Esperado

✅ Botón de estadísticas funcionará correctamente
✅ Se mostrarán estadísticas de rutas
✅ Base para agregar mapa de rutas
✅ Mejor visualización de datos de rutas
✅ Consistencia con módulo de localidades
