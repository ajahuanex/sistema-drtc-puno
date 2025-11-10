import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DateRangePickerComponent, RangoFechas } from './date-range-picker.component';

describe('DateRangePickerComponent', () => {
  let component: DateRangePickerComponent;
  let fixture: ComponentFixture<DateRangePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DateRangePickerComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DateRangePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with empty range', () => {
      expect(component.rangeForm.get('inicio')?.value).toBeNull();
      expect(component.rangeForm.get('fin')?.value).toBeNull();
    });

    it('should initialize with provided label', () => {
      component.label = 'Test Label';
      fixture.detectChanges();
      expect(component.label).toBe('Test Label');
    });

    it('should initialize with provided hint', () => {
      component.hint = 'Test Hint';
      fixture.detectChanges();
      expect(component.hint).toBe('Test Hint');
    });
  });

  describe('Range Selection', () => {
    it('should set range when writeValue is called', () => {
      const rango: RangoFechas = {
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      };

      component.writeValue(rango);

      expect(component.rangeForm.get('inicio')?.value).toEqual(rango.inicio);
      expect(component.rangeForm.get('fin')?.value).toEqual(rango.fin);
    });

    it('should clear range when writeValue is called with null', () => {
      // First set a range
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      });

      // Then clear it
      component.writeValue(null);

      expect(component.rangeForm.get('inicio')?.value).toBeNull();
      expect(component.rangeForm.get('fin')?.value).toBeNull();
    });

    it('should emit rangoChange when range is updated', (done) => {
      const rango: RangoFechas = {
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      };

      component.rangoChange.subscribe((emittedRango) => {
        expect(emittedRango.inicio).toEqual(rango.inicio);
        expect(emittedRango.fin).toEqual(rango.fin);
        done();
      });

      component.rangeForm.patchValue({
        inicio: rango.inicio,
        fin: rango.fin
      });
    });
  });

  describe('Validation', () => {
    it('should be valid with valid date range', () => {
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      });

      expect(component.rangeForm.valid).toBeTruthy();
    });

    it('should be invalid when end date is before start date', () => {
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-31'),
        fin: new Date('2025-01-01')
      });

      expect(component.rangeForm.hasError('rangoInvalido')).toBeTruthy();
    });

    it('should be invalid when range exceeds maximum days', () => {
      component.maxDiasRango = 30;
      
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-03-01')
      });

      expect(component.rangeForm.hasError('rangoExcesivo')).toBeTruthy();
    });

    it('should be valid when only one date is selected', () => {
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-01'),
        fin: null
      });

      expect(component.rangeForm.valid).toBeTruthy();
    });
  });

  describe('Quick Range Actions', () => {
    it('should set today range when establecerRangoRapido("hoy") is called', () => {
      component.establecerRangoRapido('hoy');

      const inicio = component.rangeForm.get('inicio')?.value;
      const fin = component.rangeForm.get('fin')?.value;

      expect(inicio).toBeTruthy();
      expect(fin).toBeTruthy();
      expect(inicio?.toDateString()).toBe(fin?.toDateString());
    });

    it('should set week range when establecerRangoRapido("semana") is called', () => {
      component.establecerRangoRapido('semana');

      const inicio = component.rangeForm.get('inicio')?.value;
      const fin = component.rangeForm.get('fin')?.value;

      expect(inicio).toBeTruthy();
      expect(fin).toBeTruthy();
      
      // Week should be 7 days
      const diffDays = Math.ceil((fin!.getTime() - inicio!.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(6);
    });

    it('should set month range when establecerRangoRapido("mes") is called', () => {
      component.establecerRangoRapido('mes');

      const inicio = component.rangeForm.get('inicio')?.value;
      const fin = component.rangeForm.get('fin')?.value;

      expect(inicio).toBeTruthy();
      expect(fin).toBeTruthy();
      
      // Should be first and last day of current month
      expect(inicio?.getDate()).toBe(1);
      expect(fin?.getMonth()).toBe(inicio?.getMonth());
    });
  });

  describe('Clear Range', () => {
    it('should clear range when limpiarRango is called', () => {
      // Set a range first
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      });

      // Clear it
      component.limpiarRango();

      expect(component.rangeForm.get('inicio')?.value).toBeNull();
      expect(component.rangeForm.get('fin')?.value).toBeNull();
    });

    it('should return false for tieneRango when range is empty', () => {
      expect(component.tieneRango()).toBeFalsy();
    });

    it('should return true for tieneRango when range has values', () => {
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      });

      expect(component.tieneRango()).toBeTruthy();
    });
  });

  describe('ControlValueAccessor', () => {
    it('should register onChange callback', () => {
      const fn = jasmine.createSpy('onChange');
      component.registerOnChange(fn);

      component.rangeForm.patchValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      });

      expect(fn).toHaveBeenCalled();
    });

    it('should register onTouched callback', () => {
      const fn = jasmine.createSpy('onTouched');
      component.registerOnTouched(fn);

      component.limpiarRango();

      expect(fn).toHaveBeenCalled();
    });

    it('should disable form when setDisabledState(true) is called', () => {
      component.setDisabledState(true);
      expect(component.rangeForm.disabled).toBeTruthy();
    });

    it('should enable form when setDisabledState(false) is called', () => {
      component.setDisabledState(true);
      component.setDisabledState(false);
      expect(component.rangeForm.enabled).toBeTruthy();
    });
  });

  describe('Public Methods', () => {
    it('should return current range with getRango', () => {
      const expectedRango: RangoFechas = {
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      };

      component.rangeForm.patchValue({
        inicio: expectedRango.inicio,
        fin: expectedRango.fin
      });

      const rango = component.getRango();
      expect(rango.inicio).toEqual(expectedRango.inicio);
      expect(rango.fin).toEqual(expectedRango.fin);
    });

    it('should set range with setRango', () => {
      const rango: RangoFechas = {
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      };

      component.setRango(rango);

      expect(component.rangeForm.get('inicio')?.value).toEqual(rango.inicio);
      expect(component.rangeForm.get('fin')?.value).toEqual(rango.fin);
    });

    it('should return true for esValido when form is valid', () => {
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      });

      expect(component.esValido()).toBeTruthy();
    });

    it('should return false for esValido when form is invalid', () => {
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-31'),
        fin: new Date('2025-01-01')
      });

      expect(component.esValido()).toBeFalsy();
    });

    it('should return errors with getErrores', () => {
      component.rangeForm.patchValue({
        inicio: new Date('2025-01-31'),
        fin: new Date('2025-01-01')
      });

      const errors = component.getErrores();
      expect(errors).toBeTruthy();
      expect(errors?.['rangoInvalido']).toBeTruthy();
    });
  });

  describe('Min/Max Dates', () => {
    it('should respect fechaMinima input', () => {
      const minDate = new Date('2025-01-01');
      component.fechaMinima = minDate;
      fixture.detectChanges();

      expect(component.fechaMinima).toEqual(minDate);
    });

    it('should respect fechaMaxima input', () => {
      const maxDate = new Date('2025-12-31');
      component.fechaMaxima = maxDate;
      fixture.detectChanges();

      expect(component.fechaMaxima).toEqual(maxDate);
    });
  });

  describe('Integration with FormControl', () => {
    it('should work with FormControl', () => {
      const formControl = new FormControl<RangoFechas | null>(null);
      
      const rango: RangoFechas = {
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      };

      formControl.setValue(rango);
      component.writeValue(rango);

      expect(component.rangeForm.get('inicio')?.value).toEqual(rango.inicio);
      expect(component.rangeForm.get('fin')?.value).toEqual(rango.fin);
    });
  });
});
