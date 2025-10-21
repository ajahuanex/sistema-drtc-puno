# Requirements Document

## Introduction

Este documento define los requisitos para mejorar el módulo de vehículos del sistema DRTC Puno. El módulo actual incluye componentes para gestión, formularios, detalles y modales de vehículos, pero necesita mejoras en UX, iconos inteligentes, selectores avanzados y funcionalidades adicionales.

El módulo de vehículos es crítico para el sistema ya que gestiona la flota vehicular autorizada para transporte público, incluyendo registro, transferencias, bajas y seguimiento de estados.

## Requirements

### Requirement 1: Integrar SmartIconComponent en todos los componentes de vehículos

**User Story:** Como usuario del sistema, quiero que todos los iconos del módulo de vehículos tengan fallbacks automáticos, para que la interfaz funcione correctamente incluso cuando Material Icons no se carga.

#### Acceptance Criteria

1. WHEN se carga cualquier componente del módulo de vehículos THEN todos los mat-icon SHALL ser reemplazados por app-smart-icon
2. WHEN Material Icons no están disponibles THEN los iconos SHALL mostrar emojis de fallback automáticamente
3. WHEN se pasa el mouse sobre un icono THEN SHALL mostrar tooltip descriptivo
4. WHEN un icono es clickeable THEN SHALL mostrar cursor pointer y efecto hover
5. WHEN un icono está deshabilitado THEN SHALL mostrar opacidad reducida

### Requirement 2: Mejorar selectores de empresa y resolución con búsqueda avanzada

**User Story:** Como usuario del sistema, quiero que los selectores de empresa y resolución en formularios de vehículos tengan búsqueda avanzada, para que pueda encontrar rápidamente las opciones que necesito.

#### Acceptance Criteria

1. WHEN uso el selector de empresa THEN SHALL permitir búsqueda por RUC, razón social y código de empresa
2. WHEN uso el selector de resolución THEN SHALL permitir búsqueda por número de resolución y descripción
3. WHEN escribo en un selector THEN SHALL mostrar autocompletado en tiempo real
4. WHEN no hay resultados THEN SHALL mostrar mensaje informativo
5. WHEN selecciono una opción THEN SHALL actualizar automáticamente campos relacionados

### Requirement 3: Implementar filtros avanzados mejorados

**User Story:** Como usuario del sistema, quiero filtros avanzados más intuitivos en la lista de vehículos, para que pueda encontrar vehículos específicos de manera eficiente.

#### Acceptance Criteria

1. WHEN uso filtros avanzados THEN SHALL poder combinar múltiples criterios de búsqueda
2. WHEN aplico un filtro THEN SHALL mostrar chips visuales de filtros activos
3. WHEN quiero limpiar filtros THEN SHALL poder remover filtros individuales o todos a la vez
4. WHEN filtro por empresa THEN SHALL usar el selector mejorado con búsqueda
5. WHEN filtro por resolución THEN SHALL usar el selector mejorado con búsqueda
6. WHEN aplico filtros THEN SHALL persistir en la URL para compartir enlaces

### Requirement 4: Mejorar modales de vehículos con selectores avanzados

**User Story:** Como usuario del sistema, quiero que los modales de crear/editar vehículo y transferir vehículo usen selectores mejorados, para que la experiencia sea consistente en todo el módulo.

#### Acceptance Criteria

1. WHEN abro modal de crear vehículo THEN SHALL usar EmpresaSelectorComponent mejorado
2. WHEN abro modal de editar vehículo THEN SHALL usar selectores mejorados para empresa y resolución
3. WHEN abro modal de transferir vehículo THEN SHALL usar EmpresaSelectorComponent para empresa destino
4. WHEN selecciono empresa en modal THEN SHALL cargar automáticamente resoluciones relacionadas
5. WHEN hay error en selección THEN SHALL mostrar mensaje de error claro

### Requirement 5: Implementar dashboard de estadísticas mejorado

**User Story:** Como usuario del sistema, quiero un dashboard de estadísticas más visual e informativo en la vista de vehículos, para que pueda tener una visión general del estado de la flota.

#### Acceptance Criteria

1. WHEN cargo la vista de vehículos THEN SHALL mostrar estadísticas actualizadas en tiempo real
2. WHEN veo estadísticas THEN SHALL incluir gráficos visuales de distribución por estado
3. WHEN veo estadísticas THEN SHALL mostrar tendencias con iconos de dirección
4. WHEN hago clic en una estadística THEN SHALL filtrar automáticamente la tabla
5. WHEN las estadísticas cambian THEN SHALL mostrar animaciones suaves de transición

### Requirement 6: Mejorar tabla de vehículos con funcionalidades avanzadas

**User Story:** Como usuario del sistema, quiero una tabla de vehículos más funcional con acciones rápidas y mejor visualización, para que pueda gestionar vehículos de manera más eficiente.

#### Acceptance Criteria

1. WHEN veo la tabla de vehículos THEN SHALL mostrar información clave de manera clara
2. WHEN quiero realizar acciones THEN SHALL tener menú de acciones rápidas por fila
3. WHEN veo el estado de un vehículo THEN SHALL usar chips de colores distintivos
4. WHEN la tabla tiene muchos registros THEN SHALL tener paginación eficiente
5. WHEN ordeno columnas THEN SHALL mantener el estado de ordenamiento
6. WHEN selecciono múltiples vehículos THEN SHALL permitir acciones en lote

### Requirement 7: Implementar búsqueda global inteligente

**User Story:** Como usuario del sistema, quiero una búsqueda global que encuentre vehículos por cualquier campo relevante, para que pueda localizar rápidamente cualquier vehículo.

#### Acceptance Criteria

1. WHEN uso búsqueda global THEN SHALL buscar en placa, marca, modelo, empresa y resolución
2. WHEN escribo en búsqueda THEN SHALL mostrar sugerencias en tiempo real
3. WHEN selecciono una sugerencia THEN SHALL aplicar el filtro automáticamente
4. WHEN no hay resultados THEN SHALL mostrar mensaje con sugerencias de búsqueda
5. WHEN uso búsqueda THEN SHALL resaltar términos encontrados en resultados

### Requirement 8: Mejorar formularios de vehículo con validaciones avanzadas

**User Story:** Como usuario del sistema, quiero formularios de vehículo con validaciones inteligentes y mejor UX, para que el proceso de registro sea más eficiente y sin errores.

#### Acceptance Criteria

1. WHEN lleno formulario de vehículo THEN SHALL validar placa en formato peruano
2. WHEN ingreso datos técnicos THEN SHALL validar rangos lógicos (año, capacidad, etc.)
3. WHEN selecciono empresa THEN SHALL cargar automáticamente resoluciones disponibles
4. WHEN hay errores THEN SHALL mostrar mensajes específicos y útiles
5. WHEN guardo vehículo THEN SHALL mostrar confirmación con resumen de datos

### Requirement 9: Implementar sistema de notificaciones para vehículos

**User Story:** Como usuario del sistema, quiero recibir notificaciones sobre eventos importantes de vehículos, para que pueda estar al tanto de cambios críticos.

#### Acceptance Criteria

1. WHEN se transfiere un vehículo THEN SHALL notificar a usuarios relevantes
2. WHEN se solicita baja de vehículo THEN SHALL notificar a supervisores
3. WHEN vence documentación THEN SHALL notificar con anticipación
4. WHEN hay cambios de estado THEN SHALL registrar en historial
5. WHEN ocurre error crítico THEN SHALL notificar inmediatamente

### Requirement 10: Mejorar responsive design y accesibilidad

**User Story:** Como usuario del sistema, quiero que el módulo de vehículos funcione perfectamente en dispositivos móviles y sea accesible, para que pueda usarlo desde cualquier dispositivo.

#### Acceptance Criteria

1. WHEN uso dispositivo móvil THEN SHALL adaptar layout automáticamente
2. WHEN uso tablet THEN SHALL optimizar uso del espacio disponible
3. WHEN uso lector de pantalla THEN SHALL tener etiquetas ARIA apropiadas
4. WHEN navego con teclado THEN SHALL tener orden de tabulación lógico
5. WHEN hay contraste insuficiente THEN SHALL cumplir estándares WCAG