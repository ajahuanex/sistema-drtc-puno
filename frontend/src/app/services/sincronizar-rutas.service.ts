import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LocalidadService } from './localidad.service';
import { Localidad } from '../models/localidad.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SincronizarRutasService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private localidadService = inject(LocalidadService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Sincronizar rutas: buscar localidades por nombre y actualizar IDs
   */
  async sincronizarRutasConLocalidades(): Promise<any> {
    console.log('🔄 Iniciando sincronización de rutas...');

    try {
      // 1. Obtener todas las localidades
      const localidades = await this.localidadService.obtenerTodasLasLocalidades();
      console.log(`✅ Localidades cargadas: ${localidades.length}`);

      // 2. Crear mapa de localidades por nombre
      const mapaLocalidades = this.crearMapaLocalidades(localidades);
      console.log(`✅ Mapa de localidades creado: ${mapaLocalidades.size} entradas`);

      // 3. Obtener todas las rutas
      const rutas = await this.http.get<any[]>(`${this.apiUrl}/rutas/`, {
        headers: this.getHeaders()
      }).toPromise();

      console.log(`✅ Rutas cargadas: ${rutas?.length}`);

      // 4. Procesar cada ruta
      const actualizaciones: any[] = [];
      let rutasActualizadas = 0;

      for (const ruta of rutas || []) {
        const actualizacion: any = { id: ruta.id };
        let necesitaActualizar = false;

        // Buscar origen por nombre
        if (ruta.origen && typeof ruta.origen === 'object' && ruta.origen.nombre) {
          const origenId = this.buscarLocalidadId(ruta.origen.nombre, mapaLocalidades);
          if (origenId && origenId !== ruta.origen.id) {
            console.log(`   📍 Origen actualizado: ${ruta.origen.nombre} (${ruta.origen.id} → ${origenId})`);
            actualizacion.origen = origenId;
            necesitaActualizar = true;
          }
        }

        // Buscar destino por nombre
        if (ruta.destino && typeof ruta.destino === 'object' && ruta.destino.nombre) {
          const destinoId = this.buscarLocalidadId(ruta.destino.nombre, mapaLocalidades);
          if (destinoId && destinoId !== ruta.destino.id) {
            console.log(`   📍 Destino actualizado: ${ruta.destino.nombre} (${ruta.destino.id} → ${destinoId})`);
            actualizacion.destino = destinoId;
            necesitaActualizar = true;
          }
        }

        // Procesar itinerario
        if (ruta.itinerario && Array.isArray(ruta.itinerario)) {
          const itinerarioActualizado: any[] = [];
          let itinerarioNecesitaActualizar = false;

          for (const parada of ruta.itinerario) {
            if (parada && typeof parada === 'object' && parada.nombre) {
              const paradaId = this.buscarLocalidadId(parada.nombre, mapaLocalidades);
              if (paradaId && paradaId !== parada.id) {
                console.log(`   📍 Parada actualizada: ${parada.nombre} (${parada.id} → ${paradaId})`);
                itinerarioActualizado.push({
                  ...parada,
                  id: paradaId
                });
                itinerarioNecesitaActualizar = true;
              } else {
                itinerarioActualizado.push(parada);
              }
            } else {
              itinerarioActualizado.push(parada);
            }
          }

          if (itinerarioNecesitaActualizar) {
            actualizacion.itinerario = itinerarioActualizado;
            necesitaActualizar = true;
          }
        }

        if (necesitaActualizar) {
          actualizaciones.push(actualizacion);
          rutasActualizadas++;
        }
      }

      console.log(`\n📊 Resumen:`);
      console.log(`   - Rutas procesadas: ${rutas?.length}`);
      console.log(`   - Rutas que necesitan actualización: ${rutasActualizadas}`);

      // 5. Aplicar actualizaciones
      if (actualizaciones.length > 0) {
        console.log(`\n🔄 Aplicando ${actualizaciones.length} actualizaciones...`);
        
        const resultados = await Promise.all(
          actualizaciones.map(act =>
            this.http.put(`${this.apiUrl}/rutas/${act.id}`, act, {
              headers: this.getHeaders()
            }).toPromise().catch(err => {
              console.error(`❌ Error actualizando ruta ${act.id}:`, err);
              return null;
            })
          )
        );

        const exitosas = resultados.filter(r => r !== null).length;
        console.log(`✅ Actualizaciones exitosas: ${exitosas}/${actualizaciones.length}`);

        return {
          exitosas,
          total: actualizaciones.length,
          mensaje: `${exitosas} de ${actualizaciones.length} rutas actualizadas`
        };
      } else {
        console.log('✅ Todas las rutas están sincronizadas');
        return {
          exitosas: 0,
          total: 0,
          mensaje: 'Todas las rutas están sincronizadas'
        };
      }

    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      throw error;
    }
  }

  /**
   * Crear mapa de localidades por nombre para búsqueda rápida
   */
  private crearMapaLocalidades(localidades: Localidad[]): Map<string, string> {
    const mapa = new Map<string, string>();

    localidades.forEach(localidad => {
      if (localidad.nombre && localidad.id) {
        // Agregar nombre exacto
        const nombreLimpio = localidad.nombre.toUpperCase().trim();
        if (!mapa.has(nombreLimpio)) {
          mapa.set(nombreLimpio, localidad.id);
        }

        // Agregar variaciones
        const variaciones = this.generarVariaciones(localidad.nombre);
        variaciones.forEach(variacion => {
          if (!mapa.has(variacion)) {
            mapa.set(variacion, localidad.id);
          }
        });
      }
    });

    return mapa;
  }

  /**
   * Generar variaciones de un nombre para búsqueda flexible
   */
  private generarVariaciones(nombre: string): string[] {
    const variaciones: string[] = [];
    const limpio = nombre.toUpperCase().trim();

    // Variación 1: Nombre completo
    variaciones.push(limpio);

    // Variación 2: Sin acentos
    const sinAcentos = limpio
      .replace(/Á/g, 'A')
      .replace(/É/g, 'E')
      .replace(/Í/g, 'I')
      .replace(/Ó/g, 'O')
      .replace(/Ú/g, 'U');
    if (sinAcentos !== limpio) {
      variaciones.push(sinAcentos);
    }

    // Variación 3: Primeras palabras
    const palabras = limpio.split(/\s+/);
    if (palabras.length > 1) {
      variaciones.push(palabras[0]);
      variaciones.push(palabras.slice(0, 2).join(' '));
    }

    return variaciones;
  }

  /**
   * Buscar ID de localidad por nombre
   */
  private buscarLocalidadId(nombre: string, mapa: Map<string, string>): string | null {
    if (!nombre) return null;

    const nombreLimpio = nombre.toUpperCase().trim();

    // Búsqueda exacta
    if (mapa.has(nombreLimpio)) {
      return mapa.get(nombreLimpio) || null;
    }

    // Búsqueda sin acentos
    const sinAcentos = nombreLimpio
      .replace(/Á/g, 'A')
      .replace(/É/g, 'E')
      .replace(/Í/g, 'I')
      .replace(/Ó/g, 'O')
      .replace(/Ú/g, 'U');

    if (sinAcentos !== nombreLimpio && mapa.has(sinAcentos)) {
      return mapa.get(sinAcentos) || null;
    }

    // Búsqueda parcial
    for (const [clave, id] of mapa.entries()) {
      if (clave.includes(nombreLimpio) || nombreLimpio.includes(clave)) {
        return id;
      }
    }

    return null;
  }

  /**
   * Obtener estadísticas de sincronización
   */
  async obtenerEstadisticas(): Promise<any> {
    try {
      const rutas = await this.http.get<any[]>(`${this.apiUrl}/rutas/`, {
        headers: this.getHeaders()
      }).toPromise();

      let rutasConCoordenadas = 0;
      let rutasSinCoordenadas = 0;

      for (const ruta of rutas || []) {
        if (ruta.origen?.coordenadas && ruta.destino?.coordenadas) {
          rutasConCoordenadas++;
        } else {
          rutasSinCoordenadas++;
        }
      }

      return {
        total: rutas?.length || 0,
        conCoordenadas: rutasConCoordenadas,
        sinCoordenadas: rutasSinCoordenadas,
        porcentaje: rutas && rutas.length > 0 
          ? ((rutasConCoordenadas / rutas.length) * 100).toFixed(1)
          : 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}
