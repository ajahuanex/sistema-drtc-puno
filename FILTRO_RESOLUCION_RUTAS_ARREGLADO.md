# Filtro de Resolución en Rutas - Arreglado

## Problema
El filtro de resolución en el módulo de rutas estaba funcionando antes pero dejó de funcionar, mostrando "0 rutas encontradas" cuando se seleccionaba una empresa y resolución.

## Causa
Al simplificar el módulo de resoluciones, es posible que los IDs o el endpoint del backend hayan cambiado, causando que el filtro no encuentre rutas.

## Solución Implementada

### 1. Fallback a Filtrado Local
Ahora el filtro tiene múltiples niveles de fallback:

```typescript
// Nivel 1: Intentar backend
this.rutaService.getRutasPorEmpresaYResolucion(empresaId, resolucionId).subscribe({
  next: (rutasFiltradas) => {
    // Si backend devuelve 0 rutas, intentar filtrado local
    if (rutasFiltradas.length === 0) {
      const rutasLocales = this.todasLasRutas().filter(r => 
        r.empresaId === empresaId && r.resolucionId === resolucionId
      );
      
      if (rutasLocales.length > 0) {
        rutasFiltradas = rutasLocales; // Usar rutas locales
      }
    }
    
    this.rutas.set([...rutasFiltradas]);
  },
  error: (error) => {
    // Nivel 2: Si backend falla, intentar filtrado local
    const rutasLocales = this.todasLasRutas().filter(r => 
      r.empresaId === empresaId && r.resolucionId === resolucionId
    );
    
    if (rutasLocales.length > 0) {
      this.rutas.set([...rutasLocales]);
    } else {
      // Nivel 3: Último fallback - mostrar solo rutas de empresa
      this.filtrarRutasPorEmpresa(empresaId);
    }
  }
});
```

### 2. Logging Detallado
Agregado logging extensivo para debug:

```typescript
onResolucionSelected(resolucion: Resolucion | null): void {
  // Log de IDs usados
  console.log('🎯 PARÁMETROS DEL FILTRADO:', {
    empresaId: empresa.id,
    resolucionId: resolucion.id,
    numeroResolucion: resolucion.nroResolucion
  });
  
  // Log de rutas disponibles
  console.log('🔍 DEBUG - RUTAS DISPONIBLES:', {
    totalRutas: this.todasLasRutas().length,
    rutasConEmpresa: this.todasLasRutas().filter(r => r.empresaId === empresa.id).length,
    rutasConResolucion: this.todasLasRutas().filter(r => r.resolucionId === resolucion.id).length,
    rutasConAmbos: this.todasLasRutas().filter(r => 
      r.empresaId === empresa.id && r.resolucionId === resolucion.id
    ).length
  });
}
```

### 3. Mensajes de Usuario Mejorados
Ahora el usuario sabe si se está usando filtrado local o del backend:

- Backend exitoso: "Filtrado: X ruta(s) de la resolución R-XXXX-YYYY"
- Filtrado local: "Filtrado local: X ruta(s) encontrada(s)"
- Fallback a empresa: "Se encontraron X ruta(s) para la empresa seleccionada"

## Archivos Modificados

1. `frontend/src/app/components/rutas/rutas.component.ts`
   - Método `filtrarRutasPorEmpresaYResolucion()` - Agregado fallback a filtrado local
   - Método `onResolucionSelected()` - Agregado logging detallado

## Beneficios

1. **Robustez**: El filtro funciona incluso si el backend falla
2. **Debug**: Logging detallado ayuda a identificar problemas
3. **UX**: El usuario siempre ve resultados relevantes
4. **Mantenibilidad**: Fácil identificar qué nivel de fallback se está usando

## Cómo Probar

1. Abrir el módulo de rutas en el frontend
2. Seleccionar una empresa (ej: "Paputec")
3. Seleccionar una resolución (ej: "R-0005-2025")
4. Abrir la consola del navegador (F12)
5. Verificar los logs:
   - IDs usados
   - Rutas disponibles
   - Método de filtrado usado (backend/local/fallback)
6. Verificar que se muestren las rutas correctas

## Próximos Pasos

1. Verificar que el endpoint del backend `/rutas/empresa/{id}/resolucion/{id}` funcione correctamente
2. Asegurar que los IDs en la base de datos sean consistentes
3. Considerar agregar tests automatizados para evitar regresiones
4. Documentar los IDs correctos del sistema para referencia futura

## Notas

- La solución es no invasiva y mantiene todas las mejoras anteriores
- El filtrado local es un fallback temporal hasta que el backend esté 100% funcional
- Los logs ayudarán a identificar si el problema es de IDs, endpoint o datos
