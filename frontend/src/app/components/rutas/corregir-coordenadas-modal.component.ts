import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LocalidadService } from '../../services/localidad.service';
import { RutaService } from '../../services/ruta.service';
import { Localidad } from '../../models/localidad.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface CorregirCoordenadasData {
  ruta_id: string;
  codigo_ruta: string;
  origen: { id: string; nombre: string; tiene_coordenadas: boolean };
  destino: { id: string; nombre: string; tiene_coordenadas: boolean };
  itinerario_sin_coordenadas: Array<{ id: string; nombre: string; orden: number }>;
}

interface LocalidadProblematica {
  id: string;
  nombre: string;
  tipo: 'origen' | 'destino' | 'itinerario';
  orden?: number;
}

@Component({
  selector: 'app-corregir-coordenadas-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit_location</mat-icon>
      Corregir Coordenadas - {{ data.codigo_ruta }}
    </h2>

    <mat-dialog-content>
      <mat-tab-group>
        <!-- Tab 1: Asignar Coordenadas -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>add_location</mat-icon>
            Asignar Coordenadas
          </ng-template>
          
          <div class="tab-content">
            <div class="info-section">
              <mat-icon class="info-icon">info</mat-icon>
              <p>Selecciona la localidad sin coordenadas y busca una localidad del sistema para reemplazarla.</p>
            </div>

            <form [formGroup]="coordenadasForm" class="form-container">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Localidad a reemplazar</mat-label>
                <mat-select formControlName="localidadProblematica" (selectionChange)="onLocalidadProblematicaSeleccionada($event.value)">
                  @if (!data.origen.tiene_coordenadas) {
                    <mat-option [value]="{id: data.origen.id, nombre: data.origen.nombre, tipo: 'origen'}">
                      <span class="localidad-option">
                        <mat-icon>place</mat-icon>
                        {{ data.origen.nombre }} (Origen)
                      </span>
                    </mat-option>
                  }
                  @if (!data.destino.tiene_coordenadas) {
                    <mat-option [value]="{id: data.destino.id, nombre: data.destino.nombre, tipo: 'destino'}">
                      <span class="localidad-option">
                        <mat-icon>place</mat-icon>
                        {{ data.destino.nombre }} (Destino)
                      </span>
                    </mat-option>
                  }
                  @for (parada of data.itinerario_sin_coordenadas; track parada.id) {
                    <mat-option [value]="{id: parada.id, nombre: parada.nombre, tipo: 'itinerario', orden: parada.orden}">
                      <span class="localidad-option">
                        <mat-icon>location_on</mat-icon>
                        {{ parada.nombre }} (Parada {{ parada.orden }})
                      </span>
                    </mat-option>
                  }
                </mat-select>
                <mat-error>Selecciona una localidad</mat-error>
              </mat-form-field>

              @if (localidadProblematicaSeleccionada()) {
                <div class="buscar-localidad-section">
                  <h4>
                    <mat-icon>search</mat-icon>
                    Buscar localidad de reemplazo
                  </h4>
                  <p class="help-text">
                    Busca una localidad que tenga coordenadas para reemplazar 
                    "<strong>{{ localidadProblematicaSeleccionada()!.nombre }}</strong>"
                  </p>
                  
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Buscar localidad</mat-label>
                    <input matInput 
                           type="text"
                           formControlName="busquedaLocalidad"
                           [matAutocomplete]="autoLocalidad"
                           placeholder="Escribe el nombre de la localidad...">
                    <mat-icon matPrefix>search</mat-icon>
                    @if (buscandoLocalidades()) {
                      <mat-spinner matSuffix diameter="20"></mat-spinner>
                    }
                  </mat-form-field>

                  <mat-autocomplete #autoLocalidad="matAutocomplete" 
                                    [displayWith]="displayLocalidad"
                                    (optionSelected)="onLocalidadReemplazoSeleccionada($event.option.value)">
                    @for (localidad of localidadesBuscadas(); track localidad.id) {
                      <mat-option [value]="localidad">
                        <div class="localidad-autocomplete-option">
                          <div class="localidad-nombre">
                            <mat-icon>place</mat-icon>
                            {{ localidad.nombre }}
                          </div>
                          <div class="localidad-detalles">
                            <span class="tipo-badge">{{ localidad.tipo }}</span>
                            @if (localidad.provincia || localidad.distrito) {
                              <span class="ubicacion">
                                @if (localidad.distrito) {
                                  {{ localidad.distrito }}
                                }
                                @if (localidad.provincia && localidad.distrito) {
                                  /
                                }
                                @if (localidad.provincia) {
                                  {{ localidad.provincia }}
                                }
                              </span>
                            }
                            @if (localidad.coordenadas) {
                              <mat-icon class="coords-icon">check_circle</mat-icon>
                              <span class="coords-text">Con coordenadas</span>
                            } @else {
                              <mat-icon class="no-coords-icon">cancel</mat-icon>
                              <span class="no-coords-text">Sin coordenadas</span>
                            }
                          </div>
                        </div>
                      </mat-option>
                    }
                  </mat-autocomplete>

                  @if (localidadReemplazo()) {
                    <div class="localidad-referencia">
                      <div class="referencia-header">
                        <mat-icon>swap_horiz</mat-icon>
                        <strong>Reemplazar con:</strong>
                      </div>
                      <div class="referencia-info">
                        <div class="info-item">
                          <span class="label">Nombre:</span>
                          <span class="value">{{ localidadReemplazo()!.nombre }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">Tipo:</span>
                          <span class="value">{{ localidadReemplazo()!.tipo }}</span>
                        </div>
                        @if (localidadReemplazo()!.departamento) {
                          <div class="info-item">
                            <span class="label">Ubicación:</span>
                            <span class="value">
                              {{ localidadReemplazo()!.departamento }}
                              @if (localidadReemplazo()!.provincia) {
                                / {{ localidadReemplazo()!.provincia }}
                              }
                            </span>
                          </div>
                        }
                        @if (localidadReemplazo()!.coordenadas) {
                          <div class="info-item">
                            <span class="label">Coordenadas:</span>
                            <span class="value coords">
                              {{ localidadReemplazo()!.coordenadas!.latitud | number:'1.6-6' }}, 
                              {{ localidadReemplazo()!.coordenadas!.longitud | number:'1.6-6' }}
                            </span>
                          </div>
                        } @else {
                          <div class="warning-no-coords">
                            <mat-icon>warning</mat-icon>
                            Esta localidad tampoco tiene coordenadas
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </form>
          </div>
        </mat-tab>

        <!-- Tab 2: Desactivar Ruta -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>block</mat-icon>
            Desactivar Ruta
          </ng-template>
          
          <div class="tab-content">
            <div class="warning-section">
              <mat-icon class="warning-icon">warning</mat-icon>
              <div>
                <h3>¿Desactivar esta ruta?</h3>
                <p>Si no puedes reemplazar las localidades ahora, puedes desactivar temporalmente esta ruta.</p>
                <p><strong>La ruta cambiará a estado INACTIVA</strong> y no aparecerá en las búsquedas de rutas activas.</p>
              </div>
            </div>

            <div class="ruta-info">
              <div class="info-row">
                <span class="label">Código:</span>
                <span class="value">{{ data.codigo_ruta }}</span>
              </div>
              <div class="info-row">
                <span class="label">Ruta:</span>
                <span class="value">{{ data.origen.nombre }} - {{ data.destino.nombre }}</span>
              </div>
              <div class="info-row">
                <span class="label">Localidades sin coordenadas:</span>
                <div class="chips-container">
                  @if (!data.origen.tiene_coordenadas) {
                    <mat-chip class="problema-chip">{{ data.origen.nombre }}</mat-chip>
                  }
                  @if (!data.destino.tiene_coordenadas) {
                    <mat-chip class="problema-chip">{{ data.destino.nombre }}</mat-chip>
                  }
                  @for (parada of data.itinerario_sin_coordenadas; track parada.id) {
                    <mat-chip class="problema-chip">{{ parada.nombre }}</mat-chip>
                  }
                </div>
              </div>
            </div>

            <div class="info-box">
              <mat-icon>info</mat-icon>
              <div>
                <strong>Nota:</strong> Podrás reactivar esta ruta más tarde desde el módulo de rutas 
                una vez que las localidades tengan coordenadas.
              </div>
            </div>

            <div class="accion-desactivar">
              <button mat-raised-button color="warn" (click)="desactivarRuta()" [disabled]="procesando()">
                <mat-icon>block</mat-icon>
                Desactivar Ruta
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="procesando()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="reemplazarLocalidad()" 
              [disabled]="!localidadReemplazo() || !localidadReemplazo()!.coordenadas || procesando()">
        <mat-icon>swap_horiz</mat-icon>
        Reemplazar Localidad
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 600px;
      max-width: 700px;
      padding: 0;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1976d2;
      margin: 0;
    }

    .tab-content {
      padding: 24px;
      min-height: 400px;
    }

    .info-section {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .info-icon {
      color: #1976d2;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-section p {
      margin: 0;
      color: #1565c0;
    }

    .warning-section {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #fff3e0;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .warning-icon {
      color: #f57c00;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .warning-section h3 {
      margin: 0 0 8px 0;
      color: #e65100;
    }

    .warning-section p {
      margin: 0;
      color: #ef6c00;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .localidad-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .localidad-option mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #666;
    }

    .coordenadas-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .ayuda-coordenadas {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .ayuda-coordenadas mat-icon {
      color: #2196f3;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .ayuda-coordenadas strong {
      display: block;
      margin-bottom: 8px;
      color: #1976d2;
    }

    .ayuda-coordenadas ul {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }

    .ayuda-coordenadas li {
      margin-bottom: 4px;
      font-size: 14px;
    }

    .ruta-info {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .info-row {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      align-items: flex-start;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: 600;
      color: #666;
      min-width: 200px;
    }

    .value {
      color: #333;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .problema-chip {
      background: #ffebee !important;
      color: #c62828 !important;
      font-size: 12px;
      height: 28px;
    }

    .accion-desactivar {
      display: flex;
      justify-content: center;
      padding: 24px 0;
    }

    .accion-desactivar button {
      padding: 12px 32px;
    }

    .buscar-localidad-section {
      margin: 24px 0;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .buscar-localidad-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 16px;
    }

    .help-text {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 14px;
    }

    .localidad-autocomplete-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 0;
    }

    .localidad-nombre {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .localidad-nombre mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #666;
    }

    .localidad-detalles {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
      margin-left: 26px;
    }

    .tipo-badge {
      padding: 2px 8px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .coords-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #4caf50;
    }

    .coords-text {
      font-family: monospace;
      font-size: 11px;
    }

    .localidad-referencia {
      margin-top: 16px;
      padding: 16px;
      background: white;
      border: 2px solid #4caf50;
      border-radius: 8px;
    }

    .referencia-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #2e7d32;
    }

    .referencia-header mat-icon {
      color: #4caf50;
    }

    .referencia-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }

    .info-item {
      display: flex;
      gap: 8px;
    }

    .info-item .label {
      font-weight: 600;
      color: #666;
      min-width: 100px;
    }

    .info-item .value {
      color: #333;
    }

    .info-item .value.coords {
      font-family: monospace;
      color: #1976d2;
    }

    .copiar-btn {
      width: 100%;
    }

    .no-coords-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #f44336;
    }

    .no-coords-text {
      color: #f44336;
    }

    .ubicacion {
      color: #666;
      font-size: 11px;
    }

    .warning-no-coords {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #fff3e0;
      border-radius: 4px;
      color: #e65100;
      font-size: 13px;
    }

    .warning-no-coords mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .info-box {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 24px;
      border-left: 4px solid #2196f3;
    }

    .info-box mat-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .info-box div {
      flex: 1;
      font-size: 14px;
      color: #1565c0;
    }

    .info-box strong {
      color: #0d47a1;
    }

    mat-divider {
      margin: 24px 0;
    }
  `]
})
export class CorregirCoordenadasModalComponent {
  coordenadasForm: FormGroup;
  localidadProblematicaSeleccionada = signal<LocalidadProblematica | null>(null);
  localidadReemplazo = signal<Localidad | null>(null);
  localidadesBuscadas = signal<Localidad[]>([]);
  buscandoLocalidades = signal(false);
  procesando = signal(false);

  constructor(
    public dialogRef: MatDialogRef<CorregirCoordenadasModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CorregirCoordenadasData,
    private fb: FormBuilder,
    private localidadService: LocalidadService,
    private rutaService: RutaService
  ) {
    this.coordenadasForm = this.fb.group({
      localidadProblematica: [null, Validators.required],
      busquedaLocalidad: ['']
    });

    // Configurar búsqueda de localidades
    this.coordenadasForm.get('busquedaLocalidad')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(termino => {
          if (!termino || termino.length < 2) {
            return of([]);
          }
          this.buscandoLocalidades.set(true);
          return this.localidadService.buscarLocalidades(termino, 20);
        })
      )
      .subscribe(localidades => {
        // Filtrar solo localidades con coordenadas
        const conCoordenadas = localidades.filter(l => 
          l.coordenadas && 
          l.coordenadas.latitud && 
          l.coordenadas.longitud
        );
        this.localidadesBuscadas.set(conCoordenadas);
        this.buscandoLocalidades.set(false);
      });
  }

  onLocalidadProblematicaSeleccionada(localidad: LocalidadProblematica) {
    this.localidadProblematicaSeleccionada.set(localidad);
    this.localidadReemplazo.set(null);
    this.coordenadasForm.patchValue({ busquedaLocalidad: '' });
  }

  displayLocalidad(localidad: Localidad | null): string {
    return ''; // Siempre retornar vacío para que no muestre [Object Object]
  }

  onLocalidadReemplazoSeleccionada(localidad: Localidad) {
    if (!localidad.coordenadas) {
      alert('Esta localidad no tiene coordenadas. Por favor selecciona otra.');
      return;
    }
    this.localidadReemplazo.set(localidad);
    // Limpiar el campo de búsqueda
    this.coordenadasForm.patchValue({ busquedaLocalidad: '' });
  }

  async reemplazarLocalidad() {
    const problematica = this.localidadProblematicaSeleccionada();
    const reemplazo = this.localidadReemplazo();

    if (!problematica || !reemplazo || !reemplazo.coordenadas) {
      alert('Debes seleccionar ambas localidades');
      return;
    }

    const confirmacion = confirm(
      `¿Reemplazar "${problematica.nombre}" con "${reemplazo.nombre}"?\n\n` +
      `Esto actualizará la ruta para usar la nueva localidad con coordenadas.`
    );

    if (!confirmacion) return;

    this.procesando.set(true);
    try {
      // Obtener la ruta completa
      const ruta = await this.rutaService.getRutaById(this.data.ruta_id).toPromise();
      
      if (!ruta) {
        throw new Error('No se pudo obtener la ruta');
      }

      // Preparar actualización según el tipo
      const updateData: any = {};

      if (problematica.tipo === 'origen') {
        updateData.origen = {
          id: reemplazo.id,
          nombre: reemplazo.nombre,
          tipo: reemplazo.tipo,
          ubigeo: reemplazo.ubigeo,
          departamento: reemplazo.departamento,
          provincia: reemplazo.provincia,
          distrito: reemplazo.distrito,
          coordenadas: reemplazo.coordenadas
        };
      } else if (problematica.tipo === 'destino') {
        updateData.destino = {
          id: reemplazo.id,
          nombre: reemplazo.nombre,
          tipo: reemplazo.tipo,
          ubigeo: reemplazo.ubigeo,
          departamento: reemplazo.departamento,
          provincia: reemplazo.provincia,
          distrito: reemplazo.distrito,
          coordenadas: reemplazo.coordenadas
        };
      } else if (problematica.tipo === 'itinerario' && problematica.orden !== undefined) {
        // Actualizar itinerario
        const itinerario = [...(ruta.itinerario || [])];
        const index = itinerario.findIndex(p => p.orden === problematica.orden);
        
        if (index !== -1) {
          itinerario[index] = {
            id: reemplazo.id,
            nombre: reemplazo.nombre,
            tipo: reemplazo.tipo,
            ubigeo: reemplazo.ubigeo,
            departamento: reemplazo.departamento,
            provincia: reemplazo.provincia,
            distrito: reemplazo.distrito,
            coordenadas: reemplazo.coordenadas,
            orden: problematica.orden
          };
          updateData.itinerario = itinerario;
        }
      }

      // Actualizar la ruta
      await this.rutaService.updateRuta(this.data.ruta_id, updateData).toPromise();

      this.dialogRef.close({ 
        action: 'localidad_reemplazada', 
        rutaId: this.data.ruta_id,
        tipo: problematica.tipo
      });
    } catch (error) {
      console.error('Error reemplazando localidad:', error);
      alert('Error al reemplazar la localidad');
    } finally {
      this.procesando.set(false);
    }
  }

  async desactivarRuta() {
    const confirmacion = confirm(
      '¿Estás seguro de desactivar esta ruta?\n\n' +
      'La ruta cambiará a estado INACTIVA y no aparecerá en las búsquedas activas.'
    );
    
    if (!confirmacion) return;

    this.procesando.set(true);
    try {
      console.log('🔄 Desactivando ruta:', this.data.ruta_id);
      console.log('📤 Datos a enviar:', { estaActivo: false, estado: 'INACTIVA' });
      
      const resultado = await this.rutaService.updateRuta(this.data.ruta_id, {
        estaActivo: false,
        estado: 'INACTIVA'
      }).toPromise();
      
      console.log('✅ Ruta desactivada:', resultado);

      this.dialogRef.close({ action: 'ruta_desactivada', rutaId: this.data.ruta_id });
    } catch (error) {
      console.error('❌ Error desactivando ruta:', error);
      alert('Error al desactivar la ruta: ' + (error as any)?.error?.detail || (error as any)?.message);
    } finally {
      this.procesando.set(false);
    }
  }
}
