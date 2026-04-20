import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-gestionar-alias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatCheckboxModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1><mat-icon>label</mat-icon> Gestionar Alias</h1>
        <p>Crea y administra alias para localidades</p>
      </div>

      <mat-tab-group>
        <mat-tab label="Crear Alias">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title><mat-icon>add_circle</mat-icon> Crear Nuevo Alias</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="formularioAlias" (ngSubmit)="crearAlias()">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Localidad (escribe 3+ caracteres)</mat-label>
                      <input matInput 
                             formControlName="localidad_id"
                             [matAutocomplete]="auto"
                             placeholder="Buscar localidad..."
                             (input)="buscarLocalidades($event)"
                             #localidadInput>
                      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onLocalidadChange($event)">
                        @if (cargandoBusqueda()) {
                          <mat-option disabled>
                            <mat-spinner diameter="20"></mat-spinner>
                            Buscando...
                          </mat-option>
                        } @else if (localidadesBusqueda().length > 0) {
                          <mat-option *ngFor="let loc of localidadesBusqueda()" [value]="loc.id" [attr.data-nombre]="loc.nombre">
                            {{ loc.nombre }} ({{ loc.tipo }})
                          </mat-option>
                        } @else if (terminoBusqueda().length >= 3) {
                          <mat-option disabled>No se encontraron resultados</mat-option>
                        }
                      </mat-autocomplete>
                    </mat-form-field>
                  </div>

                  @if (localidadSeleccionada()) {
                    <div class="info-box">
                      <strong>UBIGEO:</strong> {{ localidadSeleccionada().ubigeo || 'N/A' }}<br>
                      <strong>Provincia:</strong> {{ localidadSeleccionada().provincia || 'N/A' }}<br>
                      <strong>Distrito:</strong> {{ localidadSeleccionada().distrito || 'N/A' }}
                    </div>
                  }

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Alias</mat-label>
                      <input matInput formControlName="alias" placeholder="Ej: PUNO CIUDAD">
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Notas (opcional)</mat-label>
                      <textarea matInput formControlName="notas" rows="3"></textarea>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-checkbox formControlName="verificado">Marcar como verificado</mat-checkbox>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="!formularioAlias.valid || cargando()">
                      <mat-icon>save</mat-icon> Crear Alias
                    </button>
                    <button mat-button type="button" (click)="limpiarFormulario()">
                      <mat-icon>clear</mat-icon> Limpiar
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Listar Alias">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title><mat-icon>list</mat-icon> Alias ({{ totalAlias() }})</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (cargando()) {
                  <div class="loading">
                    <mat-spinner diameter="40"></mat-spinner>
                    <p>Cargando...</p>
                  </div>
                } @else {
                  <table mat-table [dataSource]="alias()" class="alias-table">
                    <ng-container matColumnDef="alias">
                      <th mat-header-cell *matHeaderCellDef>Alias</th>
                      <td mat-cell *matCellDef="let e">{{ e.alias }}</td>
                    </ng-container>
                    <ng-container matColumnDef="localidad">
                      <th mat-header-cell *matHeaderCellDef>Localidad</th>
                      <td mat-cell *matCellDef="let e">{{ e.localidad_nombre }}</td>
                    </ng-container>
                    <ng-container matColumnDef="estado">
                      <th mat-header-cell *matHeaderCellDef>Estado</th>
                      <td mat-cell *matCellDef="let e">
                        <mat-chip [highlighted]="e.estaActivo" [color]="e.estaActivo ? 'accent' : ''" class="estado-chip">
                          {{ e.estaActivo ? 'Activo' : 'Inactivo' }}
                        </mat-chip>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let e">
                        <button mat-icon-button color="warn" (click)="eliminarAlias(e.id)" matTooltip="Eliminar">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="['alias', 'localidad', 'estado', 'acciones']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['alias', 'localidad', 'estado', 'acciones'];"></tr>
                  </table>
                  <mat-paginator [length]="totalAlias()" [pageSize]="pageSize" [pageSizeOptions]="[10, 25, 50]" (page)="onPageChange($event)"></mat-paginator>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .header { margin-bottom: 30px; }
    .header h1 { display: flex; align-items: center; gap: 12px; margin: 0 0 8px 0; font-size: 28px; font-weight: 500; }
    .header p { margin: 0; color: #666; }
    .tab-content { padding: 20px 0; }
    mat-card { margin-bottom: 20px; }
    mat-card-header { margin-bottom: 20px; }
    mat-card-title { display: flex; align-items: center; gap: 12px; margin: 0; font-size: 18px; }
    .form-row { margin-bottom: 16px; }
    .full-width { width: 100%; }
    .info-box { background: #e3f2fd; border-left: 4px solid #1976d2; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px; line-height: 1.6; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
    .form-actions button { display: flex; align-items: center; gap: 8px; }
    .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 16px; }
    .loading p { margin: 0; color: #666; }
    .alias-table { width: 100%; margin-top: 20px; }
    .alias-table th { background-color: #f5f5f5; font-weight: 600; }
    .alias-table td { padding: 12px; }
    .alias-table tr:hover { background-color: #fafafa; }
    mat-checkbox { display: block; margin-bottom: 16px; }
    .estado-chip { color: #fff !important; }
    .estado-chip.mat-mdc-chip.mat-accent { background-color: #4caf50 !important; }
    .estado-chip:not(.mat-accent) { background-color: #f44336 !important; }
  `]
})
export class GestionarAliasComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  alias = signal<any[]>([]);
  localidadesBusqueda = signal<any[]>([]);
  localidadSeleccionada = signal<any>(null);
  cargando = signal(false);
  cargandoBusqueda = signal(false);
  totalAlias = signal(0);
  terminoBusqueda = signal('');

  pageSize = 10;
  pageIndex = 0;
  formularioAlias: FormGroup;

  constructor() {
    this.formularioAlias = this.fb.group({
      localidad_id: ['', Validators.required],
      localidad_nombre: [''],
      alias: ['', [Validators.required, Validators.minLength(2)]],
      notas: [''],
      verificado: [false]
    });
  }

  ngOnInit() {
    this.cargarAlias();
  }

  async buscarLocalidades(event: any) {
    const termino = event.target.value || '';
    this.terminoBusqueda.set(termino);

    if (termino.length < 3) {
      this.localidadesBusqueda.set([]);
      return;
    }

    this.cargandoBusqueda.set(true);
    try {
      const response = await this.http.get<any>(
        `http://localhost:8000/api/v1/localidades?skip=0&limit=100&nombre=${encodeURIComponent(termino)}`
      ).toPromise();
      this.localidadesBusqueda.set(response || []);
    } catch (error) {
      console.error('Error buscando:', error);
      this.localidadesBusqueda.set([]);
    } finally {
      this.cargandoBusqueda.set(false);
    }
  }

  async cargarAlias() {
    this.cargando.set(true);
    try {
      const skip = this.pageIndex * this.pageSize;
      const response = await this.http.get<any>(
        `http://localhost:8000/api/v1/localidades-alias/?skip=${skip}&limit=${this.pageSize}`
      ).toPromise();
      this.alias.set(response || []);
      this.totalAlias.set(response?.length || 0);
    } catch (error) {
      console.error('Error cargando alias:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  async crearAlias() {
    if (!this.formularioAlias.valid) {
      this.mostrarMensaje('Completa los campos requeridos', 'error');
      return;
    }

    this.cargando.set(true);
    try {
      const datos = this.formularioAlias.value;
      await this.http.post('http://localhost:8000/api/v1/localidades-alias/', datos).toPromise();
      this.mostrarMensaje('✅ Alias creado', 'success');
      this.limpiarFormulario();
      await this.cargarAlias();
    } catch (error: any) {
      const msg = error.error?.detail || 'Error creando alias';
      this.mostrarMensaje(`❌ ${msg}`, 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  async eliminarAlias(aliasId: string) {
    if (!confirm('¿Eliminar este alias?')) return;

    try {
      await this.http.delete(`http://localhost:8000/api/v1/localidades-alias/${aliasId}`).toPromise();
      this.mostrarMensaje('✅ Alias eliminado', 'success');
      await this.cargarAlias();
    } catch (error: any) {
      const msg = error.error?.detail || 'Error eliminando';
      this.mostrarMensaje(`❌ ${msg}`, 'error');
    }
  }

  onLocalidadChange(event: any) {
    const localidadId = event.option.value;
    const localidad = this.localidadesBusqueda().find(l => l.id === localidadId);
    if (localidad) {
      this.localidadSeleccionada.set(localidad);
      this.formularioAlias.patchValue({
        localidad_id: localidad.id,
        localidad_nombre: localidad.nombre
      });
      // Mostrar el nombre en el input en lugar del ID
      setTimeout(() => {
        const input = document.querySelector('input[formControlName="localidad_id"]') as HTMLInputElement;
        if (input) {
          input.value = `${localidad.nombre} (${localidad.tipo})`;
        }
      }, 0);
      this.localidadesBusqueda.set([]);
    }
  }

  limpiarFormulario() {
    this.formularioAlias.reset();
    this.localidadSeleccionada.set(null);
    this.localidadesBusqueda.set([]);
    this.terminoBusqueda.set('');
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarAlias();
  }

  private mostrarMensaje(msg: string, tipo: 'success' | 'error' | 'info') {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}
