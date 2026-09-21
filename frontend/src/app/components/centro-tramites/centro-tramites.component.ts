import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EmpresaService } from '../../services/empresa.service';
import { FlotaEmpresaService } from '../../services/flota-empresa.service';
import { ResolucionPrimigenia } from '../../models/resolucion-primigenia.model';
import { BusquedaGlobalService } from '../../services/busqueda-global.service';
import { VehiculoModalComponent } from './vehiculo-modal.component';
import { SustitucionModalComponent } from './sustitucion-modal.component';

@Component({
  selector: 'app-centro-tramites',
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
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './centro-tramites.component.html',
  styleUrls: ['./centro-tramites.component.scss']
})
export class CentroTramites {
  @ViewChild('searchInput') searchInput!: ElementRef;

  private fb = inject(FormBuilder);
  private flotaService = inject(FlotaEmpresaService);
  private empresaService = inject(EmpresaService);
  private busquedaGlobalService = inject(BusquedaGlobalService);
  private dialog = inject(MatDialog);

  enfocarBuscador() {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  // States for Wizard
  empresaBuscada = signal<any>(null);
  tramiteSeleccionado = signal<string | null>(null);
  resoluciones = signal<ResolucionPrimigenia[]>([]);
  vehiculos = signal<any[]>([]);
  vehiculosEnResolucion = signal<any[]>([]);
  resolucionSeleccionada = signal<ResolucionPrimigenia | null>(null);
  
  // States for Step 2 Data
  vehiculosNuevos = signal<any[]>([]);
  paresSustitucion = signal<any[]>([]);

  abrirModalVehiculo() {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.vehiculosNuevos.update(v => [...v, result]);
      }
    });
  }

  abrirModalSustitucion() {
    const dialogRef = this.dialog.open(SustitucionModalComponent, {
      width: '600px',
      data: { vehiculosDisponibles: this.vehiculosEnResolucion() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.paresSustitucion.update(p => [...p, result]);
      }
    });
  }

  // States for Dashboard
  estadisticas = signal({
    total: 1245,
    renovaciones: 340,
    sustituciones: 512,
    incrementos: 150
  });

  tramitesRecientes = signal<any[]>([
    { id: 'TR-1024-2026', fecha: '21/09/2026', empresa: 'TRANSANDINA DEL SUR S.A.C.', tipo: 'SUSTITUCION', doc: 'E-1234-2026', estado: 'PROCESADO' },
    { id: 'TR-1023-2026', fecha: '20/09/2026', empresa: 'EXPRESO TITICACA S.R.L.', tipo: 'RENOVACION', doc: 'E-1233-2026', estado: 'PROCESADO' },
    { id: 'TR-1022-2026', fecha: '18/09/2026', empresa: 'TURISMO MER E.I.R.L.', tipo: 'BAJAS', doc: 'O-0089-2026', estado: 'OBSERVADO' },
    { id: 'TR-1021-2026', fecha: '15/09/2026', empresa: 'TRANSPORTES SAN MARTIN', tipo: 'INCREMENTO', doc: 'M-1120-2026', estado: 'PROCESADO' }
  ]);

  columnasTabla = ['id', 'fecha', 'empresa', 'tipo', 'doc', 'estado', 'acciones'];

  tiposTramite = [
    { id: 'RENOVACION', nombre: 'Renovación', icono: 'autorenew', desc: 'Extensión de vigencia' },
    { id: 'SUSTITUCION', nombre: 'Sustitución', icono: 'sync_alt', desc: 'Reemplazo de unidad' },
    { id: 'INCREMENTO', nombre: 'Incremento', icono: 'trending_up', desc: 'Nuevas unidades' },
    { id: 'DUPLICADO', nombre: 'Duplicado', icono: 'file_copy', desc: 'Emisión de copia' },
    { id: 'CANJE', nombre: 'Canje', icono: 'change_circle', desc: 'Actualización' },
    { id: 'BAJAS', nombre: 'Bajas', icono: 'remove_circle', desc: 'Retiro definitivo' },
    { id: 'CANCELACION', nombre: 'Cancelación', icono: 'cancel', desc: 'Cese de autorización' },
    { id: 'MODIFICACION', nombre: 'Modificación', icono: 'tune', desc: 'Cambios de itinerario' }
  ];

  // Forms
  busquedaForm = this.fb.group({
    criterio: ['', [Validators.required, Validators.minLength(3)]]
  });

  datosOrigenForm = this.fb.group({
    tipo_origen: ['EXPEDIENTE'],
    numero_origen: [''],
    fecha_origen: ['']
  });

  resolucionForm = this.fb.group({
    nro_resolucion_primigenia: ['', Validators.required]
  });

  cambiarTipoOrigen() {
    let current = this.datosOrigenForm.get('numero_origen')?.value;
    if (current && current.includes('-')) {
      const parts = current.split('-');
      if (parts.length === 3) {
        const num = parts[1];
        const anio = parts[2];
        const tipo = this.datosOrigenForm.get('tipo_origen')?.value;
        let prefijo = 'E';
        if (tipo === 'OFICIO') prefijo = 'O';
        if (tipo === 'MEMORANDUM') prefijo = 'M';
        this.datosOrigenForm.get('numero_origen')?.setValue(`${prefijo}-${num}-${anio}`);
      }
    }
  }

  normalizarNumero() {
    let num = this.datosOrigenForm.get('numero_origen')?.value;
    if (!num || num.includes('-')) return;

    const numPadded = num.toString().padStart(4, '0');
    const anio = new Date().getFullYear();
    const tipo = this.datosOrigenForm.get('tipo_origen')?.value;
    
    let prefijo = 'E';
    if (tipo === 'OFICIO') prefijo = 'O';
    if (tipo === 'MEMORANDUM') prefijo = 'M';

    this.datosOrigenForm.get('numero_origen')?.setValue(`${prefijo}-${numPadded}-${anio}`);
  }

  async buscarEmpresa() {
    if (this.busquedaForm.invalid) return;
    const criterio = this.busquedaForm.value.criterio?.trim() || '';
    
    // Si es RUC exacto de 11 dígitos, buscar directo
    const esRuc = criterio.length === 11 && !isNaN(Number(criterio));
    if (esRuc) {
      this.empresaService.getEmpresaByRuc(criterio).subscribe({
        next: (emp) => this.setEmpresaFromData(emp),
        error: (err) => console.error(err)
      });
      return;
    }

    // Si no es RUC exacto, usamos BusquedaGlobalService
    this.busquedaGlobalService.buscar(criterio, 5).subscribe({
      next: (resp) => {
        // Prioridad 1: Resoluciones
        if (resp.resultados.resoluciones.length > 0) {
          const ruc = resp.resultados.resoluciones[0].data?.['ruc_empresa'];
          const nroRes = resp.resultados.resoluciones[0].data?.['nro_resolucion'];
          if (ruc) {
            this.empresaService.getEmpresaByRuc(ruc).subscribe({
              next: (emp) => {
                this.setEmpresaFromData(emp);
                // Preseleccionar resolución después de que se cargue
                setTimeout(() => {
                  if (nroRes) {
                    this.resolucionForm.get('nro_resolucion_primigenia')?.setValue(nroRes);
                  }
                }, 800);
              }
            });
            return;
          }
        }
        
        // Prioridad 2: Empresas
        if (resp.resultados.empresas.length > 0) {
          const ruc = resp.resultados.empresas[0].data?.['ruc'];
          if (ruc) {
            this.empresaService.getEmpresaByRuc(ruc).subscribe({
              next: (emp) => this.setEmpresaFromData(emp)
            });
            return;
          }
        }
        
        console.warn('No se encontraron coincidencias para:', criterio);
      },
      error: (err) => console.error(err)
    });
  }

  private setEmpresaFromData(emp: any) {
    this.empresaBuscada.set({
      ruc: emp.ruc,
      razon_social: typeof emp.razonSocial === 'object' ? emp.razonSocial?.principal : emp.razonSocial,
      estado: emp.estado,
      flota: 0, // Mock por ahora
      vigencia: 'N/A' // Obtener de la resolución si es necesario
    });
    
    // Obtener las resoluciones de la empresa o flota
    this.flotaService.getResumenEmpresas().subscribe({
      next: (res) => {
        const empresaResumen = res.data.find(r => r.ruc === emp.ruc);
        if (empresaResumen) {
          this.empresaBuscada.update(e => ({...e, flota: empresaResumen.total_vehiculos}));
          
          if (empresaResumen.primigenias && empresaResumen.primigenias.length > 0) {
             const resolucionesMock = empresaResumen.primigenias.map(p => ({
               id: p, nro_resolucion: p, fecha_resolucion: new Date(), ruc_empresa: emp.ruc, estado: 'VIGENTE'
             }));
             this.resoluciones.set(resolucionesMock as any);
          } else {
            this.resoluciones.set([]);
          }
        }
      }
    });

    // Escuchar cambios en la resolución para cargar vehículos
    this.resolucionForm.get('nro_resolucion_primigenia')?.valueChanges.subscribe(res => {
      if (res) {
        this.cargarVehiculosResolucion(res);
      }
    });
  }

  cargarVehiculosResolucion(nroRes: string) {
    this.flotaService.getFlotaPaginada({ nro_resolucion_primigenia: nroRes, solo_activos: true, limit: 100 }).subscribe({
      next: (res) => {
        this.vehiculosEnResolucion.set(res.data || []);
      },
      error: (err) => {
        console.error('Error al cargar vehículos', err);
        this.vehiculosEnResolucion.set([]);
      }
    });
  }

  cancelarTramite() {
    this.empresaBuscada.set(null);
    this.tramiteSeleccionado.set(null);
    this.busquedaForm.reset();
  }

  seleccionarTramite(id: string) {
    this.tramiteSeleccionado.set(id);
  }

  eliminarVehiculoNuevo(index: number) {
    this.vehiculosNuevos.update(v => v.filter((_, i) => i !== index));
  }

  eliminarParSustitucion(index: number) {
    this.paresSustitucion.update(p => p.filter((_, i) => i !== index));
  }

  confirmar() {
    console.log('Guardando trámite...');
    // TODO: Lógica de guardado a backend
  }
}
