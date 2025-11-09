/**
 * Tests for Archivo Documental Component
 * Requirements: 9.3, 9.4, 9.5, 9.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ArchivoDocumentalComponent } from './archivo-documental.component';
import { ArchivoService } from '../../services/mesa-partes/archivo.service';
import {
  Archivo,
  ClasificacionArchivoEnum,
  PoliticaRetencionEnum,
  ArchivoListResponse
} from '../../models/mesa-partes/archivo.model';

describe('ArchivoDocumentalComponent', () => {
  let component: ArchivoDocumentalComponent;
  let fixture: ComponentFixture<ArchivoDocumentalComponent>;
  let archivoService: jasmine.SpyObj<ArchivoService>;

  const mockArchivo: Archivo = {
    id: '1',
    documento_id: 'doc-1',
    clasificacion: ClasificacionArchivoEnum.TRAMITE_DOCUMENTARIO,
    politica_retencion: PoliticaRetencionEnum.CINCO_ANOS,
    codigo_ubicacion: 'EST-TD-2025-0001',
    ubicacion_fisica: 'Estante A, Caja 1',
    fecha_archivado: new Date('2025-01-01'),
    fecha_expiracion_retencion: new Date('2030-01-01'),
    usuario_archivo_id: 'user-1',
    observaciones: 'Test observaciones',
    motivo_archivo: 'Test motivo',
    activo: 'ARCHIVADO',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01')
  };

  const mockListResponse: ArchivoListResponse = {
    items: [mockArchivo],
    total: 1,
    page: 1,
    size: 20,
    pages: 1
  };

  beforeEach(async () => {
    const archivoServiceSpy = jasmine.createSpyObj('ArchivoService', [
      'listarArchivos',
      'obtenerProximosAExpirar',
      'restaurarDocumento'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ArchivoDocumentalComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ArchivoService, useValue: archivoServiceSpy }
      ]
    }).compileComponents();

    archivoService = TestBed.inject(ArchivoService) as jasmine.SpyObj<ArchivoService>;
    archivoService.listarArchivos.and.returnValue(of(mockListResponse));
    archivoService.obtenerProximosAExpirar.and.returnValue(of([mockArchivo]));

    fixture = TestBed.createComponent(ArchivoDocumentalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load archivos on init', () => {
    fixture.detectChanges();

    expect(archivoService.listarArchivos).toHaveBeenCalled();
    expect(component.archivos.length).toBe(1);
    expect(component.totalArchivos).toBe(1);
  });

  it('should load proximos a expirar count on init', () => {
    fixture.detectChanges();

    expect(archivoService.obtenerProximosAExpirar).toHaveBeenCalledWith(30);
    expect(component.proximosAExpirar).toBe(1);
  });

  it('should apply filters correctly', () => {
    component.filtrosForm.patchValue({
      clasificacion: ClasificacionArchivoEnum.LEGAL,
      politica_retencion: PoliticaRetencionEnum.DIEZ_ANOS
    });

    component.aplicarFiltros();

    expect(archivoService.listarArchivos).toHaveBeenCalled();
    const filtros = archivoService.listarArchivos.calls.mostRecent().args[0];
    expect(filtros.clasificacion).toBe(ClasificacionArchivoEnum.LEGAL);
    expect(filtros.politica_retencion).toBe(PoliticaRetencionEnum.DIEZ_ANOS);
  });

  it('should clear filters', () => {
    component.filtrosForm.patchValue({
      clasificacion: ClasificacionArchivoEnum.LEGAL,
      busqueda: 'test'
    });

    component.limpiarFiltros();

    expect(component.filtrosForm.value.clasificacion).toBeNull();
    expect(component.filtrosForm.value.busqueda).toBe('');
  });

  it('should handle page change', () => {
    const pageEvent = {
      pageIndex: 1,
      pageSize: 50,
      length: 100
    };

    component.onPageChange(pageEvent as any);

    expect(component.currentPage).toBe(2);
    expect(component.pageSize).toBe(50);
    expect(archivoService.listarArchivos).toHaveBeenCalled();
  });

  it('should detect expiring soon documents', () => {
    const fechaProxima = new Date();
    fechaProxima.setDate(fechaProxima.getDate() + 15);

    const isExpiring = component.isExpiringSoon(fechaProxima);
    expect(isExpiring).toBe(true);

    const fechaLejana = new Date();
    fechaLejana.setDate(fechaLejana.getDate() + 60);

    const isNotExpiring = component.isExpiringSoon(fechaLejana);
    expect(isNotExpiring).toBe(false);
  });

  it('should get clasificacion label', () => {
    const label = component.getClasificacionLabel(ClasificacionArchivoEnum.LEGAL);
    expect(label).toBe('Legal');
  });

  it('should get politica label', () => {
    const label = component.getPoliticaLabel(PoliticaRetencionEnum.CINCO_ANOS);
    expect(label).toBe('5 Años');
  });

  it('should construct filters with search term', () => {
    component.filtrosForm.patchValue({
      busqueda: 'EXP-2025-0001'
    });

    const filtros = component.construirFiltros();

    expect(filtros.numero_expediente).toBe('EXP-2025-0001');
    expect(filtros.remitente).toBe('EXP-2025-0001');
    expect(filtros.asunto).toBe('EXP-2025-0001');
  });

  it('should construct filters with date range', () => {
    const fechaDesde = new Date('2025-01-01');
    const fechaHasta = new Date('2025-12-31');

    component.filtrosForm.patchValue({
      fecha_archivado_desde: fechaDesde,
      fecha_archivado_hasta: fechaHasta
    });

    const filtros = component.construirFiltros();

    expect(filtros.fecha_archivado_desde).toEqual(fechaDesde);
    expect(filtros.fecha_archivado_hasta).toEqual(fechaHasta);
  });
});
