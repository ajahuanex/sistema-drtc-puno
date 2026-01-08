# Instrucciones para Configurar Rutas de Prueba

## 1. Borrar Rutas Existentes (si es necesario)

```bash
cd backend
python borrar_rutas.py
```

## 2. Crear Rutas de Prueba

```bash
cd backend
python crear_rutas_prueba.py
```

## 3. Verificar la Implementación

Una vez que tengas las rutas de prueba, puedes probar las siguientes funcionalidades en el frontend:

### Funcionalidades Implementadas:

✅ **Selección Múltiple**
- Checkbox en cada fila para seleccionar rutas individuales
- Checkbox en el header para seleccionar/deseleccionar todas las rutas visibles
- Contador de rutas seleccionadas

✅ **Acciones en Bloque**
- Eliminar múltiples rutas seleccionadas
- Cambiar estado de múltiples rutas (ACTIVA, INACTIVA, SUSPENDIDA, etc.)
- Exportar rutas seleccionadas (Excel, CSV, PDF)

✅ **Configuración de Columnas**
- Menú para mostrar/ocultar columnas
- Botón para restablecer configuración de columnas
- Columnas requeridas no se pueden ocultar (Selección, Código, Acciones)

✅ **Interfaz Mejorada**
- Estilos responsive para móviles
- Animaciones y transiciones suaves
- Indicadores visuales para filas seleccionadas
- Acciones contextuales según el número de elementos seleccionados

### Rutas de Prueba Creadas:

1. **R001 - PUNO - JULIACA** (ACTIVA)
2. **R002 - JULIACA - AREQUIPA** (ACTIVA)  
3. **R003 - PUNO - CUSCO** (ACTIVA)
4. **R004 - YUNGUYO - PUNO** (ACTIVA)
5. **R005 - ILAVE - JULI** (INACTIVA)
6. **R006 - DESAGUADERO - LA PAZ** (SUSPENDIDA)

### Cómo Probar:

1. **Navega a la sección de Rutas** en el frontend
2. **Selecciona rutas** usando los checkboxes
3. **Prueba las acciones en bloque**:
   - Eliminar rutas seleccionadas
   - Cambiar estado de rutas seleccionadas
   - Exportar rutas seleccionadas
4. **Configura las columnas** usando el menú de columnas
5. **Verifica la responsividad** en diferentes tamaños de pantalla

### Archivos Modificados:

- `frontend/src/app/components/rutas/rutas.component.ts` - Lógica principal
- `frontend/src/app/components/rutas/rutas.component.scss` - Estilos
- `frontend/src/app/components/rutas/confirmar-eliminacion-bloque-modal.component.ts` - Modal de confirmación
- `frontend/src/app/components/rutas/cambiar-estado-rutas-bloque-modal.component.ts` - Modal de cambio de estado
- `frontend/src/app/components/rutas/index.ts` - Exportaciones

## 4. Solución de Problemas

Si no ves las rutas en el frontend:

1. **Verifica que el backend esté ejecutándose**:
   ```bash
   cd backend
   python main.py
   ```

2. **Verifica que las rutas se crearon en la base de datos**:
   ```bash
   cd backend
   python -c "
   from pymongo import MongoClient
   client = MongoClient('mongodb://admin:admin123@localhost:27017/')
   db = client.sirret_db
   count = db.rutas.count_documents({})
   print(f'Rutas en la base de datos: {count}')
   for ruta in db.rutas.find():
       print(f'- {ruta[\"codigoRuta\"]} - {ruta[\"nombre\"]}')
   "
   ```

3. **Verifica la consola del navegador** para errores de JavaScript

4. **Verifica la consola del backend** para errores de API

## 5. Próximos Pasos

Una vez que confirmes que todo funciona:

1. Puedes agregar más rutas usando el botón "Nueva Ruta"
2. Puedes probar la carga masiva de rutas
3. Puedes personalizar los estilos según tus preferencias
4. Puedes agregar más funcionalidades como filtros avanzados

¡La implementación de selección múltiple y configuración de columnas está completa y lista para usar!