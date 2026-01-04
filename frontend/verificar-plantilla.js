// Script para verificar que la plantilla de 36 campos se genere correctamente
// Ejecutar con: node verificar-plantilla.js

const XLSX = require('xlsx');
const fs = require('fs');

console.log('🚀 Verificando generación de plantilla con 36 campos...\n');

// Definir los 36 campos según la nueva estructura
const columnas = [
    { campo: 'RUC Empresa', descripcion: 'RUC de la empresa transportista (11 dígitos)', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Resolución Primigenia', descripcion: 'Número de resolución primigenia', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'DNI', descripcion: 'DNI del propietario (8 dígitos)', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Resolución Hija', descripcion: 'Número de resolución hija', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Fecha Resolución', descripcion: 'Fecha de la resolución (DD/MM/AAAA)', obligatorio: 'NO', tipo: 'Fecha' },
    { campo: 'Tipo de Resolución', descripcion: 'Tipo de resolución (Autorización, Modificación, etc.)', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Placa de Baja', descripcion: 'Placa del vehículo dado de baja (si aplica)', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Placa', descripcion: 'Placa del vehículo (Ej: ABC-123)', obligatorio: 'SÍ', tipo: 'Texto' },
    { campo: 'Marca', descripcion: 'Marca del vehículo', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Modelo', descripcion: 'Modelo del vehículo', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Año Fabricación', descripcion: 'Año de fabricación (1990-2026)', obligatorio: 'NO', tipo: 'Número' },
    { campo: 'Color', descripcion: 'Color del vehículo', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Categoría', descripcion: 'Categoría (M1, M2, M3, N1, N2, N3)', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Carroceria', descripcion: 'Tipo de carrocería', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Tipo Combustible', descripcion: 'Tipo de combustible (Gasolina, Diesel, GLP, etc.)', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Motor', descripcion: 'Número de motor', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Número Serie VIN', descripcion: 'Número de serie VIN del vehículo', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Numero de pasajeros', descripcion: 'Número total de pasajeros (1-100)', obligatorio: 'NO', tipo: 'Número' },
    { campo: 'Asientos', descripcion: 'Número de asientos (1-100)', obligatorio: 'NO', tipo: 'Número' },
    { campo: 'Cilindros', descripcion: 'Número de cilindros del motor', obligatorio: 'NO', tipo: 'Número' },
    { campo: 'Ejes', descripcion: 'Número de ejes del vehículo', obligatorio: 'NO', tipo: 'Número' },
    { campo: 'Ruedas', descripcion: 'Número de ruedas del vehículo', obligatorio: 'NO', tipo: 'Número' },
    { campo: 'Peso Bruto (t)', descripcion: 'Peso bruto en toneladas', obligatorio: 'NO', tipo: 'Decimal' },
    { campo: 'Peso Neto (t)', descripcion: 'Peso neto en toneladas', obligatorio: 'NO', tipo: 'Decimal' },
    { campo: 'Carga Útil (t)', descripcion: 'Carga útil en toneladas (se calcula automáticamente)', obligatorio: 'NO', tipo: 'Decimal' },
    { campo: 'Largo (m)', descripcion: 'Largo del vehículo en metros', obligatorio: 'NO', tipo: 'Decimal' },
    { campo: 'Ancho (m)', descripcion: 'Ancho del vehículo en metros', obligatorio: 'NO', tipo: 'Decimal' },
    { campo: 'Alto (m)', descripcion: 'Alto del vehículo en metros', obligatorio: 'NO', tipo: 'Decimal' },
    { campo: 'Cilindrada', descripcion: 'Cilindrada del motor en cc', obligatorio: 'NO', tipo: 'Número' },
    { campo: 'Potencia (HP)', descripcion: 'Potencia del motor en caballos de fuerza', obligatorio: 'NO', tipo: 'Número' },
    { campo: 'Estado', descripcion: 'Estado del vehículo (ACTIVO, INACTIVO, etc.)', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Observaciones', descripcion: 'Observaciones adicionales del vehículo', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Sede de Registro', descripcion: 'Sede donde se registra el vehículo', obligatorio: 'SÍ', tipo: 'Texto' },
    { campo: 'Expediente', descripcion: 'Número de expediente', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'TUC', descripcion: 'Número de TUC (Ej: T-123456-2024)', obligatorio: 'NO', tipo: 'Texto' },
    { campo: 'Rutas Asignadas', descripcion: 'Rutas asignadas al vehículo (separadas por coma)', obligatorio: 'NO', tipo: 'Texto' }
];

// Ejemplos para cada campo
const ejemplos = {
    'RUC Empresa': '20123456789',
    'Resolución Primigenia': 'R-0123-2025',
    'DNI': '12345678',
    'Resolución Hija': 'R-0124-2025',
    'Fecha Resolución': '15/01/2024',
    'Tipo de Resolución': 'Autorización',
    'Placa de Baja': 'XYZ-789',
    'Placa': 'ABC-123',
    'Marca': 'MERCEDES BENZ',
    'Modelo': 'SPRINTER',
    'Año Fabricación': '2020',
    'Color': 'BLANCO',
    'Categoría': 'M3',
    'Carroceria': 'MINIBUS',
    'Tipo Combustible': 'DIESEL',
    'Motor': 'MB123456789',
    'Número Serie VIN': 'VIN123456789',
    'Numero de pasajeros': '20',
    'Asientos': '20',
    'Cilindros': '4',
    'Ejes': '2',
    'Ruedas': '6',
    'Peso Bruto (t)': '5.5',
    'Peso Neto (t)': '3.5',
    'Carga Útil (t)': '2.0',
    'Largo (m)': '8.5',
    'Ancho (m)': '2.4',
    'Alto (m)': '2.8',
    'Cilindrada': '2400',
    'Potencia (HP)': '150',
    'Estado': 'ACTIVO',
    'Observaciones': 'Vehículo en buen estado',
    'Sede de Registro': 'LIMA',
    'Expediente': 'E-01234-2025',
    'TUC': 'T-123456-2024',
    'Rutas Asignadas': '01,02,03'
};

function crearPlantillaExcel() {
    try {
        console.log('📊 Creando libro de trabajo Excel...');
        
        // Crear un nuevo libro de trabajo
        const workbook = XLSX.utils.book_new();
        
        // Hoja 1: Instrucciones
        console.log('📝 Creando hoja de INSTRUCCIONES...');
        const instrucciones = [
            ['PLANTILLA DE CARGA MASIVA DE VEHÍCULOS - SIRRET'],
            ['Sistema Integral de Registros y Regulación de Empresas de Transporte'],
            [''],
            ['INSTRUCCIONES DE USO:'],
            ['1. Complete los datos en la hoja "DATOS" usando las columnas correspondientes'],
            ['2. Los campos marcados como obligatorios (SÍ) deben completarse'],
            ['3. La placa debe ser única y seguir el formato peruano (ABC-123)'],
            ['4. Use punto (.) como separador decimal para números'],
            ['5. Consulte la hoja "REFERENCIA" para ver descripciones de campos'],
            ['6. La hoja "DATOS" está lista para completar (sin ejemplos que eliminar)'],
            [''],
            ['CAMPOS OBLIGATORIOS:'],
            ['• Placa: Placa del vehículo (formato ABC-123)'],
            ['• Sede de Registro: Sede donde se registra el vehículo'],
            [''],
            ['TOTAL DE CAMPOS: 36 (2 obligatorios, 34 opcionales)'],
            [''],
            ['Fecha de creación: ' + new Date().toLocaleDateString('es-PE')],
            ['Versión del sistema: SIRRET v1.0.0']
        ];

        const wsInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
        XLSX.utils.book_append_sheet(workbook, wsInstrucciones, 'INSTRUCCIONES');

        // Hoja 2: Referencia de campos
        console.log('📋 Creando hoja de REFERENCIA...');
        const referencia = [
            ['CAMPO', 'DESCRIPCIÓN', 'OBLIGATORIO', 'TIPO', 'EJEMPLO'],
            ...columnas.map(col => [
                col.campo,
                col.descripcion,
                col.obligatorio,
                col.tipo,
                ejemplos[col.campo] || ''
            ])
        ];

        const wsReferencia = XLSX.utils.aoa_to_sheet(referencia);
        XLSX.utils.book_append_sheet(workbook, wsReferencia, 'REFERENCIA');

        // Hoja 3: Datos
        console.log('📊 Creando hoja de DATOS...');
        const headers = columnas.map(col => col.campo);
        
        console.log(`📏 Número de columnas: ${headers.length}`);
        
        // Crear filas vacías con el número correcto de columnas (36)
        const filaVacia = new Array(36).fill('');
        
        const datosPlanilla = [
            headers,
            [...filaVacia],
            [...filaVacia],
            [...filaVacia],
            [...filaVacia],
            [...filaVacia]
        ];

        const wsDatos = XLSX.utils.aoa_to_sheet(datosPlanilla);
        
        // Establecer ancho de columnas
        wsDatos['!cols'] = headers.map(() => ({ width: 15 }));

        XLSX.utils.book_append_sheet(workbook, wsDatos, 'DATOS');

        // Generar el archivo Excel
        console.log('💾 Generando archivo Excel...');
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `plantilla_vehiculos_sirret_${fecha}.xlsx`;
        
        XLSX.writeFile(workbook, nombreArchivo);
        
        console.log(`✅ Plantilla Excel creada exitosamente: ${nombreArchivo}`);
        console.log(`📊 Total de campos: ${columnas.length}`);
        console.log(`📋 Campos obligatorios: ${columnas.filter(c => c.obligatorio === 'SÍ').length}`);
        console.log(`📝 Hojas creadas: INSTRUCCIONES, REFERENCIA, DATOS`);
        
        // Verificar el archivo creado
        if (fs.existsSync(nombreArchivo)) {
            const stats = fs.statSync(nombreArchivo);
            console.log(`📁 Tamaño del archivo: ${(stats.size / 1024).toFixed(2)} KB`);
            
            // Leer el archivo para verificar contenido
            const workbookVerify = XLSX.readFile(nombreArchivo);
            console.log(`📚 Hojas en el archivo: ${workbookVerify.SheetNames.join(', ')}`);
            
            // Verificar la hoja de datos
            const datosSheet = workbookVerify.Sheets['DATOS'];
            const datosJson = XLSX.utils.sheet_to_json(datosSheet, { header: 1 });
            console.log(`📊 Columnas en hoja DATOS: ${datosJson[0].length}`);
            console.log(`📋 Primeras 5 columnas: ${datosJson[0].slice(0, 5).join(', ')}`);
            console.log(`📋 Últimas 5 columnas: ${datosJson[0].slice(-5).join(', ')}`);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error creando plantilla Excel:', error);
        return false;
    }
}

// Ejecutar la verificación
console.log('🔍 VERIFICACIÓN DE PLANTILLA EXCEL - 36 CAMPOS\n');
console.log('=' .repeat(60));

const resultado = crearPlantillaExcel();

console.log('\n' + '='.repeat(60));
if (resultado) {
    console.log('🎉 VERIFICACIÓN EXITOSA - La plantilla se generó correctamente');
} else {
    console.log('💥 VERIFICACIÓN FALLIDA - Hubo errores en la generación');
}
console.log('='.repeat(60));