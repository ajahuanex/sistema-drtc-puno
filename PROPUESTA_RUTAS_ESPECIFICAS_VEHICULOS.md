# 🚗 PROPUESTA: RUTAS ESPECÍFICAS EN MÓDULO DE VEHÍCULOS

## 🎯 OBJETIVO

Implementar la funcionalidad para que los vehículos puedan tener **rutas específicas** derivadas de las **rutas generales** de sus resoluciones padre, permitiendo personalización de horarios, frecuencias y paradas.

---

## 📋 CONCEPTOS CLAVE

### **🌐 RUTAS GENERALES (Resoluciones PADRE)**
- Rutas base definidas en resoluciones padre
- Trayectos principales autorizados por la empresa
- Sirven como plantilla para crear rutas específicas
- **Ejemplo**: Ruta General "PUNO → JULIACA" (Resolución R-0001-2025)

### **🎯 RUTAS ESPECÍFICAS (Resoluciones HIJAS/INCREMENTO)**
- Derivadas de rutas generales
- Personalizaciones específicas para vehículos individuales:
  - ⏰ **Horarios particulares**
  - 🔄 **Frecuencias específicas**
  - 🚏 **Paradas adicionales**
  - ⚠️ **Restricciones especiales**
- Asociadas a resoluciones INCREMENTO
- **Ejemplo**: Ruta Específica "PUNO → JULIACA (Expreso Mañana)" basada en ruta general

---

## 🔍 ANÁLISIS DEL ESTADO ACTUAL

### **✅ LO QUE YA TENEMOS**
1. **Estructura de Resoluciones**: PADRE e INCREMENTO implementadas
2. **Vehículos asociados a resoluciones**: Funcionalidad existente
3. **Rutas generales**: Creadas y asociadas a resoluciones padre
4. **Módulo de vehículos**: Base funcional implementada

### **⚠️ LO QUE FALTA IMPLEMENTAR**
1. **Modelo de Rutas Específicas**: Relación con rutas generales
2. **Funcionalidad en módulo vehículos**: Agregar/gestionar rutas específicas
3. **Endpoints backend**: CRUD de rutas específicas
4. **Interfaz frontend**: Modal y formularios para rutas específicas

---

## 🚀 PROPUESTA DE IMPLEMENTACIÓN

### **📊 FASE 1: BACKEND - MODELO Y ENDPOINTS**

#### **1.1 Modelo RutaEspecifica**
```python
class RutaEspecifica(BaseModel):
    id: str
    rutaGeneralId: str  # Referencia a ruta general
    vehiculoId: str     # Vehículo específico
    resolucionId: str   # Resolución del vehículo
    
    # Datos base (heredados de ruta general)
    codigo: str         # Ej: "PUN-JUL-ESP-001"
    origen: str
    destino: str
    distancia: float
    
    # Personalizaciones específicas
    horarios: List[HorarioEspecifico]
    frecuencias: List[FrecuenciaEspecifica]
    paradasAdicionales: List[ParadaEspecifica]
    restricciones: List[RestriccionEspecifica]
    
    # Metadatos
    tipoRuta: str = "ESPECIFICA"
    estado: str = "ACTIVA"
    fechaCreacion: datetime
    fechaVigenciaInicio: datetime
    fechaVigenciaFin: Optional[datetime]
```

#### **1.2 Endpoints Requeridos**
```python
# Obtener rutas del vehículo
GET /api/v1/vehiculos/{vehiculo_id}/rutas
GET /api/v1/vehiculos/{vehiculo_id}/rutas-especificas

# Obtener rutas generales disponibles para el vehículo
GET /api/v1/vehiculos/{vehiculo_id}/rutas-generales-disponibles

# CRUD de rutas específicas
POST /api/v1/vehiculos/{vehiculo_id}/rutas-especificas
PUT /api/v1/rutas-especificas/{ruta_id}
DELETE /api/v1/rutas-especificas/{ruta_id}
GET /api/v1/rutas-especificas/{ruta_id}

# Validaciones
POST /api/v1/rutas-especificas/validar
GET /api/v1/rutas-generales/{ruta_id}/plantilla
```

### **🎨 FASE 2: FRONTEND - INTERFAZ DE USUARIO**

#### **2.1 Modificaciones en Módulo de Vehículos**

##### **Agregar columna "Rutas Específicas" en tabla**
```typescript
displayedColumns = [
  'placa', 'marca', 'empresa', 'categoria', 
  'estado', 'anio', 'rutas-especificas', 'acciones'
];
```

##### **Agregar botón "Gestionar Rutas Específicas" en menú de acciones**
```html
<button mat-menu-item (click)="gestionarRutasEspecificas(vehiculo)">
  <mat-icon>route</mat-icon>
  <span>GESTIONAR RUTAS ESPECÍFICAS</span>
</button>
```

#### **2.2 Modal de Gestión de Rutas Específicas**

##### **Componente: `GestionarRutasEspecificasModalComponent`**
```typescript
@Component({
  selector: 'app-gestionar-rutas-especificas-modal',
  template: `
    <div class="modal-header">
      <h2>Gestionar Rutas Específicas</h2>
      <h3>Vehículo: {{ vehiculo.placa }}</h3>
    </div>
    
    <div class="modal-content">
      <!-- Información del vehículo y resolución -->
      <mat-card class="info-card">
        <mat-card-content>
          <p><strong>Resolución:</strong> {{ resolucion.nroResolucion }}</p>
          <p><strong>Tipo:</strong> {{ resolucion.tipoResolucion }}</p>
          <p><strong>Empresa:</strong> {{ empresa.razonSocial.principal }}</p>
        </mat-card-content>
      </mat-card>
      
      <!-- Rutas generales disponibles -->
      <mat-card class="rutas-generales-card">
        <mat-card-header>
          <mat-card-title>Rutas Generales Disponibles</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="rutas-generales-list">
            @for (rutaGeneral of rutasGeneralesDisponibles; track rutaGeneral.id) {
              <div class="ruta-general-item">
                <div class="ruta-info">
                  <h4>{{ rutaGeneral.codigo }}</h4>
                  <p>{{ rutaGeneral.origen }} → {{ rutaGeneral.destino }}</p>
                  <span class="distancia">{{ rutaGeneral.distancia }} km</span>
                </div>
                <button mat-raised-button color="primary" 
                        (click)="crearRutaEspecifica(rutaGeneral)">
                  <mat-icon>add</mat-icon>
                  Crear Ruta Específica
                </button>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Rutas específicas existentes -->
      <mat-card class="rutas-especificas-card">
        <mat-card-header>
          <mat-card-title>Rutas Específicas del Vehículo</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (rutasEspecificas.length === 0) {
            <div class="empty-state">
              <mat-icon>route</mat-icon>
              <p>No hay rutas específicas creadas</p>
            </div>
          } @else {
            <div class="rutas-especificas-list">
              @for (rutaEspecifica of rutasEspecificas; track rutaEspecifica.id) {
                <div class="ruta-especifica-item">
                  <div class="ruta-info">
                    <h4>{{ rutaEspecifica.codigo }}</h4>
                    <p>{{ rutaEspecifica.origen }} → {{ rutaEspecifica.destino }}</p>
                    <span class="base-ruta">Base: {{ rutaEspecifica.rutaGeneralCodigo }}</span>
                  </div>
                  <div class="ruta-actions">
                    <button mat-icon-button (click)="editarRutaEspecifica(rutaEspecifica)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" 
                            (click)="eliminarRutaEspecifica(rutaEspecifica)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `
})
```

#### **2.3 Modal de Crear/Editar Ruta Específica**

##### **Componente: `CrearRutaEspecificaModalComponent`**
```typescript
@Component({
  selector: 'app-crear-ruta-especifica-modal',
  template: `
    <div class="modal-header">
      <h2>{{ esEdicion ? 'Editar' : 'Crear' }} Ruta Específica</h2>
    </div>
    
    <form [formGroup]="rutaForm" class="ruta-form">
      <!-- Información de la ruta base -->
      <mat-card class="ruta-base-card">
        <mat-card-header>
          <mat-card-title>Ruta Base</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="ruta-base-info">
            <p><strong>Código:</strong> {{ rutaGeneral.codigo }}</p>
            <p><strong>Trayecto:</strong> {{ rutaGeneral.origen }} → {{ rutaGeneral.destino }}</p>
            <p><strong>Distancia:</strong> {{ rutaGeneral.distancia }} km</p>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Datos básicos de la ruta específica -->
      <mat-card class="datos-basicos-card">
        <mat-card-header>
          <mat-card-title>Datos de la Ruta Específica</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field>
              <mat-label>Código de Ruta Específica</mat-label>
              <input matInput formControlName="codigo" placeholder="Ej: PUN-JUL-ESP-001">
            </mat-form-field>
            
            <mat-form-field>
              <mat-label>Nombre/Descripción</mat-label>
              <input matInput formControlName="descripcion" 
                     placeholder="Ej: Expreso Mañana, Servicio Nocturno">
            </mat-form-field>
            
            <mat-form-field>
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado">
                <mat-option value="ACTIVA">Activa</mat-option>
                <mat-option value="INACTIVA">Inactiva</mat-option>
                <mat-option value="SUSPENDIDA">Suspendida</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Horarios específicos -->
      <mat-card class="horarios-card">
        <mat-card-header>
          <mat-card-title>Horarios Específicos</mat-card-title>
          <button mat-icon-button (click)="agregarHorario()">
            <mat-icon>add</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div formArrayName="horarios">
            @for (horario of horariosFormArray.controls; track $index) {
              <div [formGroupName]="$index" class="horario-item">
                <mat-form-field>
                  <mat-label>Hora Salida</mat-label>
                  <input matInput type="time" formControlName="horaSalida">
                </mat-form-field>
                
                <mat-form-field>
                  <mat-label>Hora Llegada</mat-label>
                  <input matInput type="time" formControlName="horaLlegada">
                </mat-form-field>
                
                <mat-form-field>
                  <mat-label>Días</mat-label>
                  <mat-select formControlName="dias" multiple>
                    <mat-option value="L">Lunes</mat-option>
                    <mat-option value="M">Martes</mat-option>
                    <mat-option value="X">Miércoles</mat-option>
                    <mat-option value="J">Jueves</mat-option>
                    <mat-option value="V">Viernes</mat-option>
                    <mat-option value="S">Sábado</mat-option>
                    <mat-option value="D">Domingo</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <button mat-icon-button color="warn" (click)="eliminarHorario($index)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Paradas adicionales -->
      <mat-card class="paradas-card">
        <mat-card-header>
          <mat-card-title>Paradas Adicionales</mat-card-title>
          <button mat-icon-button (click)="agregarParada()">
            <mat-icon>add</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div formArrayName="paradasAdicionales">
            @for (parada of paradasFormArray.controls; track $index) {
              <div [formGroupName]="$index" class="parada-item">
                <mat-form-field>
                  <mat-label>Nombre de Parada</mat-label>
                  <input matInput formControlName="nombre">
                </mat-form-field>
                
                <mat-form-field>
                  <mat-label>Ubicación</mat-label>
                  <input matInput formControlName="ubicacion">
                </mat-form-field>
                
                <mat-form-field>
                  <mat-label>Orden</mat-label>
                  <input matInput type="number" formControlName="orden">
                </mat-form-field>
                
                <button mat-icon-button color="warn" (click)="eliminarParada($index)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </form>
    
    <div class="modal-actions">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-raised-button color="primary" 
              [disabled]="rutaForm.invalid" 
              (click)="guardar()">
        {{ esEdicion ? 'Actualizar' : 'Crear' }} Ruta Específica
      </button>
    </div>
  `
})
```

### **🔄 FASE 3: INTEGRACIÓN Y FLUJO DE TRABAJO**

#### **3.1 Flujo de Trabajo Completo**

```
1. Usuario accede al módulo de vehículos
2. Selecciona un vehículo específico
3. Hace clic en "Gestionar Rutas Específicas"
4. Sistema verifica:
   - Vehículo tiene resolución asociada
   - Resolución tiene rutas generales disponibles
5. Muestra modal con:
   - Rutas generales disponibles
   - Rutas específicas existentes
6. Usuario puede:
   - Crear nueva ruta específica basada en ruta general
   - Editar ruta específica existente
   - Eliminar ruta específica
7. Al crear ruta específica:
   - Selecciona ruta general base
   - Personaliza horarios, paradas, etc.
   - Sistema valida y guarda
8. Ruta específica queda asociada al vehículo
```

#### **3.2 Validaciones Requeridas**

```typescript
// Validaciones en frontend
validarRutaEspecifica(rutaData: any): string[] {
  const errores: string[] = [];
  
  // Validar código único
  if (!rutaData.codigo || rutaData.codigo.trim() === '') {
    errores.push('El código de ruta es requerido');
  }
  
  // Validar horarios
  if (!rutaData.horarios || rutaData.horarios.length === 0) {
    errores.push('Debe definir al menos un horario');
  }
  
  // Validar que no se solapen horarios
  // Validar que las paradas estén en orden
  // Validar fechas de vigencia
  
  return errores;
}
```

---

## 📊 BENEFICIOS DE LA IMPLEMENTACIÓN

### **👥 Para los Usuarios**
1. **Flexibilidad**: Personalizar rutas según necesidades específicas
2. **Control granular**: Gestión detallada de horarios y paradas
3. **Trazabilidad**: Seguimiento de rutas específicas por vehículo
4. **Cumplimiento**: Mejor control regulatorio

### **🏢 Para la Empresa**
1. **Optimización**: Mejor aprovechamiento de rutas autorizadas
2. **Diferenciación**: Servicios especializados (expreso, nocturno, etc.)
3. **Eficiencia**: Gestión centralizada de variaciones de ruta
4. **Reportes**: Análisis detallado de operaciones por ruta específica

### **⚖️ Para el Cumplimiento Regulatorio**
1. **Autorización**: Rutas específicas basadas en autorizaciones generales
2. **Documentación**: Registro detallado de variaciones autorizadas
3. **Auditoría**: Trazabilidad completa de rutas y modificaciones
4. **Flexibilidad regulatoria**: Adaptación a cambios normativos

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### **📅 CRONOGRAMA SUGERIDO**

#### **Semana 1: Backend**
- [ ] Crear modelo RutaEspecifica
- [ ] Implementar endpoints CRUD
- [ ] Establecer relaciones con rutas generales
- [ ] Testing de endpoints

#### **Semana 2: Frontend Base**
- [ ] Modificar módulo de vehículos
- [ ] Crear modal de gestión de rutas específicas
- [ ] Implementar listado de rutas específicas
- [ ] Conectar con endpoints backend

#### **Semana 3: Frontend Avanzado**
- [ ] Crear modal de crear/editar ruta específica
- [ ] Implementar formularios dinámicos
- [ ] Agregar validaciones frontend
- [ ] Implementar funcionalidad completa

#### **Semana 4: Testing e Integración**
- [ ] Testing completo de funcionalidad
- [ ] Integración con módulos existentes
- [ ] Validaciones de negocio
- [ ] Documentación y capacitación

---

## ✅ CRITERIOS DE ACEPTACIÓN

### **Funcionalidad Básica**
- [ ] Vehículo puede tener múltiples rutas específicas
- [ ] Rutas específicas se basan en rutas generales
- [ ] Personalización de horarios y paradas
- [ ] CRUD completo de rutas específicas

### **Integración**
- [ ] Funciona con resoluciones PADRE e INCREMENTO
- [ ] Respeta permisos y autorizaciones
- [ ] Se integra con módulo de vehículos existente
- [ ] Mantiene consistencia de datos

### **Experiencia de Usuario**
- [ ] Interfaz intuitiva y fácil de usar
- [ ] Validaciones claras y útiles
- [ ] Feedback apropiado al usuario
- [ ] Rendimiento aceptable

---

## 🎉 RESULTADO ESPERADO

Al completar esta implementación, el sistema tendrá:

1. **✅ Funcionalidad completa de rutas específicas**
2. **✅ Integración perfecta con módulo de vehículos**
3. **✅ Flexibilidad para personalizar servicios**
4. **✅ Cumplimiento regulatorio mejorado**
5. **✅ Base sólida para futuras expansiones**

---

**Fecha**: 26 de Diciembre, 2024  
**Funcionalidad**: Rutas Específicas en Módulo de Vehículos  
**Estado**: 📋 **PROPUESTA LISTA PARA IMPLEMENTACIÓN**