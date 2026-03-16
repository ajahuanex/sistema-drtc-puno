import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RutaService } from '../../services/ruta.service';
import { LocalidadService } from '../../services/localidad.service';

@Component({
  selector: 'app-diagnostico-rutas',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="diagnostico-container">
      <h2>🔍 Diagnóstico de Rutas</h2>
      
      <div class="section">
        <h3>1. Rutas del Backend</h3>
        <button (click)="cargarRutas()">Cargar Rutas</button>
        @if (rutasData) {
          <pre>{{ rutasData }}</pre>
        }
      </div>

      <div class="section">
        <h3>2. Localidades del Backend</h3>
        <button (click)="cargarLocalidades()">Cargar Localidades</button>
        @if (localidadesData) {
          <pre>{{ localidadesData }}</pre>
        }
      </div>

      <div class="section">
        <h3>3. Análisis</h3>
        <button (click)="analizarDatos()">Analizar</button>
        @if (analisisData) {
          <pre>{{ analisisData }}</pre>
        }
      </div>
    </div>
  `,
  styles: [`
    .diagnostico-container {
      padding: 20px;
      background: white;
      border-radius: 8px;
      max-width: 1200px;
      margin: 20px auto;
    }

    h2 {
      color: #667eea;
      margin-bottom: 20px;
    }

    .section {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }

    h3 {
      color: #333;
      margin-bottom: 10px;
    }

    button {
      padding: 8px 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 10px;
    }

    button:hover {
      background: #5a67d8;
    }

    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      max-height: 300px;
      overflow-y: auto;
    }
  `]
})
export class DiagnosticoRutasComponent implements OnInit {
  private rutaService = inject(RutaService);
  private localidadService = inject(LocalidadService);

  rutasData: string | null = null;
  localidadesData: string | null = null;
  analisisData: string | null = null;

  ngOnInit() {
    console.log('🔍 Componente de diagnóstico cargado');
  }

  cargarRutas() {
    console.log('📍 Cargando rutas...');
    this.rutaService.getRutas().subscribe({
      next: (rutas: any) => {
        console.log('✅ Rutas cargadas:', rutas.length);
        
        const resumen = {
          total: rutas.length,
          primera: rutas[0] ? {
            id: rutas[0].id,
            codigoRuta: rutas[0].codigoRuta,
            nombre: rutas[0].nombre,
            origen: {
              id: rutas[0].origen?.id,
              nombre: rutas[0].origen?.nombre,
              tieneCoords: !!rutas[0].origen?.coordenadas
            },
            destino: {
              id: rutas[0].destino?.id,
              nombre: rutas[0].destino?.nombre,
              tieneCoords: !!rutas[0].destino?.coordenadas
            }
          } : null,
          conCoordenadas: rutas.filter((r: any) => r.origen?.coordenadas && r.destino?.coordenadas).length
        };

        this.rutasData = JSON.stringify(resumen, null, 2);
      },
      error: (error) => {
        console.error('❌ Error cargando rutas:', error);
        this.rutasData = `ERROR: ${error.message}`;
      }
    });
  }

  cargarLocalidades() {
    console.log('📍 Cargando localidades...');
    this.localidadService.obtenerTodasLasLocalidades().then(localidades => {
      console.log('✅ Localidades cargadas:', localidades.length);

      const resumen = {
        total: localidades.length,
        primera: localidades[0] ? {
          id: localidades[0].id,
          nombre: localidades[0].nombre,
          tipo: localidades[0].tipo,
          tieneCoords: !!localidades[0].coordenadas,
          coordenadas: localidades[0].coordenadas
        } : null,
        conCoordenadas: localidades.filter(l => l.coordenadas).length
      };

      this.localidadesData = JSON.stringify(resumen, null, 2);
    }).catch(error => {
      console.error('❌ Error cargando localidades:', error);
      this.localidadesData = `ERROR: ${error.message}`;
    });
  }

  analizarDatos() {
    console.log('🔍 Analizando datos...');
    
    this.rutaService.getRutas().subscribe({
      next: (rutas: any) => {
        this.localidadService.obtenerTodasLasLocalidades().then(localidades => {
          const analisis = {
            rutas: {
              total: rutas.length,
              conCoordenadas: rutas.filter((r: any) => r.origen?.coordenadas && r.destino?.coordenadas).length,
              sinCoordenadas: rutas.filter((r: any) => !r.origen?.coordenadas || !r.destino?.coordenadas).length
            },
            localidades: {
              total: localidades.length,
              conCoordenadas: localidades.filter(l => l.coordenadas).length,
              sinCoordenadas: localidades.filter(l => !l.coordenadas).length
            },
            primeraRuta: rutas[0] ? {
              codigoRuta: rutas[0].codigoRuta,
              origenId: rutas[0].origen?.id,
              origenExisteEnLocalidades: localidades.some(l => l.id === rutas[0].origen?.id),
              destinoId: rutas[0].destino?.id,
              destinoExisteEnLocalidades: localidades.some(l => l.id === rutas[0].destino?.id)
            } : null
          };

          this.analisisData = JSON.stringify(analisis, null, 2);
        });
      }
    });
  }
}
