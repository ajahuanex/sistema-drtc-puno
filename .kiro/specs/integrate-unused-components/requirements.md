# Requirements Document

## Introduction

Este documento define los requisitos para integrar los componentes y servicios no utilizados actualmente en el frontend de la aplicación DRTC Puno. Se han identificado 5 archivos que están compilados pero no están siendo importados ni utilizados en ninguna parte de la aplicación:

1. **CodigoEmpresaInfoComponent** - Componente para mostrar información del código de empresa
2. **FlujoTrabajoService** - Servicio completo para gestión de flujos de trabajo
3. **IconService** - Servicio para gestión de iconos con fallbacks
4. **SmartIconComponent** - Componente inteligente de iconos con fallbacks automáticos
5. **shared/index.ts** - Archivo de exportación de componentes compartidos

Estos componentes y servicios están completamente implementados y funcionales, solo necesitan ser integrados en los lugares apropiados de la aplicación.

## Requirements

### Requirement 1: Integrar CodigoEmpresaInfoComponent

**User Story:** Como desarrollador del sistema, quiero que el componente CodigoEmpresaInfoComponent se utilice en las vistas de detalle de empresas, para que los usuarios puedan ver información visual y detallada sobre el código de empresa.

#### Acceptance Criteria

1. WHEN un usuario visualiza el detalle de una empresa THEN el componente CodigoEmpresaInfoComponent SHALL mostrarse en la vista
2. WHEN el componente se renderiza THEN SHALL mostrar el código de empresa dividido en número (4 dígitos) y letras (3 letras)
3. WHEN el componente se renderiza THEN SHALL mostrar chips de colores para cada tipo de empresa (P: Personas, R: Regional, T: Turismo)
4. WHEN el componente se renderiza THEN SHALL mostrar información del formato del código con ejemplos
5. IF la empresa no tiene código asignado THEN SHALL mostrar un mensaje indicando que no hay código

### Requirement 2: Integrar FlujoTrabajoService

**User Story:** Como desarrollador del sistema, quiero que el FlujoTrabajoService se integre en los componentes de expedientes y oficinas, para que el sistema pueda gestionar flujos de trabajo y movimientos de expedientes entre oficinas.

#### Acceptance Criteria

1. WHEN se crea un componente de flujo de expedientes THEN el FlujoTrabajoService SHALL estar inyectado y disponible
2. WHEN se consultan flujos de trabajo THEN el servicio SHALL realizar peticiones HTTP al backend
3. WHEN se mueve un expediente entre oficinas THEN el servicio SHALL registrar el movimiento
4. WHEN se consulta el estado de un flujo THEN el servicio SHALL retornar información completa del estado actual
5. WHEN se exporta un reporte de flujo THEN el servicio SHALL generar el archivo en el formato solicitado (PDF, EXCEL, CSV)

### Requirement 3: Integrar IconService y SmartIconComponent

**User Story:** Como desarrollador del sistema, quiero que el IconService y SmartIconComponent se utilicen en toda la aplicación, para que los iconos tengan fallbacks automáticos cuando Material Icons no se cargue correctamente.

#### Acceptance Criteria

1. WHEN la aplicación se inicializa THEN el IconService SHALL verificar si Material Icons están cargados
2. IF Material Icons no están disponibles THEN el IconService SHALL usar emojis como fallback
3. WHEN se usa SmartIconComponent THEN SHALL mostrar el icono de Material Icons o el fallback según disponibilidad
4. WHEN se pasa el mouse sobre un SmartIconComponent THEN SHALL mostrar un tooltip con la descripción del icono
5. WHEN se usa SmartIconComponent con la propiedad clickable THEN SHALL mostrar cursor pointer y efecto hover
6. WHEN se usa SmartIconComponent con la propiedad disabled THEN SHALL mostrar opacidad reducida y cursor not-allowed

### Requirement 4: Actualizar shared/index.ts

**User Story:** Como desarrollador del sistema, quiero que el archivo shared/index.ts exporte todos los componentes compartidos correctamente, para que puedan ser importados fácilmente desde otros módulos.

#### Acceptance Criteria

1. WHEN se importa desde shared/index.ts THEN SHALL exportar todos los componentes compartidos disponibles
2. WHEN se agrega un nuevo componente compartido THEN SHALL ser agregado al archivo de exportación
3. WHEN se importa un componente desde shared THEN SHALL funcionar sin errores de compilación
4. WHEN se compila la aplicación THEN el archivo shared/index.ts SHALL estar siendo utilizado por al menos un componente

### Requirement 5: Eliminar Warnings de TypeScript

**User Story:** Como desarrollador del sistema, quiero que no aparezcan warnings de archivos no utilizados durante la compilación, para que el proceso de build sea limpio y sin advertencias innecesarias.

#### Acceptance Criteria

1. WHEN se ejecuta ng serve THEN NO SHALL aparecer warnings sobre archivos no utilizados
2. WHEN se compila la aplicación THEN todos los archivos TypeScript SHALL estar siendo utilizados o importados
3. WHEN se ejecuta ng build THEN el proceso SHALL completarse sin warnings de archivos no utilizados
4. IF un archivo realmente no se necesita THEN SHALL ser removido del proyecto en lugar de dejarlo sin usar

### Requirement 6: Mejorar Selector de Empresas en Modal de Resolución

**User Story:** Como usuario del sistema, quiero que el selector de empresas en el modal "Crear Nueva Resolución" sea un buscador con autocompletado, para que pueda encontrar empresas rápidamente sin tener que desplazarme por una lista larga.

#### Acceptance Criteria

1. WHEN se abre el modal de crear resolución THEN el campo de empresa SHALL ser un input de búsqueda con autocompletado
2. WHEN el usuario escribe en el campo de empresa THEN SHALL mostrar sugerencias filtradas por RUC, razón social o código de empresa
3. WHEN el usuario selecciona una empresa de las sugerencias THEN SHALL completar el campo con la empresa seleccionada
4. WHEN hay muchas empresas en el sistema THEN el buscador SHALL cargar resultados de forma eficiente sin bloquear la UI
5. WHEN el usuario borra el campo THEN SHALL limpiar la selección y permitir buscar nuevamente
6. WHEN no hay resultados para la búsqueda THEN SHALL mostrar un mensaje indicando que no se encontraron empresas

### Requirement 7: Documentar Uso de Componentes

**User Story:** Como desarrollador del sistema, quiero que los componentes integrados tengan documentación de uso, para que otros desarrolladores sepan cómo utilizarlos correctamente.

#### Acceptance Criteria

1. WHEN se integra un componente THEN SHALL agregarse comentarios JSDoc explicando su uso
2. WHEN se integra un servicio THEN SHALL agregarse ejemplos de uso en comentarios
3. WHEN se actualiza el README THEN SHALL incluir información sobre los nuevos componentes integrados
4. WHEN un desarrollador busca cómo usar un componente THEN SHALL encontrar documentación clara en el código o README
