# ✅ Tipos de Ruta Movidos a Configuración

## 🎯 Objetivo Completado

Los tipos de ruta ahora se gestionan desde el **módulo de configuraciones** en lugar de estar hardcodeados en el código.

## 📋 Cambios Realizados

### 1. Backend - Modelo de Configuración ✅

**Archivo**: `backend/app/models/configuracion.py`

```python
# Agregado nuevo tipo de configuración
class TipoConfiguracion(str, Enum):
    TIPOS_RUTA = "TIPOS_RUTA"  # ✅ NUEVO

# Agregada configuración predefinida
CONFIGURACIONES_PREDEFINIDAS = {
    "TIPOS_RUTA": {
        "nombre": "Tipos de Ruta de Transporte",
        "descripcion": "Clasificación de rutas según su ámbito territorial",
        "items": [
            {
                "codigo": "URBANA",
                "nombre": "Urbana",
                "descripcion": "Ruta dentro de una misma ciudad o distrito",
                "orden": 1
            },
            {
                "codigo": "INTERURBANA",
                "nombre": "Interurbana",
                "descripcion": "Ruta entre ciudades cercanas de la misma provincia",
                "orden": 2
            },
            {
                "codigo": "INTERPROVINCIAL",
                "nombre": "Interprovincial",
                "descripcion": "Ruta entre provincias del mismo departamento",
                "orden": 3
            },
            {
                "codigo": "INTERREGIONAL",
                "nombre": "Interregional",
                "descripcion": "Ruta entre diferentes departamentos o regiones",
                "orden": 4
            },
            {
                "codigo": "RURAL",
                "nombre": "Rural",
                "descripcion": "Ruta en zonas rurales con características especiales",
                "orden": 5
            }
        ]
    }
}
```

### 2. Frontend - Servicio de Configuración ✅

**Archivo**: `frontend/src/app/services/configuracion.service.ts`

```typescript
// ✅ Nuevo computed property
tiposRutaConfig = computed(() => {
  const config = this.configuraciones().find(c => c.nombre === 'TIPOS_RUTA_CONFIG');
  if (config && config.valor) {
    try {
      return JSON.parse(config.valor);
    } catch (error) {
      return this.getTiposRutaDefault();
    }
  }
  return this.getTiposRutaDefault();
});

// ✅ Método helper para valores por defecto
private getTiposRutaDefault() {
  return [
    { codigo: 'URBANA', nombre: 'Urbana', descripcion: 'Transporte dentro de la ciudad', estaActivo: true },
    { codigo: 'INTERURBANA', nombre: 'Interurbana', descripcion: 'Transporte entre ciudades cercanas', estaActivo: true },
    { codigo: 'INTERPROVINCIAL', nombre: 'Interprovincial', descripcion: 'Transporte entre provincias', estaActivo: true },
    { codigo: 'INTERREGIONAL', nombre: 'Interregional', descripcion: 'Transporte entre regiones', estaActivo: true },
    { codigo: 'RURAL', nombre: 'Rural', descripcion: 'Transporte en zonas rurales', estaActivo: true }
  ];
}
```

### 3. Frontend - Componente de Rutas ✅

**Archivo**: `frontend/src/app/shared/ruta-form-shared.component.ts`

**Antes** (hardcodeado):
```typescript
tiposRuta = [
  { value: 'INTERPROVINCIAL', label: 'INTERPROVINCIAL' },
  { value: 'INTERURBANA', label: 'INTERURBANA' },
  { value: 'URBANA', label: 'URBANA' },
  { value: 'NACIONAL', label: 'NACIONAL' },
  { value: 'INTERNACIONAL', label: 'INTERNACIONAL' }
];
```

**Después** (desde configuración):
```typescript
// ✅ Opciones desde configuración
tiposRuta = computed(() => {
  const config = this.configuracionService.tiposRutaConfig();
  return config.filter((t: any) => t.estaActivo).map((t: any) => ({
    value: t.codigo,
    label: t.nombre
  }));
});
```

## 🎨 Ventajas de este Cambio

### 1. ✅ Administrable desde la UI
Los administradores pueden:
- Agregar nuevos tipos de ruta
- Modificar nombres y descripciones
- Activar/desactivar tipos
- Cambiar el orden de visualización

### 2. ✅ Sin Recompilación
Los cambios se aplican inmediatamente sin necesidad de:
- Modificar código
- Recompilar el frontend
- Reiniciar el backend

### 3. ✅ Consistencia
- Un solo lugar para gestionar los tipos
- Mismos valores en todo el sistema
- Fácil de mantener

### 4. ✅ Flexible
- Se pueden agregar tipos personalizados
- Se pueden desactivar tipos temporalmente
- Se pueden agregar metadatos adicionales

## 📊 Estructura de Configuración

### En la Base de Datos

```json
{
  "nombre": "TIPOS_RUTA_CONFIG",
  "valor": "[{\"codigo\":\"URBANA\",\"nombre\":\"Urbana\",\"descripcion\":\"Transporte dentro de la ciudad\",\"estaActivo\":true},{\"codigo\":\"INTERURBANA\",\"nombre\":\"Interurbana\",\"descripcion\":\"Transporte entre ciudades cercanas\",\"estaActivo\":true}]",
  "descripcion": "Configuración de tipos de ruta disponibles",
  "categoria": "SISTEMA",
  "activo": true,
  "esEditable": true
}
```

### Formato del Valor

```json
[
  {
    "codigo": "URBANA",
    "nombre": "Urbana",
    "descripcion": "Transporte dentro de la ciudad",
    "estaActivo": true
  },
  {
    "codigo": "INTERURBANA",
    "nombre": "Interurbana",
    "descripcion": "Transporte entre ciudades cercanas",
    "estaActivo": true
  }
]
```

## 🔧 Cómo Usar

### En Componentes

```typescript
import { ConfiguracionService } from '../services/configuracion.service';

export class MiComponente {
  private configuracionService = inject(ConfiguracionService);
  
  // Obtener tipos de ruta
  tiposRuta = this.configuracionService.tiposRutaConfig();
  
  // Usar en el template
  // @for (tipo of tiposRuta(); track tipo.codigo) {
  //   <mat-option [value]="tipo.codigo">{{ tipo.nombre }}</mat-option>
  // }
}
```

### En el Módulo de Configuraciones

Los administradores pueden editar la configuración `TIPOS_RUTA_CONFIG` desde:
- `/configuraciones` → Buscar "TIPOS_RUTA_CONFIG"
- Editar el valor JSON
- Guardar cambios
- Los cambios se reflejan inmediatamente en todos los formularios

## 🚀 Próximos Pasos

### 1. Crear UI de Administración
Crear una interfaz amigable para gestionar tipos de ruta:
- Lista de tipos con drag & drop para ordenar
- Botones para activar/desactivar
- Formulario para agregar/editar tipos
- Vista previa de cómo se verá en los formularios

### 2. Agregar Validaciones
- Validar que el código sea único
- Validar que el nombre no esté vacío
- Validar que al menos un tipo esté activo

### 3. Agregar Metadatos
Extender la configuración con:
- Color para cada tipo
- Icono para cada tipo
- Reglas de negocio específicas
- Permisos por tipo

### 4. Migración de Datos
Si hay rutas existentes con tipos que ya no están en la configuración:
- Detectarlas automáticamente
- Ofrecer migración asistida
- Mantener histórico de cambios

## 📝 Ejemplo de Uso Completo

### Agregar un Nuevo Tipo de Ruta

1. **Ir a Configuraciones**
   - Navegar a `/configuraciones`
   - Buscar "TIPOS_RUTA_CONFIG"

2. **Editar el Valor**
   ```json
   [
     ...tipos existentes...,
     {
       "codigo": "INTERNACIONAL",
       "nombre": "Internacional",
       "descripcion": "Transporte entre países",
       "estaActivo": true
     }
   ]
   ```

3. **Guardar**
   - Los formularios de rutas ahora mostrarán "Internacional"

### Desactivar un Tipo Temporalmente

1. **Editar la configuración**
2. **Cambiar `estaActivo` a `false`**
   ```json
   {
     "codigo": "RURAL",
     "nombre": "Rural",
     "descripcion": "Transporte en zonas rurales",
     "estaActivo": false  // ← Desactivado
   }
   ```
3. **Guardar**
   - El tipo "Rural" ya no aparecerá en los formularios
   - Las rutas existentes con tipo "Rural" no se afectan

## 🎯 Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Ubicación** | Hardcodeado en componentes | Configuración en BD |
| **Modificación** | Requiere código | Desde UI de admin |
| **Despliegue** | Requiere recompilación | Cambio inmediato |
| **Mantenimiento** | Difícil | Fácil |
| **Flexibilidad** | Baja | Alta |
| **Consistencia** | Múltiples lugares | Un solo lugar |

## ✅ Estado Actual

- ✅ Campo `tipoRuta` es **opcional**
- ✅ Tipos de ruta en **configuración**
- ✅ Componentes usan **configuración dinámica**
- ✅ Valores por defecto si falla la configuración
- ✅ Listo para administración desde UI

## 🔄 Para Aplicar los Cambios

**Recarga la página del navegador** (F5) para que Angular cargue la nueva configuración.

Los tipos de ruta ahora se cargan desde el servicio de configuración y se pueden administrar sin tocar el código.
