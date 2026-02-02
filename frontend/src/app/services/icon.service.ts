import { Injectable, signal, effect } from '@angular/core';

/**
 * Interfaz que define la estructura de un fallback de icono.
 * 
 * Esta interfaz describe cómo se mapea un icono de Material Icons
 * a su equivalente emoji cuando Material Icons no está disponible.
 * 
 * @interface IconFallback
 * 
 * @example
 * ```typescript
 * const homeFallback: IconFallback = {
 *   name: 'home',
 *   unicode: 'e88a',
 *   fallback: '🏠',
 *   description: 'Inicio'
 * };
 * ```
 */
export interface IconFallback {
  /** Nombre del icono de Material Icons (ej: 'home', 'search', 'add') */
  name: string;
  /** Código unicode del icono de Material Icons (ej: 'e88a') */
  unicode: string;
  /** Emoji que se usa como fallback cuando Material Icons no está disponible */
  fallback: string;
  /** Descripción legible del icono para tooltips y accesibilidad */
  description: string;
}

/**
 * Servicio para gestión inteligente de iconos con fallbacks automáticos.
 * 
 * Este servicio detecta automáticamente si Material Icons está disponible
 * en el navegador y proporciona fallbacks emoji cuando no lo está.
 * Incluye más de 80 iconos comunes con sus respectivos fallbacks.
 * 
 * ## Proceso de Detección
 * 
 * 1. **Verificación DOM**: Crea un elemento de prueba con clase 'material-icons'
 * 2. **Medición**: Mide el ancho del elemento renderizado
 * 3. **Evaluación**: Si el ancho es > 10px, Material Icons está disponible
 * 4. **Fallback**: Si no está disponible, activa modo fallback con emojis
 * 5. **CSS Class**: Agrega 'material-icons-fallback' al body para estilos
 * 
 * ## Uso Básico
 * 
 * ```typescript
 * // Inyectar el servicio
 * private iconService = inject(IconService);
 * 
 * // Verificar si Material Icons está cargado
 * if (this.iconService.materialIconsLoaded()) {
 *   // console.log removed for production
 * }
 * 
 * // Obtener icono apropiado (Material Icons o emoji)
 * const homeIcon = this.iconService.getIcon('home'); // 'home' o '🏠'
 * 
 * // Obtener información completa del icono
 * const iconInfo = this.iconService.getIconInfo('home');
 * // console.log removed for production // 'Inicio'
 * ```
 * 
 * ## Uso con SmartIconComponent
 * 
 * ```html
 * <app-smart-icon 
 *   [iconName]="'home'"
 *   [tooltipText]="iconService.getIconInfo('home')?.description">
 * </app-smart-icon>
 * ```
 * 
 * ## Agregar Fallbacks Personalizados
 * 
 * ```typescript
 * // Agregar un nuevo fallback
 * this.iconService.addFallback('custom_icon', {
 *   name: 'custom_icon',
 *   unicode: 'e123',
 *   fallback: '🎯',
 *   description: 'Icono personalizado'
 * });
 * ```
 * 
 * @injectable
 * @providedIn 'root'
 */
@Injectable({
  providedIn: 'root'
})
export class IconService {
  // Signal para el estado de carga de Material Icons
  private readonly _materialIconsLoaded = signal(false);
  readonly materialIconsLoaded = this._materialIconsLoaded.asReadonly();

  // Mapeo de iconos comunes con fallbacks
  private readonly iconFallbacks: Map<string, IconFallback> = new Map([
    ['home', { name: 'home', unicode: 'e88a', fallback: '🏠', description: 'Inicio' }],
    ['add', { name: 'add', unicode: 'e145', fallback: '➕', description: 'Agregar' }],
    ['edit', { name: 'edit', unicode: 'e3c9', fallback: '✏️', description: 'Editar' }],
    ['delete', { name: 'delete', unicode: 'e872', fallback: '🗑️', description: 'Eliminar' }],
    ['search', { name: 'search', unicode: 'e8b6', fallback: '🔍', description: 'Buscar' }],
    ['close', { name: 'close', unicode: 'e5cd', fallback: '❌', description: 'Cerrar' }],
    ['check', { name: 'check', unicode: 'e5ca', fallback: '✅', description: 'Verificar' }],
    ['warning', { name: 'warning', unicode: 'e002', fallback: '⚠️', description: 'Advertencia' }],
    ['error', { name: 'error', unicode: 'e000', fallback: '❌', description: 'Error' }],
    ['info', { name: 'info', unicode: 'e88e', fallback: 'ℹ️', description: 'Información' }],
    ['help', { name: 'help', unicode: 'e887', fallback: '❓', description: 'Ayuda' }],
    ['settings', { name: 'settings', unicode: 'e8b8', fallback: '⚙️', description: 'Configuración' }],
    ['person', { name: 'person', unicode: 'e7fd', fallback: '👤', description: 'Usuario' }],
    ['business', { name: 'business', unicode: 'e0af', fallback: '🏢', description: 'Empresa' }],
    ['directions_car', { name: 'directions_car', unicode: 'e531', fallback: '🚗', description: 'Vehículo' }],
    ['route', { name: 'route', unicode: 'e9ae', fallback: '🛣️', description: 'Ruta' }],
    ['description', { name: 'description', unicode: 'e873', fallback: '📄', description: 'Documento' }],
    ['folder', { name: 'folder', unicode: 'e2c7', fallback: '📁', description: 'Carpeta' }],
    ['file_download', { name: 'file_download', unicode: 'e2c4', fallback: '⬇️', description: 'Descargar' }],
    ['file_upload', { name: 'file_upload', unicode: 'e2c6', fallback: '⬆️', description: 'Subir' }],
    ['print', { name: 'print', unicode: 'e8ad', fallback: '🖨️', description: 'Imprimir' }],
    ['email', { name: 'email', unicode: 'e0be', fallback: '📧', description: 'Email' }],
    ['phone', { name: 'phone', unicode: 'e0cd', fallback: '📞', description: 'Teléfono' }],
    ['location_on', { name: 'location_on', unicode: 'e55f', fallback: '📍', description: 'Ubicación' }],
    ['schedule', { name: 'schedule', unicode: 'e8b5', fallback: '🕐', description: 'Horario' }],
    ['calendar_today', { name: 'calendar_today', unicode: 'e333', fallback: '📅', description: 'Calendario' }],
    ['notifications', { name: 'notifications', unicode: 'e7f4', fallback: '🔔', description: 'Notificaciones' }],
    ['account_circle', { name: 'account_circle', unicode: 'e7fb', fallback: '👤', description: 'Cuenta' }],
    ['logout', { name: 'logout', unicode: 'e9ba', fallback: '🚪', description: 'Salir' }],
    ['login', { name: 'login', unicode: 'e77e', fallback: '🔑', description: 'Entrar' }],
    ['refresh', { name: 'refresh', unicode: 'e5d5', fallback: '🔄', description: 'Actualizar' }],
    ['save', { name: 'save', unicode: 'e161', fallback: '💾', description: 'Guardar' }],
    ['cancel', { name: 'cancel', unicode: 'e5c9', fallback: '🚫', description: 'Cancelar' }],
    ['arrow_back', { name: 'arrow_back', unicode: 'e5c4', fallback: '⬅️', description: 'Atrás' }],
    ['arrow_forward', { name: 'arrow_forward', unicode: 'e5c8', fallback: '➡️', description: 'Adelante' }],
    ['expand_more', { name: 'expand_more', unicode: 'e5cf', fallback: '⬇️', description: 'Expandir' }],
    ['expand_less', { name: 'expand_less', unicode: 'e5ce', fallback: '⬆️', description: 'Contraer' }],
    ['menu', { name: 'menu', unicode: 'e5d2', fallback: '☰', description: 'Menú' }],
    ['more_vert', { name: 'more_vert', unicode: 'e5d4', fallback: '⋮', description: 'Más opciones' }],
    ['visibility', { name: 'visibility', unicode: 'e8f4', fallback: '👁️', description: 'Ver' }],
    ['visibility_off', { name: 'visibility_off', unicode: 'e8f5', fallback: '🙈', description: 'Ocultar' }],
    ['lock', { name: 'lock', unicode: 'e897', fallback: '🔒', description: 'Bloqueado' }],
    ['lock_open', { name: 'lock_open', unicode: 'e898', fallback: '🔓', description: 'Desbloqueado' }],
    ['star', { name: 'star', unicode: 'e838', fallback: '⭐', description: 'Favorito' }],
    ['favorite', { name: 'favorite', unicode: 'e87d', fallback: '❤️', description: 'Favorito' }],
    ['thumb_up', { name: 'thumb_up', unicode: 'e8dc', fallback: '👍', description: 'Me gusta' }],
    ['thumb_down', { name: 'thumb_down', unicode: 'e8db', fallback: '👎', description: 'No me gusta' }],
    ['share', { name: 'share', unicode: 'e80d', fallback: '📤', description: 'Compartir' }],
    ['download', { name: 'download', unicode: 'e2c4', fallback: '⬇️', description: 'Descargar' }],
    ['upload', { name: 'upload', unicode: 'e2c6', fallback: '⬆️', description: 'Subir' }],
    ['cloud_download', { name: 'cloud_download', unicode: 'e2bd', fallback: '☁️⬇️', description: 'Descargar de la nube' }],
    ['cloud_upload', { name: 'cloud_upload', unicode: 'e2c3', fallback: '☁️⬆️', description: 'Subir a la nube' }],
    ['sync', { name: 'sync', unicode: 'e627', fallback: '🔄', description: 'Sincronizar' }],
    ['wifi', { name: 'wifi', unicode: 'e63e', fallback: '📶', description: 'WiFi' }],
    ['signal_cellular_alt', { name: 'signal_cellular_alt', unicode: 'e202', fallback: '📱', description: 'Señal celular' }],
    ['battery_full', { name: 'battery_full', unicode: 'e1b3', fallback: '🔋', description: 'Batería llena' }],
    ['brightness_high', { name: 'brightness_high', unicode: 'e1ac', fallback: '☀️', description: 'Brillo alto' }],
    ['brightness_low', { name: 'brightness_low', unicode: 'e1ad', fallback: '🌙', description: 'Brillo bajo' }],
    ['volume_up', { name: 'volume_up', unicode: 'e050', fallback: '🔊', description: 'Volumen alto' }],
    ['volume_off', { name: 'volume_off', unicode: 'e04f', fallback: '🔇', description: 'Sin volumen' }],
    ['play_arrow', { name: 'play_arrow', unicode: 'e037', fallback: '▶️', description: 'Reproducir' }],
    ['pause', { name: 'pause', unicode: 'e034', fallback: '⏸️', description: 'Pausar' }],
    ['stop', { name: 'stop', unicode: 'e047', fallback: '⏹️', description: 'Detener' }],
    ['skip_next', { name: 'skip_next', unicode: 'e044', fallback: '⏭️', description: 'Siguiente' }],
    ['skip_previous', { name: 'skip_previous', unicode: 'e045', fallback: '⏮️', description: 'Anterior' }],
    ['fast_forward', { name: 'fast_forward', unicode: 'e01f', fallback: '⏩', description: 'Avance rápido' }],
    ['fast_rewind', { name: 'fast_rewind', unicode: 'e020', fallback: '⏪', description: 'Retroceso rápido' }],
    ['fullscreen', { name: 'fullscreen', unicode: 'e5d0', fallback: '⛶', description: 'Pantalla completa' }],
    ['fullscreen_exit', { name: 'fullscreen_exit', unicode: 'e5d1', fallback: '⛶', description: 'Salir pantalla completa' }],
    ['zoom_in', { name: 'zoom_in', unicode: 'e8ff', fallback: '🔍➕', description: 'Acercar' }],
    ['zoom_out', { name: 'zoom_out', unicode: 'e900', fallback: '🔍➖', description: 'Alejar' }],
    ['filter_list', { name: 'filter_list', unicode: 'e152', fallback: '🔍', description: 'Filtrar' }],
    ['sort', { name: 'sort', unicode: 'e164', fallback: '↕️', description: 'Ordenar' }],
    ['view_list', { name: 'view_list', unicode: 'e8ef', fallback: '📋', description: 'Vista de lista' }],
    ['view_module', { name: 'view_module', unicode: 'e8f0', fallback: '🔲', description: 'Vista de módulos' }],
    ['view_grid', { name: 'view_grid', unicode: 'e8f1', fallback: '🔲', description: 'Vista de cuadrícula' }],
    ['dashboard', { name: 'dashboard', unicode: 'e871', fallback: '📊', description: 'Dashboard' }],
    ['analytics', { name: 'analytics', unicode: 'e9f1', fallback: '📈', description: 'Analíticas' }],
    ['trending_up', { name: 'trending_up', unicode: 'e8e5', fallback: '📈', description: 'Tendencia al alza' }],
    ['trending_down', { name: 'trending_down', unicode: 'e8e4', fallback: '📉', description: 'Tendencia a la baja' }],
    ['pie_chart', { name: 'pie_chart', unicode: 'e6c4', fallback: '🥧', description: 'Gráfico circular' }],
    ['bar_chart', { name: 'bar_chart', unicode: 'e26b', fallback: '📊', description: 'Gráfico de barras' }],
    ['line_chart', { name: 'line_chart', unicode: 'e922', fallback: '📈', description: 'Gráfico de líneas' }],
    ['table_chart', { name: 'table_chart', unicode: 'e9d6', fallback: '📊', description: 'Gráfico de tabla' }]
  ]);

  /**
   * Constructor del servicio.
   * 
   * Inicializa la detección automática de Material Icons y configura
   * un effect para monitorear cambios en el estado de carga.
   * 
   * El proceso de inicialización:
   * 1. Ejecuta checkMaterialIcons() para detectar disponibilidad
   * 2. Configura effect reactivo para logging de estado
   * 3. Agrega clase CSS al body si es necesario
   */
  constructor() {
    // Verificar si Material Icons están cargados
    this.checkMaterialIcons();
    
    // Effect para detectar cambios en el estado de carga
    effect(() => {
      if (this._materialIconsLoaded()) {
        // console.log removed for production
      } else {
        console.warn('⚠️ Material Icons no disponibles, usando fallbacks');
      }
    });
  }

  /**
   * Verificar si Material Icons están cargados.
   * 
   * Método privado que inicia el proceso de detección de Material Icons.
   * Espera a que el DOM esté completamente cargado antes de realizar
   * la verificación para asegurar resultados precisos.
   * 
   * @private
   */
  private checkMaterialIcons(): void {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.performIconCheck();
      });
    } else {
      this.performIconCheck();
    }
  }

  /**
   * Realizar verificación de iconos mediante elemento de prueba.
   * 
   * Método privado que implementa la lógica de detección de Material Icons:
   * 
   * 1. **Crear elemento de prueba**: Span con clase 'material-icons'
   * 2. **Configurar estilos**: Posición absoluta fuera de la vista
   * 3. **Insertar en DOM**: Agregar temporalmente al body
   * 4. **Medir ancho**: Verificar si el icono se renderizó correctamente
   * 5. **Limpiar DOM**: Remover elemento de prueba
   * 6. **Actualizar estado**: Establecer signal según resultado
   * 7. **Aplicar CSS**: Agregar clase fallback si es necesario
   * 
   * **Criterio de detección**: Si el ancho del elemento es > 10px,
   * se considera que Material Icons está disponible.
   * 
   * @private
   */
  private performIconCheck(): void {
    // Crear un icono de prueba
    const testIcon = document.createElement('span');
    testIcon.className = 'material-icons';
    testIcon.textContent = 'home';
    testIcon.style.position = 'absolute';
    testIcon.style.left = '-9999px';
    testIcon.style.visibility = 'hidden';
    
    document.body.appendChild(testIcon);
    
    // Verificar el ancho del icono
    const iconWidth = testIcon.offsetWidth;
    document.body.removeChild(testIcon);
    
    // Si el ancho es muy pequeño, los iconos no se cargaron
    this._materialIconsLoaded.set(iconWidth > 10);
    
    // Si no se cargaron, agregar clase CSS para fallbacks
    if (!this._materialIconsLoaded()) {
      document.body.classList.add('material-icons-fallback');
    }
  }

  /**
   * Obtener el icono apropiado según disponibilidad de Material Icons.
   * 
   * Método principal para obtener iconos. Retorna el nombre del icono
   * de Material Icons si está disponible, o el emoji fallback si no lo está.
   * 
   * @param iconName - Nombre del icono de Material Icons (ej: 'home', 'search')
   * @returns El nombre del icono o emoji fallback, o '•' si no hay fallback
   * 
   * @example
   * ```typescript
   * // Con Material Icons disponible
   * const icon = iconService.getIcon('home'); // Retorna: 'home'
   * 
   * // Sin Material Icons disponible
   * const icon = iconService.getIcon('home'); // Retorna: '🏠'
   * 
   * // Icono sin fallback definido
   * const icon = iconService.getIcon('unknown'); // Retorna: '•'
   * ```
   */
  getIcon(iconName: string): string {
    if (this._materialIconsLoaded()) {
      // Usar Material Icons si están disponibles
      return iconName;
    } else {
      // Usar fallback si Material Icons no están disponibles
      const fallback = this.iconFallbacks.get(iconName);
      return fallback ? fallback.fallback : '•';
    }
  }

  /**
   * Obtener el texto del icono para insertar directamente en el DOM.
   * 
   * Similar a getIcon(), pero optimizado para uso directo en elementos HTML.
   * Útil cuando se necesita insertar el contenido del icono como texto.
   * 
   * @param iconName - Nombre del icono de Material Icons
   * @returns Texto del icono para insertar en el DOM
   * 
   * @example
   * ```typescript
   * // En un componente
   * const iconText = this.iconService.getIconText('search');
   * 
   * // En template
   * <span class="icon">{{ iconService.getIconText('search') }}</span>
   * 
   * // Con Material Icons: muestra el icono de búsqueda
   * // Sin Material Icons: muestra '🔍'
   * ```
   */
  getIconText(iconName: string): string {
    if (this._materialIconsLoaded()) {
      // Para Material Icons, usar el nombre del icono
      return iconName;
    } else {
      // Para fallbacks, usar el emoji directamente
      const fallback = this.iconFallbacks.get(iconName);
      return fallback ? fallback.fallback : '•';
    }
  }

  /**
   * Obtener información completa del icono incluyendo metadatos.
   * 
   * Retorna el objeto IconFallback completo con toda la información
   * disponible sobre el icono: nombre, unicode, fallback y descripción.
   * 
   * @param iconName - Nombre del icono de Material Icons
   * @returns Objeto IconFallback con información completa, o null si no existe
   * 
   * @example
   * ```typescript
   * const iconInfo = this.iconService.getIconInfo('home');
   * if (iconInfo) {
   *   // console.log removed for production        // 'home'
   *   // console.log removed for production     // 'e88a'
   *   // console.log removed for production    // '🏠'
   *   // console.log removed for production // 'Inicio'
   * }
   * 
   * // Usar para tooltips
   * const tooltip = iconInfo?.description || 'Icono';
   * ```
   */
  getIconInfo(iconName: string): IconFallback | null {
    return this.iconFallbacks.get(iconName) || null;
  }

  /**
   * Verificar si un icono específico tiene fallback definido.
   * 
   * Útil para validar si un icono tendrá un fallback apropiado
   * cuando Material Icons no esté disponible.
   * 
   * @param iconName - Nombre del icono a verificar
   * @returns true si el icono tiene fallback, false si no
   * 
   * @example
   * ```typescript
   * if (this.iconService.hasFallback('home')) {
   *   // El icono 'home' tiene fallback '🏠'
   *   // console.log removed for production
   * } else {
   *   // El icono no tiene fallback, se mostrará '•'
   *   // console.log removed for production
   * }
   * ```
   */
  hasFallback(iconName: string): boolean {
    return this.iconFallbacks.has(iconName);
  }

  /**
   * Obtener lista de todos los fallbacks disponibles.
   * 
   * Retorna un array con todos los objetos IconFallback registrados
   * en el servicio. Útil para debugging, documentación o UI de administración.
   * 
   * @returns Array de objetos IconFallback con todos los iconos disponibles
   * 
   * @example
   * ```typescript
   * const allIcons = this.iconService.getAllFallbacks();
   * // console.log removed for production
   * 
   * // Mostrar lista de iconos en consola
   * allIcons.forEach(icon => {
   *   console.log(`${icon.name}: ${icon.fallback} (${icon.description})`);
   * });
   * 
   * // Crear selector de iconos
   * const iconOptions = allIcons.map(icon => ({
   *   value: icon.name,
   *   label: `${icon.fallback} ${icon.description}`
   * }));
   * ```
   */
  getAllFallbacks(): IconFallback[] {
    return Array.from(this.iconFallbacks.values());
  }

  /**
   * Agregar un nuevo fallback personalizado al servicio.
   * 
   * Permite extender el servicio con iconos personalizados o sobrescribir
   * fallbacks existentes. El nuevo fallback estará disponible inmediatamente.
   * 
   * @param iconName - Nombre del icono (debe coincidir con el nombre en Material Icons)
   * @param fallback - Objeto IconFallback con la información completa del icono
   * 
   * @example
   * ```typescript
   * // Agregar un icono personalizado
   * this.iconService.addFallback('custom_star', {
   *   name: 'custom_star',
   *   unicode: 'e123',
   *   fallback: '⭐',
   *   description: 'Estrella personalizada'
   * });
   * 
   * // Sobrescribir un fallback existente
   * this.iconService.addFallback('home', {
   *   name: 'home',
   *   unicode: 'e88a',
   *   fallback: '🏡', // Cambiar de 🏠 a 🏡
   *   description: 'Casa'
   * });
   * 
   * // Usar el nuevo icono
   * const icon = this.iconService.getIcon('custom_star'); // '⭐'
   * ```
   */
  addFallback(iconName: string, fallback: IconFallback): void {
    this.iconFallbacks.set(iconName, fallback);
  }

  /**
   * Remover un fallback del servicio.
   * 
   * Elimina un fallback específico del mapa de iconos. Una vez removido,
   * el icono mostrará '•' cuando Material Icons no esté disponible.
   * 
   * @param iconName - Nombre del icono a remover
   * @returns true si el fallback fue removido, false si no existía
   * 
   * @example
   * ```typescript
   * // Verificar si existe antes de remover
   * if (this.iconService.hasFallback('custom_icon')) {
   *   const removed = this.iconService.removeFallback('custom_icon');
   *   // console.log removed for production
   * }
   * 
   * // Remover múltiples fallbacks
   * const iconsToRemove = ['icon1', 'icon2', 'icon3'];
   * iconsToRemove.forEach(iconName => {
   *   this.iconService.removeFallback(iconName);
   * });
   * ```
   */
  removeFallback(iconName: string): boolean {
    return this.iconFallbacks.delete(iconName);
  }

  /**
   * Forzar recarga y re-detección de Material Icons.
   * 
   * Útil cuando se sospecha que Material Icons se cargó después de la
   * inicialización del servicio, o para debugging. Reinicia el proceso
   * de detección completo.
   * 
   * @example
   * ```typescript
   * // En caso de problemas de carga
   * if (!this.iconService.materialIconsLoaded()) {
   *   // console.log removed for production
   *   this.iconService.forceReload();
   * }
   * 
   * // En un botón de debug
   * onDebugReload() {
   *   this.iconService.forceReload();
   *   setTimeout(() => {
   *     const status = this.iconService.getIconStatus();
   *     // console.log removed for production
   *   }, 200);
   * }
   * ```
   */
  forceReload(): void {
    this._materialIconsLoaded.set(false);
    setTimeout(() => {
      this.checkMaterialIcons();
    }, 100);
  }

  /**
   * Obtener el estado actual completo del servicio de iconos.
   * 
   * Retorna un objeto con información detallada sobre el estado actual
   * del servicio, útil para debugging, monitoreo y dashboards de administración.
   * 
   * @returns Objeto con el estado completo del servicio
   * @returns loaded - Si Material Icons está cargado y disponible
   * @returns fallbackMode - Si el servicio está usando fallbacks emoji
   * @returns totalFallbacks - Número total de fallbacks registrados
   * 
   * @example
   * ```typescript
   * const status = this.iconService.getIconStatus();
   * 
   * // console.log removed for production
   * // console.log removed for production
   * // console.log removed for production
   * 
   * // En un componente de debug
   * @Component({
   *   template: `
   *     <div class="icon-status">
   *       <p>Material Icons: {{ status.loaded ? '✅' : '❌' }}</p>
   *       <p>Fallbacks: {{ status.totalFallbacks }}</p>
   *     </div>
   *   `
   * })
   * export class IconDebugComponent {
   *   status = this.iconService.getIconStatus();
   * }
   * ```
   */
  getIconStatus(): { loaded: boolean; fallbackMode: boolean; totalFallbacks: number } {
    return {
      loaded: this._materialIconsLoaded(),
      fallbackMode: !this._materialIconsLoaded(),
      totalFallbacks: this.iconFallbacks.size
    };
  }
} 