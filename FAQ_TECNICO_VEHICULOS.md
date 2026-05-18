# ❓ PREGUNTAS FRECUENTES TÉCNICAS: MÓDULO DE VEHÍCULOS

**Versión:** 1.0  
**Fecha:** 17 de Mayo de 2026  
**Audiencia:** Desarrolladores, Administradores Técnicos

---

## 🔧 PREGUNTAS TÉCNICAS

### P1: ¿Cómo funciona la integración entre VehiculoSolo y Vehiculo?

**R:** VehiculoSolo contiene los datos técnicos puros del vehículo, mientras que Vehiculo contiene los datos administrativos. La integración se realiza a través de `vehiculoDataId`:

```typescript
// Vehiculo tiene una referencia a VehiculoSolo
interface Vehiculo {
  id: string;
  vehiculoDataId: string; // Referencia a VehiculoSolo
  // ... otros campos administrativos
}

// Para obtener datos técnicos:
const vehiculoConDatos = await integrationService
  .obtenerVehiculoCompleto(vehiculoId)
  .toPromise();

// Acceder a datos técnicos:
const marca = vehiculoConDatos.datosTecnicos.marca;
```

---

### P2: ¿Qué sucede si falla la creación de un vehículo?

**R:** El servicio de integración implementa transacciones atómicas con rollback automático:

```typescript
// Si falla crear Vehiculo, se elimina VehiculoSolo automáticamente
crearVehiculoCompleto(datosTecnicos, datosAdmin) {
  // 1. Crear VehiculoSolo ✅
  // 2. Crear Vehiculo ❌ FALLA
  // 3. Rollback: Eliminar VehiculoSolo
  // 4. Retornar error
}
```

---

### P3: ¿Cómo se valida la integridad de un vehículo?

**R:** El servicio valida que:

```typescript
validarIntegridad(vehiculoId) {
  // 1. VehiculoSolo existe
  // 2. Empresa existe
  // 3. Resolución existe (si se proporciona)
  // 4. Rutas existen (si se proporcionan)
  // 5. Placa es consistente
  // 6. No hay duplicados
  
  return {
    valido: boolean,
    errores: string[]
  };
}
```

---

### P4: ¿Puedo cambiar los datos técnicos después de crear el vehículo?

**R:** No, los datos técnicos no se pueden editar. Están en VehiculoSolo que es inmutable. Si necesitas cambiarlos:

```typescript
// Opción 1: Crear nuevo VehiculoSolo
const nuevoVehiculoSolo = await vehiculoSoloService.create(nuevosDatos);

// Opción 2: Actualizar referencia en Vehiculo
const vehiculoActualizado = await vehiculoService.update(vehiculoId, {
  vehiculoDataId: nuevoVehiculoSolo.id
});
```

---

### P5: ¿Cómo obtengo datos técnicos en un componente?

**R:** Usa el servicio helper:

```typescript
// Opción 1: Obtener datos individuales
this.helperService.obtenerMarca(vehiculo).subscribe(marca => {
  console.log('Marca:', marca);
});

// Opción 2: Obtener información formateada
this.helperService.obtenerInfoFormateada(vehiculo).subscribe(info => {
  console.log('Marca/Modelo:', info.marcaModelo);
});

// Opción 3: Obtener todos los datos técnicos
this.helperService.obtenerDatosTecnicos(vehiculo).subscribe(datos => {
  console.log('Datos técnicos:', datos);
});
```

---

### P6: ¿Cómo uso los pipes en templates?

**R:** Los pipes proporcionan descripciones legibles:

```html
<!-- Obtener descripción de categoría -->
<span>{{ 'M1' | categoriaDescripcion }}</span>
<!-- Muestra: "Pasajeros hasta 8 asientos" -->

<!-- Obtener descripción de carrocería -->
<span>{{ 'SEDAN' | carroceriaDescripcion }}</span>
<!-- Muestra: "Sedán" -->

<!-- Obtener descripción de edad -->
<span>{{ 2020 | edadDescripcion }}</span>
<!-- Muestra: "Usado" -->
```

---

### P7: ¿Cómo detecto inconsistencias en los vehículos?

**R:** Usa el método detectarInconsistencias:

```typescript
this.integrationService.detectarInconsistencias().subscribe(inconsistencias => {
  inconsistencias.forEach(inc => {
    console.log(`Vehículo ${inc.placa}:`);
    inc.errores.forEach(error => {
      console.log(`  - ${error}`);
    });
  });
});
```

---

### P8: ¿Cómo sincronizo datos entre módulos?

**R:** Usa el método sincronizarDatos:

```typescript
this.integrationService.sincronizarDatos(vehiculoId).subscribe(resultado => {
  if (resultado.exitoso) {
    console.log(`${resultado.cambios} cambios realizados`);
  } else {
    console.log('Error:', resultado.mensaje);
  }
});
```

---

## 🐛 PROBLEMAS COMUNES

### P9: Error "Vehículo sin datos técnicos"

**Causa:** El campo `vehiculoDataId` es null o el VehiculoSolo no existe.

**Solución:**
```typescript
// Verificar
if (!vehiculo.vehiculoDataId) {
  console.error('Vehículo sin datos técnicos');
  // Crear VehiculoSolo
  const vehiculoSolo = await vehiculoSoloService.create(datos).toPromise();
  // Actualizar referencia
  await vehiculoService.update(vehiculo.id, {
    vehiculoDataId: vehiculoSolo.id
  }).toPromise();
}
```

---

### P10: Error "Empresa no encontrada"

**Causa:** El `empresaActualId` no existe en la BD.

**Solución:**
```typescript
// Verificar
const empresa = await empresaService.getEmpresa(vehiculo.empresaActualId).toPromise();
if (!empresa) {
  console.error('Empresa no encontrada');
  // Asignar a empresa válida
  await vehiculoService.update(vehiculo.id, {
    empresaActualId: empresaValida.id
  }).toPromise();
}
```

---

### P11: Error "Placa duplicada"

**Causa:** Ya existe otro vehículo con la misma placa.

**Solución:**
```typescript
// Verificar
const existe = await vehiculoService.validarPlacaExistente(placa).toPromise();
if (existe) {
  console.error('Placa duplicada');
  // Usar placa diferente
}
```

---

### P12: Error "Validación de integridad falla"

**Causa:** Hay inconsistencias en los datos.

**Solución:**
```typescript
// Detectar problemas
this.integrationService.validarIntegridad(vehiculoId).subscribe(resultado => {
  if (!resultado.valido) {
    resultado.errores.forEach(error => {
      console.error('Error:', error);
      // Corregir según el error
    });
  }
});
```

---

## 📊 RENDIMIENTO

### P13: ¿Cómo optimizo la carga de vehículos?

**R:** Usa paginación y filtros:

```typescript
// Cargar solo lo necesario
const vehiculos = await vehiculoService.getVehiculos().toPromise();

// Paginar
const pagina = 0;
const tamaño = 25;
const inicio = pagina * tamaño;
const fin = inicio + tamaño;
const vehiculosPaginados = vehiculos.slice(inicio, fin);

// Filtrar
const vehiculosFiltrados = vehiculos.filter(v => 
  v.placa.includes(filtro) && 
  v.estado === estado
);
```

---

### P14: ¿Cómo cacheo datos técnicos?

**R:** Usa RxJS shareReplay:

```typescript
import { shareReplay } from 'rxjs/operators';

private datosTecnicosCache = new Map<string, Observable<VehiculoSolo>>();

obtenerDatosTecnicos(vehiculoId: string): Observable<VehiculoSolo> {
  if (!this.datosTecnicosCache.has(vehiculoId)) {
    this.datosTecnicosCache.set(
      vehiculoId,
      this.vehiculoSoloService.obtenerVehiculo(vehiculoId).pipe(
        shareReplay(1)
      )
    );
  }
  return this.datosTecnicosCache.get(vehiculoId)!;
}
```

---

### P15: ¿Cómo evito múltiples llamadas a la API?

**R:** Usa debounceTime y distinctUntilChanged:

```typescript
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

private busqueda$ = new Subject<string>();

constructor() {
  this.busqueda$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => this.vehiculoService.buscar(query))
  ).subscribe(resultados => {
    // Mostrar resultados
  });
}

onBusqueda(query: string) {
  this.busqueda$.next(query);
}
```

---

## 🔐 SEGURIDAD

### P16: ¿Cómo valido permisos de usuario?

**R:** Usa guards de Angular:

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class VehiculoGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.tienePermiso('vehiculos:crear')) {
      return true;
    }
    this.router.navigate(['/acceso-denegado']);
    return false;
  }
}

// En rutas
{
  path: 'vehiculos/crear',
  component: CrearVehiculoComponent,
  canActivate: [VehiculoGuard]
}
```

---

### P17: ¿Cómo sanitizo datos de entrada?

**R:** Usa DomSanitizer:

```typescript
import { DomSanitizer } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

sanitizarPlaca(placa: string): string {
  // Remover caracteres especiales
  return placa.replace(/[^A-Z0-9-]/g, '').toUpperCase();
}

sanitizarNumero(valor: string): number {
  // Convertir a número seguro
  const num = parseInt(valor, 10);
  return isNaN(num) ? 0 : num;
}
```

---

## 📚 RECURSOS

### P18: ¿Dónde encuentro más documentación?

**R:** Consulta estos recursos:

- [Guía de Usuario](./GUIA_USUARIO_VEHICULOS.md)
- [Manual Técnico](./MANUAL_TECNICO_VEHICULOS.md)
- [Análisis de Servicios](./ANALISIS_SERVICIOS_VEHICULOS.md)
- [Recomendaciones de Integración](./RECOMENDACIONES_INTEGRACION_VEHICULOS.md)

---

### P19: ¿Cómo reporto un bug?

**R:** Crea un issue en Jira con:

1. **Título:** Descripción breve del problema
2. **Descripción:** Pasos para reproducir
3. **Logs:** Errores de consola
4. **Ambiente:** Navegador, versión, etc.
5. **Adjuntos:** Screenshots si aplica

---

### P20: ¿Cómo contribuyo con mejoras?

**R:** Sigue este proceso:

1. Crea una rama: `git checkout -b feature/mejora`
2. Haz cambios y commits
3. Crea un Pull Request
4. Espera revisión
5. Merge a main

---

## 📞 CONTACTO

Para preguntas técnicas:
- **Email:** tech-support@sirret.gob.pe
- **Slack:** #vehiculos-tech
- **Jira:** Proyecto VEHICULOS

---

**Última actualización:** 17 de Mayo de 2026  
**Versión:** 1.0  
**Estado:** ✅ Publicado

