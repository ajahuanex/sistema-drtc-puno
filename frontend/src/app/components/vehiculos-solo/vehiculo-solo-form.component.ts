import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { VehiculoSoloService } from '../../services/vehiculo-solo.service';
import { ConfiguracionService } from '../../services/configuracion.service';
import { placaValidator, formatearPlaca } from '../../validators/placa.validator';
import { vinValidator, decodificarVIN, VINInfo } from '../../validators/vin.validator';

@Component({
  selector: 'app-vehiculo-solo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>{{ esEdicion() ? 'edit' : 'add' }}</mat-icon>
            {{ esEdicion() ? 'Editar' : 'Nuevo' }} Vehículo - Datos Técnicos
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          @if (loading()) {
            <div class="loading">
              <mat-spinner></mat-spinner>
              <p>{{ esEdicion() ? 'Cargando...' : 'Guardando...' }}</p>
            </div>
          } @else {
            <form [formGroup]="form">
              <!-- Identificación -->
              <h3 class="section-title">Identificación</h3>
              <div class="form-grid">
                <mat-form-field appearance="outline" [class.campo-valido]="placaValida()">
                  <mat-label>Placa *</mat-label>
                  <input matInput 
                         formControlName="placaActual" 
                         placeholder="Ej: ABC123"
                         (input)="onPlacaInput($event)"
                         maxlength="9">
                  <mat-icon matPrefix>badge</mat-icon>
                  @if (placaValida()) {
                    <mat-icon matSuffix class="icono-valido">check_circle</mat-icon>
                  }
                  <mat-hint>
                    @if (vistaPrevia()) {
                      Vista previa: <strong>{{ vistaPrevia() }}</strong>
                    } @else if (form.get('placaActual')?.touched && form.get('placaActual')?.hasError('placaInvalida')) {
                      <span class="hint-error">⚠️ Formato inválido: debe tener mínimo 3 letras + 3 números</span>
                    } @else {
                      Mínimo 3 letras + 3 números (Ej: ABC123)
                    }
                  </mat-hint>
                  @if (form.get('placaActual')?.touched && form.get('placaActual')?.hasError('required')) {
                    <mat-error>La placa es requerida</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" [class.campo-valido]="vinValido()">
                  <mat-label>VIN / Número de Serie</mat-label>
                  <input matInput 
                         formControlName="vin"
                         placeholder="17 caracteres"
                         (input)="onVinInput($event)"
                         maxlength="17">
                  @if (vinValido()) {
                    <mat-icon matSuffix class="icono-valido">check_circle</mat-icon>
                  }
                  <mat-hint>
                    @if (vinInfo().valido && vinInfo().pais) {
                      <strong>{{ vinInfo().fabricante }}</strong> - {{ vinInfo().pais }}
                      @if (vinInfo().anio && vinInfo().anioAlternativo) {
                        <span class="anios-posibles">({{ vinInfo().anio }} o {{ vinInfo().anioAlternativo }})</span>
                      }
                    } @else {
                      17 caracteres alfanuméricos (sin I, O, Q)
                    }
                  </mat-hint>
                  @if (form.get('vin')?.touched && form.get('vin')?.hasError('vinInvalido')) {
                    <mat-error>{{ form.get('vin')?.errors?.['vinInvalido']?.message }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Número de Motor</mat-label>
                  <input matInput formControlName="numeroMotor">
                </mat-form-field>
              </div>

              <!-- Datos Técnicos -->
              <h3 class="section-title">Datos Técnicos</h3>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Marca</mat-label>
                  <input matInput formControlName="marca">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Modelo</mat-label>
                  <input matInput formControlName="modelo">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Año de Fabricación</mat-label>
                  <input matInput 
                         type="number" 
                         formControlName="anioFabricacion"
                         (input)="validarAnioConVIN()">
                  @if (advertenciaAnio()) {
                    <mat-hint class="advertencia-anio">{{ advertenciaAnio() }}</mat-hint>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Color</mat-label>
                  <input matInput formControlName="color">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Categoría</mat-label>
                  <mat-select formControlName="categoria">
                    <mat-option value="">-- Seleccionar --</mat-option>
                    @for (categoria of categoriasVehiculos(); track categoria) {
                      <mat-option [value]="categoria">{{ categoria }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>Categoría del vehículo según normativa</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Carrocería</mat-label>
                  <mat-select formControlName="carroceria">
                    <mat-option value="">-- Seleccionar --</mat-option>
                    @for (carroceria of tiposCarroceria(); track carroceria) {
                      <mat-option [value]="carroceria">{{ carroceria }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Combustible</mat-label>
                  <mat-select formControlName="combustible">
                    <mat-option value="">-- Seleccionar --</mat-option>
                    @for (combustible of tiposCombustible(); track combustible) {
                      <mat-option [value]="combustible">{{ combustible }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Capacidades -->
              <h3 class="section-title">Capacidades y Motor</h3>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Número de Pasajeros</mat-label>
                  <input matInput type="number" formControlName="numeroPasajeros">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Número de Asientos</mat-label>
                  <input matInput type="number" formControlName="numeroAsientos">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Número de Cilindros</mat-label>
                  <input matInput type="number" formControlName="cilindrada">
                  <mat-hint>Cantidad de cilindros del motor (ej: 4, 6, 8)</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Número de Ejes</mat-label>
                  <input matInput type="number" formControlName="numeroEjes">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Número de Ruedas</mat-label>
                  <input matInput type="number" formControlName="numeroRuedas">
                </mat-form-field>
              </div>

              <!-- Pesos y Dimensiones -->
              <h3 class="section-title">Pesos y Dimensiones</h3>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Peso Bruto (kg)</mat-label>
                  <input matInput type="number" formControlName="pesoBruto" step="0.01">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Peso Neto (kg)</mat-label>
                  <input matInput type="number" formControlName="pesoSeco" step="0.01">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Carga Útil (kg)</mat-label>
                  <input matInput type="number" formControlName="cargaUtil" step="0.01">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Largo (m)</mat-label>
                  <input matInput type="number" formControlName="longitud" step="0.01">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Ancho (m)</mat-label>
                  <input matInput type="number" formControlName="ancho" step="0.01">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Alto (m)</mat-label>
                  <input matInput type="number" formControlName="altura" step="0.01">
                </mat-form-field>
              </div>

              <!-- Observaciones -->
              <h3 class="section-title">Observaciones</h3>
              <div class="form-grid">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Observaciones</mat-label>
                  <textarea matInput formControlName="observaciones" rows="3"></textarea>
                </mat-form-field>
              </div>

              <div class="actions">
                <button mat-button type="button" (click)="cancelar()">
                  <mat-icon>cancel</mat-icon>
                  Cancelar
                </button>
                <button mat-raised-button color="primary" type="button" 
                        (click)="guardar()" [disabled]="!form.valid || loading()">
                  <mat-icon>save</mat-icon>
                  {{ esEdicion() ? 'Actualizar' : 'Guardar' }}
                </button>
              </div>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 20px;
    }

    .section-title {
      color: #1976d2;
      margin: 30px 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #1976d2;
      font-size: 1.1em;
    }

    .section-title:first-of-type {
      margin-top: 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .campo-valido {
      ::ng-deep .mat-mdc-form-field-focus-overlay {
        background-color: rgba(76, 175, 80, 0.1);
      }
      
      ::ng-deep .mat-mdc-text-field-wrapper {
        background-color: rgba(76, 175, 80, 0.05);
      }
      
      ::ng-deep .mdc-notched-outline__leading,
      ::ng-deep .mdc-notched-outline__notch,
      ::ng-deep .mdc-notched-outline__trailing {
        border-color: #4caf50 !important;
      }
    }

    .icono-valido {
      color: #4caf50;
      animation: aparecer 0.3s ease;
    }

    @keyframes aparecer {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .advertencia-anio {
      color: #ff9800 !important;
      font-weight: 500;
      font-size: 0.9em;
    }

    .hint-error {
      color: #f44336;
      font-weight: 500;
    }

    .anios-posibles {
      color: #2196f3;
      font-weight: 600;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class VehiculoSoloFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoSoloService);
  private snackBar = inject(MatSnackBar);
  private configuracionService = inject(ConfiguracionService);

  loading = signal<boolean>(false);
  esEdicion = signal<boolean>(false);
  vehiculoId = signal<string | null>(null);
  placaValida = signal<boolean>(false);
  vistaPrevia = signal<string>('');
  vinInfo = signal<VINInfo>({ pais: '', fabricante: '', anio: null, anioAlternativo: null, valido: false });
  vinValido = signal<boolean>(false);
  advertenciaAnio = signal<string>('');

  // Configuraciones desde el servicio
  tiposCombustible = this.configuracionService.tiposCombustible;
  combustibleDefault = this.configuracionService.tipoCombustibleDefault;
  categoriasVehiculos = this.configuracionService.categoriasVehiculos;
  categoriaDefault = this.configuracionService.categoriaVehiculoDefault;
  tiposCarroceria = this.configuracionService.tiposCarroceria;
  carroceriaDefault = this.configuracionService.tipoCarroceriaDefault;

  form!: FormGroup;

  ngOnInit(): void {
    console.log('🚀 VehiculoSoloFormComponent - ngOnInit iniciado');
    
    this.form = this.fb.group({
      // Identificación
      placaActual: ['', [Validators.required, placaValidator()]],
      vin: ['', [vinValidator()]],
      numeroMotor: [''],
      
      // Datos Técnicos
      marca: [''],
      modelo: [''],
      anioFabricacion: [null],
      color: [''],
      categoria: [this.categoriaDefault()], // Valor por defecto desde configuración
      carroceria: [this.carroceriaDefault()], // Valor por defecto desde configuración
      combustible: [this.combustibleDefault()], // Valor por defecto desde configuración
      
      // Capacidades y Motor
      numeroAsientos: [null],
      numeroPasajeros: [null],
      cilindrada: [null], // Número de cilindros del motor (4, 6, 8, etc.)
      numeroEjes: [null],
      numeroRuedas: [null],
      
      // Pesos y Dimensiones
      pesoBruto: [null],
      pesoSeco: [null],
      cargaUtil: [null],
      longitud: [null],
      ancho: [null],
      altura: [null],
      
      // Observaciones
      observaciones: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    console.log('🔑 ID obtenido de la ruta:', id);
    
    if (id) {
      console.log('✅ Modo edición activado');
      this.esEdicion.set(true);
      this.vehiculoId.set(id);
      this.cargarVehiculo(id);
    } else {
      console.log('✅ Modo creación activado');
    }

    // Suscribirse a cambios en año de fabricación para validar con VIN
    this.form.get('anioFabricacion')?.valueChanges.subscribe(() => {
      this.validarAnioConVIN();
    });
  }

  formatearPlacaInput(): void {
    const placaControl = this.form.get('placaActual');
    if (placaControl && placaControl.value) {
      const placaFormateada = formatearPlaca(placaControl.value);
      placaControl.setValue(placaFormateada, { emitEvent: false });
    }
  }

  onPlacaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase();
    
    // Remover caracteres no permitidos (solo letras, números)
    value = value.replace(/[^A-Z0-9]/g, '');
    
    // Guardar posición del cursor
    const cursorPos = input.selectionStart || 0;
    
    let formattedValue = '';
    let isValid = false;
    
    // Si tiene más de 3 caracteres, intentar formatear
    if (value.length > 3) {
      // Buscar los últimos 3 dígitos
      const match = value.match(/^([A-Z0-9]+?)(\d{3})$/);
      
      if (match && match[1].length >= 3) {
        // Formato válido: parte alfanumérica (min 3) + 3 dígitos
        formattedValue = `${match[1]}-${match[2]}`;
        isValid = true;
        this.vistaPrevia.set(formattedValue);
      } else {
        // Aún no tiene el formato completo, dejar sin guión
        formattedValue = value;
        this.vistaPrevia.set('');
      }
    } else {
      formattedValue = value;
      this.vistaPrevia.set('');
    }
    
    // Actualizar estado de validez
    this.placaValida.set(isValid);
    
    // Actualizar el valor
    const placaControl = this.form.get('placaActual');
    if (placaControl) {
      placaControl.setValue(formattedValue, { emitEvent: false });
      
      // Ajustar posición del cursor
      setTimeout(() => {
        const newLength = formattedValue.length;
        const oldLength = value.length;
        
        // Si se agregó el guión, ajustar cursor
        if (newLength > oldLength && cursorPos >= newLength - 3) {
          input.setSelectionRange(cursorPos + 1, cursorPos + 1);
        } else {
          input.setSelectionRange(cursorPos, cursorPos);
        }
      }, 0);
    }
  }

  onVinInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.toUpperCase();
    
    // Remover caracteres no permitidos y caracteres confusos (I, O, Q)
    value = value.replace(/[^A-HJ-NPR-Z0-9]/g, '');
    
    // Limitar a 17 caracteres
    if (value.length > 17) {
      value = value.substring(0, 17);
    }
    
    // Actualizar el valor
    const vinControl = this.form.get('vin');
    if (vinControl) {
      vinControl.setValue(value, { emitEvent: false });
    }
    
    // Decodificar VIN si tiene 17 caracteres
    if (value.length === 17) {
      const info = decodificarVIN(value);
      this.vinInfo.set(info);
      this.vinValido.set(true);
      this.validarAnioConVIN();
    } else {
      this.vinInfo.set({ pais: '', fabricante: '', anio: null, anioAlternativo: null, valido: false });
      this.vinValido.set(false);
      this.advertenciaAnio.set('');
    }
  }

  validarAnioConVIN(): void {
    const anioFabricacion = this.form.get('anioFabricacion')?.value;
    const anioVIN = this.vinInfo().anio;
    const anioAlternativo = this.vinInfo().anioAlternativo;
    
    if (!anioFabricacion || !anioVIN) {
      this.advertenciaAnio.set('');
      this.removerObservacionAnio();
      return;
    }
    
    // Verificar si coincide con alguno de los dos años posibles
    const coincideAnio1 = anioFabricacion === anioVIN;
    const coincideAnio2 = anioAlternativo && anioFabricacion === anioAlternativo;
    
    if (coincideAnio1 || coincideAnio2) {
      // Coincide con uno de los años posibles
      this.advertenciaAnio.set('');
      this.removerObservacionAnio();
    } else {
      // No coincide con ninguno de los años posibles
      const diferencia1 = Math.abs(anioFabricacion - anioVIN);
      const diferencia2 = anioAlternativo ? Math.abs(anioFabricacion - anioAlternativo) : 999;
      const menorDiferencia = Math.min(diferencia1, diferencia2);
      
      this.advertenciaAnio.set(
        `⚠️ El año ingresado (${anioFabricacion}) no coincide con los años posibles del VIN según ISO 3779: ${anioVIN} o ${anioAlternativo}. Diferencia mínima: ${menorDiferencia} año${menorDiferencia > 1 ? 's' : ''}.`
      );
      this.agregarObservacionAnio(anioFabricacion, anioVIN, anioAlternativo);
    }
  }

  agregarObservacionAnio(anioFabricacion: number, anioVIN: number, anioAlternativo: number | null): void {
    const observacionesControl = this.form.get('observaciones');
    if (!observacionesControl) return;
    
    const observacionActual = observacionesControl.value || '';
    const marcador = '[VALIDACIÓN AUTOMÁTICA - AÑO VIN]';
    
    // Remover observación anterior si existe
    let nuevaObservacion = observacionActual.replace(new RegExp(`${marcador}[^\\[]*`, 'g'), '').trim();
    
    // Agregar nueva observación con ambos años posibles
    const aniosPosibles = anioAlternativo 
      ? `${anioVIN} o ${anioAlternativo}` 
      : `${anioVIN}`;
    
    const textoValidacion = `${marcador} REVISAR: Año de fabricación ingresado (${anioFabricacion}) NO coincide con los años posibles según VIN ISO 3779 (${aniosPosibles}). Verificar tarjeta de propiedad y documentación del vehículo para confirmar el año correcto.\n\n`;
    
    nuevaObservacion = textoValidacion + nuevaObservacion;
    observacionesControl.setValue(nuevaObservacion.trim());
  }

  removerObservacionAnio(): void {
    const observacionesControl = this.form.get('observaciones');
    if (!observacionesControl) return;
    
    const observacionActual = observacionesControl.value || '';
    const marcador = '[VALIDACIÓN AUTOMÁTICA - AÑO VIN]';
    
    // Remover observación de validación
    const nuevaObservacion = observacionActual.replace(new RegExp(`${marcador}[^\\[]*`, 'g'), '').trim();
    observacionesControl.setValue(nuevaObservacion);
  }

  cargarVehiculo(id: string): void {
    console.log('📥 Iniciando carga de vehículo con ID:', id);
    this.loading.set(true);
    
    this.vehiculoService.obtenerVehiculoPorId(id).subscribe({
      next: (vehiculo: any) => {
        console.log('✅ Vehículo cargado exitosamente:', vehiculo);
        
        // Mapear campos de snake_case (backend) a camelCase (formulario)
        const vehiculoMapeado = {
          placaActual: vehiculo.placa_actual,
          vin: vehiculo.vin,
          numeroMotor: vehiculo.numero_motor,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          anioFabricacion: vehiculo.anio_fabricacion,
          color: vehiculo.color,
          categoria: vehiculo.categoria,
          carroceria: vehiculo.tipo_carroceria || vehiculo.carroceria,
          combustible: vehiculo.combustible,
          numeroAsientos: vehiculo.numero_asientos,
          numeroPasajeros: vehiculo.numero_pasajeros,
          cilindrada: vehiculo.cilindrada,
          numeroEjes: vehiculo.numero_ejes,
          numeroRuedas: vehiculo.numero_ruedas,
          pesoBruto: vehiculo.peso_bruto,
          pesoSeco: vehiculo.peso_seco,
          cargaUtil: vehiculo.carga_util,
          longitud: vehiculo.longitud,
          ancho: vehiculo.ancho,
          altura: vehiculo.altura,
          observaciones: vehiculo.observaciones
        };
        
        console.log('📝 Datos mapeados para el formulario:', vehiculoMapeado);
        this.form.patchValue(vehiculoMapeado);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando vehículo:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Error completo:', JSON.stringify(error, null, 2));
        this.snackBar.open('Error al cargar el vehículo', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
        
        // Si es error 401, probablemente el AuthGuard redirigirá al login
        if (error.status === 401) {
          console.error('❌ Error 401: No autorizado - Redirigiendo al login');
        }
      }
    });
  }

  guardar(): void {
    if (!this.form.valid) {
      this.snackBar.open('Complete los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    const datos = this.form.value;

    const operacion = this.esEdicion()
      ? this.vehiculoService.actualizarVehiculo(this.vehiculoId()!, datos)
      : this.vehiculoService.crearVehiculo(datos);

    operacion.subscribe({
      next: () => {
        this.snackBar.open(
          `Vehículo ${this.esEdicion() ? 'actualizado' : 'creado'} exitosamente`,
          'Cerrar',
          { duration: 3000 }
        );
        this.router.navigate(['/vehiculos-solo']);
      },
      error: (error) => {
        console.error('Error guardando vehículo:', error);
        const mensaje = error.error?.detail || 'Error al guardar el vehículo';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/vehiculos-solo']);
  }
}
