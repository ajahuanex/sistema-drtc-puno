import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { ResolucionService } from '../../services/resolucion.service';
import { EmpresaService } from '../../services/empresa.service';
import { ExpedienteService } from '../../services/expediente.service';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { EmpresaSelectorComponent } from '../../shared/empresa-selector.component';

interface PasoAsistente {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  completado: boolean;
  opcional: boolean;
}

interface ResumenResolucion {
  numeroCompleto: string;
  empresa: any;
  expediente: any;
  tipoTramite: string;
  tipoResolucion: string;
  fechaEmision: Date;
  fechaVigenciaInicio?: Date;
  fechaVigenciaFin?: Date;
  descripcion: string;
  observaciones?: string;
}

@Component({
  selector: 'app-asistente-creacion-resolucion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    SmartIconComponent,
    EmpresaSelectorComponent
  ],
  template: `
    <div class="asistente-container">
      <!-- Header del Asistente -->
      <div class="asistente-header">
        <div class="header-content">
          <div class="header-title">
            <app-smart-icon iconName="assistant" [size]="32"></app-smart-icon>
            <div class="title-text">
              <h1>Asistente de Creación de Resoluciones</h1>
              <p class="header-subtitle">Te guiaremos paso a paso para crear una nueva resolución</p>
            </div>
          </div>
          
          <div class="progreso-general">
            <div class="progreso-info">
              <span>Paso {{ pasoActual() + 1 }} de {{ pasos.length }}</span>
              <span>{{ calcularPorcentaje() }}%</span>
            </div>
            <div class="progreso-bar">
              <div class="progreso-fill" [style.width.%]="((pasoActual() + 1) / pasos.length) * 100"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stepper del Asistente -->
      <mat-stepper #stepper [selectedIndex]="pasoActual()" orientation="horizontal" class="asistente-stepper">
        
        <!-- Paso 1: Selección de Empresa -->
        <mat-step [stepControl]="paso1Form" [completed]="pasos[0].completado">
          <ng-template matStepLabel>
            <div class="step-label">
              <app-smart-icon iconName="business" [size]="20"></app-smart-icon>
              <span>Empresa</span>
            </div>
          </ng-template>
          
          <div class="paso-content">
            <div class="paso-header">
              <h2>Seleccionar Empresa</h2>
              <p>Elige la empresa para la cual se creará la resolución</p>
            </div>
            
            <form [formGroup]="paso1Form" class="paso-form">
              <app-empresa-selector
                label="Empresa"
                placeholder="Buscar por RUC, razón social o código"
                hint="Seleccione la empresa titular de la resolución"
                [required]="true"
                [empresaId]="paso1Form.get('empresaId')?.value"
                (empresaSeleccionada)="onEmpresaSeleccionada($event)"
                (empresaIdChange)="paso1Form.patchValue({ empresaId: $event })">
              </app-empresa-selector>
              
              @if (empresaSeleccionada()) {
                <div class="empresa-preview">
                  <mat-card class="preview-card">
                    <mat-card-header>
                      <mat-card-title>Empresa Seleccionada</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="empresa-info">
                        <div class="info-item">
                          <span class="label">RUC:</span>
                          <span class="value">{{ empresaSeleccionada()?.ruc }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">Razón Social:</span>
                          <span class="value">{{ empresaSeleccionada()?.razonSocial?.principal }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">Estado:</span>
                          <mat-chip [class]="'estado-' + empresaSeleccionada()?.estado?.toLowerCase()">
                            {{ empresaSeleccionada()?.estado }}
                          </mat-chip>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              }
            </form>
            
            <div class="paso-actions">
              <button mat-raised-button color="primary" 
                      [disabled]="!paso1Form.valid"
                      (click)="siguientePaso()">
                <app-smart-icon iconName="arrow_forward" [size]="20"></app-smart-icon>
                Continuar
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Paso 2: Tipo de Trámite -->
        <mat-step [stepControl]="paso2Form" [completed]="pasos[1].completado">
          <ng-template matStepLabel>
            <div class="step-label">
              <app-smart-icon iconName="category" [size]="20"></app-smart-icon>
              <span>Tipo</span>
            </div>
          </ng-template>
          
          <div class="paso-content">
            <div class="paso-header">
              <h2>Tipo de Trámite</h2>
              <p>Selecciona el tipo de trámite para la resolución</p>
            </div>
            
            <form [formGroup]="paso2Form" class="paso-form">
              <div class="tipos-tramite-grid">
                @for (tipo of tiposTramiteDisponibles; track tipo.valor) {
                  <mat-card class="tipo-card" 
                           [class.selected]="paso2Form.get('tipoTramite')?.value === tipo.valor"
                           (click)="seleccionarTipoTramite(tipo.valor)">
                    <mat-card-content>
                      <div class="tipo-content">
                        <app-smart-icon [iconName]="tipo.icono" [size]="32"></app-smart-icon>
                        <h3>{{ tipo.nombre }}</h3>
                        <p>{{ tipo.descripcion }}</p>
                        <div class="tipo-info">
                          <mat-chip [class]="'chip-' + tipo.categoria">{{ tipo.categoria }}</mat-chip>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
              
              @if (tipoTramiteSeleccionado()) {
                <div class="tipo-preview">
                  <mat-card class="preview-card">
                    <mat-card-header>
                      <mat-card-title>Información del Trámite</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="tramite-info">
                        <div class="info-item">
                          <span class="label">Tipo:</span>
                          <span class="value">{{ tipoTramiteSeleccionado()?.nombre }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">Categoría:</span>
                          <span class="value">{{ tipoTramiteSeleccionado()?.categoria }}</span>
                        </div>
                        <div class="info-item">
                          <span class="label">Requiere Resolución Padre:</span>
                          <span class="value">{{ tipoTramiteSeleccionado()?.requierePadre ? 'Sí' : 'No' }}</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              }
            </form>
            
            <div class="paso-actions">
              <button mat-button (click)="pasoAnterior()">
                <app-smart-icon iconName="arrow_back" [size]="20"></app-smart-icon>
                Anterior
              </button>
              <button mat-raised-button color="primary" 
                      [disabled]="!paso2Form.valid"
                      (click)="siguientePaso()">
                <app-smart-icon iconName="arrow_forward" [size]="20"></app-smart-icon>
                Continuar
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Paso 3: Resolución Padre (condicional) -->
        @if (requiereResolucionPadre()) {
          <mat-step [stepControl]="paso3Form" [completed]="pasos[2].completado">
            <ng-template matStepLabel>
              <div class="step-label">
                <app-smart-icon iconName="account_tree" [size]="20"></app-smart-icon>
                <span>Padre</span>
              </div>
            </ng-template>
            
            <div class="paso-content">
              <div class="paso-header">
                <h2>Resolución Padre</h2>
                <p>Selecciona la resolución padre de la cual dependerá esta resolución</p>
              </div>
              
              <form [formGroup]="paso3Form" class="paso-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Resolución Padre</mat-label>
                  <mat-select formControlName="resolucionPadreId" required>
                    <mat-option value="">Seleccionar resolución padre</mat-option>
                    @for (resolucion of resolucionesPadreDisponibles(); track resolucion.id) {
                      <mat-option [value]="resolucion.id">
                        {{ resolucion.nroResolucion }}
                        @if (resolucion.fechaVigenciaFin) {
                          - Vence: {{ formatearFecha(resolucion.fechaVigenciaFin) }}
                        }
                      </mat-option>
                    }
                  </mat-select>
                  <mat-hint>Solo se muestran resoluciones PADRE vigentes de la misma empresa</mat-hint>
                </mat-form-field>
              </form>
              
              <div class="paso-actions">
                <button mat-button (click)="pasoAnterior()">
                  <app-smart-icon iconName="arrow_back" [size]="20"></app-smart-icon>
                  Anterior
                </button>
                <button mat-raised-button color="primary" 
                        [disabled]="!paso3Form.valid"
                        (click)="siguientePaso()">
                  <app-smart-icon iconName="arrow_forward" [size]="20"></app-smart-icon>
                  Continuar
                </button>
              </div>
            </div>
          </mat-step>
        }

        <!-- Paso 4: Datos de la Resolución -->
        <mat-step [stepControl]="paso4Form" [completed]="pasos[3].completado">
          <ng-template matStepLabel>
            <div class="step-label">
              <app-smart-icon iconName="description" [size]="20"></app-smart-icon>
              <span>Datos</span>
            </div>
          </ng-template>
          
          <div class="paso-content">
            <div class="paso-header">
              <h2>Datos de la Resolución</h2>
              <p>Completa la información básica de la resolución</p>
            </div>
            
            <form [formGroup]="paso4Form" class="paso-form">
              <div class="form-grid">
                <!-- Número de resolución -->
                <mat-form-field appearance="outline">
                  <mat-label>Número de Resolución</mat-label>
                  <input matInput formControlName="numeroBase" placeholder="0001" maxlength="4">
                  <mat-hint>Formato final: {{ numeroCompleto() }}</mat-hint>
                </mat-form-field>

                <!-- Fecha de emisión -->
                <mat-form-field appearance="outline">
                  <mat-label>Fecha de Emisión</mat-label>
                  <input matInput [matDatepicker]="pickerEmision" formControlName="fechaEmision" required>
                  <mat-datepicker-toggle matSuffix [for]="pickerEmision"></mat-datepicker-toggle>
                  <mat-datepicker #pickerEmision></mat-datepicker>
                </mat-form-field>

                <!-- Fechas de vigencia (solo para resoluciones PADRE) -->
                @if (!requiereResolucionPadre()) {
                  <mat-form-field appearance="outline">
                    <mat-label>Fecha de Inicio de Vigencia</mat-label>
                    <input matInput [matDatepicker]="pickerInicio" formControlName="fechaVigenciaInicio">
                    <mat-datepicker-toggle matSuffix [for]="pickerInicio"></mat-datepicker-toggle>
                    <mat-datepicker #pickerInicio></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Años de Vigencia</mat-label>
                    <input matInput type="number" formControlName="aniosVigencia" min="1" max="10">
                    <mat-hint>La fecha de fin se calculará automáticamente</mat-hint>
                  </mat-form-field>
                }

                <!-- Descripción -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput formControlName="descripcion" rows="3" required></textarea>
                  <button mat-icon-button matSuffix 
                          type="button"
                          (click)="generarDescripcionAutomatica()"
                          matTooltip="Generar descripción automática">
                    <app-smart-icon iconName="auto_fix_high" [size]="20"></app-smart-icon>
                  </button>
                </mat-form-field>

                <!-- Observaciones -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Observaciones (Opcional)</mat-label>
                  <textarea matInput formControlName="observaciones" rows="2"></textarea>
                </mat-form-field>
              </div>
            </form>
            
            <div class="paso-actions">
              <button mat-button (click)="pasoAnterior()">
                <app-smart-icon iconName="arrow_back" [size]="20"></app-smart-icon>
                Anterior
              </button>
              <button mat-raised-button color="primary" 
                      [disabled]="!paso4Form.valid"
                      (click)="siguientePaso()">
                <app-smart-icon iconName="arrow_forward" [size]="20"></app-smart-icon>
                Continuar
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Paso 5: Resumen y Confirmación -->
        <mat-step [completed]="pasos[4].completado">
          <ng-template matStepLabel>
            <div class="step-label">
              <app-smart-icon iconName="check_circle" [size]="20"></app-smart-icon>
              <span>Confirmar</span>
            </div>
          </ng-template>
          
          <div class="paso-content">
            <div class="paso-header">
              <h2>Resumen y Confirmación</h2>
              <p>Revisa todos los datos antes de crear la resolución</p>
            </div>
            
            <div class="resumen-container">
              <mat-card class="resumen-card">
                <mat-card-header>
                  <mat-card-title>
                    <app-smart-icon iconName="description" [size]="24"></app-smart-icon>
                    {{ resumenResolucion()?.numeroCompleto }}
                  </mat-card-title>
                  <mat-card-subtitle>{{ resumenResolucion()?.tipoTramite }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="resumen-grid">
                    <div class="resumen-section">
                      <h4>Empresa</h4>
                      <p><strong>{{ resumenResolucion()?.empresa?.razonSocial?.principal }}</strong></p>
                      <p>RUC: {{ resumenResolucion()?.empresa?.ruc }}</p>
                    </div>
                    
                    <div class="resumen-section">
                      <h4>Tipo de Resolución</h4>
                      <p><strong>{{ resumenResolucion()?.tipoResolucion }}</strong></p>
                      <p>Trámite: {{ resumenResolucion()?.tipoTramite }}</p>
                    </div>
                    
                    <div class="resumen-section">
                      <h4>Fechas</h4>
                      <p>Emisión: {{ formatearFecha(resumenResolucion()?.fechaEmision || null) }}</p>
                      @if (resumenResolucion()?.fechaVigenciaInicio) {
                        <p>Vigencia: {{ formatearFecha(resumenResolucion()?.fechaVigenciaInicio || null) }} - {{ formatearFecha(resumenResolucion()?.fechaVigenciaFin || null) }}</p>
                      }
                    </div>
                    
                    <div class="resumen-section full-width">
                      <h4>Descripción</h4>
                      <p>{{ resumenResolucion()?.descripcion }}</p>
                      @if (resumenResolucion()?.observaciones) {
                        <p><em>Observaciones: {{ resumenResolucion()?.observaciones }}</em></p>
                      }
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
            
            <div class="paso-actions">
              <button mat-button (click)="pasoAnterior()">
                <app-smart-icon iconName="arrow_back" [size]="20"></app-smart-icon>
                Anterior
              </button>
              <button mat-raised-button color="primary" 
                      [disabled]="creando()"
                      (click)="crearResolucion()">
                @if (creando()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <app-smart-icon iconName="save" [size]="20"></app-smart-icon>
                }
                {{ creando() ? 'Creando...' : 'Crear Resolución' }}
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .asistente-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .asistente-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 32px;
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 32px;
    }

    .header-title {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex: 1;
    }

    .title-text h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: white;
    }

    .header-subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
    }

    .progreso-general {
      min-width: 200px;
    }

    .progreso-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }

    .progreso-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
    }

    .progreso-fill {
      height: 100%;
      background: white;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .asistente-stepper {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 24px;
    }

    .step-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .paso-content {
      padding: 32px 0;
      max-width: 800px;
    }

    .paso-header {
      margin-bottom: 32px;
      text-align: center;
    }

    .paso-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
    }

    .paso-header p {
      margin: 0;
      color: #6c757d;
      font-size: 16px;
    }

    .paso-form {
      margin-bottom: 32px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .empresa-preview,
    .tipo-preview {
      margin-top: 24px;
    }

    .preview-card {
      border: 2px solid #e3f2fd;
      background: #f8f9fa;
    }

    .empresa-info,
    .tramite-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item .label {
      font-weight: 600;
      color: #495057;
      font-size: 14px;
    }

    .info-item .value {
      color: #2c3e50;
      font-size: 14px;
    }

    .tipos-tramite-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .tipo-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .tipo-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .tipo-card.selected {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    .tipo-content {
      text-align: center;
      padding: 16px;
    }

    .tipo-content h3 {
      margin: 16px 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
    }

    .tipo-content p {
      margin: 0 0 16px 0;
      color: #6c757d;
      font-size: 14px;
      line-height: 1.4;
    }

    .tipo-info {
      display: flex;
      justify-content: center;
    }

    .chip-PADRE {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .chip-HIJO {
      background: #e3f2fd;
      color: #1976d2;
    }

    .estado-habilitada {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .estado-suspendida {
      background: #ffebee;
      color: #c62828;
    }

    .resumen-container {
      margin-bottom: 32px;
    }

    .resumen-card {
      border: 2px solid #4caf50;
      background: #f1f8e9;
    }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
    }

    .resumen-section h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }

    .resumen-section p {
      margin: 0 0 4px 0;
      color: #495057;
      font-size: 14px;
    }

    .paso-actions {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
    }

    .paso-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-weight: 600;
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .asistente-container {
        padding: 16px;
      }
      
      .asistente-header {
        padding: 24px;
      }
      
      .header-content {
        flex-direction: column;
        gap: 16px;
      }
      
      .progreso-general {
        min-width: auto;
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .tipos-tramite-grid {
        grid-template-columns: 1fr;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }
      
      .resumen-grid {
        grid-template-columns: 1fr;
      }
      
      .paso-actions {
        flex-direction: column;
      }
      
      .paso-actions button {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .asistente-container {
        padding: 12px;
        gap: 16px;
      }
      
      .asistente-header {
        padding: 20px;
      }
      
      .title-text h1 {
        font-size: 24px;
      }
      
      .paso-content {
        padding: 24px 0;
      }
      
      .paso-header h2 {
        font-size: 20px;
      }
    }

    /* Estilos para Angular Material Stepper */
    :host ::ng-deep {
      .mat-stepper-horizontal {
        margin-top: 0;
      }
      
      .mat-step-header {
        padding: 16px 24px;
      }
      
      .mat-step-icon {
        background-color: #1976d2;
      }
      
      .mat-step-icon-selected {
        background-color: #4caf50;
      }
      
      .mat-step-icon-state-done {
        background-color: #4caf50;
      }
    }
  `]
})
export class AsistenteCreacionResolucionComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private resolucionService = inject(ResolucionService);
  private empresaService = inject(EmpresaService);
  private expedienteService = inject(ExpedienteService);
  private destroy$ = new Subject<void>();

  // Formularios para cada paso
  paso1Form!: FormGroup;
  paso2Form!: FormGroup;
  paso3Form!: FormGroup;
  paso4Form!: FormGroup;

  // Señales para el estado del componente
  pasoActual = signal(0);
  empresaSeleccionada = signal<any>(null);
  tipoTramiteSeleccionado = signal<any>(null);
  resolucionesPadreDisponibles = signal<any[]>([]);
  creando = signal(false);

  // Configuración de pasos
  pasos: PasoAsistente[] = [
    {
      id: 'empresa',
      titulo: 'Seleccionar Empresa',
      descripcion: 'Elige la empresa titular',
      icono: 'business',
      completado: false,
      opcional: false
    },
    {
      id: 'tipo',
      titulo: 'Tipo de Trámite',
      descripcion: 'Define el tipo de resolución',
      icono: 'category',
      completado: false,
      opcional: false
    },
    {
      id: 'padre',
      titulo: 'Resolución Padre',
      descripcion: 'Selecciona la resolución padre',
      icono: 'account_tree',
      completado: false,
      opcional: true
    },
    {
      id: 'datos',
      titulo: 'Datos de Resolución',
      descripcion: 'Completa la información',
      icono: 'description',
      completado: false,
      opcional: false
    },
    {
      id: 'confirmar',
      titulo: 'Confirmar',
      descripcion: 'Revisa y confirma',
      icono: 'check_circle',
      completado: false,
      opcional: false
    }
  ];

  // Tipos de trámite disponibles
  tiposTramiteDisponibles = [
    {
      valor: 'AUTORIZACION_NUEVA',
      nombre: 'Autorización Nueva',
      descripcion: 'Nueva autorización de transporte',
      icono: 'new_releases',
      categoria: 'PADRE',
      requierePadre: false
    },
    {
      valor: 'RENOVACION',
      nombre: 'Renovación',
      descripcion: 'Renovación de autorización existente',
      icono: 'refresh',
      categoria: 'PADRE',
      requierePadre: false
    },
    {
      valor: 'INCREMENTO',
      nombre: 'Incremento',
      descripcion: 'Incremento de flota vehicular',
      icono: 'add_circle',
      categoria: 'HIJO',
      requierePadre: true
    },
    {
      valor: 'SUSTITUCION',
      nombre: 'Sustitución',
      descripcion: 'Sustitución de vehículos',
      icono: 'swap_horiz',
      categoria: 'HIJO',
      requierePadre: true
    }
  ];

  // Computed properties
  requiereResolucionPadre = computed(() => {
    const tipo = this.tipoTramiteSeleccionado();
    return tipo?.requierePadre || false;
  });

  numeroCompleto = computed(() => {
    const numeroBase = this.paso4Form?.get('numeroBase')?.value || '0000';
    const anio = new Date().getFullYear();
    return `R-${numeroBase.padStart(4, '0')}-${anio}`;
  });

  calcularPorcentaje = computed(() => {
    return Math.round(((this.pasoActual() + 1) / this.pasos.length) * 100);
  });

  resumenResolucion = computed(() => {
    if (!this.paso1Form?.valid || !this.paso2Form?.valid || !this.paso4Form?.valid) {
      return null;
    }

    const empresa = this.empresaSeleccionada();
    const tipoTramite = this.tipoTramiteSeleccionado();
    const fechaEmision = this.paso4Form.get('fechaEmision')?.value;
    const fechaInicio = this.paso4Form.get('fechaVigenciaInicio')?.value;
    const aniosVigencia = this.paso4Form.get('aniosVigencia')?.value;

    let fechaFin = null;
    if (fechaInicio && aniosVigencia) {
      fechaFin = new Date(fechaInicio);
      fechaFin.setFullYear(fechaFin.getFullYear() + aniosVigencia);
    }

    const resumen: ResumenResolucion = {
      numeroCompleto: this.numeroCompleto(),
      empresa,
      expediente: null,
      tipoTramite: tipoTramite?.valor || '',
      tipoResolucion: tipoTramite?.categoria || 'PADRE',
      fechaEmision,
      fechaVigenciaInicio: fechaInicio,
      fechaVigenciaFin: fechaFin || undefined,
      descripcion: this.paso4Form.get('descripcion')?.value || '',
      observaciones: this.paso4Form.get('observaciones')?.value
    };

    return resumen;
  });

  ngOnInit(): void {
    this.inicializarFormularios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  private inicializarFormularios(): void {
    this.paso1Form = this.fb.group({
      empresaId: ['', Validators.required]
    });

    this.paso2Form = this.fb.group({
      tipoTramite: ['', Validators.required]
    });

    this.paso3Form = this.fb.group({
      resolucionPadreId: ['']
    });

    this.paso4Form = this.fb.group({
      numeroBase: ['', Validators.required],
      fechaEmision: [new Date(), Validators.required],
      fechaVigenciaInicio: [new Date()],
      aniosVigencia: [2, [Validators.min(1), Validators.max(10)]],
      descripcion: ['', Validators.required],
      observaciones: ['']
    });

    // Suscribirse a cambios en tipo de trámite
    this.paso2Form.get('tipoTramite')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(tipoTramite => {
      const tipo = this.tiposTramiteDisponibles.find(t => t.valor === tipoTramite);
      this.tipoTramiteSeleccionado.set(tipo || null);
      
      if (tipo?.requierePadre) {
        this.paso3Form.get('resolucionPadreId')?.setValidators([Validators.required]);
      } else {
        this.paso3Form.get('resolucionPadreId')?.clearValidators();
      }
      this.paso3Form.get('resolucionPadreId')?.updateValueAndValidity();
    });
  }

  // ========================================
  // NAVEGACIÓN DE PASOS
  // ========================================

  siguientePaso(): void {
    const pasoActual = this.pasoActual();
    
    // Validar paso actual
    if (!this.validarPasoActual()) {
      return;
    }

    // Marcar paso como completado
    this.pasos[pasoActual].completado = true;

    // Avanzar al siguiente paso
    if (pasoActual < this.pasos.length - 1) {
      this.pasoActual.set(pasoActual + 1);
      
      // Cargar datos específicos del paso
      this.cargarDatosPaso(pasoActual + 1);
    }
  }

  pasoAnterior(): void {
    const pasoActual = this.pasoActual();
    if (pasoActual > 0) {
      this.pasoActual.set(pasoActual - 1);
    }
  }

  private validarPasoActual(): boolean {
    const paso = this.pasoActual();
    
    switch (paso) {
      case 0: return this.paso1Form.valid;
      case 1: return this.paso2Form.valid;
      case 2: return !this.requiereResolucionPadre() || this.paso3Form.valid;
      case 3: return this.paso4Form.valid;
      default: return true;
    }
  }

  private cargarDatosPaso(paso: number): void {
    switch (paso) {
      case 2: // Paso de resolución padre
        if (this.requiereResolucionPadre()) {
          this.cargarResolucionesPadre();
        }
        break;
      case 3: // Paso de datos
        this.generarSiguienteNumero();
        break;
    }
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  onEmpresaSeleccionada(empresa: any): void {
    this.empresaSeleccionada.set(empresa);
    this.paso1Form.patchValue({ empresaId: empresa?.id });
  }

  seleccionarTipoTramite(tipoTramite: string): void {
    this.paso2Form.patchValue({ tipoTramite });
  }

  generarDescripcionAutomatica(): void {
    const empresa = this.empresaSeleccionada();
    const tipo = this.tipoTramiteSeleccionado();
    
    if (empresa && tipo) {
      const descripcion = `Resolución de ${tipo.nombre} otorgada a ${empresa.razonSocial?.principal} para el servicio de transporte público de pasajeros.`;
      this.paso4Form.patchValue({ descripcion });
    }
  }

  // ========================================
  // CARGA DE DATOS
  // ========================================

  private cargarResolucionesPadre(): void {
    const empresaId = this.empresaSeleccionada()?.id;
    if (!empresaId) return;

    this.resolucionService.getResolucionesPorEmpresa(empresaId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resoluciones) => {
        // Filtrar solo resoluciones PADRE vigentes
        const padres = resoluciones.filter(r => 
          r.tipoResolucion === 'PADRE' && 
          r.estado === 'VIGENTE' && 
          r.estaActivo
        );
        this.resolucionesPadreDisponibles.set(padres);
      },
      error: (error) => {
        console.error('Error cargando resoluciones padre:', error);
        this.resolucionesPadreDisponibles.set([]);
      }
    });
  }

  private generarSiguienteNumero(): void {
    const anio = new Date().getFullYear();
    
    // Simular obtención del siguiente número
    const siguienteNumero = '0001'; // Por ahora usar número fijo
    this.paso4Form.patchValue({ numeroBase: siguienteNumero });
  }

  // ========================================
  // CREACIÓN DE RESOLUCIÓN
  // ========================================

  async crearResolucion(): Promise<void> {
    if (!this.validarTodosLosPasos()) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    this.creando.set(true);

    try {
      const resolucionData = this.construirDatosResolucion();
      
      const resolucionCreada = await this.resolucionService.createResolucion(resolucionData).toPromise();
      
      this.snackBar.open('✓ Resolución creada exitosamente', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-success']
      });

      // Navegar a la resolución creada
      this.router.navigate(['/resoluciones', resolucionCreada?.id]);
      
    } catch (error) {
      console.error('Error creando resolución:', error);
      this.snackBar.open('Error al crear la resolución. Por favor, intente nuevamente.', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.creando.set(false);
    }
  }

  private validarTodosLosPasos(): boolean {
    return this.paso1Form.valid && 
           this.paso2Form.valid && 
           (!this.requiereResolucionPadre() || this.paso3Form.valid) && 
           this.paso4Form.valid;
  }

  private construirDatosResolucion(): any {
    const empresa = this.empresaSeleccionada();
    const tipoTramite = this.tipoTramiteSeleccionado();
    const numeroBase = this.paso4Form.get('numeroBase')?.value;
    const anio = new Date().getFullYear();
    
    const fechaEmision = this.paso4Form.get('fechaEmision')?.value;
    const fechaInicio = this.paso4Form.get('fechaVigenciaInicio')?.value;
    const aniosVigencia = this.paso4Form.get('aniosVigencia')?.value;
    
    let fechaFin = null;
    if (fechaInicio && aniosVigencia && !this.requiereResolucionPadre()) {
      fechaFin = new Date(fechaInicio);
      fechaFin.setFullYear(fechaFin.getFullYear() + aniosVigencia);
    }

    return {
      nroResolucion: `R-${numeroBase.padStart(4, '0')}-${anio}`,
      empresaId: empresa?.id,
      expedienteId: `asistente_${Date.now()}`, // ID temporal
      fechaEmision,
      fechaVigenciaInicio: fechaInicio,
      fechaVigenciaFin: fechaFin,
      tipoResolucion: tipoTramite?.categoria,
      tipoTramite: tipoTramite?.valor,
      resolucionPadreId: this.paso3Form.get('resolucionPadreId')?.value || null,
      descripcion: this.paso4Form.get('descripcion')?.value,
      observaciones: this.paso4Form.get('observaciones')?.value,
      vehiculosHabilitadosIds: [],
      rutasAutorizadasIds: []
    };
  }

  // ========================================
  // UTILIDADES
  // ========================================

  formatearFecha(fecha: Date | string | null): string {
    if (!fecha) return 'N/A';
    
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}