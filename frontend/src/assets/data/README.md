# Base de Datos Inicializadora de Localidades

Este directorio contiene los datos iniciales para poblar MongoDB con localidades del departamento de Puno, Perú.

## 🎯 Propósito

El archivo `localidades.json` sirve como **inicializador/seeder** para la base de datos MongoDB. No es la base de datos principal, sino la fuente de datos iniciales que se cargan una sola vez.

## 🔄 Flujo de Trabajo

1. **Desarrollo inicial:** Los datos se definen en `localidades.json`
2. **Inicialización:** Se ejecuta el seeder para poblar MongoDB
3. **Operación normal:** El sistema usa MongoDB como base de datos principal
4. **Actualizaciones:** Se pueden hacer cambios en MongoDB directamente o re-inicializar desde el JSON

## 📁 Archivos

### `localidades.json`
Archivo fuente con datos iniciales de localidades.

**Estructura:**
```json
{
  "localidades": [
    {
      "id": number,
      "nombre": string,
      "ubigeo": string,
      "tipo": "PROVINCIA" | "DISTRITO" | "CENTRO_POBLADO",
      "nivel_territorial": "PROVINCIA" | "DISTRITO" | "CENTRO_POBLADO",
      "departamento": string,
      "provincia": string | null,
      "distrito": string | null,
      "estaActiva": boolean,
      "fechaCreacion": string (ISO),
      "fechaActualizacion": string (ISO)
    }
  ],
  "metadata": {
    "version": string,
    "fechaGeneracion": string (ISO),
    "descripcion": string,
    "totalRegistros": number,
    "provincias": number,
    "distritos": number,
    "centrosPoblados": number,
    "fuente": string
  }
}
```

## 🗄️ Base de Datos Principal: MongoDB

### Colección: `localidades`
- **Ubicación:** MongoDB Atlas/Local
- **Propósito:** Almacenamiento permanente y operacional
- **Operaciones:** CRUD completo, búsquedas, filtros
- **Persistencia:** Todos los cambios se guardan aquí

### Servicios Disponibles

#### `LocalidadesSeederService`
- Inicializa MongoDB desde el archivo JSON
- Detecta registros existentes vs nuevos
- Actualiza registros modificados
- Maneja errores y estadísticas
- Exporta datos de MongoDB a JSON

#### `LocalidadService` (Principal)
- Operaciones CRUD con MongoDB
- API REST para el backend
- Validaciones y manejo de errores
- Búsquedas y filtros avanzados

#### `LocalidadesFactoryService`
- Decide qué servicio usar (local vs remoto)
- API unificada para ambos modos
- Útil para desarrollo y testing

## 🚀 Inicialización

### Acceso a Administración
```
http://localhost:4200/localidades/admin
```

### Proceso de Inicialización

1. **Verificar estado:** El sistema detecta si MongoDB está vacío
2. **Cargar datos:** Lee el archivo `localidades.json`
3. **Procesar registros:** 
   - Crea nuevos registros
   - Actualiza registros existentes (por ubigeo)
   - Reporta errores y estadísticas
4. **Confirmar:** Muestra resultado del proceso

### Comandos Disponibles

#### Inicializar Base de Datos
```typescript
// Poblar MongoDB desde JSON (solo nuevos registros)
await seederService.inicializarBaseDatos();
```

#### Reinicializar Base de Datos
```typescript
// Limpiar MongoDB y volver a poblar
await seederService.reinicializarBaseDatos();
```

#### Exportar Datos
```typescript
// Exportar datos actuales de MongoDB a JSON
const json = await seederService.exportarDatosMongoDB();
```

## 📊 Datos Incluidos

### Provincias (13)
- PUNO, AZANGARO, CARABAYA, CHUCUITO
- EL COLLAO, HUANCANE, LAMPA, MELGAR
- MOHO, SAN ANTONIO DE PUTINA, SAN ROMAN
- SANDIA, YUNGUYO

### Distritos (109)
Todos los distritos oficiales de las 13 provincias de Puno según INEI.

### Centros Poblados (8)
Principales centros poblados de la ciudad de Puno.

## ⚙️ Configuración

### Modo de Operación
```typescript
// En frontend/src/app/config/localidades.config.ts
export const LOCALIDADES_CONFIG = {
  modo: 'remote' as 'local' | 'remote', // MongoDB por defecto
  // ...
};
```

### Modos Disponibles

#### `remote` (Producción)
- Usa MongoDB como base de datos
- Operaciones persistentes
- API REST completa
- **Modo recomendado para producción**

#### `local` (Desarrollo)
- Usa archivo JSON en memoria
- Cambios no persisten
- Útil para testing y desarrollo
- No requiere MongoDB

## 🔧 Uso en Desarrollo

### Primera vez
```bash
# 1. Asegurar que MongoDB esté corriendo
# 2. Ir a http://localhost:4200/localidades/admin
# 3. Hacer clic en "Inicializar Base de Datos"
# 4. Verificar estadísticas
```

### Actualizar datos
```bash
# 1. Modificar /assets/data/localidades.json
# 2. Ir a admin panel
# 3. Usar "Reinicializar Base de Datos"
```

### Respaldo
```bash
# 1. Ir a admin panel
# 2. Hacer clic en "Exportar Datos"
# 3. Guardar archivo JSON generado
```

## 🛡️ Seguridad

### Operaciones Destructivas
- **Reinicializar:** Requiere confirmación
- **Limpiar:** Requiere confirmación doble
- **Solo desarrollo:** Panel admin solo visible en desarrollo

### Validaciones
- Verificación de datos antes de insertar
- Manejo de duplicados por ubigeo
- Rollback automático en caso de errores críticos

## 📈 Monitoreo

### Estadísticas Disponibles
- Total de registros
- Conteo por tipo (provincias, distritos, centros poblados)
- Registros activos vs inactivos
- Resultado de operaciones (creados, actualizados, errores)

### Logs
- Proceso de inicialización detallado
- Errores específicos por registro
- Estadísticas de rendimiento

## 🔄 Flujo de Datos

```
JSON Local → Seeder Service → MongoDB → LocalidadService → Frontend
     ↑                                        ↓
     └── Exportar ←── Admin Panel ←── API REST
```

## 📝 Notas Importantes

1. **Una sola inicialización:** Normalmente solo se ejecuta una vez
2. **MongoDB es la fuente de verdad:** Después de inicializar, MongoDB es la base de datos principal
3. **Archivo JSON como backup:** Se puede usar para restaurar datos
4. **Actualizaciones:** Cambios en producción se hacen en MongoDB, no en el JSON
5. **Desarrollo:** El JSON se puede actualizar para nuevas funcionalidades

## 🚨 Advertencias

- ⚠️ **Reinicializar elimina todos los datos de MongoDB**
- ⚠️ **Siempre hacer backup antes de operaciones destructivas**
- ⚠️ **No ejecutar en producción sin supervisión**
- ⚠️ **Verificar conexión a MongoDB antes de inicializar**

## 📞 Soporte

Para problemas con la inicialización:
1. Verificar logs en la consola del navegador
2. Revisar conexión a MongoDB
3. Validar formato del archivo JSON
4. Usar el panel de administración para diagnósticos