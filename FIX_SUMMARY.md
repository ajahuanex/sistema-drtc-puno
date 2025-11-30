# Solución de Errores Backend (CORS y 500)

## 1. Error CORS (Cross-Origin Resource Sharing)
**Síntoma:** El frontend recibía error al intentar comunicar con el backend. Headers `Access-Control-Allow-Origin` faltantes.
**Causa:** Configuración incompatible en `main.py`. Se estaba usando `allow_origins=["*"]` junto con `allow_credentials=True`, lo cual no es permitido por el estándar ni soportado correctamente por los navegadores/frameworks modernos en modo wildcard.
**Solución:**
- Se modificó `backend/app/main.py`.
- Se estableció `allow_credentials=False`.
- Se mantuvo `allow_origins=["*"]` para facilitar el desarrollo local.

## 2. Error 500 (Internal Server Error) al Actualizar Empresa
**Síntoma:** Petición `PUT /api/v1/empresas/{id}` fallaba con error 500.
**Causa:** Error de serialización en `EmpresaService.update_empresa`.
- Al actualizar la auditoría, se concatenaba la lista existente de objetos `AuditoriaEmpresa` con el nuevo diccionario de auditoría.
- El driver de MongoDB (`motor`) no sabía cómo serializar los objetos `AuditoriaEmpresa` existentes.
**Solución:**
- Se modificó `backend/app/services/empresa_service.py`.
- Se convirtió explícitamente la lista de auditoría existente a diccionarios usando `.model_dump()` antes de concatenar y guardar.

## 3. Problema de Codificación en Windows
**Síntoma:** El backend fallaba al iniciar en consolas Windows estándar debido a caracteres Unicode (emojis) en los logs.
**Solución:**
- Se eliminaron los emojis de los mensajes `print` en `backend/app/services/mock_oficina_service.py`.

## Estado Actual
- Backend reiniciado y escuchando en puerto 8000.
- Pruebas de CORS exitosas (Headers presentes).
- Pruebas de actualización de empresa exitosas (Respuesta 200 OK con datos actualizados).
