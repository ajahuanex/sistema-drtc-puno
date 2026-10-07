import { environment } from '../../environments/environment';

/**
 * Configuración centralizada de identidad del sistema.
 * Permite cambiar el nombre y datos de la institución en un solo lugar
 * modificando únicamente las variables de entorno (environment.ts / environment.prod.ts).
 */
export const SYSTEM_CONFIG = {
  get name(): string {
    return environment.systemName || 'SIRRETT';
  },
  get fullName(): string {
    return environment.systemFullName || 'Sistema Regional de Registros de Transporte Terrestre (SIRRETT)';
  },
  get entityName(): string {
    return environment.entityName || 'Dirección Regional de Transportes y Comunicaciones Puno';
  },
  get version(): string {
    return environment.version || '2.4.1';
  }
};
