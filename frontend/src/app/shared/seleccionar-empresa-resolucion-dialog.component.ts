import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { EmpresaService } from '../services/empresa.service';
import { ResolucionService } from '../services/resolucion.service';
import { Empresa } from '../models/empresa.model';
import { Resolucion } from '../models/resolucion.model';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-seleccionar-empresa-resolucion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>business</mat-icon>
      Seleccionar Empresa y Resolución
    </h2>

    <mat-dialog-content>
      <p class="hint">Para crear una nueva ruta, primero selecciona la empresa y resolución</p>

      @if (cargando()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando empresas...</p>
        </div>
      } @else {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Buscar y seleccionar empresa</mat-label>
          <input matInput 
                 [formControl]="empresaControl"
                 [matAutocomplete]="autoEmpresa"
                 placeholder="Escribe RUC o razón social...">
          <mat-icon matSuffix>search</mat-icon>
          <mat-autocomplete #autoEmpresa="matAutocomplete" 
                           [displayWith]="displayEmpresa"
                           (optionSelected)="onEmpresaSeleccionada($event)">
            @for (empresa of empresasFiltradas$ | async; track empresa.id) {
              <mat-option [value]="empresa">
                <div class="empresa-option">
                  <strong>{{ empresa.ruc }}</strong>
                  <span>{{ getEmpresaNombre(empresa) }}</span>
                </div>
              </mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        @if (empresaSeleccionada) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Resolución</mat-label>
            <mat-select [(value)]="resolucionSeleccionada">
              @for (resolucion of resoluciones(); track resolucion.id) {
                <mat-option [value]="resolucion">
                  {{ resolucion.nroResolucion }} - {{ resolucion.tipoResolucion }}
                </mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>description</mat-icon>
          </mat-form-field>
        }

        @if (empresaSeleccionada && resoluciones().length === 0) {
          <div class="no-results">
            <mat-icon>warning</mat-icon>
            <p>Esta empresa no tiene resoluciones activas</p>
          </div>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button 
              color="primary" 
              (click)="continuar()"
              [disabled]="!puedeContinuar()">
        Continuar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1976d2;
    }

    mat-dialog-content {
      min-width: 500px;
      padding: 20px;
    }

    .hint {
      color: #666;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .empresa-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .empresa-option strong {
      font-size: 14px;
      color: #1976d2;
    }

    .empresa-option span {
      font-size: 12px;
      color: #666;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #666;
    }

    .loading p {
      margin-top: 16px;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: #fff3e0;
      border-radius: 4px;
      color: #f57c00;
    }

    .no-results mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }
  `]
})
export class SeleccionarEmpresaResolucionDialogComponent implements OnInit {
  empresas = signal<Empresa[]>([]);
  resoluciones = signal<Resolucion[]>([]);
  cargando = signal(true);
  
  empresaControl = new FormControl<string | Empresa>('');
  empresasFiltradas$!: Observable<Empresa[]>;
  
  empresaSeleccionada: Empresa | null = null;
  resolucionSeleccionada: Resolucion | null = null;

  constructor(
    private dialogRef: MatDialogRef<SeleccionarEmpresaResolucionDialogComponent>,
    private empresaService: EmpresaService,
    private resolucionService: ResolucionService
  ) {}

  ngOnInit() {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
        this.cargando.set(false);
        this.setupAutocomplete();
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.cargando.set(false);
      }
    });
  }

  setupAutocomplete() {
    this.empresasFiltradas$ = this.empresaControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const termino = typeof value === 'string' ? value : '';
        return this.filtrarEmpresas(termino);
      })
    );
  }

  filtrarEmpresas(termino: string): Empresa[] {
    if (!termino) {
      return this.empresas();
    }

    const busqueda = termino.toLowerCase().trim();
    return this.empresas().filter(empresa => {
      const ruc = empresa.ruc.toLowerCase();
      const razonSocial = this.getEmpresaNombre(empresa).toLowerCase();
      return ruc.includes(busqueda) || razonSocial.includes(busqueda);
    });
  }

  displayEmpresa = (empresa: Empresa | null): string => {
    if (!empresa) return '';
    return `${empresa.ruc} - ${this.getEmpresaNombre(empresa)}`;
  }

  onEmpresaSeleccionada(event: any) {
    this.empresaSeleccionada = event.option.value;
    this.onEmpresaChange();
  }

  onEmpresaChange() {
    if (this.empresaSeleccionada) {
      // Cargar resoluciones de la empresa desde el servicio
      this.resolucionService.getResolucionesPorEmpresa(this.empresaSeleccionada.id).subscribe({
        next: (resoluciones) => {
          this.resoluciones.set(resoluciones);
          this.resolucionSeleccionada = null;
        },
        error: (error) => {
          console.error('Error cargando resoluciones:', error);
          this.resoluciones.set([]);
          this.resolucionSeleccionada = null;
        }
      });
    }
  }

  getEmpresaNombre(empresa: Empresa): string {
    if (typeof empresa.razonSocial === 'string') {
      return empresa.razonSocial;
    } else if (empresa.razonSocial?.principal) {
      return empresa.razonSocial.principal;
    }
    return 'Sin nombre';
  }

  puedeContinuar(): boolean {
    return !!this.empresaSeleccionada && !!this.resolucionSeleccionada;
  }

  continuar() {
    if (this.puedeContinuar()) {
      this.dialogRef.close({
        empresa: this.empresaSeleccionada,
        resolucion: this.resolucionSeleccionada
      });
    }
  }
}
