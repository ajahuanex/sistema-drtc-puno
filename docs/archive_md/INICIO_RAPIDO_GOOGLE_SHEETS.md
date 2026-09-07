# Inicio Rápido: Carga Masiva desde Google Sheets

## 5 Minutos para Empezar

### Paso 1: Crear Google Sheet (1 min)

1. Ir a [Google Sheets](https://sheets.google.com)
2. Crear nueva hoja
3. Agregar encabezados en la primera fila:
   ```
   RUC | Razón Social Principal | Dirección Fiscal | Estado | Tipos de Servicio | Email Contacto | Teléfono Contacto
   ```

### Paso 2: Agregar Datos (1 min)

Copiar y pegar en la hoja:

```
20448048242 | EMPRESA A S.A.C. | Av. Principal 123 | AUTORIZADA | PERSONAS;TURISMO | contacto@a.com | 051-123456
20123456789 | EMPRESA B E.I.R.L. | Jr. Comercio 456 | EN_TRAMITE | PERSONAS | info@b.com | 051-654321
20987654321 | EMPRESA C S.R.L. | Calle Secundaria 789 | AUTORIZADA | CARGA;MERCANCIAS | ventas@c.com | 051-789012
```

### Paso 3: Compartir (1 min)

1. Hacer clic en "Compartir" (arriba a la derecha)
2. Cambiar a "Cualquiera con el enlace"
3. Copiar el enlace

### Paso 4: Cargar en SIRRET (2 min)

1. Ir a **Empresas**
2. Hacer clic en **"Carga desde Google Sheets"**
3. Pegar el enlace
4. Hacer clic en **"Validar y Conectar"**
5. Revisar datos en preview
6. Hacer clic en **"Procesar Empresas"**
7. ¡Listo! Ver resultados

## Ejemplo Completo

### Google Sheet
```
RUC,Razón Social Principal,Dirección Fiscal,Estado,Tipos de Servicio,Email Contacto,Teléfono Contacto
20448048242,EMPRESA TRANSPORTES S.A.C.,Av. Principal 123 Puno,AUTORIZADA,PERSONAS;TURISMO,contacto@empresa.com,051-123456
20123456789,TRANSPORTES PUNO E.I.R.L.,Jr. Comercio 456 Puno,EN_TRAMITE,PERSONAS,info@transportes.com,051-654321
```

### Resultado
- ✅ 2 empresas creadas
- ✅ 0 errores
- ✅ Listo para usar

## Errores Comunes

### "No se pudo acceder a la hoja"
→ Asegúrate de que el sheet sea público (Compartir → Cualquiera con el enlace)

### "La hoja debe contener encabezados..."
→ Verifica que la primera fila tenga los nombres de las columnas

### "RUC es requerido"
→ Asegúrate de que todas las filas tengan RUC

## Columnas Requeridas

| Columna | Ejemplo | Obligatorio |
|---------|---------|-------------|
| RUC | 20448048242 | ✅ |
| Razón Social Principal | EMPRESA S.A.C. | ✅ |
| Dirección Fiscal | Av. Principal 123 | ✅ |

## Columnas Opcionales

| Columna | Valores | Ejemplo |
|---------|---------|---------|
| Estado | AUTORIZADA, EN_TRAMITE, SUSPENDIDA, CANCELADA | AUTORIZADA |
| Tipos de Servicio | PERSONAS, TURISMO, TRABAJADORES, MERCANCIAS, CARGA, MIXTO | PERSONAS;TURISMO |
| Email Contacto | Email válido | contacto@empresa.com |
| Teléfono Contacto | Teléfono | 051-123456 |
| Sitio Web | URL | www.empresa.com |

## Tips

✅ **Usa CSV en Google Sheets**
- Más compatible
- Menos problemas de formato

✅ **Valida primero**
- Usa "Solo validar" antes de crear
- Revisa los errores

✅ **Pequeños lotes**
- Empieza con 5-10 empresas
- Luego aumenta

✅ **Nombres de columnas**
- Pueden estar en cualquier orden
- Deben ser similares a los esperados

## Soporte

¿Problemas? Ver:
- `CARGA_MASIVA_GOOGLE_SHEETS.md` - Guía completa
- `IMPLEMENTACION_CARGA_MASIVA_GOOGLE_SHEETS.md` - Detalles técnicos

---

**¡Listo para empezar!** 🚀
