import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador para VIN (Vehicle Identification Number)
 * Debe tener exactamente 17 caracteres alfanuméricos
 */
export function vinValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Opcional
    }

    const value = control.value.toString().trim().toUpperCase();
    
    // Validar longitud exacta de 17 caracteres
    if (value.length !== 17) {
      return { 
        vinInvalido: { 
          message: 'El VIN debe tener exactamente 17 caracteres' 
        } 
      };
    }

    // Validar que solo contenga caracteres alfanuméricos (sin I, O, Q)
    // Estos caracteres no se usan en VIN para evitar confusión con 1, 0
    const formatoValido = /^[A-HJ-NPR-Z0-9]{17}$/.test(value);
    if (!formatoValido) {
      return { 
        vinInvalido: { 
          message: 'VIN inválido. No debe contener I, O, Q' 
        } 
      };
    }

    return null;
  };
}

/**
 * Decodifica información del VIN según ISO 3779
 */
export interface VINInfo {
  pais: string;
  fabricante: string;
  anio: number | null;
  anioAlternativo: number | null; // Segundo año posible (30 años después)
  valido: boolean;
}

/**
 * Decodifica el VIN para extraer país, fabricante y años posibles según ISO 3779
 */
export function decodificarVIN(vin: string): VINInfo {
  if (!vin || vin.length !== 17) {
    return { pais: '', fabricante: '', anio: null, anioAlternativo: null, valido: false };
  }

  const vinUpper = vin.toUpperCase();
  
  // WMI (World Manufacturer Identifier) - primeros 3 caracteres
  const wmi = vinUpper.substring(0, 3);
  const primerCaracter = vinUpper.charAt(0);
  
  // Decodificar país según el primer carácter
  const pais = decodificarPais(primerCaracter);
  
  // Decodificar fabricante según WMI completo
  const fabricante = decodificarFabricante(wmi);
  
  // Decodificar años posibles (posición 10) - ISO 3779
  const caracterAnio = vinUpper.charAt(9);
  const anios = decodificarAniosISO3779(caracterAnio);
  
  return {
    pais,
    fabricante,
    anio: anios.anio1,
    anioAlternativo: anios.anio2,
    valido: true
  };
}

/**
 * Decodifica el país según el primer carácter del VIN
 */
function decodificarPais(caracter: string): string {
  const paises: { [key: string]: string } = {
    // América del Norte
    '1': 'Estados Unidos',
    '2': 'Canadá',
    '3': 'México',
    '4': 'Estados Unidos',
    '5': 'Estados Unidos',
    
    // Europa
    'S': 'Reino Unido',
    'T': 'República Checa / Eslovaquia',
    'V': 'España / Francia',
    'W': 'Alemania',
    'X': 'Rusia',
    'Y': 'Suecia / Finlandia',
    'Z': 'Italia',
    
    // Asia
    'J': 'Japón',
    'K': 'Corea del Sur',
    'L': 'China',
    'M': 'India / Indonesia',
    'N': 'Turquía',
    'P': 'Malasia',
    'R': 'Taiwán',
    
    // América del Sur
    '8': 'Argentina',
    '9': 'Brasil',
    
    // África
    'A': 'Sudáfrica',
    'B': 'Kenia',
    'C': 'Benín',
    'D': 'Egipto',
    'E': 'Etiopía',
    'F': 'Ghana',
    
    // Oceanía
    '6': 'Australia',
    '7': 'Nueva Zelanda'
  };
  
  return paises[caracter] || 'Desconocido';
}

/**
 * Decodifica el fabricante según WMI
 */
function decodificarFabricante(wmi: string): string {
  const fabricantes: { [key: string]: string } = {
    // Japoneses
    'JTF': 'Toyota',
    'JHM': 'Honda',
    'JMB': 'Mitsubishi',
    'JN1': 'Nissan',
    'JS1': 'Suzuki',
    'JMZ': 'Mazda',
    'JF1': 'Subaru',
    'JHG': 'Honda',
    
    // Alemanes
    'WBA': 'BMW',
    'WBS': 'BMW M',
    'WDB': 'Mercedes-Benz',
    'WDD': 'Mercedes-Benz',
    'WVW': 'Volkswagen',
    'WAU': 'Audi',
    'WP0': 'Porsche',
    
    // Americanos
    '1G1': 'Chevrolet',
    '1FA': 'Ford',
    '1FT': 'Ford Trucks',
    '1HG': 'Honda USA',
    '2HG': 'Honda Canadá',
    '3VW': 'Volkswagen México',
    
    // Coreanos
    'KMH': 'Hyundai',
    'KNA': 'Kia',
    'KL1': 'Daewoo',
    
    // Chinos
    'LVS': 'Ford China',
    'LDC': 'Dongfeng',
    'LSV': 'SAIC',
    
    // Otros
    'VF1': 'Renault',
    'VF3': 'Peugeot',
    'VF7': 'Citroën',
    'VSS': 'SEAT',
    'YV1': 'Volvo'
  };
  
  return fabricantes[wmi] || 'Fabricante desconocido';
}

/**
 * Decodifica los años posibles según ISO 3779
 * Cada carácter representa 2 años separados por 30 años
 */
function decodificarAniosISO3779(caracter: string): { anio1: number; anio2: number } {
  // Tabla según ISO 3779 - cada carácter se repite cada 30 años
  const tablaAnios: { [key: string]: { anio1: number; anio2: number } } = {
    'A': { anio1: 1980, anio2: 2010 },
    'B': { anio1: 1981, anio2: 2011 },
    'C': { anio1: 1982, anio2: 2012 },
    'D': { anio1: 1983, anio2: 2013 },
    'E': { anio1: 1984, anio2: 2014 },
    'F': { anio1: 1985, anio2: 2015 },
    'G': { anio1: 1986, anio2: 2016 },
    'H': { anio1: 1987, anio2: 2017 },
    'J': { anio1: 1988, anio2: 2018 },
    'K': { anio1: 1989, anio2: 2019 },
    'L': { anio1: 1990, anio2: 2020 },
    'M': { anio1: 1991, anio2: 2021 },
    'N': { anio1: 1992, anio2: 2022 },
    'P': { anio1: 1993, anio2: 2023 },
    'R': { anio1: 1994, anio2: 2024 },
    'S': { anio1: 1995, anio2: 2025 },
    'T': { anio1: 1996, anio2: 2026 },
    'V': { anio1: 1997, anio2: 2027 },
    'W': { anio1: 1998, anio2: 2028 },
    'X': { anio1: 1999, anio2: 2029 },
    'Y': { anio1: 2000, anio2: 2030 },
    '1': { anio1: 2001, anio2: 2031 },
    '2': { anio1: 2002, anio2: 2032 },
    '3': { anio1: 2003, anio2: 2033 },
    '4': { anio1: 2004, anio2: 2034 },
    '5': { anio1: 2005, anio2: 2035 },
    '6': { anio1: 2006, anio2: 2036 },
    '7': { anio1: 2007, anio2: 2037 },
    '8': { anio1: 2008, anio2: 2038 },
    '9': { anio1: 2009, anio2: 2039 }
  };
  
  return tablaAnios[caracter] || { anio1: 0, anio2: 0 };
}

/**
 * Ejemplos de VIN según ISO 3779:
 * 
 * JTFSK22P5B0013653
 * │││││││││││││││││
 * │││└─────────────── Año: B = 1981 o 2011 (ISO 3779)
 * ││└──────────────── Fabricante: Toyota
 * │└───────────────── País: J = Japón
 * └────────────────── WMI: JTF = Toyota
 * 
 * 1HGBH41JXMN109186
 * │││││││││││││││││
 * │││└─────────────── Año: X = 1999 o 2029 (ISO 3779)
 * ││└──────────────── Fabricante: Honda
 * │└───────────────── País: 1 = Estados Unidos
 * └────────────────── WMI: 1HG = Honda USA
 * 
 * NOTA: Según ISO 3779, el carácter de año se repite cada 30 años.
 * Por ejemplo, 'B' puede ser 1981 o 2011. El usuario debe verificar
 * con la documentación del vehículo cuál es el año correcto.
 */
