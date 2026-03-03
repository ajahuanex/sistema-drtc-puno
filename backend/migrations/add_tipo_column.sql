-- Migración: Agregar columna 'tipo' a la tabla localidades
-- Fecha: 2026-03-03
-- Descripción: Agrega la columna tipo para clasificar localidades por jerarquía territorial

-- 1. Agregar columna tipo (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'localidades' AND column_name = 'tipo'
    ) THEN
        ALTER TABLE localidades 
        ADD COLUMN tipo VARCHAR(50) DEFAULT 'DISTRITO';
        
        RAISE NOTICE 'Columna tipo agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna tipo ya existe';
    END IF;
END $$;

-- 2. Actualizar valores de tipo basándose en nivel_territorial (si existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'localidades' AND column_name = 'nivel_territorial'
    ) THEN
        UPDATE localidades 
        SET tipo = CASE 
            WHEN nivel_territorial = 'DEPARTAMENTO' THEN 'DEPARTAMENTO'
            WHEN nivel_territorial = 'PROVINCIA' THEN 'PROVINCIA'
            WHEN nivel_territorial = 'DISTRITO' THEN 'DISTRITO'
            WHEN nivel_territorial = 'CENTRO_POBLADO' THEN 'CENTRO_POBLADO'
            WHEN nivel_territorial = 'PUEBLO' THEN 'PUEBLO'
            ELSE 'DISTRITO'
        END
        WHERE tipo IS NULL OR tipo = 'DISTRITO';
        
        RAISE NOTICE 'Valores de tipo actualizados desde nivel_territorial';
    END IF;
END $$;

-- 3. Si no existe nivel_territorial, inferir tipo desde ubigeo o nombre
UPDATE localidades 
SET tipo = CASE
    -- Departamentos (ubigeo termina en 0000)
    WHEN ubigeo LIKE '%0000' THEN 'DEPARTAMENTO'
    -- Provincias (ubigeo termina en 00 pero no 0000)
    WHEN ubigeo LIKE '%00' AND ubigeo NOT LIKE '%0000' THEN 'PROVINCIA'
    -- Distritos (ubigeo no termina en 00)
    WHEN ubigeo IS NOT NULL AND ubigeo NOT LIKE '%00' THEN 'DISTRITO'
    -- Por nombre
    WHEN UPPER(nombre) = 'PUNO' AND departamento = 'PUNO' AND provincia = 'PUNO' THEN 'DISTRITO'
    -- Default
    ELSE 'DISTRITO'
END
WHERE tipo = 'DISTRITO' OR tipo IS NULL;

-- 4. Marcar centros poblados (tienen codigo_ccpp o son tipo CENTRO_POBLADO)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'localidades' AND column_name = 'codigo_ccpp'
    ) THEN
        UPDATE localidades 
        SET tipo = 'CENTRO_POBLADO'
        WHERE codigo_ccpp IS NOT NULL AND codigo_ccpp != '';
        
        RAISE NOTICE 'Centros poblados marcados por codigo_ccpp';
    END IF;
END $$;

-- 5. Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_localidades_tipo ON localidades(tipo);

-- 6. Mostrar estadísticas
DO $$
DECLARE
    total_count INTEGER;
    tipo_stats TEXT;
BEGIN
    SELECT COUNT(*) INTO total_count FROM localidades;
    
    SELECT string_agg(tipo || ': ' || count::TEXT, ', ')
    INTO tipo_stats
    FROM (
        SELECT tipo, COUNT(*) as count 
        FROM localidades 
        GROUP BY tipo 
        ORDER BY count DESC
    ) t;
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Total de localidades: %', total_count;
    RAISE NOTICE 'Distribución por tipo: %', tipo_stats;
    RAISE NOTICE '===========================================';
END $$;
