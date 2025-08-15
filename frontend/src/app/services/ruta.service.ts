import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Ruta, RutaCreate, RutaUpdate, ValidacionRuta, RespuestaValidacionRuta, EstadoRuta, TipoRuta } from '../models/ruta.model';
import { LocalidadService } from './localidad.service';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  private apiUrl = 'http://localhost:8000/api/v1';

  // Datos mock para desarrollo
  private mockRutas: Ruta[] = [
    // RESOLUCIÓN 1 - EMPRESA 1 (TRANSPORTES PUNO S.A.)
    {
      id: '1',
      codigoRuta: '01',
      nombre: 'PUNO - JULIACA',
      origenId: '1',
      destinoId: '2',
      origen: 'PUNO',
      destino: 'JULIACA',
      distancia: 45,
      tiempoEstimado: 1,
      itinerarioIds: [],
      frecuencias: 'Diaria, cada 30 minutos',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '1',
      resolucionId: '1',
      fechaRegistro: new Date('2024-01-15'),
      fechaActualizacion: new Date('2024-01-15'),
      observaciones: 'Ruta principal interprovincial',
      tipoRuta: 'INTERPROVINCIAL',
      capacidadMaxima: 50,
      tarifaBase: 5.00
    },
    {
      id: '2',
      codigoRuta: '02',
      nombre: 'PUNO - CUSCO',
      origenId: '1',
      destinoId: '3',
      origen: 'PUNO',
      destino: 'CUSCO',
      distancia: 350,
      tiempoEstimado: 6,
      itinerarioIds: [],
      frecuencias: 'Diaria, 3 veces al día',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '1',
      resolucionId: '1',
      fechaRegistro: new Date('2024-01-15'),
      fechaActualizacion: new Date('2024-01-15'),
      observaciones: 'Ruta turística importante',
      tipoRuta: 'INTERPROVINCIAL',
      capacidadMaxima: 45,
      tarifaBase: 25.00
    },
    {
      id: '3',
      codigoRuta: '03',
      nombre: 'PUNO - MOQUEGUA',
      origenId: '1',
      destinoId: '4',
      origen: 'PUNO',
      destino: 'MOQUEGUA',
      distancia: 280,
      tiempoEstimado: 4,
      itinerarioIds: [],
      frecuencias: 'Diaria, 2 veces al día',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '1',
      resolucionId: '1',
      fechaRegistro: new Date('2024-01-20'),
      fechaActualizacion: new Date('2024-01-20'),
      observaciones: 'Ruta comercial',
      tipoRuta: 'INTERPROVINCIAL',
      capacidadMaxima: 40,
      tarifaBase: 18.00
    },

    // RESOLUCIÓN 2 - EMPRESA 2 (TRANSPORTES LIMA E.I.R.L.)
    {
      id: '4',
      codigoRuta: '01',
      nombre: 'LIMA - TRUJILLO',
      origenId: '5',
      destinoId: '6',
      origen: 'LIMA',
      destino: 'TRUJILLO',
      distancia: 550,
      tiempoEstimado: 8,
      itinerarioIds: [],
      frecuencias: 'Diaria, 2 veces al día',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '2',
      resolucionId: '2',
      fechaRegistro: new Date('2024-02-01'),
      fechaActualizacion: new Date('2024-02-01'),
      observaciones: 'Ruta costera norte',
      tipoRuta: 'INTERPROVINCIAL',
      capacidadMaxima: 55,
      tarifaBase: 35.00
    },
    {
      id: '5',
      codigoRuta: '02',
      nombre: 'LIMA - CHICLAYO',
      origenId: '5',
      destinoId: '7',
      origen: 'LIMA',
      destino: 'CHICLAYO',
      distancia: 770,
      tiempoEstimado: 12,
      itinerarioIds: [],
      frecuencias: 'Diaria, 1 vez al día',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '2',
      resolucionId: '2',
      fechaRegistro: new Date('2024-02-01'),
      fechaActualizacion: new Date('2024-02-01'),
      observaciones: 'Ruta larga distancia',
      tipoRuta: 'INTERPROVINCIAL',
      capacidadMaxima: 40,
      tarifaBase: 45.00
    },
    {
      id: '6',
      codigoRuta: '03',
      nombre: 'LIMA - PIURA',
      origenId: '5',
      destinoId: '8',
      origen: 'LIMA',
      destino: 'PIURA',
      distancia: 950,
      tiempoEstimado: 15,
      itinerarioIds: [],
      frecuencias: 'Diaria, 1 vez al día',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '2',
      resolucionId: '2',
      fechaRegistro: new Date('2024-02-05'),
      fechaActualizacion: new Date('2024-02-05'),
      observaciones: 'Ruta norte extrema',
      tipoRuta: 'INTERPROVINCIAL',
      capacidadMaxima: 35,
      tarifaBase: 55.00
    },

    // RESOLUCIÓN 3 - EMPRESA 3 (TRANSPORTES AREQUIPA S.A.C.)
    {
      id: '7',
      codigoRuta: '01',
      nombre: 'AREQUIPA - MOLLENDO',
      origenId: '9',
      destinoId: '10',
      origen: 'AREQUIPA',
      destino: 'MOLLENDO',
      distancia: 120,
      tiempoEstimado: 2,
      itinerarioIds: [],
      frecuencias: 'Diaria, cada hora',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '3',
      resolucionId: '3',
      fechaRegistro: new Date('2024-03-01'),
      fechaActualizacion: new Date('2024-03-01'),
      observaciones: 'Ruta costera',
      tipoRuta: 'INTERPROVINCIAL',
      capacidadMaxima: 30,
      tarifaBase: 8.00
    },
    {
      id: '8',
      codigoRuta: '02',
      nombre: 'AREQUIPA - TACNA',
      origenId: '9',
      destinoId: '11',
      origen: 'AREQUIPA',
      destino: 'TACNA',
      distancia: 320,
      tiempoEstimado: 5,
      itinerarioIds: [],
      frecuencias: 'Diaria, 3 veces al día',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '3',
      resolucionId: '3',
      fechaRegistro: new Date('2024-03-01'),
      fechaActualizacion: new Date('2024-03-01'),
      observaciones: 'Ruta fronteriza',
      tipoRuta: 'INTERPROVINCIAL',
      capacidadMaxima: 25,
      tarifaBase: 20.00
    },

    // RESOLUCIÓN 4 - EMPRESA 4 (TRANSPORTES CUSCO S.A.)
    {
      id: '9',
      codigoRuta: '01',
      nombre: 'CUSCO - SACRED VALLEY',
      origenId: '12',
      destinoId: '13',
      origen: 'CUSCO',
      destino: 'SACRED VALLEY',
      distancia: 25,
      tiempoEstimado: 0.5,
      itinerarioIds: [],
      frecuencias: 'Diaria, cada 15 minutos',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '4',
      resolucionId: '4',
      fechaRegistro: new Date('2024-04-01'),
      fechaActualizacion: new Date('2024-04-01'),
      observaciones: 'Ruta turística',
      tipoRuta: 'INTERURBANA',
      capacidadMaxima: 20,
      tarifaBase: 3.00
    },
    {
      id: '10',
      codigoRuta: '02',
      nombre: 'CUSCO - MACHU PICCHU',
      origenId: '12',
      destinoId: '14',
      origen: 'CUSCO',
      destino: 'MACHU PICCHU',
      distancia: 80,
      tiempoEstimado: 2,
      itinerarioIds: [],
      frecuencias: 'Diaria, 4 veces al día',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '4',
      resolucionId: '4',
      fechaRegistro: new Date('2024-04-01'),
      fechaActualizacion: new Date('2024-04-01'),
      observaciones: 'Ruta arqueológica',
      tipoRuta: 'INTERPROVINCIAL',
      capacidadMaxima: 30,
      tarifaBase: 15.00
    },

    // RESOLUCIÓN 5 - EMPRESA 5 (TRANSPORTES URBANOS LIMA S.A.)
    {
      id: '11',
      codigoRuta: '01',
      nombre: 'LIMA CENTRO - MIRAFLORES',
      origenId: '15',
      destinoId: '16',
      origen: 'LIMA CENTRO',
      destino: 'MIRAFLORES',
      distancia: 8,
      tiempoEstimado: 0.3,
      itinerarioIds: [],
      frecuencias: 'Diaria, cada 5 minutos',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '5',
      resolucionId: '5',
      fechaRegistro: new Date('2024-05-01'),
      fechaActualizacion: new Date('2024-05-01'),
      observaciones: 'Ruta urbana principal',
      tipoRuta: 'URBANA',
      capacidadMaxima: 80,
      tarifaBase: 2.50
    },
    {
      id: '12',
      codigoRuta: '02',
      nombre: 'LIMA CENTRO - SAN ISIDRO',
      origenId: '15',
      destinoId: '17',
      origen: 'LIMA CENTRO',
      destino: 'SAN ISIDRO',
      distancia: 6,
      tiempoEstimado: 0.2,
      itinerarioIds: [],
      frecuencias: 'Diaria, cada 3 minutos',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '5',
      resolucionId: '5',
      fechaRegistro: new Date('2024-05-01'),
      fechaActualizacion: new Date('2024-05-01'),
      observaciones: 'Ruta financiera',
      tipoRuta: 'URBANA',
      capacidadMaxima: 60,
      tarifaBase: 2.00
    },
    {
      id: '13',
      codigoRuta: '03',
      nombre: 'LIMA CENTRO - BARRANCO',
      origenId: '15',
      destinoId: '18',
      origen: 'LIMA CENTRO',
      destino: 'BARRANCO',
      distancia: 12,
      tiempoEstimado: 0.4,
      itinerarioIds: [],
      frecuencias: 'Diaria, cada 8 minutos',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: '5',
      resolucionId: '5',
      fechaRegistro: new Date('2024-05-05'),
      fechaActualizacion: new Date('2024-05-05'),
      observaciones: 'Ruta bohemia',
      tipoRuta: 'URBANA',
      capacidadMaxima: 45,
      tarifaBase: 2.80
    }
  ];

  private localidadService = inject(LocalidadService);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🚀 CONSTRUCTOR RUTA SERVICE INICIALIZADO');
    console.log('📊 ESTADO INICIAL DE MOCK RUTAS:', {
      totalRutas: this.mockRutas.length,
      rutas: this.mockRutas.map(r => ({
        id: r.id,
        codigoRuta: r.codigoRuta,
        nombre: r.nombre,
        resolucionId: r.resolucionId,
        empresaId: r.empresaId
      }))
    });
    
    // Mostrar estado detallado
    this.mostrarEstadoMockRutas();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getRutas(): Observable<Ruta[]> {
    console.log('🔍 GET RUTAS LLAMADO');
    console.log('📊 TOTAL RUTAS MOCK DISPONIBLES:', this.mockRutas.length);
    
    // En modo desarrollo, devolver directamente las rutas mock
    const rutasMock = [...this.mockRutas]; // Crear una copia del array
    
    console.log('📋 RUTAS A DEVOLVER:', {
      total: rutasMock.length,
      rutas: rutasMock.map(r => ({
        id: r.id,
        codigoRuta: r.codigoRuta,
        nombre: r.nombre,
        origen: r.origen,
        destino: r.destino,
        resolucionId: r.resolucionId,
        empresaId: r.empresaId
      }))
    });
    
    return of(rutasMock);
  }

  getRutaById(id: string): Observable<Ruta> {
    // Funcionamiento offline - usar datos mock directamente
    const mockRuta = this.mockRutas.find(r => r.id === id);
    if (mockRuta) {
      return of(mockRuta);
    }
    return throwError(() => new Error('Ruta no encontrada'));
  }

  createRuta(ruta: RutaCreate): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas`;
    
    return this.http.post<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating ruta:', error);
          // Crear ruta mock en caso de error
          const newRuta: Ruta = {
            id: (this.mockRutas.length + 1).toString(),
            codigoRuta: ruta.codigoRuta,
            nombre: ruta.nombre,
            origenId: ruta.origenId,
            destinoId: ruta.destinoId,
            origen: ruta.origen,
            destino: ruta.destino,
            distancia: ruta.distancia,
            tiempoEstimado: ruta.tiempoEstimado,
            tipoRuta: ruta.tipoRuta,
            empresaId: ruta.empresaId,
            fechaActualizacion: new Date(),
            observaciones: ruta.observaciones,
            descripcion: ruta.descripcion,
            capacidadMaxima: ruta.capacidadMaxima,
            tarifaBase: ruta.tarifaBase,
            itinerarioIds: ruta.itinerarioIds || [],
            frecuencias: ruta.frecuencias || '',
            estado: ruta.estado || 'ACTIVA',
            estaActivo: true,
            fechaRegistro: new Date()
          };
          this.mockRutas.push(newRuta);
          return of(newRuta);
        })
      );
  }

  updateRuta(id: string, ruta: RutaUpdate): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas/${id}`;
    
    return this.http.put<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating ruta:', error);
          // Actualizar ruta mock en caso de error
          const index = this.mockRutas.findIndex(r => r.id === id);
          if (index !== -1) {
            const rutaActualizada = { ...this.mockRutas[index] };
            if (ruta.codigoRuta !== undefined) rutaActualizada.codigoRuta = ruta.codigoRuta;
            if (ruta.nombre !== undefined) rutaActualizada.nombre = ruta.nombre;
            if (ruta.origenId !== undefined) rutaActualizada.origenId = ruta.origenId;
            if (ruta.destinoId !== undefined) rutaActualizada.destinoId = ruta.destinoId;
            if (ruta.origen !== undefined) rutaActualizada.origen = ruta.origen;
            if (ruta.destino !== undefined) rutaActualizada.destino = ruta.destino;
            if (ruta.distancia !== undefined) rutaActualizada.distancia = ruta.distancia;
            if (ruta.tiempoEstimado !== undefined) rutaActualizada.tiempoEstimado = ruta.tiempoEstimado;
            if (ruta.tipoRuta !== undefined) rutaActualizada.tipoRuta = ruta.tipoRuta;
            if (ruta.empresaId !== undefined) rutaActualizada.empresaId = ruta.empresaId;
            if (ruta.observaciones !== undefined) rutaActualizada.observaciones = ruta.observaciones;
            if (ruta.descripcion !== undefined) rutaActualizada.descripcion = ruta.descripcion;
            if (ruta.capacidadMaxima !== undefined) rutaActualizada.capacidadMaxima = ruta.capacidadMaxima;
            if (ruta.tarifaBase !== undefined) rutaActualizada.tarifaBase = ruta.tarifaBase;
            if (ruta.itinerarioIds !== undefined) rutaActualizada.itinerarioIds = ruta.itinerarioIds;
            if (ruta.frecuencias !== undefined) rutaActualizada.frecuencias = ruta.frecuencias;
            if (ruta.estado !== undefined) rutaActualizada.estado = ruta.estado;
            
            this.mockRutas[index] = rutaActualizada;
            return of(this.mockRutas[index]);
          }
          return throwError(() => new Error('Ruta no encontrada'));
        })
      );
  }

  deleteRuta(id: string): Observable<void> {
    const url = `${this.apiUrl}/rutas/${id}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting ruta:', error);
          // Eliminar ruta mock en caso de error
          const index = this.mockRutas.findIndex(r => r.id === id);
          if (index !== -1) {
            this.mockRutas.splice(index, 1);
          }
          return of(void 0);
        })
      );
  }

  // Método para validar que una ruta sea única
  validarRutaUnica(validacion: ValidacionRuta): Observable<RespuestaValidacionRuta> {
    // Buscar ruta existente con el mismo código, excluyendo la ruta actual si estamos en edición
    const rutaExistente = this.mockRutas.find(r => 
      r.codigoRuta === validacion.codigoRuta && 
      (!validacion.rutaIdExcluir || r.id !== validacion.rutaIdExcluir)
    );

    if (rutaExistente) {
      const respuesta: RespuestaValidacionRuta = {
        valido: false,
        mensaje: `Ya existe una ruta con el código ${validacion.codigoRuta}`,
        rutaExistente: {
          id: rutaExistente.id,
          codigoRuta: rutaExistente.codigoRuta,
          origen: rutaExistente.origen,
          destino: rutaExistente.destino,
          empresaId: rutaExistente.empresaId,
          estado: rutaExistente.estado
        },
        conflictos: [`Código de ruta duplicado: ${validacion.codigoRuta}`]
      };
      return of(respuesta);
    }

    // Validar que origen y destino sean diferentes
    if (validacion.origenId === validacion.destinoId) {
      const respuesta: RespuestaValidacionRuta = {
        valido: false,
        mensaje: 'El origen y destino no pueden ser la misma localidad',
        conflictos: ['Origen y destino idénticos']
      };
      return of(respuesta);
    }

    return of({
      valido: true,
      mensaje: `Ruta válida - Código ${validacion.codigoRuta} disponible`
    });
  }

  // Método para generar código de ruta automáticamente
  generarCodigoRuta(origen: string, destino: string): Observable<string> {
    // Generar código basado en origen y destino
    const codigoOrigen = origen.substring(0, 3).toUpperCase();
    const codigoDestino = destino.substring(0, 3).toUpperCase();
    
    // Buscar el siguiente número disponible
    let numero = 1;
    let codigoGenerado = `${codigoOrigen}-${codigoDestino}-${numero.toString().padStart(3, '0')}`;
    
    while (this.mockRutas.some(r => r.codigoRuta === codigoGenerado)) {
      numero++;
      codigoGenerado = `${codigoOrigen}-${codigoDestino}-${numero.toString().padStart(3, '0')}`;
    }
    
    return of(codigoGenerado);
  }

  // Método para validar que el código de ruta sea único dentro de una resolución
  validarCodigoRutaUnico(resolucionId: string, codigoRuta: string, rutaIdExcluir?: string): Observable<boolean> {
    console.log('🔍 VALIDANDO UNICIDAD:', {
      resolucionId,
      codigoRuta,
      rutaIdExcluir
    });

    // Mostrar todas las rutas del sistema para debug
    console.log('📊 TODAS LAS RUTAS DEL SISTEMA:', this.mockRutas.map(r => ({
      id: r.id,
      codigoRuta: r.codigoRuta,
      nombre: r.nombre,
      origen: r.origen,
      destino: r.destino,
      resolucionId: r.resolucionId,
      empresaId: r.empresaId,
      estaActivo: r.estaActivo
    })));

    // Obtener todas las rutas activas de la resolución específica
    const rutasDeResolucion = this.mockRutas.filter(r => {
      return r.estaActivo && r.resolucionId === resolucionId && r.id !== rutaIdExcluir;
    });

    console.log('📊 RUTAS A VALIDAR:', {
      resolucionId,
      totalRutas: rutasDeResolucion.length,
      rutas: rutasDeResolucion.map(r => ({ 
        id: r.id, 
        codigoRuta: r.codigoRuta,
        nombre: r.nombre,
        origen: r.origen,
        destino: r.destino
      }))
    });

    // Verificar si el código ya existe
    const codigoExiste = rutasDeResolucion.some(r => r.codigoRuta === codigoRuta);
    
    console.log('✅ RESULTADO VALIDACIÓN:', {
      resolucionId,
      codigoRuta,
      codigoExiste,
      esUnico: !codigoExiste
    });

    // Si el código existe, NO es único
    if (codigoExiste) {
      console.error('❌ CÓDIGO DUPLICADO DETECTADO:', {
        resolucionId,
        codigoRuta,
        rutasExistentes: rutasDeResolucion.filter(r => r.codigoRuta === codigoRuta)
      });
    }

    return of(!codigoExiste);
  }

  // Método para generar código de ruta único dentro de una resolución primigenia
  generarCodigoRutaPorResolucion(resolucionId: string): Observable<string> {
    console.log('🔧 GENERANDO CÓDIGO PARA RESOLUCIÓN:', resolucionId);
    
    // Obtener todas las rutas activas de la resolución
    const rutasDeResolucion = this.mockRutas.filter(r => {
      return r.estaActivo && r.resolucionId === resolucionId;
    });

    console.log('📊 RUTAS ENCONTRADAS EN LA RESOLUCIÓN:', {
      resolucionId,
      totalRutas: rutasDeResolucion.length,
      rutas: rutasDeResolucion.map(r => ({ id: r.id, codigoRuta: r.codigoRuta }))
    });

    // Buscar el siguiente número disponible dentro de la resolución
    let numero = 1;
    let codigoGenerado = numero.toString().padStart(2, '0');
    
    // Verificar que no exista el código generado
    while (rutasDeResolucion.some(r => r.codigoRuta === codigoGenerado)) {
      numero++;
      codigoGenerado = numero.toString().padStart(2, '0');
      
      // Protección contra bucles infinitos
      if (numero > 99) {
        console.error('❌ ERROR: No se pueden generar más códigos de ruta (límite 99)');
        break;
      }
    }
    
    console.log('✅ CÓDIGO GENERADO:', {
      resolucionId,
      codigoGenerado,
      intentos: numero,
      totalRutasExistentes: rutasDeResolucion.length
    });
    
    return of(codigoGenerado);
  }

  // Método para calcular distancia y tiempo estimado automáticamente
  calcularDistanciaYTiempo(origenId: string, destinoId: string): Observable<{distancia: number, tiempoEstimado: number}> {
    return this.localidadService.calcularDistancia(origenId, destinoId).pipe(
      map(distancia => {
        // Calcular tiempo estimado basado en distancia (promedio 60 km/h)
        const tiempoEstimado = Math.ceil(distancia / 60);
        return { distancia, tiempoEstimado };
      })
    );
  }

  getRutasPorEmpresa(empresaId: string): Observable<Ruta[]> {
    console.log('🏢 OBTENIENDO RUTAS POR EMPRESA:', empresaId);
    
    // En modo desarrollo, usar directamente las rutas mock
    const rutasDeEmpresa = this.mockRutas.filter(r => r.empresaId === empresaId && r.estaActivo);
    
    console.log('📊 RUTAS DE LA EMPRESA ENCONTRADAS:', {
      empresaId,
      totalRutas: rutasDeEmpresa.length,
      rutas: rutasDeEmpresa.map(r => ({ 
        id: r.id, 
        codigoRuta: r.codigoRuta, 
        nombre: r.nombre, 
        origen: r.origen,
        destino: r.destino,
        resolucionId: r.resolucionId 
      }))
    });
    
    return of(rutasDeEmpresa);
  }

  // Método para obtener rutas por empresa y resolución
  getRutasPorEmpresaYResolucion(empresaId: string, resolucionId: string): Observable<Ruta[]> {
    console.log('🔍 OBTENIENDO RUTAS POR EMPRESA Y RESOLUCIÓN:', { empresaId, resolucionId });
    
    // En modo desarrollo, usar directamente las rutas mock
    const rutasFiltradas = this.mockRutas.filter(r => 
      r.empresaId === empresaId && 
      r.resolucionId === resolucionId && 
      r.estaActivo
    );
    
    console.log('📊 RUTAS FILTRADAS POR EMPRESA Y RESOLUCIÓN:', {
      empresaId,
      resolucionId,
      totalRutas: rutasFiltradas.length,
      rutas: rutasFiltradas.map(r => ({ 
        id: r.id, 
        codigoRuta: r.codigoRuta, 
        nombre: r.nombre, 
        origen: r.origen,
        destino: r.destino,
        resolucionId: r.resolucionId 
      }))
    });
    
    return of(rutasFiltradas);
  }

  // Método para obtener rutas por resolución específica
  getRutasPorResolucion(resolucionId: string): Observable<Ruta[]> {
    console.log('🔍 OBTENIENDO RUTAS POR RESOLUCIÓN:', resolucionId);
    
    const rutasDeResolucion = this.mockRutas.filter(r => {
      return r.estaActivo && r.resolucionId === resolucionId;
    });

    console.log('📊 RUTAS ENCONTRADAS:', {
      resolucionId,
      totalRutas: rutasDeResolucion.length,
      rutas: rutasDeResolucion.map(r => ({ 
        id: r.id, 
        codigoRuta: r.codigoRuta, 
        nombre: r.nombre,
        origen: r.origen,
        destino: r.destino
      }))
    });

    return of(rutasDeResolucion);
  }

  // Método para obtener el siguiente código disponible en una resolución
  getSiguienteCodigoDisponible(resolucionId: string): Observable<string> {
    console.log('🔧 OBTENIENDO SIGUIENTE CÓDIGO DISPONIBLE PARA RESOLUCIÓN:', resolucionId);
    
    return this.getRutasPorResolucion(resolucionId).pipe(
      map(rutas => {
        // Obtener todos los códigos existentes
        const codigosExistentes = rutas.map(r => r.codigoRuta).sort();
        
        console.log('📊 CÓDIGOS EXISTENTES EN LA RESOLUCIÓN:', {
          resolucionId,
          codigosExistentes,
          totalRutas: rutas.length
        });
        
        // Buscar el siguiente número disponible
        let numero = 1;
        let codigoGenerado = numero.toString().padStart(2, '0');
        
        while (codigosExistentes.includes(codigoGenerado)) {
          numero++;
          codigoGenerado = numero.toString().padStart(2, '0');
          
          // Protección contra bucles infinitos
          if (numero > 99) {
            console.error('❌ ERROR: No se pueden generar más códigos de ruta (límite 99)');
            break;
          }
        }
        
        console.log('✅ SIGUIENTE CÓDIGO DISPONIBLE:', {
          resolucionId,
          codigoGenerado,
          codigosExistentes,
          totalRutasExistentes: rutas.length
        });
        
        return codigoGenerado;
      })
    );
  }

  agregarRutaAEmpresa(empresaId: string, rutaId: string): Observable<Ruta> {
    const url = `${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`;
    
    return this.http.post<Ruta>(url, {}, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error adding ruta to empresa:', error);
          // Simular éxito en caso de error
          const ruta = this.mockRutas.find(r => r.id === rutaId);
          if (ruta) {
            return of(ruta);
          }
          return throwError(() => new Error('Ruta no encontrada'));
        })
      );
  }

  removerRutaDeEmpresa(empresaId: string, rutaId: string): Observable<void> {
    const url = `${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error removing ruta from empresa:', error);
          // Simular éxito en caso de error
          return of(void 0);
        })
      );
  }

  // Método para mostrar el estado actual de las rutas mock
  mostrarEstadoRutasMock(): void {
    console.log('📊 ESTADO ACTUAL DE RUTAS MOCK:');
    console.log('='.repeat(80));
    
    // Agrupar por resolución para mejor visualización
    const rutasPorResolucion = this.mockRutas.reduce((acc, ruta) => {
      const resolucionId = ruta.resolucionId || 'SIN_RESOLUCION';
      if (!acc[resolucionId]) {
        acc[resolucionId] = [];
      }
      acc[resolucionId].push({
        id: ruta.id,
        codigoRuta: ruta.codigoRuta,
        nombre: ruta.nombre,
        origen: ruta.origen,
        destino: ruta.destino,
        empresaId: ruta.empresaId,
        estado: ruta.estado,
        tipoRuta: ruta.tipoRuta
      });
      return acc;
    }, {} as any);
    
    // Mostrar resumen por resolución
    Object.keys(rutasPorResolucion).forEach(resolucionId => {
      const rutas = rutasPorResolucion[resolucionId];
      console.log(`\n🏢 RESOLUCIÓN ${resolucionId}:`);
      console.log(`   Total de rutas: ${rutas.length}`);
      console.log(`   Códigos utilizados: ${rutas.map((r: any) => r.codigoRuta).sort().join(', ')}`);
      
      rutas.forEach((ruta: any) => {
        console.log(`   • ${ruta.codigoRuta} - ${ruta.nombre} (${ruta.origen} → ${ruta.destino})`);
      });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`📈 TOTAL GENERAL: ${this.mockRutas.length} rutas activas`);
    
    // Verificar integridad de códigos únicos
    this.verificarIntegridadCodigosUnicos();
  }

  // Método para mostrar el estado actual de mockRutas
  mostrarEstadoMockRutas(): void {
    console.log('🔍 === ESTADO ACTUAL DE MOCK RUTAS ===');
    console.log('📊 Total de rutas mock:', this.mockRutas.length);
    
    // Agrupar por resolución
    const rutasPorResolucion = this.mockRutas.reduce((acc, ruta) => {
      const resolucionId = ruta.resolucionId || 'SIN_RESOLUCION';
      if (!acc[resolucionId]) {
        acc[resolucionId] = [];
      }
      acc[resolucionId].push(ruta);
      return acc;
    }, {} as Record<string, Ruta[]>);
    
    Object.keys(rutasPorResolucion).forEach(resolucionId => {
      const rutas = rutasPorResolucion[resolucionId];
      console.log(`🏢 RESOLUCIÓN ${resolucionId}:`, {
        totalRutas: rutas.length,
        codigosUtilizados: rutas.map(r => r.codigoRuta).sort(),
        rutas: rutas.map(r => ({
          id: r.id,
          codigoRuta: r.codigoRuta,
          nombre: r.nombre,
          empresaId: r.empresaId,
          resolucionId: r.resolucionId
        }))
      });
    });
    
    console.log('=== FIN ESTADO MOCK RUTAS ===');
  }

  // Método para verificar la integridad de códigos únicos por resolución
  private verificarIntegridadCodigosUnicos(): void {
    console.log('\n🔍 VERIFICANDO INTEGRIDAD DE CÓDIGOS ÚNICOS:');
    
    const resoluciones = [...new Set(this.mockRutas.map(r => r.resolucionId))];
    
    resoluciones.forEach(resolucionId => {
      if (!resolucionId) return;
      
      const rutasDeResolucion = this.mockRutas.filter(r => r.resolucionId === resolucionId);
      const codigos = rutasDeResolucion.map(r => r.codigoRuta);
      const codigosUnicos = [...new Set(codigos)];
      
      if (codigos.length === codigosUnicos.length) {
        console.log(`✅ Resolución ${resolucionId}: Códigos únicos correctos (${codigos.sort().join(', ')})`);
      } else {
        console.error(`❌ Resolución ${resolucionId}: CÓDIGOS DUPLICADOS DETECTADOS!`);
        console.error(`   Códigos: ${codigos.sort().join(', ')}`);
        console.error(`   Únicos: ${codigosUnicos.sort().join(', ')}`);
      }
    });
  }

  // Método para obtener todas las rutas mock (para debugging)
  getRutasMock(): Ruta[] {
    return this.mockRutas;
  }

  // Método para agregar una nueva ruta y actualizar la lista mock
  agregarRutaMock(ruta: RutaCreate, resolucionId: string): Observable<Ruta> {
    console.log('➕ AGREGANDO RUTA MOCK:', {
      ruta,
      resolucionId
    });

    // Generar ID único
    const nuevoId = (this.mockRutas.length + 1).toString();
    
    // Crear la nueva ruta
    const nuevaRuta: Ruta = {
      id: nuevoId,
      codigoRuta: ruta.codigoRuta,
      nombre: `${ruta.origen} - ${ruta.destino}`,
      origenId: ruta.origenId || ruta.origen,
      destinoId: ruta.destinoId || ruta.destino,
      origen: ruta.origen,
      destino: ruta.destino,
      distancia: ruta.distancia || 0,
      tiempoEstimado: ruta.tiempoEstimado || 0,
      itinerarioIds: ruta.itinerarioIds || [],
      frecuencias: ruta.frecuencias || '',
      estado: 'ACTIVA',
      estaActivo: true,
      empresaId: ruta.empresaId,
      resolucionId: resolucionId,
      fechaRegistro: new Date(),
      fechaActualizacion: new Date(),
      observaciones: ruta.observaciones || '',
      descripcion: ruta.descripcion || '',
      tipoRuta: ruta.tipoRuta,
      capacidadMaxima: ruta.capacidadMaxima,
      tarifaBase: ruta.tarifaBase
    };

    // Agregar a la lista mock
    this.mockRutas.push(nuevaRuta);
    
    console.log('✅ RUTA AGREGADA A MOCK:', {
      id: nuevaRuta.id,
      codigoRuta: nuevaRuta.codigoRuta,
      resolucionId: nuevaRuta.resolucionId,
      totalRutasMock: this.mockRutas.length
    });

    return of(nuevaRuta);
  }

  // Método para generar datos mock adicionales de prueba
  generarDatosMockAdicionales(): void {
    console.log('🔧 GENERANDO DATOS MOCK ADICIONALES DE PRUEBA...');
    
    // Agregar más rutas a la resolución 1 (Empresa 1)
    const nuevaRuta1: Ruta = {
      id: '14',
      codigoRuta: '04',
      nombre: 'PUNO - AREQUIPA',
      origenId: '1',
      destinoId: '9',
      origen: 'PUNO',
      destino: 'AREQUIPA',
      distancia: 275,
      tiempoEstimado: 4.5,
      itinerarioIds: [],
      frecuencias: 'Diaria, 2 veces al día',
      estado: 'ACTIVA' as EstadoRuta,
      estaActivo: true,
      empresaId: '1',
      resolucionId: '1',
      fechaRegistro: new Date('2024-06-01'),
      fechaActualizacion: new Date('2024-06-01'),
      observaciones: 'Ruta interprovincial adicional',
      tipoRuta: 'INTERPROVINCIAL' as TipoRuta,
      capacidadMaxima: 35,
      tarifaBase: 22.00
    };

    // Agregar más rutas a la resolución 2 (Empresa 2)
    const nuevaRuta2: Ruta = {
      id: '15',
      codigoRuta: '04',
      nombre: 'LIMA - HUANCAYO',
      origenId: '5',
      destinoId: '19',
      origen: 'LIMA',
      destino: 'HUANCAYO',
      distancia: 320,
      tiempoEstimado: 6,
      itinerarioIds: [],
      frecuencias: 'Diaria, 3 veces al día',
      estado: 'ACTIVA' as EstadoRuta,
      estaActivo: true,
      empresaId: '2',
      resolucionId: '2',
      fechaRegistro: new Date('2024-06-05'),
      fechaActualizacion: new Date('2024-06-05'),
      observaciones: 'Ruta sierra central',
      tipoRuta: 'INTERPROVINCIAL' as TipoRuta,
      capacidadMaxima: 40,
      tarifaBase: 28.00
    };

    // Agregar más rutas a la resolución 5 (Empresa 5)
    const nuevaRuta3: Ruta = {
      id: '16',
      codigoRuta: '04',
      nombre: 'LIMA CENTRO - LA MOLINA',
      origenId: '15',
      destinoId: '20',
      origen: 'LIMA CENTRO',
      destino: 'LA MOLINA',
      distancia: 15,
      tiempoEstimado: 0.6,
      itinerarioIds: [],
      frecuencias: 'Diaria, cada 10 minutos',
      estado: 'ACTIVA' as EstadoRuta,
      estaActivo: true,
      empresaId: '5',
      resolucionId: '5',
      fechaRegistro: new Date('2024-06-10'),
      fechaActualizacion: new Date('2024-06-10'),
      observaciones: 'Ruta residencial',
      tipoRuta: 'URBANA' as TipoRuta,
      capacidadMaxima: 50,
      tarifaBase: 3.20
    };

    // Agregar las nuevas rutas
    this.mockRutas.push(nuevaRuta1, nuevaRuta2, nuevaRuta3);
    
    console.log('✅ DATOS MOCK ADICIONALES GENERADOS:');
    console.log(`   • Nueva ruta PUNO-AREQUIPA (04) agregada a resolución 1`);
    console.log(`   • Nueva ruta LIMA-HUANCAYO (04) agregada a resolución 2`);
    console.log(`   • Nueva ruta LIMA CENTRO-LA MOLINA (04) agregada a resolución 5`);
    console.log(`   • Total de rutas mock: ${this.mockRutas.length}`);
    
    // Verificar la integridad después de agregar
    this.verificarIntegridadCodigosUnicos();
  }

  // Método para limpiar datos mock y volver al estado inicial
  limpiarDatosMock(): void {
    console.log('🧹 LIMPIANDO DATOS MOCK...');
    
    // Mantener solo las rutas originales (primeras 13)
    this.mockRutas = this.mockRutas.slice(0, 13);
    
    console.log('✅ DATOS MOCK LIMPIADOS');
    console.log(`   • Total de rutas: ${this.mockRutas.length}`);
    
    // Verificar la integridad después de limpiar
    this.verificarIntegridadCodigosUnicos();
  }
} 