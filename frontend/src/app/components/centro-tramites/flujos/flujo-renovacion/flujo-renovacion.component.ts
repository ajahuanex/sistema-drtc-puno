import { Component, inject, signal, computed, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { VehiculoDataService } from '../../../../services/vehiculo-data.service';
import { TucService } from '../../../../services/tuc.service';
import { RutaModalComponent } from '../../ruta-modal.component';
import { VehiculoModalComponent, calcularCompletitudVehiculo, enriquecerFichaTecnica } from '../../vehiculo-modal.component';
import { evaluarPermanenciaVehiculo, EvaluacionPermanencia } from '../../../../utils/permanencia.utils';

@Component({
  selector: 'app-flujo-renovacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './flujo-renovacion.component.html',
  styleUrls: ['./flujo-renovacion.component.scss']
})
export class FlujoRenovacionComponent {
  private vehiculoDataService = inject(VehiculoDataService);
  private tucService = inject(TucService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Inputs / Two-way models
  renovacionForm = input.required<FormGroup>();
  vehiculos = model<any[]>([]);
  rutasEmpresaActual = model<any[]>([]);
  rutasSeleccionadas = model<string[]>([]);
  duracionAnios = model<number>(4);
  vehiculosEnResolucion = input<any[]>([]);
  cargandoRutas = input<boolean>(false);
  empresaSeleccionada = input<any>(null);

  // Output events
  solicitarPantallaCompleta = output<void>();

  // Collapsible section states
  grupoVigenciaColapsado = signal<boolean>(false);
  grupoRutasColapsado = signal<boolean>(false);
  grupoFlotaColapsado = signal<boolean>(false);
  tablaFlotaExpandidaPaso3 = signal<boolean>(false);

  // Excel input state
  modoCargaVehiculosRenovacion = signal<'PRECARGADA' | 'MULTIFILA'>('PRECARGADA');
  lineasExcelInput = signal<string>('');
  procesandoLineasExcel = signal<boolean>(false);

  // Computeds
  vehiculosRenovacionSeleccionadosCount = computed(() => {
    return this.vehiculos().filter(v => v.seleccionado).length;
  });

  // Evaluador de Régimen de Permanencia Vehicular (MTC / Puno)
  obtenerPermanencia(v: any): EvaluacionPermanencia {
    const anio = v?.anio_fabricacion || v?.anio_modelo || v?.ano_fabricacion || v?.anio;
    return evaluarPermanenciaVehiculo(anio);
  }

  toggleColapsoVigencia() {
    this.grupoVigenciaColapsado.update(v => !v);
  }

  toggleColapsoRutas() {
    this.grupoRutasColapsado.update(v => !v);
  }

  toggleColapsoFlota() {
    this.grupoFlotaColapsado.update(v => !v);
  }

  // Rutas handlers
  toggleRutaRenovacion(codigo: string) {
    this.rutasSeleccionadas.update(rutas =>
      rutas.includes(codigo) ? rutas.filter(r => r !== codigo) : [...rutas, codigo]
    );
  }

  isRutaRenovacionSeleccionada(codigo: string): boolean {
    return this.rutasSeleccionadas().includes(codigo);
  }

  seleccionarTodasRutasRenovacion(seleccionar: boolean) {
    if (seleccionar) {
      const todosCodigos = this.rutasEmpresaActual().map(r => r.codigoRuta || r.codigo);
      this.rutasSeleccionadas.set(todosCodigos);
    } else {
      this.rutasSeleccionadas.set([]);
    }
  }

  abrirModalEditarRuta(ruta: any, index: number) {
    const rutaParaEditar = {
      ...ruta,
      itinerario: this.formatearItinerario(ruta.itinerario)
    };
    const dialogRef = this.dialog.open(RutaModalComponent, {
      width: '520px',
      data: { ruta: rutaParaEditar, isNew: false }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const codOriginal = ruta.codigoRuta || ruta.codigo;
        const nuevoCod = res.codigoRuta;
        
        this.rutasEmpresaActual.update(rutas =>
          rutas.map((r, i) => i === index ? { ...r, ...res } : r)
        );

        this.rutasSeleccionadas.update(sel => {
          if (sel.includes(codOriginal)) {
            return sel.map(c => c === codOriginal ? nuevoCod : c);
          } else {
            return [...sel, nuevoCod];
          }
        });

        this.snackBar.open(`✓ Ruta ${nuevoCod} actualizada`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarRutaRenovacion(ruta: any, index: number) {
    const cod = ruta.codigoRuta || ruta.codigo;
    if (confirm(`¿Está seguro de quitar la Ruta ${cod} de esta renovación? No será ratificada ni clonada para la nueva resolución.`)) {
      this.rutasEmpresaActual.update(rutas => rutas.filter((_, i) => i !== index));
      this.rutasSeleccionadas.update(sel => sel.filter(c => c !== cod));
      this.snackBar.open(`Ruta ${cod} eliminada de la renovación`, 'Cerrar', { duration: 3000 });
    }
  }

  abrirModalNuevaRuta() {
    const dialogRef = this.dialog.open(RutaModalComponent, {
      width: '520px',
      data: { isNew: true }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const cod = res.codigoRuta;
        this.rutasEmpresaActual.update(rutas => [...rutas, res]);
        this.rutasSeleccionadas.update(sel => [...sel, cod]);
        this.snackBar.open(`✓ Nueva Ruta ${cod} agregada`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Flota mode & Excel parsing
  setModoCargaVehiculos(modo: 'PRECARGADA' | 'MULTIFILA') {
    this.modoCargaVehiculosRenovacion.set(modo);
  }

  onLineasExcelChange(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.lineasExcelInput.set(val);
  }

  procesarLineasExcelRenovacion() {
    const texto = this.lineasExcelInput().trim();
    if (!texto) {
      this.snackBar.open('Pegue las líneas de placas desde Excel', 'Cerrar', { duration: 3000 });
      return;
    }

    this.procesandoLineasExcel.set(true);
    const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const nuevosVehiculos: any[] = [];
    const anterioresMap = new Map<string, any>();
    for (const v of this.vehiculosEnResolucion()) {
      if (v.placa) anterioresMap.set(v.placa.replace(/[\s-]/g, '').toUpperCase(), v);
    }

    let ordenContador = 1;
    for (const linea of lineas) {
      const tokens = linea.split(/[\t\s]+/).filter(t => t.trim().length > 0);
      if (tokens.length === 0) continue;

      let placaToken = '';
      let rutasTokens: string[] = [];

      let placaIdx = tokens.findIndex(t => /^[A-Z0-9]{3}-?[A-Z0-9]{3}$/i.test(t));
      if (placaIdx !== -1) {
        placaToken = tokens[placaIdx];
        const resto = tokens.filter((_, idx) => idx !== placaIdx);
        rutasTokens = resto.join(',').split(',').map(r => r.trim()).filter(r => r.length > 0);
      } else {
        if (/^\d+$/.test(tokens[0]) && tokens.length > 1) {
          placaToken = tokens[1];
          rutasTokens = tokens.slice(2).join(',').split(',').map(r => r.trim()).filter(r => r.length > 0);
        } else {
          placaToken = tokens[0];
          rutasTokens = tokens.slice(1).join(',').split(',').map(r => r.trim()).filter(r => r.length > 0);
        }
      }

      let cleanPlaca = placaToken.replace(/[\s-]/g, '').toUpperCase();
      if (cleanPlaca.length === 6) {
        cleanPlaca = `${cleanPlaca.substring(0, 3)}-${cleanPlaca.substring(3)}`;
      }

      const cleanRutas = rutasTokens.map(r => {
        const num = r.replace(/\D/g, '');
        return num.length === 1 ? `0${num}` : r.toUpperCase();
      });

      const rawKey = cleanPlaca.replace(/[\s-]/g, '');
      const anterior = anterioresMap.get(rawKey);

      const itemVehiculo: any = enriquecerFichaTecnica({
        orden: ordenContador++,
        seleccionado: true,
        placa: cleanPlaca,
        rutas: cleanRutas.length > 0 ? cleanRutas : (anterior?.rutas || []),
        numero_tuc: anterior?.numero_tuc || ''
      }, anterior);

      nuevosVehiculos.push(itemVehiculo);
    }

    this.vehiculos.set(nuevosVehiculos);
    this.procesandoLineasExcel.set(false);
    this.snackBar.open(`✓ ${nuevosVehiculos.length} vehículos procesados con éxito`, 'Entendido', { duration: 4000 });

    for (const v of nuevosVehiculos) {
      if (v.placa) {
        this.vehiculoDataService.getVehiculoDataByPlaca(v.placa).subscribe({
          next: (res) => {
            if (res && res.success && res.data) {
              this.vehiculos.update(lista =>
                lista.map(item => item.placa === v.placa ? enriquecerFichaTecnica(item, res.data) : item)
              );
            }
          }
        });
      }
    }
  }

  // Vehicles selection & editing
  toggleVehiculoRenovacion(index: number) {
    this.vehiculos.update(lista =>
      lista.map((item, i) => i === index ? { ...item, seleccionado: !item.seleccionado } : item)
    );
  }

  toggleTodosVehiculosRenovacion(seleccionar?: boolean) {
    const nuevoEstado = seleccionar !== undefined ? seleccionar : !this.estanTodosVehiculosRenovacionSeleccionados();
    this.vehiculos.update(lista =>
      lista.map(item => ({ ...item, seleccionado: nuevoEstado }))
    );
  }

  estanTodosVehiculosRenovacionSeleccionados(): boolean {
    const list = this.vehiculos();
    return list.length > 0 && list.every(v => v.seleccionado);
  }

  actualizarTucVehiculo(index: number, event: Event) {
    const val = (event.target as HTMLInputElement).value.trim().toUpperCase();
    this.vehiculos.update(lista =>
      lista.map((item, i) => i === index ? { ...item, numero_tuc: val } : item)
    );
  }

  generarTucIndividual(index: number) {
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const siguiente = res?.siguienteNroTuc || 'T-000001';
        this.vehiculos.update(lista =>
          lista.map((item, i) => i === index ? { ...item, numero_tuc: siguiente } : item)
        );
        this.snackBar.open(`✓ TUC Física ${siguiente} asignada`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        const num = String(index + 1).padStart(6, '0');
        const fallback = `T-${num}`;
        this.vehiculos.update(lista =>
          lista.map((item, i) => i === index ? { ...item, numero_tuc: fallback } : item)
        );
        this.snackBar.open(`✓ TUC Física ${fallback} asignada`, 'Cerrar', { duration: 2500 });
      }
    });
  }

  generarTucsMasivos(mostrarNotificacion: boolean = true) {
    const seleccionados = this.vehiculos().filter(v => v.seleccionado);
    if (seleccionados.length === 0) {
      if (mostrarNotificacion) {
        this.snackBar.open('Seleccione al menos un vehículo para asignar TUCs', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.asignarTucsSecuenciales(sig, mostrarNotificacion);
      },
      error: () => {
        this.asignarTucsSecuenciales('T-000001', mostrarNotificacion);
      }
    });
  }

  private asignarTucsSecuenciales(tucInicial: string, mostrarNotificacion: boolean = true) {
    const match = tucInicial.match(/^([A-Za-z]+-?)(\d+)(.*)$/);
    let prefijo = 'T-';
    let baseNum = 1;
    let sufijo = '';

    if (match) {
      prefijo = match[1];
      baseNum = parseInt(match[2], 10) || 1;
      sufijo = match[3] || '';
    }

    let contador = baseNum;
    let totalAsignados = 0;
    let primerTuc = '';

    this.vehiculos.update(lista => {
      return lista.map(v => {
        if (!v.seleccionado) return v;
        const numStr = String(contador).padStart(6, '0');
        const nuevoTuc = `${prefijo}${numStr}${sufijo}`;
        if (!primerTuc) primerTuc = nuevoTuc;
        contador++;
        totalAsignados++;
        return { ...v, numero_tuc: nuevoTuc };
      });
    });

    const ultimoTuc = `${prefijo}${String(contador - 1).padStart(6, '0')}${sufijo}`;
    if (mostrarNotificacion) {
      this.snackBar.open(
        `✓ Se asignaron ${totalAsignados} nuevas TUCs Físicas correlativas (${primerTuc} al ${ultimoTuc})`,
        'Cerrar',
        { duration: 4000 }
      );
    }
  }

  abrirVerificacionTecnica(v: any, index: number) {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '740px',
      maxWidth: '95vw',
      panelClass: 'modal-vehiculo-overlay-elevado',
      data: {
        vehiculo: v,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (res) {
        this.vehiculos.update(lista =>
          lista.map((item, i) => i === index ? enriquecerFichaTecnica(item, res) : item)
        );
        this.snackBar.open(`✓ Ficha técnica actualizada para ${v.placa}`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  calcularCompletitud(v: any): number {
    return v?.porcentaje_completitud ?? calcularCompletitudVehiculo(v);
  }

  abrirPantallaCompleta() {
    this.solicitarPantallaCompleta.emit();
  }

  // Formatters
  formatoFechaLatina(fechaStr: string | null | undefined): string {
    if (!fechaStr) return '-';
    const str = String(fechaStr).trim();
    if (!str) return '-';
    const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return str;
  }

  formatearLugar(lugar: any): string {
    if (!lugar) return '';
    if (typeof lugar === 'string') {
      return (lugar.includes('[object') || lugar.includes('[OBJECT')) ? '' : lugar;
    }
    if (typeof lugar === 'object') {
      return lugar.nombre || lugar.distrito || lugar.localidad || lugar.provincia || lugar.descripcion || '';
    }
    return String(lugar);
  }

  formatearItinerario(itinerario: any): string {
    if (!itinerario) return '';
    if (Array.isArray(itinerario)) {
      return itinerario
        .map(item => {
          if (!item) return '';
          if (typeof item === 'string') {
            if (item.includes('[object Object]') || item.includes('[OBJECT OBJECT]')) return '';
            return item;
          }
          if (typeof item === 'object') {
            return item.punto || item.nombre || item.localidad || item.distrito || item.descripcion || '';
          }
          return String(item);
        })
        .filter(Boolean)
        .join(' - ');
    }
    return String(itinerario);
  }
}
