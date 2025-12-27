# Instrucciones para Agregar el Logo

## 📁 Ubicación del Logo

Para que el logo aparezca correctamente en el sistema SIGRET, sigue estos pasos:

### 1. Guardar el Logo
- **Nombre del archivo**: `logo.png`
- **Ubicación**: `frontend/src/assets/logo.png`
- **Formato recomendado**: PNG con fondo transparente
- **Dimensiones recomendadas**: 400x200 píxeles (ratio 2:1)

### 2. Estructura de Carpetas
```
sistema-drtc-puno/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.png  ← AQUÍ va tu logo
│   │   └── app/
│   └── public/
└── backend/
```

### 3. Configuración Angular
El sistema está configurado para:
- **Desarrollo**: `assets/logo.png` → `http://localhost:4200/assets/logo.png`
- **Producción**: `assets/logo.png` → `/assets/logo.png` en el build

### 4. Verificación
Una vez colocado el logo:
1. Reinicia el servidor de desarrollo del frontend
2. Ve a la página de login
3. El logo debería aparecer en:
   - Página de login (logo grande)
   - Barra superior (logo pequeño)

### 5. Fallback
Si el logo no se carga por alguna razón, el sistema mostrará automáticamente el texto "SIGRET" como respaldo.

## 🎨 Características del Diseño Actual

- **Colores**: Degradado azul eléctrico (#0066ff) a azul cielo (#87ceeb)
- **Estilo**: Moderno con efectos de blur y sombras
- **Responsive**: Se adapta automáticamente a dispositivos móviles
- **Tema**: Profesional para sistema gubernamental

## ⚠️ Notas Importantes

- El logo debe estar en formato PNG para mejor calidad
- La carpeta `src/assets` se mapea automáticamente a `/assets` en el build
- Si cambias el nombre del archivo, debes actualizar las rutas en:
  - `frontend/src/app/components/login/login.component.ts`
  - `frontend/src/app/components/layout/topbar.component.ts`
- El sistema incluye manejo de errores automático con fallback a texto

## 🔧 Configuración Técnica

Angular está configurado en `angular.json` para incluir:
```json
"assets": [
  {
    "glob": "**/*",
    "input": "public"
  },
  "src/favicon.ico",
  "src/assets"
]
```

Esto significa que:
- `src/assets/logo.png` → `/assets/logo.png` (RECOMENDADO)
- `public/logo.png` → `/logo.png` (alternativo)