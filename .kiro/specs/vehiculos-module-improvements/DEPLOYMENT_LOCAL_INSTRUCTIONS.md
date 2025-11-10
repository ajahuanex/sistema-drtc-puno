# Instrucciones de Despliegue Local - Task 3

## 🚀 Servicios Levantados

### ✅ Frontend (Angular)
- **Puerto:** 4200
- **URL:** http://localhost:4200
- **Estado:** ✅ Corriendo
- **Proceso ID:** 28380

### ✅ Backend (FastAPI)
- **Puerto:** 8002 (cambiado desde 8000 por conflicto)
- **URL:** http://localhost:8002
- **Docs API:** http://localhost:8002/docs
- **ReDoc:** http://localhost:8002/redoc
- **Estado:** ✅ Corriendo
- **Proceso ID:** 28912

### ℹ️ Servicios Existentes (No modificados)
- **PostgreSQL:** Puerto 5432 (ya estaba corriendo)
- **Otros servicios:** Puertos 8000, 8001, 8080 (ya estaban corriendo)

## 📝 Cambios Realizados

### 1. Configuración del Backend
- Backend iniciado en puerto **8002** para evitar conflicto con servicios existentes
- Comando usado: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8002`

### 2. Configuración del Frontend
- Actualizado `frontend/src/environments/environment.ts`
- `apiUrl` cambiado de `http://localhost:8000` a `http://localhost:8002`
- Frontend se recargará automáticamente con la nueva configuración

## 🧪 Cómo Probar los Cambios de Task 3

### Acceder al Módulo de Vehículos
1. Abre tu navegador en: **http://localhost:4200**
2. Navega a: **Vehículos** (desde el menú lateral)
3. O accede directamente: **http://localhost:4200/vehiculos**

### Probar los Filtros Avanzados

#### 1. Filtro por Empresa (EmpresaSelectorComponent)
- Haz clic en el campo "Empresa" en la sección "Filtros Avanzados"
- Empieza a escribir:
  - RUC (ej: "20123456789")
  - Razón Social (ej: "Transportes")
  - Código de Empresa (ej: "EMP001")
- Selecciona una empresa del dropdown
- Verifica que aparece un chip azul: `Empresa: [Razón Social]`
- Verifica que la tabla se filtra mostrando solo vehículos de esa empresa

#### 2. Filtro por Resolución (ResolucionSelectorComponent)
- Primero selecciona una empresa (requisito)
- El campo "Resolución" se habilitará automáticamente
- Haz clic en el campo "Resolución"
- Empieza a escribir el número de resolución
- Selecciona una resolución del dropdown
- Verifica que aparece un chip naranja: `Resolución: [Número]`
- Verifica que la tabla se filtra mostrando solo vehículos con esa resolución

#### 3. Chips Visuales de Filtros Activos
- Aplica varios filtros (búsqueda rápida, placa, empresa, resolución, estado)
- Haz clic en "Filtrar"
- Verifica que aparece la sección "Filtros Activos" con chips de colores
- Prueba remover un filtro individual haciendo clic en la "×" del chip
- Verifica que el filtro se elimina y la tabla se actualiza
- Prueba el botón "Limpiar Todo" para eliminar todos los filtros

#### 4. Persistencia en URL
- Aplica varios filtros y haz clic en "Filtrar"
- Observa la URL del navegador, debe contener query params como:
  ```
  /vehiculos?empresaId=123&resolucionId=456&estado=ACTIVO&placa=ABC
  ```
- Copia la URL completa
- Abre una nueva pestaña del navegador
- Pega la URL y presiona Enter
- Verifica que:
  - Los filtros se restauran automáticamente
  - Los chips se muestran correctamente
  - La tabla muestra los resultados filtrados
  - Los selectores muestran los valores seleccionados

#### 5. Interacciones Avanzadas
- **Dependencia Empresa → Resolución:**
  - Selecciona una empresa
  - Verifica que el selector de resolución se habilita
  - Haz clic en la "×" del chip de empresa
  - Verifica que el selector de resolución se deshabilita
  - Verifica que el chip de resolución también se elimina

- **Reset de Paginación:**
  - Navega a la página 2 o 3 de la tabla
  - Aplica un filtro
  - Verifica que la paginación vuelve a la página 1

- **Búsqueda Combinada:**
  - Usa la "Búsqueda rápida" con un término
  - Aplica también un filtro de empresa
  - Verifica que ambos filtros se aplican (lógica AND)

## 🔧 Comandos Útiles

### Detener los Servicios
```powershell
# Detener frontend (proceso 28380)
Stop-Process -Id 28380

# Detener backend (proceso 28912)
Stop-Process -Id 28912
```

### Reiniciar los Servicios
```powershell
# Frontend
cd frontend
ng serve --open

# Backend (en puerto 8002)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

### Ver Logs en Tiempo Real
Los logs se muestran en las ventanas de PowerShell que se abrieron automáticamente:
- **Frontend:** Ventana con título "ng serve"
- **Backend:** Ventana con título "uvicorn"

### Verificar Puertos en Uso
```powershell
netstat -ano | findstr "LISTENING" | findstr ":4200 :8002"
```

## 📊 Estado de Puertos

| Puerto | Servicio | Estado | Proceso |
|--------|----------|--------|---------|
| 4200 | Frontend Angular | ✅ Activo | 28380 |
| 8002 | Backend FastAPI | ✅ Activo | 28912 |
| 5432 | PostgreSQL | ✅ Activo | 16972, 8036 |
| 8000 | Servicio Existente | ⚠️ Ocupado | 16972, 18404 |
| 8001 | Servicio Existente | ⚠️ Ocupado | 16972, 18404 |
| 8080 | Servicio Existente | ⚠️ Ocupado | 16972 |

## 🐛 Troubleshooting

### Frontend no carga
1. Verifica que el proceso esté corriendo: `Get-Process | Where-Object {$_.Id -eq 28380}`
2. Verifica el puerto: `netstat -ano | findstr ":4200"`
3. Revisa los logs en la ventana de PowerShell del frontend

### Backend no responde
1. Verifica que el proceso esté corriendo: `Get-Process | Where-Object {$_.Id -eq 28912}`
2. Verifica el puerto: `netstat -ano | findstr ":8002"`
3. Prueba acceder a: http://localhost:8002/docs
4. Revisa los logs en la ventana de PowerShell del backend

### Filtros no funcionan
1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña "Console" para ver errores de JavaScript
3. Ve a la pestaña "Network" para ver las peticiones HTTP
4. Verifica que las peticiones van a `http://localhost:8002`

### Error de CORS
Si ves errores de CORS en la consola:
1. Verifica que el backend esté configurado para permitir `http://localhost:4200`
2. El backend ya tiene configurado CORS para desarrollo
3. Reinicia el backend si es necesario

## ✅ Checklist de Verificación

- [ ] Frontend accesible en http://localhost:4200
- [ ] Backend accesible en http://localhost:8002/docs
- [ ] Módulo de vehículos carga correctamente
- [ ] Selector de empresa funciona con autocomplete
- [ ] Selector de resolución se habilita al seleccionar empresa
- [ ] Chips de filtros activos se muestran correctamente
- [ ] Remover chips individuales funciona
- [ ] Botón "Limpiar Todo" funciona
- [ ] URL se actualiza con los filtros
- [ ] Filtros se restauran desde la URL
- [ ] Tabla se filtra correctamente
- [ ] Paginación se resetea al filtrar

## 📚 Documentación Relacionada

- [TASK_3_COMPLETION_SUMMARY.md](./TASK_3_COMPLETION_SUMMARY.md) - Resumen de implementación
- [TASK_3_VISUAL_GUIDE.md](./TASK_3_VISUAL_GUIDE.md) - Guía visual de pruebas
- [TASK_3_DEVELOPER_GUIDE.md](./TASK_3_DEVELOPER_GUIDE.md) - Guía técnica para desarrolladores
- [TASK_3_VERIFICATION_REPORT.md](./TASK_3_VERIFICATION_REPORT.md) - Reporte de verificación completo

---

**Fecha de Despliegue:** 2025-11-09  
**Task:** 3. Mejorar filtros avanzados en VehiculosComponent  
**Estado:** ✅ Desplegado y listo para pruebas
