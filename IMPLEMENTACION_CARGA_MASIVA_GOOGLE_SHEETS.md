# Implementación: Carga Masiva de Empresas desde Google Sheets

## Resumen

Se implementó un módulo completo para importar empresas directamente desde Google Sheets **sin necesidad de API key**, usando descarga directa de CSV.

## Características Principales

✅ **Sin API key requerida**
- Descarga directa de CSV desde Google Sheets
- Solo necesita que el sheet sea público

✅ **Conexión simple**
- Pegar URL o ID del sheet
- Validación automática

✅ **Validación en dos pasos**
- Validación en frontend
- Validación en backend

✅ **Previsualización de datos**
- Ver primeras filas antes de procesar
- Detectar problemas temprano

✅ **Procesamiento flexible**
- Solo validar o crear
- Reportes detallados

✅ **Interfaz intuitiva**
- Stepper de pasos
- Indicadores de progreso
- Diseño responsive

## Archivos Creados

### Frontend

#### 1. Componente Principal
- **Archivo**: `frontend/src/app/components/empresas/carga-masiva-empresas.component.ts`
- **Descripción**: Componente standalone con interfaz de 4 pasos
- **Funcionalidades**:
  - Configuración de conexión a Google Sheets
  - Descarga de CSV sin API key
  - Previsualización de datos
  - Validación y procesamiento
  - Reportes de resultados

#### 2. Estilos
- **Archivo**: `frontend/src/app/components/empresas/carga-masiva-empresas.component.scss`
- **Descripción**: Estilos completos con diseño responsive
- **Características**:
  - Stepper de pasos
  - Tablas de datos
  - Indicadores de estado
  - Diseño mobile-friendly

#### 3. Actualización de Servicio de Empresas
- **Archivo**: `frontend/src/app/services/empresa.service.ts`
- **Cambios**:
  - Nuevo método `procesarCargaMasivaGoogleSheets()`
  - Envía datos al backend para procesamiento

#### 4. Actualización de Componente de Empresas
- **Archivo**: `frontend/src/app/components/empresas/empresas.component.ts`
- **Cambios**:
  - Nuevo botón "Carga desde Google Sheets"
  - Nuevo método `abrirCargaMasivaGoogleSheets()`
  - Diferenciación entre carga Excel y Google Sheets

#### 5. Rutas
- **Archivo**: `frontend/src/app/app.routes.ts`
- **Cambios**:
  - Nueva ruta: `/empresas/carga-masiva-google-sheets`

### Backend

#### 1. Nuevo Endpoint
- **Archivo**: `backend/app/routers/empresas_router.py`
- **Endpoint**: `POST /empresas/carga-masiva/google-sheets`
- **Funcionalidades**:
  - Validación de datos
  - Creación de empresas
  - Reportes de procesamiento
  - Manejo de errores

## Flujo de Uso

```
Usuario
  ↓
Empresas Component
  ↓
Botón "Carga desde Google Sheets"
  ↓
CargaMasivaEmpresasComponent
  ├─ Paso 1: Configurar Google Sheets
  │  └─ Descargar CSV (sin API key)
  ├─ Paso 2: Previsualizar Datos
  │  └─ Mostrar primeras filas
  ├─ Paso 3: Configurar y Procesar
  │  └─ EmpresaService.procesarCargaMasivaGoogleSheets()
  │     └─ Backend: POST /empresas/carga-masiva/google-sheets
  └─ Paso 4: Resultados
     └─ Mostrar estadísticas y errores
```

## Estructura de Datos

### Entrada (Google Sheets)

```typescript
{
  ruc: string;
  razonSocial: string;
  direccionFiscal: string;
  estado?: string;
  tiposServicio?: string;
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
}
```

### Salida (Backend)

```typescript
{
  solo_validacion: boolean;
  resultado: {
    total_filas: number;
    validos: number;
    invalidos: number;
    exitosas: number;
    fallidas: number;
    empresas_creadas: Array<{
      ruc: string;
      razonSocial: string;
      id: string;
      estado: string;
    }>;
    errores: Array<{
      fila: number;
      ruc: string;
      error: string;
    }>;
  };
  mensaje: string;
}
```

## Validaciones Implementadas

### Frontend
- URL o ID de Google Sheets válido
- Datos no vacíos
- Formato de CSV correcto
- Columnas requeridas presentes

### Backend
- RUC requerido y único
- Razón Social requerida
- Dirección Fiscal requerida
- Estado válido
- Tipos de Servicio válidos

## Cómo Funciona (Sin API Key)

1. Usuario pega URL del Google Sheet
2. Se extrae el ID del sheet
3. Se construye URL de exportación CSV: `https://docs.google.com/spreadsheets/d/{ID}/export?format=csv`
4. Se descarga el CSV directamente (sin autenticación)
5. Se parsea el CSV en el frontend
6. Se envían los datos al backend para procesamiento

**Ventaja**: No requiere API key ni configuración compleja

## Configuración Requerida

### Único requisito: Google Sheet público

1. Crear un Google Sheet con tus datos
2. Compartir con "Cualquiera con el enlace"
3. ¡Listo! No necesitas nada más

## Próximos Pasos

1. **Crear hoja de prueba**
   - Crear Google Sheet con datos de prueba
   - Hacer pública o compartida

2. **Probar el módulo**
   - Acceder a Empresas
   - Hacer clic en "Carga desde Google Sheets"
   - Seguir los pasos

3. **Optimizaciones futuras**
   - Procesamiento en lotes más grandes
   - Caché de datos
   - Historial de cargas
   - Exportación de reportes
   - Soporte para múltiples pestañas

## Compilación

El proyecto compila sin errores:

```bash
npm run build
# ✅ Build successful
```

## Testing

Para probar el módulo:

1. Crear Google Sheet con datos de prueba
2. Compartir con "Cualquiera con el enlace"
3. Acceder a `/empresas/carga-masiva-google-sheets`
4. Pegar URL o ID del sheet
5. Seguir los pasos del asistente

## Documentación

Ver `CARGA_MASIVA_GOOGLE_SHEETS.md` para:
- Instrucciones detalladas
- Ejemplos de uso
- Solución de problemas
- Limitaciones y seguridad

## Cambios Realizados

### Removidos
- Servicio `google-sheets.service.ts` (no necesario)
- Configuración de API key en environment

### Agregados
- Parser de CSV en el componente
- Descarga directa de CSV desde Google Sheets
- Validación de URL/ID mejorada

### Mejorados
- Interfaz más simple
- Menos dependencias
- Mejor manejo de errores
- Documentación actualizada
