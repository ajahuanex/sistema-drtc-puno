import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ExpedienteService } from '../../services/expediente.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { Expediente, ExpedienteCreate, ExpedienteUpdate, ValidacionExpediente, RespuestaValidacion, TipoSolicitante, TipoExpediente } from '../../models/expediente.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';

@Component({
  selector: 'app-expediente-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDividerModule,
    MatListModule,
    MatTooltipModule
  ],
  template: `
    <div class="expediente-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>{{ isEditMode() ? 'edit' : 'add' }}</mat-icon>
            {{ isEditMode() ? 'Editar Expediente' : 'Nuevo Expediente' }}
          </mat-card-title>
          <mat-card-subtitle>
            {{ isEditMode() ? 'Modifica la informaciÃ³n del expediente' : 'Crea un nuevo expediente en el sistema' }}
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="expedienteForm" (ngSubmit)="onSubmit()" class="expediente-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>NÃºmero de Expediente</mat-label>
                <input matInput 
                       formControlName="numero" 
                       [placeholder]="numeroCompleto()" 
                       maxlength="4"
                       (input)="onNumeroInput($event)"
                       (blur)="onNumeroBlur()">
                @if (expedienteForm.get('numero')?.hasError('required')) {
                  <mat-error>El nÃºmero de expediente es requerido</mat-error>
                }
                @if (expedienteForm.get('numero')?.hasError('pattern')) {
                  <mat-error>Debe ser un nÃºmero de 4 dÃ­gitos</mat-error>
                }
                @if (expedienteForm.get('numero')?.hasError('numeroDuplicado')) {
                  <mat-error>NÃºmero duplicado en {{ fechaEmision().getFullYear() }}</mat-error>
                }
                <mat-hint>Formato: {{ numeroCompleto() }} - Ãnico por aÃ±o</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Cantidad de Hojas (Folio)</mat-label>
                <input matInput 
                       type="number"
                       formControlName="folio" 
                       placeholder="Cantidad de hojas del expediente"
                       min="1"
                       max="1000"
                       (input)="onFolioInput($event)">
                @if (expedienteForm.get('folio')?.hasError('required')) {
                  <mat-error>La cantidad de hojas es requerida</mat-error>
                }
                @if (expedienteForm.get('folio')?.hasError('min')) {
                  <mat-error>La cantidad de hojas debe ser mayor a 0</mat-error>
                }
                @if (expedienteForm.get('folio')?.hasError('max')) {
                  <mat-error>La cantidad de hojas no puede exceder 1000</mat-error>
                }
                @if (expedienteForm.get('folio')?.hasError('invalidFolio')) {
                  <mat-error>La cantidad de hojas debe ser un nÃºmero vÃ¡lido entre 1 y 1000</mat-error>
                }

              </mat-form-field>
            </div>

            <!-- Tipo de TrÃ¡mite - Movido arriba -->
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tipo de TrÃ¡mite</mat-label>
                <mat-select formControlName="tipoTramite" (selectionChange)="onTipoTramiteChange($event)">
                  <mat-option value="AUTORIZACION_NUEVA">AUTORIZACIÓN NUEVA</mat-option>
                  <mat-option value="RENOVACION">RENOVACION</mat-option>
                  <mat-option value="INCREMENTO">INCREMENTO</mat-option>
                  <mat-option value="SUSTITUCION">SUSTITUCION</mat-option>
                  <mat-option value="OTROS">OTROS</mat-option>
                </mat-select>
                @if (expedienteForm.get('tipoTramite')?.hasError('required')) {
                  <mat-error>El tipo de trÃ¡mite es requerido</mat-error>
                }
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Fecha de EmisiÃ³n</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="fechaEmision">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (expedienteForm.get('fechaEmision')?.hasError('required')) {
                  <mat-error>La fecha de emisiÃ³n es requerida</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Empresa</mat-label>
                <input matInput 
                       formControlName="empresaSearch" 
                       [matAutocomplete]="auto"
                       placeholder="Buscar por RUC o razÃ³n social"
                       (input)="onEmpresaSearch()">
                <mat-autocomplete #auto="matAutocomplete" 
                                 [displayWith]="displayEmpresa"
                                 (optionSelected)="onEmpresaSelected($event)">
                  @for (empresa of empresasFiltradas() | async; track empresa.id) {
                    <mat-option [value]="empresa">
                      <div class="empresa-option">
                        <div class="empresa-ruc">{{ empresa.ruc }}</div>
                        <div class="empresa-razon">{{ empresa.razonSocial.principal }}</div>
                      </div>
                    </mat-option>
                  }
                </mat-autocomplete>
                @if (expedienteForm.get('empresaSearch')?.hasError('required')) {
                  <mat-error>La empresa es requerida</mat-error>
                }
                <mat-hint>Busca por RUC o razÃ³n social de la empresa</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  <mat-option value="EN PROCESO">EN PROCESO</mat-option>
                  <mat-option value="APROBADO">APROBADO</mat-option>
                  <mat-option value="RECHAZADO">RECHAZADO</mat-option>
                  <mat-option value="ARCHIVADO">ARCHIVADO</mat-option>
                </mat-select>
                @if (expedienteForm.get('estado')?.hasError('required')) {
                  <mat-error>El estado es requerido</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- ResoluciÃ³n Padre - Solo para INCREMENTO y SUSTITUCION -->
            @if (necesitaResolucionPadre()) {
              <div class="form-row">
                <!-- Campo ResoluciÃ³n Padre funcionando correctamente -->
                
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>ResoluciÃ³n Padre</mat-label>
                  <mat-select formControlName="resolucionPadreId" required>
                    <mat-option value="">Seleccione una resoluciÃ³n padre</mat-option>
                    @for (resolucion of resolucionesPadre() | async; track resolucion.id) {
                      <mat-option [value]="resolucion.id">
                        <div class="resolucion-option">
                          <div class="resolucion-numero">{{ resolucion.nroResolucion }}</div>
                          <div class="resolucion-tipo">{{ resolucion.tipoTramite }}</div>
                          <div class="resolucion-fecha">{{ resolucion.fechaEmision | date:'dd/MM/yyyy' }}</div>
                        </div>
                      </mat-option>
                    }
                  </mat-select>
                  @if (expedienteForm.get('resolucionPadreId')?.hasError('required')) {
                    <mat-error>Debe seleccionar una resoluciÃ³n padre</mat-error>
                  }
                  <mat-hint>Seleccione la resoluciÃ³n padre para este expediente de incremento o sustituciÃ³n</mat-hint>
                </mat-form-field>
              </div>
            }

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Observaciones</mat-label>
                <textarea matInput formControlName="observaciones" rows="3" placeholder="Observaciones adicionales"></textarea>
              </mat-form-field>
            </div>

            <!-- SecciÃ³n de Documentos -->
            <mat-divider class="section-divider"></mat-divider>
            
            <div class="documentos-section">
              <h3>Documentos del Expediente</h3>
              <p class="section-description">Sube los documentos necesarios para el trÃ¡mite</p>
              
              <div class="upload-area" 
                   (click)="fileInput.click()" 
                   (dragover)="onDragOver($event)"
                   (dragleave)="onDragLeave($event)"
                   (drop)="onDrop($event)"
                   [class.drag-over]="isDragOver()">
                <mat-icon>cloud_upload</mat-icon>
                <p>Arrastra archivos aquÃ­ o haz clic para seleccionar</p>
                <p class="upload-hint">Formatos permitidos: PDF, DOC, DOCX, JPG, PNG (Max: 10MB)</p>
              </div>
              
              <input #fileInput 
                     type="file" 
                     multiple 
                     accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                     (change)="onFileSelected($event)"
                     style="display: none;">
              
              @if (archivosSeleccionados().length > 0) {
                <div class="archivos-lista">
                  <h4>Archivos seleccionados:</h4>
                  <mat-list>
                    @for (archivo of archivosSeleccionados(); track archivo.name) {
                      <mat-list-item>
                        <mat-icon matListItemIcon>description</mat-icon>
                        <div matListItemTitle>{{ archivo.name }}</div>
                        <div matListItemLine>{{ (archivo.size / 1024 / 1024).toFixed(2) }} MB</div>
                        <button mat-icon-button 
                                color="warn" 
                                (click)="removerArchivo(archivo)"
                                matTooltip="Eliminar archivo">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </mat-list-item>
                    }
                  </mat-list>
                </div>
              }
              
              @if (uploadProgress() > 0 && uploadProgress() < 100) {
                <div class="upload-progress">
                  <mat-progress-bar mode="determinate" [value]="uploadProgress()"></mat-progress-bar>
                  <p>Subiendo archivos... {{ uploadProgress() | number:'1.0-0' }}%</p>
                </div>
              }
            </div>

            <!-- Empresa seleccionada -->
            @if (empresaSeleccionada()) {
              <div class="empresa-seleccionada">
                <mat-chip color="primary" selected>
                  <mat-icon>business</mat-icon>
                  <span class="empresa-info">
                    <strong>{{ empresaSeleccionada()?.ruc }}</strong> - 
                    {{ empresaSeleccionada()?.razonSocial?.principal }}
                  </span>
                  <button matChipRemove (click)="removerEmpresa()">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              </div>
            }

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelar()">
                <mat-icon>cancel</mat-icon>
                Cancelar
              </button>
              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      [disabled]="isSubmitting() || expedienteForm.invalid">
                <mat-icon>{{ isEditMode() ? 'save' : 'add' }}</mat-icon>
                {{ isEditMode() ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .expediente-form-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .mat-mdc-form-field {
      width: 100%;
    }

    .empresa-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .empresa-ruc {
      font-weight: 500;
      color: #1976d2;
    }

    .empresa-razon {
      font-size: 0.9em;
      color: #666;
    }

    .empresa-seleccionada {
      margin: 16px 0;
    }

    .empresa-info {
      margin-left: 8px;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    /* Estilos para la secciÃ³n de documentos */
    .section-divider {
      margin: 24px 0;
    }

    .documentos-section {
      margin: 24px 0;
    }

    .documentos-section h3 {
      color: #1976d2;
      margin-bottom: 8px;
    }

    .section-description {
      color: #666;
      margin-bottom: 16px;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #fafafa;
    }

    .upload-area:hover,
    .upload-area.drag-over {
      border-color: #1976d2;
      background-color: #e3f2fd;
    }

    .upload-area mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
      margin-bottom: 16px;
    }

    .upload-area p {
      margin: 8px 0;
      color: #666;
    }

    .upload-hint {
      font-size: 0.9em;
      color: #999;
    }

    .archivos-lista {
      margin-top: 16px;
    }

    .archivos-lista h4 {
      color: #1976d2;
      margin-bottom: 12px;
    }

    .upload-progress {
      margin-top: 16px;
    }

    .upload-progress p {
      text-align: center;
      margin-top: 8px;
      color: #666;
    }

    .resolucion-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .resolucion-numero {
      font-weight: 500;
      color: #1976d2;
    }

    .resolucion-tipo {
      font-size: 0.9em;
      color: #666;
    }

    .resolucion-fecha {
      font-size: 0.8em;
      color: #999;
    }
  `]
})
export class ExpedienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expedienteService = inject(ExpedienteService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  // Propiedades de entrada para modo modal
  @Input() isModalMode = false;
  @Input() numeroPredefinido?: string;

  // Outputs para modo modal
  @Output() expedienteCreado = new EventEmitter<any>();
  @Output() cancelado = new EventEmitter<void>();

  // Signals
  isEditMode = signal(false);
  isSubmitting = signal(false);
  expedienteId = signal<string | null>(null);

  // Signal para el nÃºmero del expediente (solo los 4 dÃ­gitos)
  numero = signal('');

  // Signal para la fecha de emisiÃ³n
  fechaEmision = signal<Date>(new Date());

  // Signal para la empresa seleccionada
  empresaSeleccionada = signal<Empresa | null>(null);

  // Signal para las empresas filtradas
  empresasFiltradas = signal<Observable<Empresa[]>>(of([]));

  // Propiedades para resoluciones padre
  resolucionesPadre = signal<Observable<Resolucion[]>>(of([]));

  // Propiedades para archivos
  archivosSeleccionados = signal<File[]>([]);
  isDragOver = signal(false);
  uploadProgress = signal(0);

  // Computed para el nÃºmero completo del expediente
  numeroCompleto = computed(() => {
    const numeroValue = this.numero();
    const fechaValue = this.fechaEmision();

    if (!numeroValue) return 'E-XXXX-YYYY';

    const anio = fechaValue ? fechaValue.getFullYear() : new Date().getFullYear();
    const numeroFormateado = numeroValue.toString().padStart(4, '0');
    return `E-${numeroFormateado}-${anio}`;
  });

  expedienteForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
    this.cargarEmpresas();

    // Si es modo modal y hay nÃºmero predefinido, pre-llenarlo
    if (this.isModalMode && this.numeroPredefinido) {
      const numero = this.numeroPredefinido.replace('E-', '').replace(/-2025$/, '');
      if (numero) {
        this.expedienteForm.patchValue({ numero });
        this.numero.set(numero);
      }
    }

    // Sincronizar signals con cambios del formulario
    this.expedienteForm.get('numero')?.valueChanges.subscribe(value => {
      if (value) {
        this.numero.set(value);
      }
    });

    this.expedienteForm.get('fechaEmision')?.valueChanges.subscribe(value => {
      if (value) {
        this.fechaEmision.set(value);
      }
    });
  }

  private initForm(): void {
    this.expedienteForm = this.fb.group({
      numero: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      folio: ['', [Validators.required, Validators.min(1), Validators.max(1000)]],
      fechaEmision: [new Date(), [Validators.required]],
      tipoTramite: ['', [Validators.required]],
      empresaSearch: ['', [Validators.required]],
      resolucionPadreId: [''],
      estado: ['EN PROCESO', [Validators.required]],
      descripcion: [''],
      observaciones: ['']
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.expedienteId.set(id);
      this.loadExpediente(id);
    }
  }

  private cargarEmpresas(): void {
    this.empresaService.getEmpresas().subscribe(empresas => {
      // Filtrar solo empresas habilitadas
      const empresasAutorizadas = empresas.filter(emp => emp.estado === 'AUTORIZADA');

      const empresaSearchControl = this.expedienteForm.get('empresaSearch');
      if (empresaSearchControl) {
        this.empresasFiltradas.set(
          empresaSearchControl.valueChanges.pipe(
            startWith(''),
            map(value => this.filtrarEmpresas(value, empresasAutorizadas))
          )
        );
      } else {
        this.empresasFiltradas.set(of(empresasAutorizadas));
      }
    });
  }

  private filtrarEmpresas(value: string, empresas: Empresa[]): Empresa[] {
    if (typeof value !== 'string') return empresas;

    const filterValue = value.toLowerCase();
    return empresas.filter(empresa =>
      empresa.ruc.toLowerCase().includes(filterValue) ||
      empresa.razonSocial.principal.toLowerCase().includes(filterValue)
    );
  }

  onEmpresaSearch(): void {
    // El filtrado se maneja automÃ¡ticamente por el autocomplete
  }

  onEmpresaSelected(event: any): void {
    const empresa = event.option.value;

    this.empresaSeleccionada.set(empresa);

    // Actualizar el campo de bÃºsqueda con la empresa seleccionada
    this.expedienteForm.patchValue({
      empresaSearch: empresa
    });

    // Cargar resoluciones padre si es necesario
    if (this.necesitaResolucionPadre()) {
      this.cargarResolucionesPadre(empresa.id);
    }
  }

  onTipoTramiteChange(event: any): void {
    const tipoTramite = event.value;

    // Si cambia el tipo de trÃ¡mite, limpiar la resoluciÃ³n padre seleccionada
    if (this.expedienteForm.get('resolucionPadreId')) {
      this.expedienteForm.patchValue({ resolucionPadreId: '' });
    }

    // Si ahora necesita resoluciÃ³n padre y hay empresa seleccionada, cargar las resoluciones
    if (this.necesitaResolucionPadre() && this.empresaSeleccionada()) {
      this.cargarResolucionesPadre(this.empresaSeleccionada()!.id);
    }
  }

  removerEmpresa(): void {
    this.empresaSeleccionada.set(null);
    this.expedienteForm.patchValue({
      empresaSearch: ''
    });
  }

  displayEmpresa = (empresa: Empresa): string => {
    return empresa ? `${empresa.ruc} - ${empresa.razonSocial.principal}` : '';
  }

  necesitaResolucionPadre(): boolean {
    const tipoTramite = this.expedienteForm.get('tipoTramite')?.value;
    return tipoTramite === 'INCREMENTO' || tipoTramite === 'SUSTITUCION';
  }

  private cargarResolucionesPadre(empresaId: string): void {
    this.resolucionService.getResolucionesPorEmpresa(empresaId).subscribe({
      next: (resoluciones) => {
        console.log('ð Resoluciones de la empresa:', resoluciones);

        // Filtrar resoluciones que pueden ser padre
        const resolucionesPadre = resoluciones.filter(r => {
          // Una resoluciÃ³n puede ser padre si:
          // 1. Tiene tipoResolucion === 'PADRE'
          // 2. Es de tipo PRIMIGENIA o RENOVACION
          // 3. No tiene resolucionPadreId (es una resoluciÃ³n raÃ­z)
          // 4. EstÃ¡ vigente y activa
          const esPadre = r.tipoResolucion === 'PADRE';
          const esPrimigeniaORenovacion = r.tipoTramite === 'AUTORIZACION_NUEVA' || r.tipoTramite === 'RENOVACION';
          const noTienePadre = !r.resolucionPadreId;
          const estaVigente = r.estaActivo && r.estado === 'VIGENTE';

          return (esPadre || esPrimigeniaORenovacion || noTienePadre) && estaVigente;
        });

        console.log('â Resoluciones padre filtradas:', resolucionesPadre);

        // Actualizar el signal
        this.resolucionesPadre.set(of(resolucionesPadre));
      },
      error: (error) => {
        console.error('â Error al cargar resoluciones padre:', error);
        this.resolucionesPadre.set(of([]));
      }
    });
  }

  private loadExpediente(id: string): void {
    this.expedienteService.getExpediente(id).subscribe({
      next: (expediente) => {
        // Extraer solo el nÃºmero del formato completo E-1234-2025
        const numeroMatch = expediente.nroExpediente.match(/^E-(\d{4})-\d{4}$/);
        const numero = numeroMatch ? numeroMatch[1] : '';

        // Cargar la empresa asociada
        if (expediente.empresaId) {
          this.empresaService.getEmpresa(expediente.empresaId).subscribe({
            next: (empresa: Empresa) => {
              this.empresaSeleccionada.set(empresa);
              this.expedienteForm.patchValue({
                empresaSearch: empresa
              });

              // Si el expediente necesita resoluciÃ³n padre, cargarlas
              if (this.necesitaResolucionPadre()) {
                this.cargarResolucionesPadre(empresa.id);
              }
            }
          });
        }

        this.expedienteForm.patchValue({
          numero: numero,
          folio: expediente.folio,
          fechaEmision: new Date(expediente.fechaEmision),
          tipoTramite: expediente.tipoTramite,
          resolucionPadreId: (expediente as any).resolucionPadreId || '',
          estado: expediente.estado,
          descripcion: expediente.descripcion || '',
          observaciones: expediente.observaciones || ''
        });

        // Actualizar signals
        this.numero.set(numero);
        this.fechaEmision.set(new Date(expediente.fechaEmision));

        // Limpiar errores de validaciÃ³n en modo ediciÃ³n
        if (this.isEditMode()) {
          this.expedienteForm.get('numero')?.setErrors(null);
        }
      },
      error: (error) => {
        console.error('Error al cargar expediente:', error);
        this.snackBar.open('Error al cargar expediente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onNumeroInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Solo nÃºmeros

    // Limitar a 4 dÃ­gitos
    if (value.length > 4) {
      value = value.substring(0, 4);
      input.value = value; // Actualizar el input directamente
    }

    // Actualizar el signal para reactividad
    this.numero.set(value);

    // Limpiar errores si no estÃ¡ completo
    if (value.length < 4) {
      this.expedienteForm.get('numero')?.setErrors(null);
    }
  }

  onNumeroBlur(): void {
    const numero = this.expedienteForm.get('numero')?.value;

    // Validar que el nÃºmero tenga 4 dÃ­gitos
    if (!numero || numero.length !== 4) {
      return;
    }

    // Validar nÃºmero Ãºnico
    this.validarNumeroUnico(numero);
  }

  onFolioInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);

    // Validar que sea un nÃºmero vÃ¡lido
    if (isNaN(value) || value < 1 || value > 1000) {
      this.expedienteForm.get('folio')?.setErrors({ invalidFolio: true });
    } else {
      this.expedienteForm.get('folio')?.setErrors(null);
    }
  }

  private validarNumeroUnico(numero: string): void {
    // Asegurar que el nÃºmero tenga 4 dÃ­gitos
    if (numero.length !== 4) {
      return;
    }

    const fechaEmision = this.expedienteForm.get('fechaEmision')?.value || new Date();

    const validacion: ValidacionExpediente = {
      numero: numero,
      folio: this.expedienteForm.get('folio')?.value || 1,
      empresaId: this.empresaSeleccionada()?.id,
      tipoTramite: this.expedienteForm.get('tipoTramite')?.value || 'AUTORIZACION_NUEVA',
      fechaEmision: fechaEmision,
      // En modo ediciÃ³n, excluir el expediente actual de la validaciÃ³n
      expedienteIdExcluir: this.isEditMode() ? this.expedienteId() || undefined : undefined
    };

    console.log('ð Validando nÃºmero de expediente:', validacion);

    this.expedienteService.validarExpedienteUnico(validacion).subscribe({
      next: (respuesta) => {
        console.log('â Respuesta de validaciÃ³n:', respuesta);

        if (!respuesta.valido) {
          // NÃºmero duplicado
          this.expedienteForm.get('numero')?.setErrors({ numeroDuplicado: true });
          this.snackBar.open('â ï¸ NÃºmero duplicado', 'Cerrar', { duration: 3000 });
        } else {
          // NÃºmero vÃ¡lido - limpiar errores de duplicado sin mostrar mensaje
          const numeroControl = this.expedienteForm.get('numero');
          if (numeroControl?.hasError('numeroDuplicado')) {
            const errors = { ...numeroControl.errors };
            delete errors['numeroDuplicado'];
            numeroControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
          }
          // No mostrar mensaje cuando el nÃºmero es vÃ¡lido
        }
      },
      error: (error) => {
        console.error('â Error en validaciÃ³n:', error);
        // En caso de error, permitir el nÃºmero pero mostrar advertencia corta
        this.snackBar.open('Error al validar', 'Cerrar', { duration: 2000 });
      }
    });
  }

  // MÃ©todos para manejo de archivos
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      this.procesarArchivos(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      this.procesarArchivos(Array.from(files));
    }
  }

  private procesarArchivos(files: File[]): void {
    const archivosValidos = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const tiposPermitidos = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (file.size > maxSize) {
        this.snackBar.open(`El archivo ${file.name} excede el tamaÃ±o mÃ¡ximo de 10MB`, 'Cerrar', { duration: 3000 });
        return false;
      }

      if (!tiposPermitidos.includes(extension)) {
        this.snackBar.open(`El archivo ${file.name} no tiene un formato permitido`, 'Cerrar', { duration: 3000 });
        return false;
      }

      return true;
    });

    this.archivosSeleccionados.update(current => [...current, ...archivosValidos]);
  }

  removerArchivo(archivo: File): void {
    this.archivosSeleccionados.update(current =>
      current.filter(f => f !== archivo)
    );
  }

  onSubmit(): void {
    if (this.expedienteForm.valid && this.empresaSeleccionada()) {
      // Verificar que el nÃºmero sea Ãºnico antes de continuar
      const numero = this.expedienteForm.get('numero')?.value;
      if (numero && numero.length === 4) {
        // En modo ediciÃ³n, solo validar si el nÃºmero cambiÃ³
        if (this.isEditMode() && numero === this.numero()) {
          // NÃºmero no cambiÃ³ en ediciÃ³n, proceder directamente
          this.procesarEnvio();
        } else {
          // Validar nÃºmero Ãºnico (nuevo expediente o nÃºmero cambiado en ediciÃ³n)
          this.validarNumeroUnico(numero);

          // Esperar un momento para que la validaciÃ³n se complete
          setTimeout(() => {
            const tieneError = this.expedienteForm.get('numero')?.hasError('numeroDuplicado');
            if (tieneError) {
              const anio = this.fechaEmision().getFullYear();
              this.snackBar.open(`El número de expediente ya existe en el año ${anio}. Use otro número o cambie el año.`, 'Cerrar', { duration: 4000 });
              return;
            } else {
              this.procesarEnvio();
            }
          }, 500);
        }
      } else {
        this.procesarEnvio();
      }
    } else {
      if (!this.empresaSeleccionada()) {
        this.snackBar.open('Debe seleccionar una empresa', 'Cerrar', { duration: 3000 });
      }
    }
  }

  private procesarEnvio(): void {
    this.isSubmitting.set(true);

    const formValue = this.expedienteForm.value;

    if (this.isEditMode()) {
      // Modo ediciÃ³n
      const expedienteUpdate = {
        nroExpediente: this.numeroCompleto(), // Usar el nÃºmero completo
        fechaEmision: formValue.fechaEmision,
        tipoTramite: formValue.tipoTramite,
        empresaId: this.empresaSeleccionada()?.id,
        estado: formValue.estado,
        descripcion: formValue.descripcion,
        observaciones: formValue.observaciones
      };

      // TODO: Implementar actualizaciÃ³n en el servicio
      console.log('Actualizando expediente:', expedienteUpdate);

      setTimeout(() => {
        this.isSubmitting.set(false);
        this.snackBar.open('Expediente actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/expedientes']);
      }, 1000);
    } else {
      // Modo creaciÃ³n
      const expedienteCreate: ExpedienteCreate = {
        nroExpediente: this.numeroCompleto(),
        folio: +formValue.folio,
        fechaEmision: formValue.fechaEmision,
        estado: formValue.estado,
        tipoTramite: formValue.tipoTramite,
        empresaId: this.empresaSeleccionada()?.id,
        resolucionPadreId: formValue.resolucionPadreId || undefined,
        descripcion: formValue.descripcion,
        observaciones: formValue.observaciones
      };

      this.expedienteService.createExpediente(expedienteCreate).subscribe({
        next: (expedienteCreado) => {
          this.isSubmitting.set(false);

          if (this.isModalMode) {
            // Modo modal: emitir evento y cerrar
            this.expedienteCreado.emit(expedienteCreado);
          } else {
            // Modo normal: mostrar mensaje y redirigir
            this.snackBar.open('Expediente creado exitosamente', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/expedientes']);
          }
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('Error al crear expediente:', error);
          this.snackBar.open('Error al crear expediente', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  cancelar(): void {
    if (this.isModalMode) {
      // Modo modal: emitir evento de cancelaciÃ³n
      this.cancelado.emit();
    } else {
      // Modo normal: redirigir
      this.router.navigate(['/expedientes']);
    }
  }
} 
