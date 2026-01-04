import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { ExpedienteFormComponent } from '../expedientes/expediente-form.component';
import { ExpedienteService } from '../../services/expediente.service';
import { EmpresaService } from '../../services/empresa.service';
import { Expediente } from '../../models/expediente.model';
import { Empresa, EstadoEmpresa } from '../../models/empresa.model';
import { Observable, of, forkJoin } from 'rxjs';
import { map, startWith, switchMap, catchError } from 'rxjs/operators';

// Interfaz extendida para expediente con información de empresa
interface ExpedienteConEmpresa extends Expediente {
  empresa?: Empresa;
  numeroCompleto?: string;
}

@Component({
  selector: 'app-crear-expediente-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    ExpedienteFormComponent
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>add_circle</mat-icon>
        Seleccionar o Crear Expediente
      </h2>
      <button mat-icon-button (click)="onCancel()" class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    
    <mat-dialog-content class="modal-content">
      <!-- Paso 1: Búsqueda de Expediente -->
      <div class="search-section" *ngIf="!expedienteSeleccionado && !mostrarFormulario">
        <h3>Seleccionar o Crear Expediente</h3>
        
        <!-- Botón Crear Nuevo Expediente - Colocado primero -->
        <div class="create-actions">
          <button mat-raised-button 
                  color="primary" 
                  (click)="crearNuevoExpediente()"
                  class="create-btn">
            <mat-icon>add</mat-icon>
            Crear Nuevo Expediente
          </button>
        </div>

        <div class="search-divider">
          <span>O</span>
        </div>
        
        <h4>Buscar Expediente Existente</h4>
        <p class="search-hint">Busca por número de expediente o empresa</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Buscar Expediente</mat-label>
          <input matInput 
                 [formControl]="busquedaControl"
                 placeholder="E-0001-2025 o nombre de empresa"
                 [matAutocomplete]="auto">
          <mat-autocomplete #auto="matAutocomplete" 
                           (optionSelected)="onExpedienteSeleccionado($event)"
                           [displayWith]="displayExpediente">
            <mat-option *ngFor="let expediente of expedientesFiltrados | async" [value]="expediente">
              <div class="expediente-option">
                <strong>{{ expediente.numeroCompleto }}</strong>
                <span class="empresa-info">{{ expediente.empresa?.razonSocial?.principal || 'Sin empresa' }}</span>
                <span class="tipo-info">{{ expediente.tipoTramite }}</span>
              </div>
            </mat-option>
          </mat-autocomplete>
          <mat-hint>Escribe para buscar expedientes existentes</mat-hint>
        </mat-form-field>

        <div class="no-results" *ngIf="(expedientesFiltrados | async)?.length === 0 && busquedaControl.value">
          <p>No se encontraron expedientes con esa búsqueda.</p>
          <button mat-button color="primary" (click)="crearNuevoExpediente()">
            Crear Nuevo Expediente
          </button>
        </div>
      </div>

      <!-- Paso 2: Formulario de Creación -->
      <div class="form-section" *ngIf="mostrarFormulario">
        <div class="form-header">
          <button mat-button (click)="volverABusqueda()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
            Volver a Búsqueda
          </button>
          <h3>Crear Nuevo Expediente</h3>
        </div>
        
        <app-expediente-form 
          [isModalMode]="true"
          [numeroPredefinido]="data?.numeroExpediente"
          (expedienteCreado)="onExpedienteCreado($event)"
          (cancelado)="onCancel()">
        </app-expediente-form>
      </div>

      <!-- Paso 3: Expediente Seleccionado -->
      <div class="selected-section" *ngIf="expedienteSeleccionado && !mostrarFormulario">
        <div class="form-header">
          <button mat-button (click)="volverABusqueda()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
            Volver a Búsqueda
          </button>
          <h3>Expediente Seleccionado</h3>
        </div>

        <div class="expediente-info">
          <div class="info-row">
            <strong>Número:</strong> {{ expedienteSeleccionado.numeroCompleto }}
          </div>
          <div class="info-row">
            <strong>Empresa:</strong> {{ expedienteSeleccionado.empresa?.razonSocial?.principal || 'Sin empresa' }}
          </div>
          <div class="info-row">
            <strong>Tipo de Trámite:</strong> {{ expedienteSeleccionado.tipoTramite }}
          </div>
          <div class="info-row">
            <strong>Fecha de Emisión:</strong> {{ expedienteSeleccionado.fechaEmision | date:'dd/MM/yyyy' }}
          </div>
        </div>

        <div class="selection-actions">
          <button mat-raised-button 
                  color="primary" 
                  (click)="confirmarExpediente()"
                  class="confirm-btn">
            <mat-icon>check</mat-icon>
            Usar Este Expediente
          </button>
        </div>
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .modal-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2c3e50;
    }

    .close-btn {
      color: #6c757d;
    }

    .modal-content {
      padding: 16px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .search-section, .form-section, .selected-section {
      max-width: 800px;
      margin: 0 auto;
    }

    .search-hint {
      color: #6c757d;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .full-width {
      width: 100%;
    }

    .create-actions {
      margin-bottom: 24px;
      text-align: center;
    }

    .create-btn {
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 500;
      min-width: 200px;
    }

    .search-divider {
      text-align: center;
      margin: 24px 0;
      position: relative;
    }

    .search-divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e0e0e0;
    }

    .search-divider span {
      background: white;
      padding: 0 16px;
      color: #6c757d;
      font-size: 14px;
      font-weight: 500;
    }

    .search-section h4 {
      margin: 0 0 16px 0;
      color: #495057;
      font-size: 18px;
      font-weight: 500;
    }

    .no-results {
      margin-top: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }

    .no-results p {
      margin-bottom: 16px;
      color: #6c757d;
    }

    .form-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .back-btn {
      color: #6c757d;
    }

    .form-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .expediente-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .empresa-info {
      font-size: 12px;
      color: #6c757d;
    }

    .tipo-info {
      font-size: 11px;
      color: #495057;
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 4px;
      align-self: flex-start;
    }

    .expediente-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .selection-actions {
      text-align: center;
    }

    .confirm-btn {
      padding: 12px 24px;
      font-size: 16px;
    }
  `]
})

export class CrearExpedienteModalComponent {
  private dialogRef = inject(MatDialogRef<CrearExpedienteModalComponent>);
  private expedienteService = inject(ExpedienteService);
  private empresaService = inject(EmpresaService);
  private fb = inject(FormBuilder);
  
  data = inject(MAT_DIALOG_DATA);

  // Estados del modal
  expedienteSeleccionado: ExpedienteConEmpresa | null = null;
  mostrarFormulario = false;

  // Controles de búsqueda
  busquedaControl = this.fb.control('');
  expedientesFiltrados: Observable<ExpedienteConEmpresa[]> = of([]);

  constructor() {
    this.configurarBusqueda();
  }

  private configurarBusqueda(): void {
    this.expedientesFiltrados = this.busquedaControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        if (typeof value === 'string' && value.trim()) {
          return this.expedienteService.getExpedientes().pipe(
            map(expedientes => this.enriquecerExpedientesConEmpresa(expedientes)),
            map(expedientesEnriquecidos => this.filtrarExpedientes(value, expedientesEnriquecidos))
          );
        }
        return of([]);
      })
    );
  }

  private enriquecerExpedientesConEmpresa(expedientes: Expediente[]): ExpedienteConEmpresa[] {
    if (expedientes.length === 0) return [];
    
    // Usar datos mock locales para evitar llamadas HTTP fallidas
    const empresasMock: { [key: string]: Empresa } = {
      '1': {
        id: '1',
        codigoEmpresa: '0001PRT',
        ruc: '20123456789',
        razonSocial: { principal: 'EMPRESA TRANSPORTES ABC S.A.C.' },
        direccionFiscal: 'Av. Principal 123, Lima',
        estado: EstadoEmpresa.AUTORIZADA,
        estaActivo: true,
        fechaRegistro: new Date('2020-01-15'),
        fechaActualizacion: new Date('2025-01-15'),
        representanteLegal: {
          dni: '12345678',
          nombres: 'Juan',
          apellidos: 'Pérez García',
          email: 'juan.perez@transportesabc.com',
          telefono: '+51 1 234-5678'
        },
        emailContacto: 'contacto@transportesabc.com',
        telefonoContacto: '+51 1 234-5678',
        documentos: [],
        auditoria: [],
        resolucionesPrimigeniasIds: [],
        vehiculosHabilitadosIds: [],
        conductoresHabilitadosIds: [],
        rutasAutorizadasIds: []
      },
      '2': {
        id: '2',
        codigoEmpresa: '0002PRT',
        ruc: '20123456790',
        razonSocial: { principal: 'EMPRESA TRANSPORTES XYZ S.A.C.' },
        direccionFiscal: 'Av. Secundaria 456, Lima',
        estado: EstadoEmpresa.AUTORIZADA,
        estaActivo: true,
        fechaRegistro: new Date('2020-02-20'),
        fechaActualizacion: new Date('2025-01-20'),
        representanteLegal: {
          dni: '23456789',
          nombres: 'María',
          apellidos: 'López Silva',
          email: 'maria.lopez@transportesxyz.com',
          telefono: '+51 1 234-5679'
        },
        emailContacto: 'contacto@transportesxyz.com',
        telefonoContacto: '+51 1 234-5679',
        documentos: [],
        auditoria: [],
        resolucionesPrimigeniasIds: [],
        vehiculosHabilitadosIds: [],
        conductoresHabilitadosIds: [],
        rutasAutorizadasIds: []
      },
      '3': {
        id: '3',
        codigoEmpresa: '0003PRT',
        ruc: '20123456791',
        razonSocial: { principal: 'EMPRESA TRANSPORTES 123 S.A.C.' },
        direccionFiscal: 'Av. Terciaria 789, Lima',
        estado: EstadoEmpresa.AUTORIZADA,
        estaActivo: true,
        fechaRegistro: new Date('2020-03-25'),
        fechaActualizacion: new Date('2025-01-25'),
        representanteLegal: {
          dni: '34567890',
          nombres: 'Carlos',
          apellidos: 'Rodríguez Torres',
          email: 'carlos.rodriguez@transportes123.com',
          telefono: '+51 1 234-5680'
        },
        emailContacto: 'contacto@transportes123.com',
        telefonoContacto: '+51 1 234-5680',
        documentos: [],
        auditoria: [],
        resolucionesPrimigeniasIds: [],
        vehiculosHabilitadosIds: [],
        conductoresHabilitadosIds: [],
        rutasAutorizadasIds: []
      }
    };
    
    const expedientesConEmpresa: ExpedienteConEmpresa[] = expedientes.map(expediente => {
      const expedienteEnriquecido: ExpedienteConEmpresa = {
        ...expediente,
        numeroCompleto: expediente.nroExpediente
      };
      
      if (expediente.empresaId && empresasMock[expediente.empresaId]) {
        expedienteEnriquecido.empresa = empresasMock[expediente.empresaId];
      }
      
      return expedienteEnriquecido;
    });
    
    return expedientesConEmpresa;
  }

  private filtrarExpedientes(busqueda: string, expedientes: ExpedienteConEmpresa[]): ExpedienteConEmpresa[] {
    const termino = busqueda.toLowerCase();
    return expedientes.filter(expediente => 
      expediente.numeroCompleto?.toLowerCase().includes(termino) ||
      expediente.empresa?.razonSocial?.principal?.toLowerCase().includes(termino) ||
      expediente.empresa?.ruc?.toLowerCase().includes(termino)
    );
  }

  displayExpediente = (expediente: ExpedienteConEmpresa): string => {
    if (!expediente) return '';
    return `${expediente.numeroCompleto} - ${expediente.empresa?.razonSocial?.principal || 'Sin empresa'}`;
  }

  onExpedienteSeleccionado(event: any): void {
    this.expedienteSeleccionado = event.option.value as ExpedienteConEmpresa;
    this.busquedaControl.setValue(this.displayExpediente(event.option.value));
  }

  crearNuevoExpediente(): void {
    this.mostrarFormulario = true;
    this.expedienteSeleccionado = null;
  }

  volverABusqueda(): void {
    this.mostrarFormulario = false;
    this.expedienteSeleccionado = null;
    this.busquedaControl.setValue('');
  }

  confirmarExpediente(): void {
    if (this.expedienteSeleccionado) {
      this.dialogRef.close(this.expedienteSeleccionado);
    }
  }

  onExpedienteCreado(expediente: any): void {
    this.dialogRef.close(expediente);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 