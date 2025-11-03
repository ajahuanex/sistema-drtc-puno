import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MesaPartesComponent } from './mesa-partes.component';
import { NotificacionService } from '../../services/mesa-partes/notificacion.service';

describe('MesaPartesComponent', () => {
  let component: MesaPartesComponent;
  let fixture: ComponentFixture<MesaPartesComponent>;
  let notificacionService: jasmine.SpyObj<NotificacionService>;

  beforeEach(async () => {
    const notificacionServiceSpy = jasmine.createSpyObj('NotificacionService', [
      'obtenerContadorNoLeidas',
      'desconectarWebSocket',
      'mostrarNotificacionNavegador'
    ]);

    // Mock del observable de notificaciones
    notificacionServiceSpy.notificaciones$ = of();
    
    // Mock del método obtenerContadorNoLeidas
    notificacionServiceSpy.obtenerContadorNoLeidas.and.returnValue(
      of({ total: 5, porTipo: {} as any })
    );

    await TestBed.configureTestingModule({
      imports: [
        MesaPartesComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: NotificacionService, useValue: notificacionServiceSpy }
      ]
    }).compileComponents();

    notificacionService = TestBed.inject(NotificacionService) as jasmine.SpyObj<NotificacionService>;
    fixture = TestBed.createComponent(MesaPartesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.selectedTabIndex).toBe(0);
    expect(component.notificacionesPendientes).toBe(0);
  });

  it('should load notification counter on init', (done) => {
    fixture.detectChanges();

    setTimeout(() => {
      expect(notificacionService.obtenerContadorNoLeidas).toHaveBeenCalled();
      expect(component.notificacionesPendientes).toBe(5);
      done();
    }, 100);
  });

  it('should handle tab change', () => {
    spyOn(console, 'log');
    component.onTabChange(2);
    
    expect(component.selectedTabIndex).toBe(2);
    expect(console.log).toHaveBeenCalledWith('Tab seleccionado:', 'Búsqueda');
  });

  it('should call verNotificaciones when notification button is clicked', () => {
    spyOn(console, 'log');
    component.verNotificaciones();
    
    expect(console.log).toHaveBeenCalledWith('Ver notificaciones - Funcionalidad pendiente de implementar');
  });

  it('should disconnect WebSocket on destroy', () => {
    component.ngOnDestroy();
    
    expect(notificacionService.desconectarWebSocket).toHaveBeenCalled();
  });

  it('should render header with title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const header = compiled.querySelector('.header h1');
    
    expect(header.textContent).toContain('Mesa de Partes');
  });

  it('should render all tabs', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const tabs = compiled.querySelectorAll('.mat-mdc-tab');
    
    expect(tabs.length).toBe(5);
  });

  it('should show notification badge when there are pending notifications', () => {
    component.notificacionesPendientes = 3;
    fixture.detectChanges();
    
    const badge = fixture.nativeElement.querySelector('.mat-badge-content');
    expect(badge).toBeTruthy();
  });

  it('should hide notification badge when there are no pending notifications', () => {
    component.notificacionesPendientes = 0;
    fixture.detectChanges();
    
    const badge = fixture.nativeElement.querySelector('.mat-badge-content');
    expect(badge).toBeFalsy();
  });
});
