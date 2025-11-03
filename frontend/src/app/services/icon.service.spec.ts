import { TestBed } from '@angular/core/testing';
import { IconService } from './icon.service';

describe('IconService', () => {
  let service: IconService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IconService]
    });
    service = TestBed.inject(IconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with materialIconsLoaded signal', () => {
    expect(service.materialIconsLoaded).toBeDefined();
    expect(typeof service.materialIconsLoaded()).toBe('boolean');
  });

  it('should have icon fallbacks map', () => {
    const status = service.getIconStatus();
    expect(status.totalFallbacks).toBeGreaterThan(0);
  });

  it('should return icon name when Material Icons are loaded', () => {
    // Simular que Material Icons están cargados
    (service as any)._materialIconsLoaded.set(true);
    
    const icon = service.getIcon('home');
    expect(icon).toBe('home');
  });

  it('should return fallback emoji when Material Icons are not loaded', () => {
    // Simular que Material Icons no están cargados
    (service as any)._materialIconsLoaded.set(false);
    
    const icon = service.getIcon('home');
    expect(icon).toBe('🏠');
  });

  it('should return default fallback for unknown icons', () => {
    (service as any)._materialIconsLoaded.set(false);
    
    const icon = service.getIcon('unknown_icon_xyz');
    expect(icon).toBe('•');
  });

  it('should get icon info correctly', () => {
    const iconInfo = service.getIconInfo('home');
    
    expect(iconInfo).toBeTruthy();
    expect(iconInfo?.name).toBe('home');
    expect(iconInfo?.fallback).toBe('🏠');
    expect(iconInfo?.description).toBe('Inicio');
  });

  it('should check if icon has fallback', () => {
    expect(service.hasFallback('home')).toBe(true);
    expect(service.hasFallback('unknown_icon')).toBe(false);
  });

  it('should get all fallbacks', () => {
    const fallbacks = service.getAllFallbacks();
    
    expect(Array.isArray(fallbacks)).toBe(true);
    expect(fallbacks.length).toBeGreaterThan(0);
    expect(fallbacks[0].name).toBeDefined();
    expect(fallbacks[0].fallback).toBeDefined();
    expect(fallbacks[0].description).toBeDefined();
  });

  it('should add custom fallback', () => {
    const customFallback = {
      name: 'custom_icon',
      unicode: 'e999',
      fallback: '🎨',
      description: 'Custom Icon'
    };
    
    service.addFallback('custom_icon', customFallback);
    
    expect(service.hasFallback('custom_icon')).toBe(true);
    expect(service.getIconInfo('custom_icon')).toEqual(customFallback);
  });

  it('should remove fallback', () => {
    service.addFallback('temp_icon', {
      name: 'temp_icon',
      unicode: 'e999',
      fallback: '🔧',
      description: 'Temp Icon'
    });
    
    expect(service.hasFallback('temp_icon')).toBe(true);
    
    const removed = service.removeFallback('temp_icon');
    expect(removed).toBe(true);
    expect(service.hasFallback('temp_icon')).toBe(false);
  });

  it('should get icon status', () => {
    const status = service.getIconStatus();
    
    expect(status.loaded).toBeDefined();
    expect(status.fallbackMode).toBeDefined();
    expect(status.totalFallbacks).toBeDefined();
    expect(typeof status.loaded).toBe('boolean');
    expect(typeof status.fallbackMode).toBe('boolean');
    expect(typeof status.totalFallbacks).toBe('number');
  });

  it('should have common icons in fallback map', () => {
    const commonIcons = [
      'home', 'add', 'edit', 'delete', 'search', 'close',
      'check', 'warning', 'error', 'info', 'settings', 'person',
      'business', 'directions_car', 'route', 'description'
    ];
    
    commonIcons.forEach(iconName => {
      expect(service.hasFallback(iconName)).toBe(true);
    });
  });

  it('should return correct icon text for Material Icons mode', () => {
    (service as any)._materialIconsLoaded.set(true);
    
    const iconText = service.getIconText('home');
    expect(iconText).toBe('home');
  });

  it('should return correct icon text for fallback mode', () => {
    (service as any)._materialIconsLoaded.set(false);
    
    const iconText = service.getIconText('home');
    expect(iconText).toBe('🏠');
  });
});
