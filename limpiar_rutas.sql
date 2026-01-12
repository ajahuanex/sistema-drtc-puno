-- Script SQL para limpiar rutas y preparar carga masiva con localidades únicas
-- Ejecutar en el orden mostrado

-- 1. Mostrar estadísticas antes de la limpieza
SELECT 'ESTADÍSTICAS ANTES DE LA LIMPIEZA' as info;

SELECT 
    'RUTAS' as tabla,
    COUNT(*) as total_registros
FROM rutas_ruta
UNION ALL
SELECT 
    'LOCALIDADES' as tabla,
    COUNT(*) as total_registros
FROM localidades_localidad
UNION ALL
SELECT 
    'EMPRESAS' as tabla,
    COUNT(*) as total_registros
FROM empresas_empresa
UNION ALL
SELECT 
    'RESOLUCIONES' as tabla,
    COUNT(*) as total_registros
FROM resoluciones_resolucion;

-- 2. Mostrar distribución de localidades por departamento
SELECT 
    'LOCALIDADES POR DEPARTAMENTO' as info,
    departamento,
    COUNT(*) as cantidad
FROM localidades_localidad
GROUP BY departamento
ORDER BY cantidad DESC;

-- 3. Mostrar localidades más utilizadas (si hay rutas)
SELECT 
    'LOCALIDADES MÁS UTILIZADAS EN RUTAS' as info;

-- Como origen
SELECT 
    'COMO ORIGEN' as tipo,
    l.nombre,
    l.departamento,
    COUNT(*) as veces_usada
FROM rutas_ruta r
JOIN localidades_localidad l ON r.origen_id = l.id
GROUP BY l.id, l.nombre, l.departamento
ORDER BY veces_usada DESC
LIMIT 10;

-- Como destino
SELECT 
    'COMO DESTINO' as tipo,
    l.nombre,
    l.departamento,
    COUNT(*) as veces_usada
FROM rutas_ruta r
JOIN localidades_localidad l ON r.destino_id = l.id
GROUP BY l.id, l.nombre, l.departamento
ORDER BY veces_usada DESC
LIMIT 10;

-- 4. LIMPIEZA DE RUTAS
-- ⚠️ CUIDADO: Esto eliminará TODAS las rutas
-- Descomenta las siguientes líneas solo si estás seguro

/*
-- Eliminar todas las rutas
DELETE FROM rutas_ruta;

-- Reiniciar secuencia de IDs (PostgreSQL)
-- ALTER SEQUENCE rutas_ruta_id_seq RESTART WITH 1;

-- Para MySQL usar:
-- ALTER TABLE rutas_ruta AUTO_INCREMENT = 1;

SELECT 'RUTAS ELIMINADAS EXITOSAMENTE' as resultado;
*/

-- 5. Verificar localidades duplicadas potenciales
SELECT 
    'VERIFICACIÓN DE LOCALIDADES DUPLICADAS' as info;

SELECT 
    UPPER(TRIM(nombre)) as nombre_normalizado,
    departamento,
    COUNT(*) as cantidad_duplicados,
    STRING_AGG(id::text, ', ') as ids_duplicados
FROM localidades_localidad
WHERE nombre IS NOT NULL
GROUP BY UPPER(TRIM(nombre)), departamento
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC;

-- 6. Mostrar localidades sin datos completos
SELECT 
    'LOCALIDADES CON DATOS INCOMPLETOS' as info;

SELECT 
    id,
    nombre,
    departamento,
    provincia,
    distrito,
    CASE 
        WHEN nombre IS NULL THEN 'Sin nombre'
        WHEN departamento IS NULL THEN 'Sin departamento'
        WHEN provincia IS NULL THEN 'Sin provincia'
        WHEN distrito IS NULL THEN 'Sin distrito'
        ELSE 'Datos completos'
    END as problema
FROM localidades_localidad
WHERE nombre IS NULL 
   OR departamento IS NULL 
   OR provincia IS NULL 
   OR distrito IS NULL
LIMIT 20;

-- 7. Crear localidades de ejemplo para pruebas (opcional)
-- Descomenta si necesitas localidades de ejemplo

/*
INSERT INTO localidades_localidad (
    nombre, departamento, provincia, distrito, 
    municipalidad_centro_poblado, nivel_territorial, 
    tipo, descripcion, esta_activa, 
    fecha_creacion, fecha_actualizacion
) VALUES 
('PUNO', 'PUNO', 'PUNO', 'PUNO', 'PUNO', 'CIUDAD', 'CIUDAD', 
 'Capital del departamento de Puno', true, NOW(), NOW()),
('JULIACA', 'PUNO', 'SAN ROMAN', 'JULIACA', 'JULIACA', 'CIUDAD', 'CIUDAD', 
 'Ciudad comercial de Puno', true, NOW(), NOW()),
('PUCARA', 'PUNO', 'LAMPA', 'PUCARA', 'PUCARA', 'DISTRITO', 'DISTRITO', 
 'Distrito de Pucará', true, NOW(), NOW()),
('TARACO', 'PUNO', 'HUANCANE', 'TARACO', 'TARACO', 'DISTRITO', 'DISTRITO', 
 'Distrito de Taraco', true, NOW(), NOW())
ON CONFLICT (nombre, departamento) DO NOTHING;

SELECT 'LOCALIDADES DE EJEMPLO CREADAS' as resultado;
*/

-- 8. Estadísticas finales
SELECT 'ESTADÍSTICAS DESPUÉS DE LA LIMPIEZA' as info;

SELECT 
    'RUTAS' as tabla,
    COUNT(*) as total_registros
FROM rutas_ruta
UNION ALL
SELECT 
    'LOCALIDADES' as tabla,
    COUNT(*) as total_registros
FROM localidades_localidad;

-- 9. Preparación para carga masiva
SELECT 
    'SISTEMA LISTO PARA CARGA MASIVA' as estado,
    'Las localidades se procesarán automáticamente para evitar duplicados' as nota;