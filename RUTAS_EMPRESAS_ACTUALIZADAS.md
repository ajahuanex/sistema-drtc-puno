# Rutas Actualizadas para el Módulo de Empresas

## Nuevas Rutas a Agregar

Agregar las siguientes rutas en tu archivo de routing (probablemente `app.routes.ts` o `empresas.routes.ts`):

```typescript
import { EmpresaDetailComponent } from './components/empresas/empresa-detail.component';
import { EmpresaResolucionesComponent } from './components/empresas/empresa-resoluciones.component';
import { EmpresaVehiculosComponent } from './components/empresas/empresa-vehiculos.component';
import { EmpresaConductoresComponent } from './components/empresas/empresa-conductores.component';
import { EmpresaDocumentosComponent } from './components/empresas/empresa-documentos.component';
import { EmpresaAuditoriaComponent } from './components/empresas/empresa-auditoria.component';

export const empresasRoutes = [
  {
    path: '',
    component: EmpresasComponent
  },
  {
    path: ':id',
    component: EmpresaDetailComponent
  },
  {
    path: ':id/resoluciones',
    component: EmpresaResolucionesComponent
  },
  {
    path: ':id/vehiculos',
    component: EmpresaVehiculosComponent
  },
  {
    path: ':id/conductores',
    component: EmpresaConductoresComponent
  },
  {
    path: ':id/documentos',
    component: EmpresaDocumentosComponent
  },
  {
    path: ':id/auditoria',
    component: EmpresaAuditoriaComponent
  }
];
```

## Estructura de Rutas

```
/empresas
├── /                          → Lista de empresas
├── /:id                       → Detalle de empresa (SIMPLIFICADO)
├── /:id/resoluciones         → Gestión de resoluciones
├── /:id/vehiculos            → Gestión de vehículos
├── /:id/conductores          → Gestión de conductores
├── /:id/documentos           → Gestión de documentos
└── /:id/auditoria            → Historial de auditoría
```

## Componentes Creados

| Componente | Archivo | Ruta |
|-----------|---------|------|
| Detalle Empresa | `empresa-detail.component.ts` | `/empresas/:id` |
| Resoluciones | `empresa-resoluciones.component.ts` | `/empresas/:id/resoluciones` |
| Vehículos | `empresa-vehiculos.component.ts` | `/empresas/:id/vehiculos` |
| Conductores | `empresa-conductores.component.ts` | `/empresas/:id/conductores` |
| Documentos | `empresa-documentos.component.ts` | `/empresas/:id/documentos` |
| Auditoría | `empresa-auditoria.component.ts` | `/empresas/:id/auditoria` |

## Cambios en empresa-detail.component.ts

El componente principal ahora debe navegar a estas rutas en lugar de usar tabs:

```typescript
// Métodos de navegación actualizados
crearResolucion(): void {
  this.router.navigate(['/empresas', this.empresa.id, 'resoluciones']);
}

verTodasResoluciones(): void {
  this.router.navigate(['/empresas', this.empresa.id, 'resoluciones']);
}

verTodosVehiculos(): void {
  this.router.navigate(['/empresas', this.empresa.id, 'vehiculos']);
}

verTodosConductores(): void {
  this.router.navigate(['/empresas', this.empresa.id, 'conductores']);
}

verDocumentos(): void {
  this.router.navigate(['/empresas', this.empresa.id, 'documentos']);
}

verAuditoria(): void {
  this.router.navigate(['/empresas', this.empresa.id, 'auditoria']);
}
```

## Próximos Pasos

1. ✅ Crear los 5 nuevos componentes (COMPLETADO)
2. ⏳ Actualizar las rutas en el archivo de routing
3. ⏳ Actualizar los métodos de navegación en empresa-detail.component.ts
4. ⏳ Eliminar MatTabsModule del componente principal
5. ⏳ Probar la navegación
6. ⏳ Actualizar tests

---

**Nota**: Los componentes están listos para usar. Solo necesitas agregar las rutas en tu archivo de configuración de routing.
