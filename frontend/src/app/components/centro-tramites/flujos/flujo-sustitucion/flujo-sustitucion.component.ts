import { Component, inject, signal, computed, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { FlotaEmpresaService } from '../../../../services/flota-empresa.service';
import { TucService } from '../../../../services/tuc.service';
import { VehiculoModalComponent } from '../../vehiculo-modal.component';
import { BajaExternaFormComponent } from '../../../bajas-externas/baja-externa-form/baja-externa-form.component';

@Component({
  selector: 'app-flujo-sustitucion',
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
  templateUrl: './flujo-sustitucion.component.html',
  styleUrls: ['./flujo-sustitucion.component.scss']
})
export class FlujoSustitucionComponent {
  private vehiculoDataService = inject(VehiculoDataService);
  private flotaService = inject(FlotaEmpresaService);
  private tucService = inject(TucService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Inputs / Two-way Models
  pares = model<any[]>([]);
  rutasEmpresaActual = input<any[]>([]);
  rutasOpciones = input<{ codigo: string; label: string }[]>([]);
  vehiculosEnResolucion = input<any[]>([]);
  empresaSeleccionada = input<any>(null);
  resolucionPrimigenia = input<string>('');

  // Internal component state
  placaSalienteTemp = signal<string>('');
  vehiculoSalienteObj = signal<any | null>(null);
  criterioSalienteInhabilitado = signal<string>('VENTA_PLAZO_60D');
  plazoSustitucionDias = signal<number>(60);
  filtroSalienteText = signal<string>('');
  mostrarSugerenciasSaliente = signal<boolean>(false);
  datosTecnicosSaliente = signal<any>(null);
  buscandoPlacaSaliente = signal<boolean>(false);

  placaEntranteTemp = signal<string>('');
  datosTecnicosEntrante = signal<any>(null);
  buscandoPlacaEntrante = signal<boolean>(false);
  habilitacionOtraEmpresa = signal<{ ruc: string; razon_social: string; nro_resolucion_primigenia?: string } | null>(null);
  darDeBajaOtraEmpresa = signal<boolean>(true);
  habilitacionMismaEmpresa = signal<{ ruc: string; razon_social: string; nro_resolucion_primigenia?: string; nro_resolucion_hija?: string; numero_tuc?: string } | null>(null);
  darDeBajaMismaEmpresa = signal<boolean>(true);

  // Computeds
  vehiculosSalientesFiltrados = computed(() => {
    const yaSustituidos = new Set(this.pares().map(p => p.placa_saliente));
    let lista = this.vehiculosEnResolucion().filter(v => {
      const est = String(v.estado || '').toUpperCase();
      const yaSustituidoEnEmpresa = est === 'SUSTITUIDO' || (v.motivo_baja && String(v.motivo_baja).toUpperCase().includes('SUSTITUIDO POR'));
      if (yaSustituidoEnEmpresa) return false;
      if (yaSustituidos.has(v.placa)) return false;
      return true;
    });
    const txt = this.filtroSalienteText().trim().toUpperCase();
    if (txt) {
      lista = lista.filter(v => 
        (v.placa && v.placa.toUpperCase().includes(txt)) ||
        (v.marca && v.marca.toUpperCase().includes(txt)) ||
        (v.modelo && v.modelo.toUpperCase().includes(txt)) ||
        (v.estado && v.estado.toUpperCase().includes(txt)) ||
        (v.nro_resolucion_hija && v.nro_resolucion_hija.toUpperCase().includes(txt))
      );
    }
    lista.sort((a, b) => {
      const aHab = (String(a.estado || '').toUpperCase() === 'HABILITADO' || !a.estado) ? 1 : 0;
      const bHab = (String(b.estado || '').toUpperCase() === 'HABILITADO' || !b.estado) ? 1 : 0;
      return bHab - aHab;
    });
    return lista.slice(0, 30);
  });

  vehiculoSalienteSeleccionado = computed(() => {
    const p = this.placaSalienteTemp();
    if (!p) return null;
    const base = this.vehiculoSalienteObj() || 
                 this.vehiculosEnResolucion().find(v => v.placa === p && (String(v.estado || '').toUpperCase() === 'HABILITADO' || !v.estado) && v.esta_activo !== false) || 
                 this.vehiculosEnResolucion().find(v => v.placa === p) || {};
    const dt = this.datosTecnicosSaliente() || {};
    return {
      ...base,
      ...dt,
      id: base.id || base._id,
      _id: base._id || base.id,
      placa: p,
      marca: dt.marca || base.marca || '',
      modelo: dt.modelo || base.modelo || '',
      anio_fabricacion: dt.anio_fabricacion || base.anio_fabricacion || base.anio || null,
      categoria: dt.categoria || base.categoria || 'M2',
      asientos: dt.asientos || dt.numero_asientos || dt.numero_pasajeros || base.asientos || null,
      peso_neto: dt.peso_neto || base.peso_neto || null,
      nro_resolucion_primigenia: base.nro_resolucion_primigenia || '',
      nro_resolucion_hija: base.nro_resolucion_hija || '',
      estado: base.estado || (base.esta_activo === false ? 'INHABILITADO' : 'HABILITADO'),
      esta_activo: base.esta_activo,
      motivo_baja: base.motivo_baja
    };
  });

  comparacionAniosSustitucion = computed(() => {
    const sal = this.vehiculoSalienteSeleccionado();
    const ent = this.datosTecnicosEntrante();
    if (!sal || !ent) return null;

    const rawSal = sal.anio_fabricacion || sal.anio_modelo || sal.anio;
    const rawEnt = ent.anio_fabricacion || ent.anio_modelo || ent.ano_fabricacion || ent.anio;

    const anioSal = rawSal ? parseInt(String(rawSal), 10) : 0;
    const anioEnt = rawEnt ? parseInt(String(rawEnt), 10) : 0;

    if (!anioSal || !anioEnt || isNaN(anioSal) || isNaN(anioEnt)) {
      return {
        evaluado: false,
        anioSaliente: anioSal || null,
        anioEntrante: anioEnt || null,
        esMejor: true,
        diferencia: 0,
        mensaje: 'Se requiere año de fabricación de ambas unidades para validar la modernización de flota.'
      };
    }

    const diferencia = anioEnt - anioSal;
    const esMejor = anioEnt > anioSal;

    return {
      evaluado: true,
      anioSaliente: anioSal,
      anioEntrante: anioEnt,
      esMejor,
      diferencia,
      mensaje: esMejor
        ? `✓ Cumple con la regla de modernización: la unidad entrante (${anioEnt}) es ${diferencia} año(s) más reciente que la saliente (${anioSal}).`
        : `⛔ No cumple con la regla de modernización de flota: La unidad entrante (${anioEnt}) debe ser de un año mejor (más reciente) que la unidad saliente (${anioSal}).`
    };
  });

  // Saliente handlers
  onSalienteInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = (input.value || '').toUpperCase().trim();
    this.filtroSalienteText.set(val);
    this.placaSalienteTemp.set(val);
    this.mostrarSugerenciasSaliente.set(true);

    const match = this.vehiculosEnResolucion().find(v => v.placa === val);
    if (match) {
      this.vehiculoSalienteObj.set(match);
      this.cargarDatosTecnicosSaliente(val);
    } else {
      this.vehiculoSalienteObj.set(null);
      this.datosTecnicosSaliente.set(null);
    }
  }

  onSalienteBlur() {
    setTimeout(() => {
      this.mostrarSugerenciasSaliente.set(false);
    }, 250);
  }

  seleccionarSaliente(v: any) {
    this.placaSalienteTemp.set(v.placa);
    this.filtroSalienteText.set(v.placa);
    this.vehiculoSalienteObj.set(v);
    this.mostrarSugerenciasSaliente.set(false);
    this.cargarDatosTecnicosSaliente(v.placa);
  }

  cargarDatosTecnicosSaliente(placa: string) {
    if (!placa) return;
    this.buscandoPlacaSaliente.set(true);
    this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
      next: (res) => {
        this.buscandoPlacaSaliente.set(false);
        if (res && res.success && res.data) {
          this.datosTecnicosSaliente.set(res.data);
        }
      },
      error: () => {
        this.buscandoPlacaSaliente.set(false);
      }
    });
  }

  onCriterioSalienteChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.criterioSalienteInhabilitado.set(select.value);
  }

  onPlazoDiasInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    this.plazoSustitucionDias.set(isNaN(val) ? 60 : Math.max(1, Math.min(180, val)));
  }

  // Entrante handlers
  onPlacaEntranteInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = (input.value || '').toUpperCase().trim();
    this.placaEntranteTemp.set(val);
    if (this.habilitacionOtraEmpresa()) {
      this.habilitacionOtraEmpresa.set(null);
    }
  }

  buscarDatosVehiculoEntrante() {
    let placa = this.placaEntranteTemp().toUpperCase().trim();
    if (!placa || placa.length < 5) return;

    if (/^[A-Z0-9]{6}$/.test(placa)) {
      placa = `${placa.substring(0, 3)}-${placa.substring(3)}`;
      this.placaEntranteTemp.set(placa);
    }

    this.buscandoPlacaEntrante.set(true);
    const empresaActualRuc = this.empresaSeleccionada()?.ruc;

    this.flotaService.verificarPlacaTramite(placa, empresaActualRuc).subscribe({
      next: (resVerif) => {
        if (resVerif.habilitado_otra_empresa && resVerif.otra_empresa_info) {
          const oInfo = resVerif.otra_empresa_info;
          this.habilitacionOtraEmpresa.set({
            ruc: oInfo.ruc,
            razon_social: oInfo.razon_social || 'Otra Empresa Registrada',
            nro_resolucion_primigenia: oInfo.nro_resolucion_primigenia || oInfo.nro_resolucion_hija
          });
          this.darDeBajaOtraEmpresa.set(true);
          this.snackBar.open(
            `⚠️ ALERTA: La placa entrante ${placa} ya está HABILITADA en "${oInfo.razon_social}" (RUC ${oInfo.ruc}). Se requiere autorización de baja previa (Art. 68.1) o baja externa ante el MTC para evitar DOBLE HABILITACIÓN.`,
            'ENTENDIDO',
            { duration: 7500 }
          );
        } else {
          this.habilitacionOtraEmpresa.set(null);
        }

        if (resVerif.habilitado_misma_empresa && resVerif.misma_empresa_info) {
          const mInfo = resVerif.misma_empresa_info;
          this.habilitacionMismaEmpresa.set({
            ruc: mInfo.ruc,
            razon_social: mInfo.razon_social || 'Esta Empresa',
            nro_resolucion_primigenia: mInfo.nro_resolucion_primigenia,
            nro_resolucion_hija: mInfo.nro_resolucion_hija,
            numero_tuc: mInfo.numero_tuc
          });
          this.darDeBajaMismaEmpresa.set(true);
          const resMis = mInfo.nro_resolucion_hija || mInfo.nro_resolucion_primigenia || 'Vigente';
          this.snackBar.open(
            `⚠️ ATENCIÓN: La unidad entrante ${placa} ya se encuentra HABILITADA en esta empresa (Res. ${resMis}). Se dará de baja su habilitación previa para regularizar (Doble Habilitación Prohibida).`,
            'ENTENDIDO',
            { duration: 7000 }
          );
        } else {
          this.habilitacionMismaEmpresa.set(null);
        }

        if (resVerif.datos_tecnicos) {
          const dt = resVerif.datos_tecnicos;
          this.datosTecnicosEntrante.set({
            placa,
            marca: dt.marca || '',
            modelo: dt.modelo || '',
            anio_fabricacion: dt.anio_fabricacion || null,
            categoria: dt.categoria || 'M2',
            asientos: dt.asientos || null,
            peso_neto: dt.peso_neto || null,
            numero_tuc: dt.numero_tuc || '',
            color: dt.color || '',
            combustible: dt.combustible || 'DIESEL',
            numero_motor: dt.numero_motor || '',
            numero_serie: dt.numero_serie || '',
            vin: dt.vin || ''
          });
        }

        this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
          next: (res) => {
            this.buscandoPlacaEntrante.set(false);
            if (res && res.success && res.data) {
              const d = res.data;
              this.datosTecnicosEntrante.update(prev => ({
                placa: d.placa || placa,
                marca: d.marca || prev?.marca || '',
                modelo: d.modelo || prev?.modelo || '',
                anio_fabricacion: d.anio_fabricacion || d.anio_modelo || d.ano_fabricacion || d.anoFabricacion || d.anio || prev?.anio_fabricacion || null,
                categoria: d.categoria || prev?.categoria || 'M2',
                asientos: d.numero_asientos || d.asientos || d.numero_pasajeros || d.pasajeros || prev?.asientos || null,
                peso_neto: d.peso_neto || d.peso_seco || prev?.peso_neto || null,
                numero_tuc: d.numero_tuc || prev?.numero_tuc || '',
                color: d.color || prev?.color || '',
                combustible: d.combustible || prev?.combustible || '',
                numero_motor: d.numero_motor || prev?.numero_motor || '',
                numero_serie: d.numero_serie || prev?.numero_serie || '',
                vin: d.vin || prev?.vin || ''
              }));
              this.snackBar.open(`✓ Especificaciones encontradas para ${placa}`, 'Cerrar', { duration: 2500 });
            } else if (!this.datosTecnicosEntrante() || !this.datosTecnicosEntrante()?.marca) {
              this.datosTecnicosEntrante.set({
                placa,
                marca: '',
                modelo: '',
                anio_fabricacion: null,
                categoria: 'M2'
              });
            }
          },
          error: () => {
            this.buscandoPlacaEntrante.set(false);
            if (!this.datosTecnicosEntrante() || !this.datosTecnicosEntrante()?.marca) {
              this.datosTecnicosEntrante.set({
                placa,
                marca: '',
                modelo: '',
                anio_fabricacion: null,
                categoria: 'M2'
              });
            }
          }
        });
      },
      error: () => {
        this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
          next: (res) => {
            this.buscandoPlacaEntrante.set(false);
            if (res && res.success && res.data) {
              const d = res.data;
              this.datosTecnicosEntrante.set({
                placa: d.placa || placa,
                marca: d.marca || '',
                modelo: d.modelo || '',
                anio_fabricacion: d.anio_fabricacion || d.anio_modelo || d.ano_fabricacion || d.anoFabricacion || d.anio || null,
                categoria: d.categoria || 'M2',
                asientos: d.numero_asientos || d.asientos || d.numero_pasajeros || null,
                peso_neto: d.peso_neto || d.peso_seco || null,
                numero_tuc: d.numero_tuc || '',
                color: d.color || '',
                combustible: d.combustible || '',
                numero_motor: d.numero_motor || '',
                numero_serie: d.numero_serie || '',
                vin: d.vin || ''
              });
              this.snackBar.open(`✓ Datos encontrados para ${placa}`, 'Cerrar', { duration: 2500 });
            } else {
              this.datosTecnicosEntrante.set({
                placa,
                marca: '',
                modelo: '',
                anio_fabricacion: null,
                categoria: 'M2'
              });
            }
          },
          error: () => {
            this.buscandoPlacaEntrante.set(false);
            this.datosTecnicosEntrante.set({
              placa,
              marca: '',
              modelo: '',
              anio_fabricacion: null,
              categoria: 'M2'
            });
          }
        });
      }
    });
  }

  abrirModalDatosTecnicosEntrante(parIndex?: number) {
    let vehiculoData: any = {};
    let placa = '';

    if (parIndex !== undefined) {
      const par = this.pares()[parIndex];
      placa = par.placa_entrante;
      vehiculoData = {
        placa: par.placa_entrante,
        marca: par.marca,
        modelo: par.modelo,
        anio_fabricacion: par.anio_fabricacion,
        categoria: par.categoria,
        asientos: par.asientos,
        peso_neto: par.peso_neto,
        numero_tuc: par.numero_tuc,
        ...par.datos_completos
      };
    } else {
      placa = this.placaEntranteTemp().toUpperCase().trim();
      vehiculoData = this.datosTecnicosEntrante() || { placa };
      if (!vehiculoData.placa) vehiculoData.placa = placa;
    }

    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '740px',
      maxWidth: '95vw',
      data: {
        vehiculo: vehiculoData,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (parIndex !== undefined) {
          this.pares.update(pares => {
            const copia = [...pares];
            copia[parIndex] = {
              ...copia[parIndex],
              placa_entrante: result.placa || copia[parIndex].placa_entrante,
              marca: result.marca,
              modelo: result.modelo,
              anio_fabricacion: result.anio_fabricacion,
              categoria: result.categoria,
              asientos: result.asientos,
              peso_neto: result.peso_neto,
              numero_tuc: result.numero_tuc,
              datos_completos: result
            };
            return copia;
          });
          this.snackBar.open('Datos técnicos actualizados en el par', 'OK', { duration: 3000 });
        } else {
          this.placaEntranteTemp.set(result.placa || placa);
          this.datosTecnicosEntrante.set(result);
          this.snackBar.open('Datos técnicos listos para ' + (result.placa || placa), 'OK', { duration: 3000 });
        }
      }
    });
  }

  abrirModalBajaExterna(parIndex?: number) {
    let placa = '';
    let ruc = '';
    let razon = '';
    let motivo = 'Habilitado en otra Empresa (Interprovincial)';

    if (parIndex !== undefined) {
      const par = this.pares()[parIndex];
      placa = par.placa_entrante;
      ruc = par.otra_empresa_ruc || '';
      razon = par.otra_empresa_razon || '';
      if (!ruc) {
        placa = par.placa_saliente;
        ruc = this.empresaSeleccionada()?.ruc || '';
        razon = this.empresaSeleccionada()?.razon_social || '';
        motivo = 'Retiro Voluntario';
      }
    } else {
      const otra = this.habilitacionOtraEmpresa();
      if (otra) {
        placa = this.placaEntranteTemp() || '';
        ruc = otra.ruc || '';
        razon = otra.razon_social || '';
        motivo = 'Habilitado en otra Empresa (Interprovincial)';
      } else if (this.placaSalienteTemp()) {
        placa = this.placaSalienteTemp();
        ruc = this.empresaSeleccionada()?.ruc || '';
        razon = this.empresaSeleccionada()?.razon_social || '';
        motivo = 'Retiro Voluntario';
      } else if (this.placaEntranteTemp()) {
        placa = this.placaEntranteTemp();
        ruc = this.empresaSeleccionada()?.ruc || '';
        razon = this.empresaSeleccionada()?.razon_social || '';
      }
    }

    const dialogRef = this.dialog.open(BajaExternaFormComponent, {
      width: '600px',
      data: {
        placa,
        ruc_empresa: ruc,
        razon_social: razon,
        motivo,
        observaciones: `Notificación preventiva MTC registrada durante proceso de Sustitución en DRTC Puno.`
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res && parIndex !== undefined) {
        this.pares.update(pares => {
          const copia = [...pares];
          copia[parIndex] = { ...copia[parIndex], baja_externa_registrada: true };
          return copia;
        });
        this.snackBar.open('✓ Notificación MTC registrada exitosamente para ' + placa, 'OK', { duration: 3500 });
      }
    });
  }

  agregarParSustitucion() {
    const saliente = this.placaSalienteTemp();
    const entrante = this.placaEntranteTemp().toUpperCase().trim();

    if (!saliente) {
      this.snackBar.open('Seleccione el vehículo saliente de la flota', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!entrante) {
      this.snackBar.open('Ingrese la placa del vehículo entrante', 'Cerrar', { duration: 3000 });
      return;
    }
    if (saliente === entrante) {
      this.snackBar.open('La placa saliente y entrante no pueden ser la misma', 'Cerrar', { duration: 3000 });
      return;
    }
    const yaExiste = this.pares().some(p => p.placa_saliente === saliente || p.placa_entrante === entrante);
    if (yaExiste) {
      this.snackBar.open('Una de las placas ya se encuentra en otro par configurado', 'Cerrar', { duration: 3000 });
      return;
    }

    const salienteObj = this.vehiculoSalienteSeleccionado() || this.vehiculoSalienteObj() || 
                        this.vehiculosEnResolucion().find(v => v.placa === saliente && (String(v.estado || '').toUpperCase() === 'HABILITADO' || !v.estado) && v.esta_activo !== false) || 
                        this.vehiculosEnResolucion().find(v => v.placa === saliente) || {};
    if (!salienteObj || !salienteObj.placa) {
      this.snackBar.open(`⛔ El vehículo saliente ${saliente} no pertenece a la flota registrada ni habilitada de esta empresa.`, 'Cerrar', { duration: 4500 });
      return;
    }

    const estadoSal = String(salienteObj.estado || '').toUpperCase();
    const activoSal = salienteObj.esta_activo !== false;
    const yaSustituidoSal = estadoSal === 'SUSTITUIDO' || (salienteObj.motivo_baja && String(salienteObj.motivo_baja).toUpperCase().includes('SUSTITUIDO POR'));
    if (yaSustituidoSal) {
      this.snackBar.open(
        `⛔ Bloqueo normativo absoluto: El vehículo saliente ${saliente} ya figura como SUSTITUIDO en esta empresa. Prohibida la doble sustitución de una misma unidad.`,
        'Cerrar',
        { duration: 6000 }
      );
      return;
    }

    const esInhab = ['INHABILITADO', 'BAJA'].includes(estadoSal) || !activoSal;

    const otraEmp = this.habilitacionOtraEmpresa();
    if (otraEmp && !this.darDeBajaOtraEmpresa()) {
      this.snackBar.open(
        `⛔ Bloqueo normativo: La unidad entrante ${entrante} cuenta con habilitación vigente en "${otraEmp.razon_social}" (RUC ${otraEmp.ruc}). Prohibida la doble habilitación; debe marcar "Dar de baja en la otra empresa" o registrar baja externa acreditada.`,
        'CORREGIR',
        { duration: 6000 }
      );
      return;
    }

    const mismaEmp = this.habilitacionMismaEmpresa();
    if (mismaEmp && !this.darDeBajaMismaEmpresa()) {
      this.snackBar.open(
        `⛔ Bloqueo normativo: La unidad entrante ${entrante} ya está habilitada en esta empresa. Debe autorizar la baja previa de su habilitación anterior para regularizarla en este trámite.`,
        'CORREGIR',
        { duration: 6000 }
      );
      return;
    }

    const entranteMisma = this.vehiculosEnResolucion().find(v => v.placa === entrante);
    const esMismaEmpresaEntrante = !!mismaEmp || (!!entranteMisma && (entranteMisma.estado === 'HABILITADO' || entranteMisma.esta_activo !== false));

    const dt = this.datosTecnicosEntrante() || {};

    const rawAnioSal = salienteObj?.anio_fabricacion || salienteObj?.anio_modelo || salienteObj?.anio || null;
    const rawAnioEnt = dt.anio_fabricacion || dt.anio_modelo || dt.ano_fabricacion || dt.anio || null;
    const anioSal = rawAnioSal ? parseInt(String(rawAnioSal), 10) : 0;
    const anioEnt = rawAnioEnt ? parseInt(String(rawAnioEnt), 10) : 0;

    if (anioSal > 0 && anioEnt > 0 && anioEnt <= anioSal) {
      this.snackBar.open(
        `⛔ Bloqueo normativo (Modernización de Flota): La unidad entrante (${entrante}, año ${anioEnt}) debe ser de un año mejor (más reciente) que la unidad saliente (${saliente}, año ${anioSal}). No se permite ingresar unidades del mismo año o más antiguas.`,
        'CERRAR',
        { duration: 7000 }
      );
      return;
    }

    const diferenciaAnios = (anioSal > 0 && anioEnt > 0) ? (anioEnt - anioSal) : null;

    const rutasPar = (salienteObj?.rutas && salienteObj.rutas.length > 0)
      ? [...salienteObj.rutas]
      : this.rutasOpciones().map(o => o.codigo);
    const nuevoPar = {
      saliente_id: salienteObj._id || salienteObj.id || null,
      placa_saliente: saliente,
      saliente_resolucion: salienteObj.nro_resolucion_hija || salienteObj.nro_resolucion_primigenia || null,
      saliente_estado: salienteObj.estado || (esInhab ? 'INHABILITADO' : 'HABILITADO'),
      es_saliente_inhabilitado: esInhab,
      criterio_sustitucion: esInhab ? this.criterioSalienteInhabilitado() : 'SUSTITUCION_REGULAR',
      plazo_sustitucion_dias: esInhab ? this.plazoSustitucionDias() : null,
      saliente_marca: salienteObj?.marca || 'S/M',
      saliente_modelo: salienteObj?.modelo || '',
      saliente_anio: salienteObj?.anio_fabricacion || salienteObj?.anio_modelo || salienteObj?.anio || null,
      saliente_categoria: salienteObj?.categoria || 'M2',
      saliente_asientos: salienteObj?.asientos || salienteObj?.numero_asientos || salienteObj?.numero_pasajeros || null,
      saliente_peso_neto: salienteObj?.peso_neto || null,

      placa_entrante: entrante,
      marca: dt.marca || 'S/M',
      modelo: dt.modelo || '',
      anio_fabricacion: dt.anio_fabricacion || dt.anio_modelo || dt.ano_fabricacion || dt.anio || null,
      categoria: dt.categoria || 'M2',
      asientos: dt.asientos || dt.numero_asientos || dt.numero_pasajeros || null,
      peso_neto: dt.peso_neto || null,
      numero_tuc: dt.numero_tuc || '',
      diferencia_anios: diferenciaAnios,
      rutas: rutasPar,
      datos_completos: dt,
      dar_de_baja_otra_empresa: otraEmp ? this.darDeBajaOtraEmpresa() : false,
      otra_empresa_info: otraEmp ? `${otraEmp.razon_social} (${otraEmp.ruc})` : null,
      otra_empresa_ruc: otraEmp ? otraEmp.ruc : null,
      otra_empresa_razon: otraEmp ? otraEmp.razon_social : null,
      baja_externa_registrada: false,
      dar_de_baja_misma_empresa: esMismaEmpresaEntrante ? this.darDeBajaMismaEmpresa() : false,
      es_misma_empresa: esMismaEmpresaEntrante,
      misma_empresa_resolucion: mismaEmp?.nro_resolucion_hija || mismaEmp?.nro_resolucion_primigenia || entranteMisma?.nro_resolucion_hija || entranteMisma?.nro_resolucion_primigenia || null,
      misma_empresa_tuc: mismaEmp?.numero_tuc || entranteMisma?.numero_tuc || null
    };

    this.pares.update(pares => [...pares, nuevoPar]);
    this.snackBar.open(`✓ Par configurado: ${saliente} ➔ ${entrante}`, 'Entendido', { duration: 3000 });

    this.placaSalienteTemp.set('');
    this.vehiculoSalienteObj.set(null);
    this.filtroSalienteText.set('');
    this.datosTecnicosSaliente.set(null);
    this.placaEntranteTemp.set('');
    this.datosTecnicosEntrante.set(null);
    this.habilitacionOtraEmpresa.set(null);
    this.darDeBajaOtraEmpresa.set(true);
    this.habilitacionMismaEmpresa.set(null);
    this.darDeBajaMismaEmpresa.set(true);
  }

  eliminarParSustitucion(index: number) {
    this.pares.update(pares => pares.filter((_, i) => i !== index));
    this.snackBar.open('Par de sustitución eliminado', 'OK', { duration: 2500 });
  }

  toggleRutaParSustitucion(index: number, codRuta: string) {
    this.pares.update(pares => {
      const copia = [...pares];
      if (!copia[index]) return pares;
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

  asignarTodasRutasParSustitucion(index: number) {
    this.pares.update(pares => {
      const copia = [...pares];
      if (!copia[index]) return pares;
      copia[index] = { ...copia[index], rutas: this.rutasOpciones().map(o => o.codigo) };
      return copia;
    });
  }

  actualizarTucParSustitucion(index: number, event: Event) {
    const val = (event.target as HTMLInputElement).value?.trim() || '';
    this.pares.update(pares =>
      pares.map((p, i) => i === index ? { ...p, numero_tuc: val } : p)
    );
  }

  generarTucParSustitucion(index: number) {
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.pares.update(pares =>
          pares.map((p, i) => i === index ? { ...p, numero_tuc: sig } : p)
        );
        this.snackBar.open(`✓ TUC Física ${sig} asignada`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        const num = String(index + 1).padStart(6, '0');
        const fallback = `T-${num}`;
        this.pares.update(pares =>
          pares.map((p, i) => i === index ? { ...p, numero_tuc: fallback } : p)
        );
        this.snackBar.open(`✓ TUC Física ${fallback} asignada`, 'Cerrar', { duration: 2500 });
      }
    });
  }

  generarTucsMasivosSustitucion() {
    const pares = this.pares();
    if (pares.length === 0) {
      this.snackBar.open('No hay pares configurados para asignar TUCs', 'Cerrar', { duration: 3000 });
      return;
    }
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.asignarTucsSecuencialesSustitucion(sig);
      },
      error: () => {
        this.asignarTucsSecuencialesSustitucion('T-000001');
      }
    });
  }

  private asignarTucsSecuencialesSustitucion(tucInicial: string) {
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
    const total = this.pares().length;
    this.pares.update(pares =>
      pares.map(p => {
        const numFormateado = String(contador).padStart(6, '0');
        const tuc = `${prefijo}${numFormateado}${sufijo}`;
        contador++;
        return { ...p, numero_tuc: tuc };
      })
    );
    this.snackBar.open(`✓ Se asignaron ${total} TUCs secuenciales`, 'OK', { duration: 3000 });
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
