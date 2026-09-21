import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentroTramites } from './centro-tramites';

describe('CentroTramites', () => {
  let component: CentroTramites;
  let fixture: ComponentFixture<CentroTramites>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentroTramites]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CentroTramites);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
