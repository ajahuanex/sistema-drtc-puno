# Implementation Plan

- [x] 1. Actualizar archivo de exportaciones compartidas


  - Agregar CodigoEmpresaInfoComponent a shared/index.ts
  - Verificar que todas las exportaciones son válidas
  - Probar imports desde otros componentes
  - _Requirements: 4.1, 4.2, 4.3_



- [x] 2. Configurar IconService globalmente






  - Agregar IconService a app.config.ts providers si no está
  - Verificar que el servicio se inicializa correctamente

  - Probar detección de Material Icons en diferentes navegadores



  - _Requirements: 3.1, 3.2_

- [x] 3. Integrar CodigoEmpresaInfoComponent en EmpresaDetailComponent





  - [x] 3.1 Importar CodigoEmpresaInfoComponent en empresa-detail.component.ts










    - Agregar import del componente



    - Agregar a array de imports del componente
    - _Requirements: 1.1_


  
  - [x] 3.2 Agregar componente al template de empresa-detail





    - Ubicar en tab "Información General"



    - Pasar codigoEmpresa como signal


    - Verificar que se renderiza correctamente
    - _Requirements: 1.2, 1.3, 1.4_


  


  - [x] 3.3 Probar visualización con diferentes códigos










    - Probar con código válido (ej: 0123PRT)
    - Probar con empresa sin código
    - Verificar chips de colores para tipos


    - _Requirements: 1.5_

- [x] 4. Reemplazar mat-icon con SmartIconComponent en componentes principales






  - [x] 4.1 Identificar componentes críticos para reemplazo

    - Listar componentes que usan mat-icon frecuentemente
    - Priorizar componentes de navegación y acciones
    - _Requirements: 3.3_
  



  - [x] 4.2 Reemplazar iconos en MainLayoutComponent


    - Importar SmartIconComponent
    - Reemplazar mat-icon en menú de navegación


    - Verificar que los iconos se muestran correctamente
    - _Requirements: 3.3, 3.4_


  
  - [x] 4.3 Reemplazar iconos en DashboardComponent




    - Importar SmartIconComponent
    - Reemplazar mat-icon en cards y botones


    - Verificar tooltips automáticos
    - _Requirements: 3.4, 3.5_
  
  - [x] 4.4 Probar fallbacks deshabilitando Material Icons


    - Bloquear carga de Material Icons en DevTools

    - Verificar que aparecen emojis de fallback
    - Verificar que la funcionalidad no se rompe
    - _Requirements: 3.2_

- [x] 5. Mejorar EmpresaSelectorComponent para modal de resolución


  - [x] 5.1 Actualizar EmpresaSelectorComponent con búsqueda por código





    - Agregar filtrado por código de empresa en método _filter
    - Actualizar placeholder y hint
    - Probar búsqueda por código
    - _Requirements: 6.3_
  

  - [x] 5.2 Integrar EmpresaSelectorComponent en CrearResolucionComponent









    - Importar EmpresaSelectorComponent
    - Reemplazar mat-select actual con app-empresa-selector
    - Conectar eventos con formulario reactivo
    - _Requirements: 6.1, 6.2_
  

  - [x] 5.3 Implementar manejo de selección de empresa


    - Crear método onEmpresaSeleccionadaBuscador
    - Actualizar empresaSeleccionada signal
    - Actualizar empresaId en formulario
    - Filtrar expedientes por empresa seleccionada
    - _Requirements: 6.2, 6.3_


  
  - [x] 5.4 Mejorar UX del selector





    - Agregar loading state mientras carga empresas
    - Mostrar mensaje cuando no hay resultados
    - Agregar indicador de campo requerido

    - _Requirements: 6.4, 6.5, 6.6_
  
  - [x] 5.5 Probar flujo completo de creación de resolución









    - Abrir modal de crear resolución
    - Buscar empresa por RUC
    - Buscar empresa por razón social

    - Buscar empresa por código
    - Verificar que se completa el formulario
    - Crear resolución exitosamente
    - _Requirements: 6.1, 6.2, 6.3_


- [x] 6. Preparar FlujoTrabajoService para uso futuro





  - Verificar que el servicio está en providedIn: 'root'
  - Documentar API del servicio con JSDoc
  - Crear archivo de ejemplos de uso
  - Agregar comentarios sobre integración futura
  - _Requirements: 2.1, 2.2, 7.2_


- [x] 7. Agregar documentación JSDoc a componentes integrados


  - [x] 7.1 Documentar CodigoEmpresaInfoComponent





    - Agregar JSDoc al componente
    - Documentar @Input codigoEmpresa
    - Documentar métodos públicos

    - Agregar ejemplos de uso
    - _Requirements: 7.1, 7.3_
  
  - [x] 7.2 Documentar SmartIconComponent





    - Agregar JSDoc al componente

    - Documentar todos los @Input
    - Documentar comportamiento de fallback
    - Agregar ejemplos de uso
    - _Requirements: 7.1, 7.3_


  

  - [x] 7.3 Documentar EmpresaSelectorComponent





    - Agregar JSDoc al componente
    - Documentar @Input y @Output
    - Documentar métodos públicos
    - Agregar ejemplos de uso en modal
    - _Requirements: 7.1, 7.3_

  
  - [x] 7.4 Documentar IconService





    - Agregar JSDoc a métodos públicos
    - Documentar estructura de IconFallback
    - Agregar ejemplos de uso
    - Documentar proceso de detección
    - _Requirements: 7.2, 7.3_

-

- [x] 8. Actualizar README con información de componentes integrados




  - Agregar sección sobre CodigoEmpresaInfoComponent
  - Agregar sección sobre SmartIconComponent e IconService
  - Agregar sección sobre EmpresaSelectorComponent mejorado
  - Agregar sección sobre FlujoTrabajoService (preparado)
  - Actualizar lista de componentes disponibles

  - _Requirements: 7.3, 7.4_
-

- [x] 9. Ejecutar tests y verificar compilación




  - [x] 9.1 Ejecutar ng build


    - Verificar que no hay errores de compilación
    - Verificar que no hay warnings de archivos no utilizados
    - Verificar tamaño del bundle
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 9.2 Ejecutar ng test


    - Ejecutar tests unitarios existentes
    - Verificar que no hay regresiones
    - Agregar tests para nuevas integraciones
    - _Requirements: 5.4_
  
  - [x] 9.3 Ejecutar ng serve y verificar en navegador


    - Verificar que la aplicación carga sin errores
    - Verificar que no hay warnings en consola
    - Probar flujos principales
    - _Requirements: 5.1, 5.2_

- [x] 10. Realizar pruebas manuales completas






  - [x] 10.1 Probar vista de detalle de empresa

    - Navegar a detalle de empresa
    - Verificar que CodigoEmpresaInfoComponent se muestra
    - Verificar chips de tipos de empresa
    - Probar con empresa sin código
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  


  - [ ] 10.2 Probar creación de resolución con nuevo selector
    - Abrir modal de crear resolución
    - Probar búsqueda por RUC
    - Probar búsqueda por razón social
    - Probar búsqueda por código de empresa
    - Verificar autocompletado
    - Crear resolución completa


    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ] 10.3 Probar SmartIconComponent en diferentes escenarios
    - Verificar iconos en navegación
    - Verificar iconos en botones


    - Verificar tooltips
    - Probar con Material Icons deshabilitado
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ] 10.4 Verificar que no hay regresiones
    - Probar flujos principales de la aplicación
    - Verificar que todos los módulos funcionan
    - Verificar que no hay errores en consola
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
