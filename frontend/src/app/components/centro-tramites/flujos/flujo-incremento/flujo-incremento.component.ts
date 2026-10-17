import { Component, inject, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { VehiculoDataService } from '../../../../services/vehiculo-data.service';
import { FlotaEmpresaService } from '../../../../services/flota-empresa.service';
import { TucService } from '../../../../services/tuc.service';
import { VehiculoModalComponent } from '../../vehiculo-modal.component';

@Component({
  selector: 'app-flujo-incremento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './flujo-incremento.component.html',
  styleUrls: ['./flujo-incremento.component.scss']
})
export class FlujoIncrementoComponent {
  private flotaService = inject(FlotaEmpresaService);
  private tucService = inject(TucService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Inputs / Two-way models
  vehiculos = model<any[]>([]);
  rutasEmpresaActual = input<any[]>([]);
  rutasOpciones = input<{ codigo: string; label: string }[]>([]);
  empresaSeleccionada = input<any>(null);
  resolucionPrimigenia = input<string>('');

  // Methods
  abrirModalVehiculo(vehiculoEdit?: any, index?: number) {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '780px',
      maxWidth: '95vw',
      data: {
        vehiculo: vehiculoEdit || {},
        isEdit: !!vehiculoEdit
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (index !== undefined) {
          this.vehiculos.update(v => {
            const copia = [...v];
            copia[index] = {
              ...copia[index],
              ...result,
              rutas: copia[index].rutas || (result.rutas && result.rutas.length > 0 ? result.rutas : this.rutasOpciones().map(o => o.codigo)),
              numero_tuc: copia[index].numero_tuc || result.numero_tuc || ''
            };
            return copia;
          });
          this.snackBar.open(`✓ Ficha técnica actualizada para ${result.placa} (${result.porcentaje_completitud || 0}% datos)`, 'OK', { duration: 2500 });
        } else {
          const nuevoIdx = this.vehiculos().length;
          const rutasDefecto = this.rutasOpciones().map(o => o.codigo);
          const nuevoVehiculo = {
            ...result,
            rutas: (result.rutas && result.rutas.length > 0) ? result.rutas : rutasDefecto,
            numero_tuc: result.numero_tuc || '',
            baja_tipo: 'NINGUNA',
            dar_de_baja_otra_empresa: false,
            otra_empresa_ruc: '',
            otra_empresa_razon: '',
            otra_empresa_resolucion: '',
            otra_empresa_estado: '',
            otra_empresa_tuc: '',
            baja_interna_encontrada: false,
            baja_interna_verificada: false,
            buscando_baja_interna: false,
            mostrar_ingreso_manual_interna: false,
            baja_externa: null
          };
          this.vehiculos.update(v => [...v, nuevoVehiculo]);
          this.snackBar.open(`✓ Vehículo ${result.placa} agregado a la lista`, 'OK', { duration: 2500 });
          this.verificarBajaOtraEmpresaParaVehiculo(result.placa, nuevoIdx);
        }
      }
    });
  }

  eliminarVehiculoNuevo(index: number) {
    this.vehiculos.update(v => v.filter((_, i) => i !== index));
    this.snackBar.open('Vehículo retirado de la lista', 'OK', { duration: 2500 });
  }

  toggleRutaVehiculoNuevo(index: number, codRuta: string) {
    this.vehiculos.update(list => {
      const copia = [...list];
      if (!copia[index]) return list;
      const rActuales = Array.isArray(copia[index].rutas) ? [...copia[index].rutas] : this.rutasOpciones().map(o => o.codigo);
      const idx = rActuales.indexOf(codRuta);
      if (idx >= 0) {
        rActuales.splice(idx, 1);
      } else {
        rActuales.push(codRuta);
      }
      copia[index] = { ...copia[index], rutas: rActuales };
      return copia;
    });
  }

  asignarTodasRutasVehiculoNuevo(index: number) {
    this.vehiculos.update(list => {
      const copia = [...list];
      if (!copia[index]) return list;
      copia[index] = { ...copia[index], rutas: this.rutasOpciones().map(o => o.codigo) };
      return copia;
    });
  }

  actualizarTucVehiculoNuevo(index: number, event: Event) {
    const val = (event.target as HTMLInputElement).value?.trim() || '';
    this.vehiculos.update(list =>
      list.map((v, i) => i === index ? { ...v, numero_tuc: val } : v)
    );
  }

  generarTucVehiculoNuevo(index: number) {
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.vehiculos.update(list =>
          list.map((v, i) => i === index ? { ...v, numero_tuc: sig } : v)
        );
        this.snackBar.open(`✓ TUC Física ${sig} asignada`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        const num = String(index + 1).padStart(6, '0');
        const fallback = `T-${num}`;
        this.vehiculos.update(list =>
          list.map((v, i) => i === index ? { ...v, numero_tuc: fallback } : v)
        );
        this.snackBar.open(`✓ TUC Física ${fallback} asignada`, 'Cerrar', { duration: 2500 });
      }
    });
  }

  generarTucsMasivosIncremento() {
    const vehs = this.vehiculos();
    if (vehs.length === 0) {
      this.snackBar.open('No hay vehículos para asignar TUCs', 'Cerrar', { duration: 3000 });
      return;
    }
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.asignarTucsSecuencialesIncremento(sig);
      },
      error: () => {
        this.asignarTucsSecuencialesIncremento('T-000001');
      }
    });
  }

  private asignarTucsSecuencialesIncremento(tucInicial: string) {
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
    const total = this.vehiculos().length;
    this.vehiculos.update(list =>
      list.map(v => {
        const numFormateado = String(contador).padStart(6, '0');
        const tuc = `${prefijo}${numFormateado}${sufijo}`;
        contador++;
        return { ...v, numero_tuc: tuc };
      })
    );
    this.snackBar.open(`✓ Se asignaron ${total} TUCs secuenciales`, 'OK', { duration: 3000 });
  }

  // Baja previa y Art. 68.1
  setBajaTipoVehiculoNuevo(index: number, tipo: 'NINGUNA' | 'INTERNA' | 'EXTERNA') {
    this.vehiculos.update(list => {
      const copia = [...list];
      if (!copia[index]) return copia;
      const v = copia[index];
      if (tipo === 'NINGUNA') {
        copia[index] = {
          ...v,
          baja_tipo: 'NINGUNA',
          dar_de_baja_otra_empresa: false,
          dar_de_baja_misma_empresa: false
        };
      } else if (tipo === 'INTERNA') {
        if (v.es_misma_empresa) {
          copia[index] = {
            ...v,
            baja_tipo: 'INTERNA_MISMA_EMPRESA',
            dar_de_baja_misma_empresa: true
          };
        } else {
          const puedeDarDeBaja = v.otra_empresa_estado === 'HABILITADO' || !v.otra_empresa_estado;
          copia[index] = {
            ...v,
            baja_tipo: 'INTERNA',
            dar_de_baja_otra_empresa: puedeDarDeBaja
          };
          if (!v.baja_interna_verificada) {
            this.verificarBajaOtraEmpresaParaVehiculo(v.placa, index);
          }
        }
      } else if (tipo === 'EXTERNA') {
        copia[index] = {
          ...v,
          baja_tipo: 'EXTERNA',
          dar_de_baja_otra_empresa: false,
          baja_externa: v.baja_externa || {
            ambito: 'NACIONAL_MTC',
            resolucion_baja: '',
            empresa_origen: '',
            ruc_empresa_origen: ''
          }
        };
      }
      return copia;
    });
  }

  toggleBajaMismaEmpresa(index: number, checked: boolean) {
    this.vehiculos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index] = {
          ...copia[index],
          dar_de_baja_misma_empresa: checked
        };
      }
      return copia;
    });
    if (!checked) {
      this.snackBar.open(
        '⛔ Atención: Un vehículo no puede tener doble habilitación en la empresa. Si no autoriza la baja previa, el trámite no podrá avanzar.',
        'Entendido',
        { duration: 5000 }
      );
    }
  }

  toggleBajaInternaVehiculoNuevo(index: number, checked: boolean) {
    this.vehiculos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index] = {
          ...copia[index],
          dar_de_baja_otra_empresa: checked
        };
      }
      return copia;
    });
  }

  verificarBajaOtraEmpresaParaVehiculo(placa: string, index: number) {
    if (!placa || placa.length < 5) return;
    const rucActual = this.empresaSeleccionada()?.ruc;

    const rawPlaca = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const placaConGuion = rawPlaca.length >= 6 ? `${rawPlaca.substring(0, 3)}-${rawPlaca.substring(3)}` : rawPlaca;
    const regexPattern = rawPlaca.length >= 6 ? `${rawPlaca.substring(0, 3)}-?${rawPlaca.substring(3)}` : rawPlaca;

    this.vehiculos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index] = {
          ...copia[index],
          buscando_baja_interna: true
        };
      }
      return copia;
    });

    this.flotaService.getFlotaPaginada({ placa: regexPattern, limit: 30 }).subscribe({
      next: (res) => {
        const items = res?.data || [];
        const mismaEmpresaItems = items.filter((r: any) => r.ruc && r.ruc === rucActual && (r.estado === 'HABILITADO' || r.esta_activo !== false));

        if (mismaEmpresaItems.length > 0) {
          const matchMisma = mismaEmpresaItems[0];
          const resActual = matchMisma.nro_resolucion_hija || matchMisma.nro_resolucion_primigenia || 'Resolución Vigente';
          const tucActual = matchMisma.numero_tuc || '';
          const estadoActual = (matchMisma.estado || 'HABILITADO').toUpperCase();

          this.vehiculos.update(list => {
            const copia = [...list];
            if (copia[index]) {
              copia[index] = {
                ...copia[index],
                es_misma_empresa: true,
                misma_empresa_ruc: rucActual,
                misma_empresa_razon: matchMisma.razon_social || this.empresaSeleccionada()?.razon_social || 'Misma Empresa',
                misma_empresa_resolucion: resActual,
                misma_empresa_tuc: tucActual,
                misma_empresa_estado: estadoActual,
                dar_de_baja_misma_empresa: true,
                baja_tipo: 'INTERNA_MISMA_EMPRESA',
                baja_interna_encontrada: true,
                baja_interna_verificada: true,
                buscando_baja_interna: false
              };
            }
            return copia;
          });

          this.snackBar.open(
            `⚠️ ATENCIÓN: La unidad ${placaConGuion} ya está HABILITADA en esta empresa (Res. ${resActual}, TUC: ${tucActual || 'S/N'}). Se requiere dar de baja la habilitación anterior para regularizar (Doble Habilitación Prohibida).`,
            'ENTENDIDO',
            { duration: 7000 }
          );
          return;
        }

        const otrasEmpresas = items.filter((r: any) => r.ruc && r.ruc !== rucActual);

        if (otrasEmpresas.length > 0) {
          otrasEmpresas.sort((a: any, b: any) => {
            const aActivo = a.estado === 'HABILITADO' || a.esta_activo !== false;
            const bActivo = b.estado === 'HABILITADO' || b.esta_activo !== false;
            if (aActivo && !bActivo) return -1;
            if (!aActivo && bActivo) return 1;
            return 0;
          });

          const match = otrasEmpresas[0];
          const resolucionDetectada = match.nro_resolucion_primigenia || match.nro_resolucion_hija || (match as any).resolucion_habilitacion || 'Resolución Registrada';
          const estadoDetectado = (match.estado || (match.esta_activo !== false ? 'HABILITADO' : 'INACTIVO')).toUpperCase();
          const resolucionesList = Array.from(new Set(otrasEmpresas.map((r: any) => r.nro_resolucion_primigenia || r.nro_resolucion_hija || (r as any).resolucion_habilitacion).filter(Boolean)));
          const estaHabilitadoEnOtra = estadoDetectado === 'HABILITADO';

          this.vehiculos.update(list => {
            const copia = [...list];
            if (copia[index]) {
              copia[index] = {
                ...copia[index],
                es_misma_empresa: false,
                dar_de_baja_misma_empresa: false,
                baja_tipo: estaHabilitadoEnOtra ? 'INTERNA' : 'NINGUNA',
                dar_de_baja_otra_empresa: estaHabilitadoEnOtra,
                otra_empresa_ruc: match.ruc,
                otra_empresa_razon: match.razon_social,
                otra_empresa_resolucion: resolucionDetectada,
                otra_empresa_resoluciones: resolucionesList,
                otra_empresa_estado: estadoDetectado,
                otra_empresa_tuc: match.numero_tuc || '',
                otra_empresa_info: `${match.razon_social} (${match.ruc})`,
                baja_interna_encontrada: true,
                baja_interna_verificada: true,
                buscando_baja_interna: false
              };
            }
            return copia;
          });

          if (estaHabilitadoEnOtra) {
            this.snackBar.open(
              `ℹ️ Unidad ${placaConGuion} está HABILITADA en "${match.razon_social}". Se configuró Régimen de Baja Regional (Art. 68.1).`,
              'OK',
              { duration: 5000 }
            );
          } else {
            this.snackBar.open(
              `ℹ️ Unidad ${placaConGuion} figura como ${estadoDetectado} en "${match.razon_social}". No requiere baja regional en DRTC Puno.`,
              'OK',
              { duration: 5000 }
            );
          }
        } else {
          this.vehiculos.update(list => {
            const copia = [...list];
            if (copia[index]) {
              copia[index] = {
                ...copia[index],
                es_misma_empresa: false,
                dar_de_baja_misma_empresa: false,
                baja_interna_encontrada: false,
                baja_interna_verificada: true,
                buscando_baja_interna: false
              };
            }
            return copia;
          });
        }
      },
      error: () => {
        this.vehiculos.update(list => {
          const copia = [...list];
          if (copia[index]) {
            copia[index] = {
              ...copia[index],
              buscando_baja_interna: false,
              baja_interna_verificada: true
            };
          }
          return copia;
        });
      }
    });
  }

  toggleIncluirBajaExterna(index: number) {
    this.vehiculos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        const actual = !!copia[index].incluir_baja_externa;
        copia[index] = {
          ...copia[index],
          incluir_baja_externa: !actual,
          baja_externa: (!actual && !copia[index].baja_externa) ? {
            ambito: 'NACIONAL_MTC',
            resolucion_baja: '',
            empresa_origen: ''
          } : copia[index].baja_externa
        };
      }
      return copia;
    });
  }

  actualizarBajaExternaVehiculo(index: number, campo: string, valor: any) {
    this.vehiculos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index].baja_externa = {
          ...(copia[index].baja_externa || {}),
          [campo]: valor
        };
      }
      return copia;
    });
  }

  onEvidenciaBajaExternaSelected(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 15 * 1024 * 1024) {
      this.snackBar.open('El archivo excede el tamaño máximo permitido (15 MB)', 'Cerrar', { duration: 4000 });
      return;
    }

    const tamano = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : Math.round(file.size / 1024) + ' KB';

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.vehiculos.update(list => {
        const copia = [...list];
        if (copia[index]) {
          copia[index] = {
            ...copia[index],
            baja_externa: {
              ...(copia[index].baja_externa || { ambito: 'NACIONAL_MTC', resolucion_baja: '', empresa_origen: '' }),
              evidencia_nombre: file.name,
              evidencia_tamano: tamano,
              evidencia_tipo: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              evidencia_base64: base64
            }
          };
        }
        return copia;
      });
      this.snackBar.open(`✓ Evidencia "${file.name}" adjuntada correctamente`, 'OK', { duration: 3000 });
    };
    reader.readAsDataURL(file);
  }

  verEvidenciaBajaExterna(index: number) {
    const v = this.vehiculos()[index];
    const evidencia = v?.baja_externa?.evidencia_base64;
    if (!evidencia) return;

    const win = window.open('', '_blank');
    if (win) {
      if (v.baja_externa?.evidencia_tipo?.includes('pdf') || v.baja_externa?.evidencia_nombre?.toLowerCase().endsWith('.pdf')) {
        win.document.write(
          `<html><head><title>Evidencia MTC - ${v.placa}</title></head><body style="margin:0;"><iframe src="${evidencia}" frameborder="0" style="border:0; width:100%; height:100vh;" allowfullscreen></iframe></body></html>`
        );
      } else {
        win.document.write(
          `<html><head><title>Evidencia MTC - ${v.placa}</title></head><body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-content:center; min-height:100vh;"><img src="${evidencia}" style="max-width:96%; max-height:96vh; object-fit:contain; border-radius:8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);"></body></html>`
        );
      }
    }
  }

  quitarEvidenciaBajaExterna(index: number) {
    this.vehiculos.update(list => {
      const copia = [...list];
      if (copia[index] && copia[index].baja_externa) {
        copia[index].baja_externa = {
          ...copia[index].baja_externa,
          evidencia_nombre: undefined,
          evidencia_tamano: undefined,
          evidencia_tipo: undefined,
          evidencia_base64: undefined
        };
      }
      return copia;
    });
    this.snackBar.open('Evidencia retirada', 'OK', { duration: 2000 });
  }

  // Formatters
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
