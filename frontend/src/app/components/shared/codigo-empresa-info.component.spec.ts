import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodigoEmpresaInfoComponent } from './codigo-empresa-info.component';
import { TipoEmpresa } from '../../models/empresa.model';

describe('CodigoEmpresaInfoComponent', () => {
  let component: CodigoEmpresaInfoComponent;
  let fixture: ComponentFixture<CodigoEmpresaInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodigoEmpresaInfoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CodigoEmpresaInfoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Visualización con código válido', () => {
    it('should display valid code 0123PRT correctly', () => {
      component.codigoEmpresa = '0123PRT';
      fixture.detectChanges();

      expect(component.obtenerNumero()).toBe('0123');
      expect(component.obtenerLetras()).toBe('PRT');
    });

    it('should extract number part correctly from valid code', () => {
      component.codigoEmpresa = '0123PRT';
      
      const numero = component.obtenerNumero();
      expect(numero).toBe('0123');
      expect(numero.length).toBe(4);
    });

    it('should extract letters part correctly from valid code', () => {
      component.codigoEmpresa = '0123PRT';
      
      const letras = component.obtenerLetras();
      expect(letras).toBe('PRT');
      expect(letras.length).toBe(3);
    });

    it('should parse all three types from PRT code', () => {
      component.codigoEmpresa = '0123PRT';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos.length).toBe(3);
      
      // Verificar tipo Personas (P)
      expect(tipos[0].letra).toBe('P');
      expect(tipos[0].descripcion).toBe('Personas');
      expect(tipos[0].color).toBe('primary');
      expect(tipos[0].icono).toBe('people');
      
      // Verificar tipo Regional (R)
      expect(tipos[1].letra).toBe('R');
      expect(tipos[1].descripcion).toBe('Regional');
      expect(tipos[1].color).toBe('accent');
      expect(tipos[1].icono).toBe('location_on');
      
      // Verificar tipo Turismo (T)
      expect(tipos[2].letra).toBe('T');
      expect(tipos[2].descripcion).toBe('Turismo');
      expect(tipos[2].color).toBe('warn');
      expect(tipos[2].icono).toBe('flight');
    });

    it('should handle code with only Personas type (P)', () => {
      component.codigoEmpresa = '0001PPP';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos.length).toBe(3);
      expect(tipos.every(t => t.letra === 'P')).toBe(true);
      expect(tipos.every(t => t.descripcion === 'Personas')).toBe(true);
    });

    it('should handle code with only Regional type (R)', () => {
      component.codigoEmpresa = '0002RRR';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos.length).toBe(3);
      expect(tipos.every(t => t.letra === 'R')).toBe(true);
      expect(tipos.every(t => t.descripcion === 'Regional')).toBe(true);
    });

    it('should handle code with only Turismo type (T)', () => {
      component.codigoEmpresa = '0003TTT';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos.length).toBe(3);
      expect(tipos.every(t => t.letra === 'T')).toBe(true);
      expect(tipos.every(t => t.descripcion === 'Turismo')).toBe(true);
    });

    it('should handle mixed types PT', () => {
      component.codigoEmpresa = '0004PPT';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos.length).toBe(3);
      expect(tipos[0].letra).toBe('P');
      expect(tipos[1].letra).toBe('P');
      expect(tipos[2].letra).toBe('T');
    });

    it('should handle mixed types PR', () => {
      component.codigoEmpresa = '0005PRR';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos.length).toBe(3);
      expect(tipos[0].letra).toBe('P');
      expect(tipos[1].letra).toBe('R');
      expect(tipos[2].letra).toBe('R');
    });

    it('should handle mixed types RT', () => {
      component.codigoEmpresa = '0006RRT';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos.length).toBe(3);
      expect(tipos[0].letra).toBe('R');
      expect(tipos[1].letra).toBe('R');
      expect(tipos[2].letra).toBe('T');
    });
  });

  describe('Visualización con empresa sin código', () => {
    it('should handle empty code gracefully', () => {
      component.codigoEmpresa = '';
      fixture.detectChanges();

      expect(component.obtenerNumero()).toBe('');
      expect(component.obtenerLetras()).toBe('');
      expect(component.obtenerTiposEmpresa()).toEqual([]);
    });

    it('should return empty string for numero when code is empty', () => {
      component.codigoEmpresa = '';
      
      const numero = component.obtenerNumero();
      expect(numero).toBe('');
    });

    it('should return empty string for letras when code is empty', () => {
      component.codigoEmpresa = '';
      
      const letras = component.obtenerLetras();
      expect(letras).toBe('');
    });

    it('should return empty array for tipos when code is empty', () => {
      component.codigoEmpresa = '';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos).toEqual([]);
      expect(tipos.length).toBe(0);
    });

    it('should handle undefined code', () => {
      component.codigoEmpresa = undefined as any;
      
      expect(component.obtenerNumero()).toBe('');
      expect(component.obtenerLetras()).toBe('');
      expect(component.obtenerTiposEmpresa()).toEqual([]);
    });

    it('should handle null code', () => {
      component.codigoEmpresa = null as any;
      
      expect(component.obtenerNumero()).toBe('');
      expect(component.obtenerLetras()).toBe('');
      expect(component.obtenerTiposEmpresa()).toEqual([]);
    });
  });

  describe('Verificar chips de colores para tipos', () => {
    it('should assign primary color to Personas type', () => {
      component.codigoEmpresa = '0001PPP';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos[0].color).toBe('primary');
    });

    it('should assign accent color to Regional type', () => {
      component.codigoEmpresa = '0002RRR';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos[0].color).toBe('accent');
    });

    it('should assign warn color to Turismo type', () => {
      component.codigoEmpresa = '0003TTT';
      
      const tipos = component.obtenerTiposEmpresa();
      expect(tipos[0].color).toBe('warn');
    });

    it('should assign correct icons to each type', () => {
      component.codigoEmpresa = '0123PRT';
      
      const tipos = component.obtenerTiposEmpresa();
      
      // Personas icon
      expect(tipos[0].icono).toBe('people');
      
      // Regional icon
      expect(tipos[1].icono).toBe('location_on');
      
      // Turismo icon
      expect(tipos[2].icono).toBe('flight');
    });

    it('should have all required properties for chip display', () => {
      component.codigoEmpresa = '0123PRT';
      
      const tipos = component.obtenerTiposEmpresa();
      
      tipos.forEach(tipo => {
        expect(tipo.letra).toBeDefined();
        expect(tipo.descripcion).toBeDefined();
        expect(tipo.color).toBeDefined();
        expect(tipo.icono).toBeDefined();
        
        expect(typeof tipo.letra).toBe('string');
        expect(typeof tipo.descripcion).toBe('string');
        expect(typeof tipo.color).toBe('string');
        expect(typeof tipo.icono).toBe('string');
      });
    });

    it('should maintain color consistency across multiple calls', () => {
      component.codigoEmpresa = '0123PRT';
      
      const tipos1 = component.obtenerTiposEmpresa();
      const tipos2 = component.obtenerTiposEmpresa();
      
      expect(tipos1[0].color).toBe(tipos2[0].color);
      expect(tipos1[1].color).toBe(tipos2[1].color);
      expect(tipos1[2].color).toBe(tipos2[2].color);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle code shorter than 7 characters', () => {
      component.codigoEmpresa = '0123';
      
      const numero = component.obtenerNumero();
      const letras = component.obtenerLetras();
      
      expect(numero).toBe('0123');
      expect(letras).toBe('');
    });

    it('should handle code with only numbers', () => {
      component.codigoEmpresa = '0123456';
      
      const numero = component.obtenerNumero();
      const letras = component.obtenerLetras();
      
      expect(numero).toBe('0123');
      expect(letras).toBe('456');
    });

    it('should handle code longer than 7 characters', () => {
      component.codigoEmpresa = '0123PRTXYZ';
      
      const numero = component.obtenerNumero();
      const letras = component.obtenerLetras();
      
      expect(numero).toBe('0123');
      expect(letras).toBe('PRT');
    });

    it('should handle code with lowercase letters', () => {
      component.codigoEmpresa = '0123prt';
      
      const tipos = component.obtenerTiposEmpresa();
      // Lowercase letters won't match the enum, so should return empty array
      expect(tipos.length).toBe(0);
    });

    it('should ignore invalid letters in code', () => {
      component.codigoEmpresa = '0123XYZ';
      
      const tipos = component.obtenerTiposEmpresa();
      // Invalid letters should be ignored
      expect(tipos.length).toBe(0);
    });

    it('should handle partial valid code', () => {
      component.codigoEmpresa = '0123PXY';
      
      const tipos = component.obtenerTiposEmpresa();
      // Only P is valid
      expect(tipos.length).toBe(1);
      expect(tipos[0].letra).toBe('P');
    });
  });

  describe('Integration with template', () => {
    it('should render component with valid code', () => {
      component.codigoEmpresa = '0123PRT';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled).toBeTruthy();
    });

    it('should render component with empty code', () => {
      component.codigoEmpresa = '';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled).toBeTruthy();
    });

    it('should update display when code changes', () => {
      component.codigoEmpresa = '0123PRT';
      fixture.detectChanges();
      
      let tipos = component.obtenerTiposEmpresa();
      expect(tipos.length).toBe(3);

      component.codigoEmpresa = '0456RRR';
      fixture.detectChanges();
      
      tipos = component.obtenerTiposEmpresa();
      expect(tipos.length).toBe(3);
      expect(tipos.every(t => t.letra === 'R')).toBe(true);
    });
  });
});
