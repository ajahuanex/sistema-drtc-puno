import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, map, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { Tuc, TucCreate, TucUpdate, EstadoTuc } from '../models/tuc.model';
import { Vehiculo } from '../models/vehiculo.model';
import { Empresa } from '../models/empresa.model';
import { Resolucion } from '../models/resolucion.model';
import { AuthService } from './auth.service';
import { VehiculoService } from './vehiculo.service';
import { EmpresaService } from './empresa.service';
import { ResolucionService } from './resolucion.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TucService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  private apiUrl = environment.apiUrl;

  // Función helper para mapear TUCs del backend al frontend
  private mapearTucBackend(tucBackend: any): Tuc {
    return {
      id: tucBackend.id,
      vehiculoId: tucBackend.vehiculo_id,
      empresaId: tucBackend.empresa_id,
      expedienteId: tucBackend.expediente_id,
      nroTuc: tucBackend.nro_tuc,
      fechaEmision: tucBackend.fecha_emision,
      fechaVencimiento: tucBackend.fecha_vencimiento,
      estado: tucBackend.estado,
      observaciones: tucBackend.observaciones,
      estaActivo: tucBackend.esta_activo,
      documentoId: tucBackend.documento_id || undefined,
      qrVerificationUrl: tucBackend.qr_verification_url || undefined,
      razonDescarte: tucBackend.razon_descarte || undefined,
      // Información relacionada incluida directamente
      vehiculo: tucBackend.vehiculo || undefined,
      empresa: tucBackend.empresa || undefined,
      resolucion: tucBackend.resolucion || undefined
    };
  }

  // Datos mock para desarrollo
  private mockTucs: Tuc[] = [
    {
      id: '1',
      vehiculoId: '1',
      empresaId: '1',
      expedienteId: '1',
      nroTuc: 'T-123456-2025',
      fechaEmision: '2025-01-15T10:00:00Z',
      fechaVencimiento: '2025-12-15T10:00:00Z',
      estado: 'VIGENTE',
      estaActivo: true,
      documentoId: 'DOC-001',
      qrVerificationUrl: 'https://verificacion.tucs.gob.pe/verify/T-123456-2025',
      observaciones: 'TUC para Mercedes-Benz',
      // Información relacionada incluida directamente
      vehiculo: {
        id: '1',
        placa: 'V1A-123',
        marca: 'Mercedes-Benz',
        modelo: 'Sprinter',
        año: 2023,
        capacidad: 15,
        tipo: 'PASAJEROS'
      },
      empresa: {
        id: '1',
        razonSocial: 'TRANSPORTES MERCEDES S.A.',
        ruc: '20123456789',
        direccion: 'Av. Principal 123, Lima',
        telefono: '+51 1 234-5678',
        email: 'info@mercedes-transportes.pe'
      },
      resolucion: {
        id: '1',
        numero: 'R-0001-2024',
        fechaEmision: new Date('2024-01-15'),
        fechaVencimiento: new Date('2025-01-15'),
        estado: 'VIGENTE',
        tipo: 'PRIMIGENIA',
        empresaId: '1',
        descripcion: 'Resolución principal de autorización para transporte de pasajeros',
        observaciones: 'Resolución principal de autorización',
        estaActivo: true
      }
    },
    {
      id: '2',
      vehiculoId: '2',
      empresaId: '1',
      expedienteId: '1',
      nroTuc: 'T-123457-2025',
      fechaEmision: '2025-02-20T14:30:00Z',
      fechaVencimiento: '2025-12-20T14:30:00Z',
      estado: 'VIGENTE',
      estaActivo: true,
      documentoId: 'DOC-002',
      qrVerificationUrl: 'https://verificacion.tucs.gob.pe/verify/T-123457-2025',
      observaciones: 'TUC para Volvo',
      // Información relacionada incluida directamente
      vehiculo: {
        id: '2',
        placa: 'V2B-456',
        marca: 'Volvo',
        modelo: 'B12M',
        año: 2022,
        capacidad: 45,
        tipo: 'PASAJEROS'
      },
      empresa: {
        id: '1',
        razonSocial: 'TRANSPORTES MERCEDES S.A.',
        ruc: '20123456789',
        direccion: 'Av. Principal 123, Lima',
        telefono: '+51 1 234-5678',
        email: 'info@mercedes-transportes.pe'
      },
      resolucion: {
        id: '1',
        numero: 'R-0001-2024',
        fechaEmision: new Date('2024-01-15'),
        fechaVencimiento: new Date('2025-01-15'),
        estado: 'VIGENTE',
        tipo: 'PRIMIGENIA',
        empresaId: '1',
        descripcion: 'Resolución principal de autorización para transporte de pasajeros',
        observaciones: 'Resolución principal de autorización',
        estaActivo: true
      }
    },
    {
      id: '3',
      vehiculoId: '3',
      empresaId: '2',
      expedienteId: '2',
      nroTuc: 'T-123458-2025',
      fechaEmision: '2025-03-10T09:15:00Z',
      fechaVencimiento: '2025-12-10T09:15:00Z',
      estado: 'VIGENTE',
      estaActivo: true,
      documentoId: 'DOC-003',
      qrVerificationUrl: 'https://verificacion.tucs.gob.pe/verify/T-123458-2025',
      observaciones: 'TUC para Toyota',
      // Información relacionada incluida directamente
      vehiculo: {
        id: '3',
        placa: 'V3C-789',
        marca: 'Toyota',
        modelo: 'Coaster',
        año: 2024,
        capacidad: 25,
        tipo: 'PASAJEROS'
      },
      empresa: {
        id: '2',
        razonSocial: 'TRANSPORTES TOYOTA E.I.R.L.',
        ruc: '20234567890',
        direccion: 'Jr. Comercial 456, Arequipa',
        telefono: '+51 54 345-6789',
        email: 'contacto@toyota-transportes.pe'
      },
      resolucion: {
        id: '2',
        numero: 'R-0002-2024',
        fechaEmision: new Date('2024-02-20'),
        fechaVencimiento: new Date('2025-02-20'),
        estado: 'VIGENTE',
        tipo: 'AMPLIACION',
        empresaId: '2',
        descripcion: 'Ampliación de rutas autorizadas',
        observaciones: 'Ampliación de rutas',
        estaActivo: true
      }
    },
    {
      id: '4',
      vehiculoId: '4',
      empresaId: '3',
      expedienteId: '3',
      nroTuc: 'T-123459-2025',
      fechaEmision: '2025-04-26T07:30:00Z',
      fechaVencimiento: '2025-12-26T07:30:00Z',
      estado: 'VIGENTE',
      estaActivo: true,
      documentoId: 'DOC-004',
      qrVerificationUrl: 'https://verificacion.tucs.gob.pe/verify/T-123459-2025',
      observaciones: 'TUC para Scania',
      // Información relacionada incluida directamente
      vehiculo: {
        id: '4',
        placa: 'V4D-012',
        marca: 'Scania',
        modelo: 'K420',
        año: 2023,
        capacidad: 50,
        tipo: 'PASAJEROS'
      },
      empresa: {
        id: '3',
        razonSocial: 'TRANSPORTES SCANIA S.A.C.',
        ruc: '20345678901',
        direccion: 'Av. Industrial 789, Trujillo',
        telefono: '+51 44 456-7890',
        email: 'ventas@scania-transportes.pe'
      },
      resolucion: {
        id: '3',
        numero: 'R-0003-2024',
        fechaEmision: new Date('2024-03-10'),
        fechaVencimiento: new Date('2025-03-10'),
        estado: 'VIGENTE',
        tipo: 'RENOVACION',
        empresaId: '3',
        descripcion: 'Resolución de renovación para transporte de carga',
        observaciones: 'Renovación anual',
        estaActivo: true
      }
    }
  ];

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener todos los TUCs
  getTucs(skip: number = 0, limit: number = 100, estado?: EstadoTuc): Observable<Tuc[]> {
    console.log('AuthService.isAuthenticated():', this.authService.isAuthenticated());
    
    // TEMPORAL: Forzar uso de datos mock durante desarrollo
    const usarMock = true; // Cambiar a false cuando la API esté lista
    
    if (this.authService.isAuthenticated() && !usarMock) {
      console.log('Intentando obtener TUCs desde API...');
      const params: any = { skip, limit };
      if (estado) params.estado = estado;

      return this.http.get<any[]>(`${this.apiUrl}/tucs`, { 
        headers: this.getHeaders(),
        params 
      }).pipe(
        map(tucsBackend => tucsBackend.map(tucBackend => this.mapearTucBackend(tucBackend))),
        catchError(error => {
          console.error('Error obteniendo TUCs desde API:', error);
          console.log('Fallback a datos mock...');
          return of(this.mockTucs);
        })
      );
    }
    
    console.log('Usando datos mock directamente...');
    console.log('Datos mock disponibles:', this.mockTucs);
    return of(this.mockTucs);
  }

  // Obtener TUC por ID
  getTucById(id: string): Observable<Tuc> {
    // TEMPORAL: Forzar uso de datos mock durante desarrollo
    const usarMock = true; // Cambiar a false cuando la API esté lista
    
    if (this.authService.isAuthenticated() && !usarMock) {
      return this.http.get<any>(`${this.apiUrl}/tucs/${id}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucBackend => this.mapearTucBackend(tucBackend)),
        catchError(error => {
          console.error('Error obteniendo TUC desde API:', error);
          // Fallback a datos mock
          const mockTuc = this.mockTucs.find(t => t.id === id);
          if (mockTuc) {
            return of(mockTuc);
          }
          return throwError(() => new Error('TUC no encontrado'));
        })
      );
    }
    const mockTuc = this.mockTucs.find(t => t.id === id);
    if (mockTuc) {
      return of(mockTuc);
    }
    return throwError(() => new Error('TUC no encontrado'));
  }

  // Obtener TUC por número
  getTucByNumero(nroTuc: string): Observable<Tuc> {
    // TEMPORAL: Forzar uso de datos mock durante desarrollo
    const usarMock = true; // Cambiar a false cuando la API esté lista
    
    if (this.authService.isAuthenticated() && !usarMock) {
      return this.http.get<any>(`${this.apiUrl}/tucs/numero/${nroTuc}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucBackend => this.mapearTucBackend(tucBackend)),
        catchError(error => {
          console.error('Error obteniendo TUC por número desde API:', error);
          // Fallback a datos mock
          const mockTuc = this.mockTucs.find(t => t.nroTuc === nroTuc);
          if (mockTuc) {
            return of(mockTuc);
          }
          return throwError(() => new Error('TUC no encontrado'));
        })
      );
    }
    const mockTuc = this.mockTucs.find(t => t.nroTuc === nroTuc);
    if (mockTuc) {
      return of(mockTuc);
    }
    return throwError(() => new Error('TUC no encontrado'));
  }

  // Obtener TUCs por empresa
  getTucsByEmpresa(empresaId: string): Observable<Tuc[]> {
    // TEMPORAL: Forzar uso de datos mock durante desarrollo
    const usarMock = true; // Cambiar a false cuando la API esté lista
    
    if (this.authService.isAuthenticated() && !usarMock) {
      return this.http.get<any[]>(`${this.apiUrl}/tucs/empresa/${empresaId}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucsBackend => tucsBackend.map(tucBackend => this.mapearTucBackend(tucBackend))),
        catchError(error => {
          console.error('Error obteniendo TUCs por empresa desde API:', error);
          // Fallback a datos mock
          return of(this.mockTucs.filter(t => t.empresaId === empresaId));
        })
      );
    }
    return of(this.mockTucs.filter(t => t.empresaId === empresaId));
  }

  // Obtener TUCs por vehículo
  getTucsByVehiculo(vehiculoId: string): Observable<Tuc[]> {
    // TEMPORAL: Forzar uso de datos mock durante desarrollo
    const usarMock = true; // Cambiar a false cuando la API esté lista
    
    if (this.authService.isAuthenticated() && !usarMock) {
      return this.http.get<any[]>(`${this.apiUrl}/tucs/vehiculo/${vehiculoId}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucsBackend => tucsBackend.map(tucBackend => this.mapearTucBackend(tucBackend))),
        catchError(error => {
          console.error('Error obteniendo TUCs por vehículo desde API:', error);
          // Fallback a datos mock
          return of(this.mockTucs.filter(t => t.vehiculoId === vehiculoId));
        })
      );
    }
    return of(this.mockTucs.filter(t => t.vehiculoId === vehiculoId));
  }

  // Obtener TUCs por resolución
  getTucsByResolucion(resolucionId: string): Observable<Tuc[]> {
    // TEMPORAL: Forzar uso de datos mock durante desarrollo
    const usarMock = true; // Cambiar a false cuando la API esté lista
    
    if (this.authService.isAuthenticated() && !usarMock) {
      return this.http.get<any[]>(`${this.apiUrl}/tucs/resolucion/${resolucionId}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucsBackend => tucsBackend.map(tucBackend => this.mapearTucBackend(tucBackend))),
        catchError(error => {
          console.error('Error obteniendo TUCs por resolución desde API:', error);
          // Fallback a datos mock
          return of(this.mockTucs.filter(t => t.expedienteId === resolucionId));
        })
      );
    }
    return of(this.mockTucs.filter(t => t.expedienteId === resolucionId));
  }

  // Crear nuevo TUC
  createTuc(tuc: TucCreate): Observable<Tuc> {
    // TEMPORAL: Forzar uso de datos mock durante desarrollo
    const usarMock = true; // Cambiar a false cuando la API esté lista
    
    if (this.authService.isAuthenticated() && !usarMock) {
      return this.http.post<Tuc>(`${this.apiUrl}/tucs`, tuc, { 
        headers: this.getHeaders() 
      }).pipe(
        catchError(error => {
          console.error('Error creando TUC desde API:', error);
          // Fallback a datos mock
          const newTuc: Tuc = {
            id: Date.now().toString(),
            ...tuc,
            fechaEmision: new Date().toISOString(),
            fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año después
            estado: 'VIGENTE',
            estaActivo: true,
            documentoId: `DOC-${Date.now()}`,
            qrVerificationUrl: `https://verificacion.tucs.gob.pe/verify/${tuc.nroTuc}`,
            observaciones: 'TUC creado en modo mock'
          };
          this.mockTucs.push(newTuc);
          return of(newTuc);
        })
      );
    }
    // Crear en datos mock
    const newTuc: Tuc = {
      id: Date.now().toString(),
      ...tuc,
      fechaEmision: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año después
      estado: 'VIGENTE',
      estaActivo: true,
      documentoId: `DOC-${Date.now()}`,
      qrVerificationUrl: `https://verificacion.tucs.gob.pe/verify/${tuc.nroTuc}`,
      observaciones: 'TUC creado en modo mock'
    };
    this.mockTucs.push(newTuc);
    return of(newTuc);
  }

  // Actualizar TUC
  updateTuc(id: string, tuc: TucUpdate): Observable<Tuc> {
    if (this.authService.isAuthenticated()) {
      return this.http.put<Tuc>(`${this.apiUrl}/tucs/${id}`, tuc, { 
        headers: this.getHeaders() 
      }).pipe(
        catchError(error => {
          console.error('Error actualizando TUC desde API:', error);
          // Fallback a datos mock
          const index = this.mockTucs.findIndex(t => t.id === id);
          if (index !== -1) {
            this.mockTucs[index] = { ...this.mockTucs[index], ...tuc };
            return of(this.mockTucs[index]);
          }
          return throwError(() => new Error('TUC no encontrado'));
        })
      );
    }
    // Actualizar en datos mock
    const index = this.mockTucs.findIndex(t => t.id === id);
    if (index !== -1) {
      this.mockTucs[index] = { ...this.mockTucs[index], ...tuc };
      return of(this.mockTucs[index]);
    }
    return throwError(() => new Error('TUC no encontrado'));
  }

  // Eliminar TUC
  deleteTuc(id: string): Observable<void> {
    if (this.authService.isAuthenticated()) {
      return this.http.delete<void>(`${this.apiUrl}/tucs/${id}`, { 
        headers: this.getHeaders() 
      }).pipe(
        catchError(error => {
          console.error('Error eliminando TUC desde API:', error);
          // Fallback a datos mock
          const index = this.mockTucs.findIndex(t => t.id === id);
          if (index !== -1) {
            this.mockTucs.splice(index, 1);
          }
          return of(void 0);
        })
      );
    }
    // Eliminar de datos mock
    const index = this.mockTucs.findIndex(t => t.id === id);
    if (index !== -1) {
      this.mockTucs.splice(index, 1);
    }
    return of(void 0);
  }

  // Cambiar estado del TUC
  cambiarEstadoTuc(id: string, nuevoEstado: EstadoTuc, razonDescarte?: string): Observable<Tuc> {
    const updateData: TucUpdate = { 
      estado: nuevoEstado,
      estaActivo: nuevoEstado === 'VIGENTE'
    };
    
    if (razonDescarte) {
      updateData.razonDescarte = razonDescarte;
    }

    return this.updateTuc(id, updateData);
  }

  // Generar número de TUC único
  generarNumeroTuc(): string {
    const año = new Date().getFullYear();
    const numero = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `T-${numero}-${año}`;
  }

  // Verificar si un TUC está próximo a vencer (30 días)
  isTucProximoAVencer(fechaEmision: string): boolean {
    const fechaEmisionDate = new Date(fechaEmision);
    const fechaVencimiento = new Date(fechaEmisionDate);
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
    
    const hoy = new Date();
    const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    
    return diasRestantes <= 30 && diasRestantes > 0;
  }

  // Verificar si un TUC está vencido
  isTucVencido(fechaEmision: string): boolean {
    const fechaEmisionDate = new Date(fechaEmision);
    const fechaVencimiento = new Date(fechaEmisionDate);
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
    
    const hoy = new Date();
    return hoy > fechaVencimiento;
  }

  // Obtener TUCs próximos a vencer
  getTucsProximosAVencer(): Observable<Tuc[]> {
    return this.getTucs().pipe(
      map(tucs => tucs.filter(tuc => 
        tuc.estado === 'VIGENTE' && 
        this.isTucProximoAVencer(tuc.fechaEmision)
      ))
    );
  }

  // Obtener TUCs vencidos
  getTucsVencidos(): Observable<Tuc[]> {
    return this.getTucs().pipe(
      map(tucs => tucs.filter(tuc => 
        tuc.estado === 'VIGENTE' && 
        this.isTucVencido(tuc.fechaEmision)
      ))
    );
  }

  // Obtener TUC con información completa (vehículo, empresa, resolución)
  getTucCompleto(id: string): Observable<{
    tuc: Tuc;
    vehiculo: Vehiculo | null;
    empresa: Empresa;
    resolucion: Resolucion;
  }> {
    // TEMPORAL: Forzar uso de datos mock durante desarrollo
    const usarMock = true; // Cambiar a false cuando la API esté lista

    if (usarMock) {
      console.log('Usando datos mock para getTucCompleto...');
      const tuc = this.mockTucs.find(t => t.id === id);
      
      if (tuc && tuc.vehiculo && tuc.empresa && tuc.resolucion) {
        console.log('TUC completo encontrado en mock data:', tuc);
        return of({
          tuc,
          vehiculo: tuc.vehiculo,
          empresa: tuc.empresa,
          resolucion: tuc.resolucion
        });
      } else {
        console.warn('TUC no encontrado o incompleto en mock data, ID:', id);
        return of({
          tuc: {} as Tuc,
          vehiculo: {} as Vehiculo,
          empresa: {} as Empresa,
          resolucion: {} as Resolucion
        });
      }
    }

    // Lógica original para cuando la API esté lista
    return this.getTucById(id).pipe(
      switchMap(tuc => {
        // Verificar que el TUC tenga los IDs necesarios
        if (!tuc.vehiculoId || !tuc.empresaId || !tuc.expedienteId) {
          console.warn('TUC sin IDs completos:', tuc);
          // Retornar solo el TUC con objetos vacíos para las entidades relacionadas
          return of({
            tuc,
            vehiculo: null as any as Vehiculo,
            empresa: {} as Empresa,
            resolucion: {} as Resolucion
          });
        }

        // Obtener información relacionada solo si los IDs existen
        return this.vehiculoService.getVehiculo(tuc.vehiculoId).pipe(
          catchError(error => {
            console.warn('Error obteniendo vehículo, usando objeto vacío:', error);
            return of({} as Vehiculo);
          }),
          switchMap(vehiculo => 
            this.empresaService.getEmpresa(tuc.empresaId).pipe(
              catchError(error => {
                console.warn('Error obteniendo empresa, usando objeto vacío:', error);
                return of({} as Empresa);
              }),
              switchMap(empresa => 
                this.resolucionService.getResolucionById(tuc.expedienteId).pipe(
                  catchError(error => {
                    console.warn('Error obteniendo resolución, usando objeto vacío:', error);
                    return of({} as Resolucion);
                  }),
                  map(resolucion => ({
                    tuc,
                    vehiculo,
                    empresa,
                    resolucion
                  }))
                )
              )
            )
          )
        );
      })
    );
  }

  // Obtener estadísticas de TUCs
  getEstadisticasTucs(): Observable<{
    total: number;
    vigentes: number;
    dadosDeBaja: number;
    desechados: number;
    proximosAVencer: number;
    vencidos: number;
  }> {
    return this.getTucs().pipe(
      map(tucs => {
        const total = tucs.length;
        const vigentes = tucs.filter(t => t.estado === 'VIGENTE').length;
        const dadosDeBaja = tucs.filter(t => t.estado === 'DADA_DE_BAJA').length;
        const desechados = tucs.filter(t => t.estado === 'DESECHADA').length;
        const proximosAVencer = tucs.filter(t => 
          t.estado === 'VIGENTE' && this.isTucProximoAVencer(t.fechaEmision)
        ).length;
        const vencidos = tucs.filter(t => 
          t.estado === 'VIGENTE' && this.isTucVencido(t.fechaEmision)
        ).length;

        return {
          total,
          vigentes,
          dadosDeBaja,
          desechados,
          proximosAVencer,
          vencidos
        };
      })
    );
  }
} 
