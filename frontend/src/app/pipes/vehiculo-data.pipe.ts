import { Pipe, PipeTransform, inject } from '@angular/core';
import { Vehiculo } from '../models/vehiculo.model';
import { VehiculoHelperService } from '../services/vehiculo-helper.service';

/**
 * Pipe para obtener datos técnicos de un vehículo
 * 
 * Uso en template:
 * {{ vehiculo | vehiculoData:'marca' }}
 * {{ vehiculo | vehiculoData:'modelo' }}
 * {{ vehiculo | vehiculoData:'marcaModelo' }}
 * {{ vehiculo | vehiculoData:'categoria' }}
 * {{ vehiculo | vehiculoData:'anio' }}
 * {{ vehiculo | vehiculoData:'color' }}
 * {{ vehiculo | vehiculoData:'numeroSerie' }}
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */
@Pipe({
  name: 'vehiculoData',
  standalone: true
})
export class VehiculoDataPipe implements PipeTransform {
  private helperService = inject(VehiculoHelperService);

  /**
   * Transformar vehículo para obtener datos técnicos
   * 
   * @param vehiculo - Vehículo
   * @param campo - Campo a obtener (marca, modelo, categoria, etc.)
   * @returns Valor del campo o 'N/A'
   */
  transform(vehiculo: Vehiculo | null | undefined, campo: string): string {
    if (!vehiculo) {
      return 'N/A';
    }

    // Nota: Este pipe es síncrono, pero los datos son asíncronos
    // Para uso en templates, se recomienda usar async pipe o cargar datos en componente
    // Este pipe es principalmente para referencia y casos simples

    switch (campo) {
      case 'marca':
        return 'Cargando...'; // Ver nota arriba
      case 'modelo':
        return 'Cargando...'; // Ver nota arriba
      case 'marcaModelo':
        return 'Cargando...'; // Ver nota arriba
      case 'categoria':
        return 'Cargando...'; // Ver nota arriba
      case 'anio':
        return 'Cargando...'; // Ver nota arriba
      case 'color':
        return 'Cargando...'; // Ver nota arriba
      case 'numeroSerie':
        return 'Cargando...'; // Ver nota arriba
      default:
        return 'N/A';
    }
  }
}

/**
 * Pipe para obtener descripción de categoría
 * 
 * Uso en template:
 * {{ 'M1' | categoriaDescripcion }}
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */
@Pipe({
  name: 'categoriaDescripcion',
  standalone: true
})
export class CategoriaDescripcionPipe implements PipeTransform {
  private helperService = inject(VehiculoHelperService);

  transform(categoria: string): string {
    return this.helperService.getDescripcionCategoria(categoria);
  }
}

/**
 * Pipe para obtener descripción de carrocería
 * 
 * Uso en template:
 * {{ 'SEDAN' | carroceriaDescripcion }}
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */
@Pipe({
  name: 'carroceriaDescripcion',
  standalone: true
})
export class CarroceriaDescripcionPipe implements PipeTransform {
  private helperService = inject(VehiculoHelperService);

  transform(carroceria: string): string {
    return this.helperService.getDescripcionCarroceria(carroceria);
  }
}

/**
 * Pipe para obtener descripción de combustible
 * 
 * Uso en template:
 * {{ 'DIESEL' | combustibleDescripcion }}
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */
@Pipe({
  name: 'combustibleDescripcion',
  standalone: true
})
export class CombustibleDescripcionPipe implements PipeTransform {
  private helperService = inject(VehiculoHelperService);

  transform(combustible: string): string {
    return this.helperService.getDescripcionCombustible(combustible);
  }
}

/**
 * Pipe para obtener descripción de estado físico
 * 
 * Uso en template:
 * {{ 'BUENO' | estadoFisicoDescripcion }}
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */
@Pipe({
  name: 'estadoFisicoDescripcion',
  standalone: true
})
export class EstadoFisicoDescripcionPipe implements PipeTransform {
  private helperService = inject(VehiculoHelperService);

  transform(estado: string): string {
    return this.helperService.getDescripcionEstadoFisico(estado);
  }
}

/**
 * Pipe para obtener descripción de edad
 * 
 * Uso en template:
 * {{ 2020 | edadDescripcion }}
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */
@Pipe({
  name: 'edadDescripcion',
  standalone: true
})
export class EdadDescripcionPipe implements PipeTransform {
  private helperService = inject(VehiculoHelperService);

  transform(anioFabricacion: number): string {
    return this.helperService.getDescripcionEdad(anioFabricacion);
  }
}
