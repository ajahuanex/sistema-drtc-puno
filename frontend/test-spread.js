// Test para verificar si el spread operator preserva todos los campos

const localidadOriginal = {
    "nombre": "LA RINCONADA ANA MARIA (LA RINCONADA)",
    "tipo": "CENTRO_POBLADO",
    "ubigeo": "211002",
    "departamento": "PUNO",
    "provincia": "SAN ANTONIO DE PUTINA",
    "distrito": "ANANEA",
    "descripcion": "Centro poblado urbano",
    "coordenadas": {
        "latitud": -14.635790757837185,
        "longitud": -69.44728404522249
    },
    "observaciones": null,
    "codigo_ccpp": "0003",
    "tipo_area": "Urbano",
    "poblacion": 0,
    "altitud": null,
    "metadata": {
        "aliases": ["C.P. LA RINCONADA"],
        "alias": "C.P. LA RINCONADA",
        "nombre_oficial": "LA RINCONADA ANA MARIA (LA RINCONADA)"
    },
    "id": "69a50fb81bc05e7463e6bee2",
    "estaActiva": true
};

console.log('Original:', JSON.stringify(localidadOriginal, null, 2));

// Simular lo que hace el frontend
const localidadConAlias = {
    ...localidadOriginal,
    nombre: "C.P. LA RINCONADA",
    metadata: {
        ...localidadOriginal.metadata,
        es_alias: true,
        nombre_original: localidadOriginal.nombre,
        alias_usado: "C.P. LA RINCONADA"
    }
};

console.log('\n\nCon Alias:', JSON.stringify(localidadConAlias, null, 2));

// Verificar que todos los campos se preservaron
console.log('\n\nVerificación:');
console.log('coordenadas:', localidadConAlias.coordenadas);
console.log('tipo:', localidadConAlias.tipo);
console.log('ubigeo:', localidadConAlias.ubigeo);
console.log('departamento:', localidadConAlias.departamento);
