# Instrucciones para Plantilla de Carga Masiva de Empresas - Actualizada

## Cambios Implementados

### 1. Múltiples Teléfonos
- **ANTES**: Solo se permitía un número de teléfono
- **AHORA**: Se pueden ingresar múltiples números separados por espacios
- **Ejemplo**: `987654321 123456789 555666777`
- **Conversión automática**: El sistema convierte espacios a comas internamente

### 2. Validación de Representantes
- **DNI**: OBLIGATORIO - Debe tener exactamente 8 dígitos
- **Nombres**: OPCIONAL - Si no se proporciona, se asigna "Por actualizar"  
- **Apellidos**: OPCIONAL - Si no se proporciona, se asigna "Por actualizar"

### 3. Dominio Institucional
- **Email**: Debe usar el dominio @transportespuno.gob.pe
- **Ejemplo**: empresa@transportespuno.gob.pe

## Estructura de la Plantilla Excel

### Columnas Requeridas:
1. **razon_social** (Obligatorio)
2. **ruc** (Obligatorio - 11 dígitos)
3. **direccion** (Obligatorio)
4. **telefono** (Obligatorio - puede ser múltiple separado por espacios)
5. **email** (Obligatorio - debe usar @transportespuno.gob.pe)
6. **representante_dni** (Obligatorio - 8 dígitos)
7. **representante_nombres** (Opcional)
8. **representante_apellidos** (Opcional)

### Ejemplos de Datos Válidos:

| razon_social | ruc | direccion | telefono | email | representante_dni | representante_nombres | representante_apellidos |
|--------------|-----|-----------|----------|-------|-------------------|----------------------|------------------------|
| Transportes El Sol SAC | 20123456789 | Av. Principal 123 | 987654321 123456789 | elsol@transportespuno.gob.pe | 12345678 | Juan Carlos | Pérez López |
| Empresa Luna EIRL | 20987654321 | Jr. Comercio 456 | 555666777 | luna@transportespuno.gob.pe | 87654321 | | |
| Transportes Andes SRL | 20456789123 | Av. Los Andes 789 | 999888777 111222333 444555666 | andes@transportespuno.gob.pe | 11223344 | María Elena | Quispe Mamani |

### Notas Importantes:

1. **Teléfonos múltiples**: Separar con espacios, no comas
2. **Representante sin datos**: Dejar celdas vacías para nombres y apellidos si no se conocen
3. **Email institucional**: Siempre usar @transportespuno.gob.pe
4. **DNI**: Exactamente 8 dígitos numéricos
5. **RUC**: Exactamente 11 dígitos numéricos

### Validaciones Automáticas:
- El sistema normalizará automáticamente los teléfonos (espacios → comas)
- Los campos opcionales de representante se completarán con "Por actualizar"
- Se validará el formato de email institucional
- Se verificará la longitud de DNI y RUC