# 📋 ANÁLISIS Y MEJORAS DEL MÓDULO DE RUTAS

**Fecha:** 4 de diciembre de 2025  
**Objetivo:** Implementar lógica para agregar rutas asociadas a una empresa y una resolución padre vigente

## 🔍 ESTADO ACTUAL

### Frontend
- ✅ Modelo `Ruta` tiene campos `empresaId` y `resolucionId`
- ✅ Servicio `RutaService` tiene métodos para filtrar por empresa y resolución
- ✅ Componente `AgregarRutaModalComponent` permite crear/editar rutas
- ✅ Validación de códigos únicos por resolución
- ✅ Generación automática de códigos de ruta

### Backend
- ✅ Modelo `Ruta` en Python tiene estructura básica
- ⚠️ Falta campo `empresaId` en el modelo Python
- ⚠️ Falta campo `resolucionId` en el modelo Python
- ⚠️ Router usa datos mock, no MongoDB
- ⚠️ No hay servicio real de rutas (solo mock)

## 🎯 REQUISITOS

### Funcionalidad Requerida
1. **Asociar ruta a empresa:** Cada ruta debe pertenecer a una empresa específica
2. **Asociar ruta a resolución:** Cada ruta debe estar vinculada a una resolución padre VIGENTE
3. **Validación de resolución:** Solo permitir resoluciones VIGENTES y de tipo PADRE
4. **Códigos únicos:** Los códigos de ruta deben ser únicos dentro de cada resolución
5. **Filtrado:** Poder filtrar rutas por empresa y por resolución

## 📝 CAMBIOS NECESARIOS

### 1. Backend - Modelo de Ruta

**Archivo:** `backend/app/models/ruta.py`

Agregar campos faltantes:
```python
class Ruta(BaseModel):
    # ... campos existentes ...
    empresaId: Optional[str] = None  # AGREGAR
    resolucionId: Optional[str] = None  # AGREGAR
```

### 2. Backend - Servicio de Rutas

**Crear:** `backend/app/services/ruta_service.py`

Funcionalidades necesarias:
- `create_ruta(ruta_data, empresa_id, resolucion_id)` - Crear ruta con validaciones
- `get_rutas_por_empresa(empresa_id)` - Obtener rutas de una empresa
- `get_rutas_por_resolucion(resolucion_id)` - Obtener rutas de una resolución
- `validar_resolucion_vigente(resolucion_id)` - Validar que la resolución sea VIGENTE y PADRE
- `validar_codigo_unico(codigo, resolucion_id)` - Validar código único por resolución
- `actualizar_relacion_empresa(ruta_id, empresa_id)` - Actualizar empresa en ruta

### 3. Backend - Router de Rutas

**Archivo:** `backend/app/routers/rutas_router.py`

Endpoints necesarios:
- `POST /rutas` - Crear ruta (validar empresa y resolución)
- `GET /rutas/empresa/{empresa_id}` - Obtener rutas por empresa
- `GET /rutas/resolucion/{resolucion_id}` - Obtener rutas por resolución
- `GET /rutas/validar-codigo/{codigo}/resolucion/{resolucion_id}` - Validar código único
- `PUT /rutas/{ruta_id}/empresa/{empresa_id}` - Actualizar empresa de ruta

### 4. Frontend - Componente de Rutas

**Archivo:** `frontend/src/app/components/rutas/rutas.component.ts`

Mejoras necesarias:
- Selector de empresa (obligatorio)
- Selector de resolución VIGENTE (obligatorio)
- Filtrar resoluciones por empresa seleccionada
- Mostrar solo resoluciones PADRE y VIGENTES
- Validación en tiempo real de código único por resolución
- Indicador visual de empresa y resolución asociadas

### 5. Frontend - Modal Agregar Ruta

**Archivo:** `frontend/src/app/components/rutas/agregar-ruta-modal.component.ts`

Mejoras necesarias:
- Recibir empresa y resolución como parámetros obligatorios
- Validar que la resolución sea VIGENTE antes de permitir crear ruta
- Generar código automático basado en resolución
- Mostrar información de empresa y resolución en el modal

## 🔧 IMPLEMENTACIÓN PROPUESTA

### Paso 1: Actualizar Modelo Backend
```python
# backend/app/models/ruta.py
class Ruta(BaseModel):
    # ... campos existentes ...
    empresaId: Optional[str] = None
    resolucionId: Optional[str] = None
    
class RutaCreate(BaseModel):
    # ... campos existentes ...
    empresaId: str  # Obligatorio
    resolucionId: str  # Obligatorio
```

### Paso 2: Crear Servicio de Rutas
```python
# backend/app/services/ruta_service.py
class RutaService:
    async def create_ruta(self, ruta_data: RutaCreate):
        # 1. Validar que la empresa existe
        # 2. Validar que la resolución existe y es VIGENTE
        # 3. Validar que el código es único en la resolución
        # 4. Crear la ruta
        # 5. Actualizar relaciones en empresa
        pass
    
    async def validar_resolucion_vigente(self, resolucion_id: str):
        # Verificar que la resolución sea VIGENTE y PADRE
        pass
```

### Paso 3: Actualizar Router
```python
# backend/app/routers/rutas_router.py
@router.post("/", response_model=RutaResponse)
async def create_ruta(ruta_data: RutaCreate):
    # Validar empresa y resolución
    # Crear ruta con servicio
    pass

@router.get("/empresa/{empresa_id}")
async def get_rutas_por_empresa(empresa_id: str):
    # Obtener rutas de la empresa
    pass
```

### Paso 4: Actualizar Frontend
```typescript
// frontend/src/app/components/rutas/rutas.component.ts
export class RutasComponent {
  empresaSeleccionada: Empresa | null = null;
  resolucionSeleccionada: Resolucion | null = null;
  resolucionesVigentes: Resolucion[] = [];
  
  onEmpresaSeleccionada(empresa: Empresa) {
    this.empresaSeleccionada = empresa;
    this.cargarResolucionesVigentes(empresa.id);
  }
  
  cargarResolucionesVigentes(empresaId: string) {
    this.resolucionService.getResolucionesPorEmpresa(empresaId)
      .pipe(
        map(resoluciones => resoluciones.filter(r => 
          r.estado === 'VIGENTE' && 
          r.tipoResolucion === 'PADRE'
        ))
      )
      .subscribe(resoluciones => {
        this.resolucionesVigentes = resoluciones;
      });
  }
  
  abrirModalAgregarRuta() {
    if (!this.empresaSeleccionada || !this.resolucionSeleccionada) {
      this.snackBar.open('Debe seleccionar una empresa y resolución', 'Cerrar');
      return;
    }
    
    this.dialog.open(AgregarRutaModalComponent, {
      data: {
        empresa: this.empresaSeleccionada,
        resolucion: this.resolucionSeleccionada
      }
    });
  }
}
```

## ✅ VALIDACIONES REQUERIDAS

### Al Crear Ruta
1. ✅ Empresa debe existir y estar activa
2. ✅ Resolución debe existir y estar VIGENTE
3. ✅ Resolución debe ser de tipo PADRE
4. ✅ Código de ruta debe ser único dentro de la resolución
5. ✅ Origen y destino deben ser diferentes
6. ✅ Todos los campos obligatorios deben estar completos

### Al Editar Ruta
1. ✅ No se puede cambiar la empresa asociada
2. ✅ No se puede cambiar la resolución asociada
3. ✅ Se puede cambiar el código si es único en la resolución
4. ✅ Se pueden actualizar todos los demás campos

## 📊 FLUJO DE TRABAJO

```
1. Usuario selecciona EMPRESA
   ↓
2. Sistema carga RESOLUCIONES VIGENTES de esa empresa
   ↓
3. Usuario selecciona RESOLUCIÓN PADRE VIGENTE
   ↓
4. Usuario hace clic en "Agregar Ruta"
   ↓
5. Modal se abre con empresa y resolución pre-seleccionadas
   ↓
6. Sistema genera código automático basado en resolución
   ↓
7. Usuario completa datos de la ruta
   ↓
8. Sistema valida:
   - Código único en resolución
   - Resolución vigente
   - Empresa activa
   ↓
9. Sistema crea ruta y actualiza relaciones
   ↓
10. Ruta aparece en la lista filtrada por empresa/resolución
```

## 🎨 INTERFAZ PROPUESTA

### Vista Principal de Rutas
```
┌─────────────────────────────────────────────────────────┐
│ GESTIÓN DE RUTAS                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Empresa: [Selector de Empresa ▼]                       │
│                                                         │
│ Resolución: [Selector de Resolución VIGENTE ▼]         │
│                                                         │
│ [+ Agregar Ruta]  [🔄 Actualizar]  [📥 Exportar]       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ RUTAS DE LA RESOLUCIÓN                                  │
├──────┬──────────────────┬──────────┬──────────┬────────┤
│ Cód  │ Ruta             │ Tipo     │ Estado   │ Acción │
├──────┼──────────────────┼──────────┼──────────┼────────┤
│ 01   │ PUNO - JULIACA   │ INTERP.  │ ACTIVA   │ [✏️ 🗑️]│
│ 02   │ PUNO - CUSCO     │ INTERP.  │ ACTIVA   │ [✏️ 🗑️]│
│ 03   │ PUNO - AREQUIPA  │ INTERP.  │ ACTIVA   │ [✏️ 🗑️]│
└──────┴──────────────────┴──────────┴──────────┴────────┘
```

### Modal Agregar Ruta
```
┌─────────────────────────────────────────────────────────┐
│ AGREGAR NUEVA RUTA                                      │
├─────────────────────────────────────────────────────────┤
│ Empresa: TRANSPORTES PUNO S.A. (20123456789)           │
│ Resolución: RD-001-2024 - AUTORIZACION_NUEVA (VIGENTE) │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Código de Ruta: [01] [🔄 Regenerar]                    │
│ Origen:         [PUNO ▼]                               │
│ Destino:        [JULIACA ▼]                            │
│ Tipo de Ruta:   [INTERPROVINCIAL ▼]                    │
│ Frecuencias:    [Diaria, cada 30 minutos]              │
│ Itinerario:     [Descripción del itinerario...]        │
│ Observaciones:  [Observaciones adicionales...]         │
│                                                         │
│                    [Cancelar]  [💾 Guardar Ruta]       │
└─────────────────────────────────────────────────────────┘
```

## 🚀 PRÓXIMOS PASOS

1. ✅ Actualizar modelo de Ruta en backend (agregar empresaId y resolucionId)
2. ✅ Crear servicio de rutas en backend con validaciones
3. ✅ Actualizar router de rutas con nuevos endpoints
4. ✅ Crear componente principal de rutas en frontend
5. ✅ Actualizar modal de agregar ruta con selectores
6. ✅ Implementar validaciones en tiempo real
7. ✅ Agregar filtros por empresa y resolución
8. ✅ Probar flujo completo de creación de rutas

## 📌 NOTAS IMPORTANTES

- Las rutas solo pueden asociarse a resoluciones PADRE y VIGENTES
- Los códigos de ruta son únicos dentro de cada resolución (01, 02, 03...)
- Una ruta no puede cambiar de empresa ni de resolución una vez creada
- Al desactivar una resolución, sus rutas también se desactivan
- Las rutas heredan el estado de su resolución padre
