import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VehiculoDataService } from '../../services/vehiculo-data.service';

export function calcularCompletitudVehiculo(v: any): number {
  if (!v) return 0;
  
  const camposRevisar = [
    // 1. Identificación y Fabricación (sin contar la clase)
    { val: v.placa || v.placa_actual },
    { val: v.marca },
    { val: v.modelo },
    { val: v.anio_fabricacion || v.anio_modelo || v.ano_fabricacion, num: true },
    { val: v.color },
    { val: v.carroceria },
    
    // 2. Clasificación, Motor e Identificadores
    { val: v.categoria },
    { val: v.combustible },
    { val: v.numero_motor },
    { val: v.vin || v.numero_serie },
    
    // 3. Capacidad y Rodaje
    { val: v.numero_pasajeros ?? v.pasajeros, num: true },
    { val: v.numero_asientos ?? v.asientos, num: true },
    { val: v.numero_cilindros ?? v.cilindros, num: true },
    { val: v.numero_ejes ?? v.ejes, num: true },
    { val: v.numero_ruedas ?? v.ruedas, num: true },
    
    // 4. Pesos y Dimensiones
    { val: v.peso_bruto, num: true },
    { val: v.peso_seco ?? v.peso_neto, num: true },
    { val: v.carga_util, num: true },
    { val: v.longitud ?? v.largo, num: true },
    { val: v.ancho, num: true },
    { val: v.altura ?? v.alto, num: true }
  ];

  let completados = 0;
  for (const c of camposRevisar) {
    if (c.num) {
      if (c.val !== undefined && c.val !== null && c.val !== '' && !isNaN(Number(c.val)) && Number(c.val) > 0) {
        completados++;
      }
    } else {
      if (c.val !== undefined && c.val !== null && String(c.val).trim() !== '' && String(c.val).trim().toUpperCase() !== 'SIN REGISTRAR') {
        completados++;
      }
    }
  }

  return Math.round((completados / camposRevisar.length) * 100);
}

export function enriquecerFichaTecnica(item: any, d?: any): any {
  const data = d || {};
  const catRaw = data.categoria || item?.categoria || 'M2';
  let catNorm = catRaw;
  const c = String(catRaw).toUpperCase().trim().replace(/\s+/g, '');
  if (c === 'M2-C3' || (c.includes('M2') && c.includes('C3'))) catNorm = 'M2-C3';
  else if (c === 'M3-C3' || (c.includes('M3') && c.includes('C3'))) catNorm = 'M3-C3';
  else if (c === 'M1-C3' || (c.includes('M1') && c.includes('C3'))) catNorm = 'M1-C3';
  else if (c === 'M2' || c === 'M3' || c === 'M1' || c === 'N1' || c === 'N2' || c === 'N3') catNorm = c;

  let claseVal = '';
  if (catNorm.includes('C3')) {
    claseVal = data.clase || item?.clase || 'C3';
    if (claseVal === 'MICROBUS') claseVal = 'C3';
  }

  const r3 = (n: any) => (n !== undefined && n !== null && n !== '' && !isNaN(Number(n)) && Number(n) > 0) ? (Math.round(Number(n) * 1000) / 1000) : null;

  let pb = r3(data.peso_bruto || data.pesoBruto) || r3(item?.peso_bruto);
  let ps = r3(data.peso_seco || data.peso_neto || data.pesoNeto) || r3(item?.peso_seco || item?.peso_neto);
  let cu = r3(data.carga_util || data.cargaUtil) || r3(item?.carga_util);
  let l = r3(data.longitud || data.largo) || r3(item?.longitud);
  let an = r3(data.ancho) || r3(item?.ancho);
  let al = r3(data.altura || data.alto) || r3(item?.altura);

  const modelToCheck = String(data.modelo || data.modelo_vehiculo || item?.modelo || '').toUpperCase();
  if (!pb) {
    if (modelToCheck.includes('415')) {
      pb = 3.88; ps = 2.65; cu = 1.23; l = 5.91; an = 1.99; al = 2.86;
    } else if (modelToCheck.includes('413')) {
      pb = 4.60; ps = 2.89; cu = 1.71; l = 6.99; an = 1.99; al = 2.76;
    } else if (modelToCheck.includes('313') || modelToCheck.includes('314') || modelToCheck.includes('311')) {
      pb = 3.88; ps = 2.35; cu = 1.53; l = 5.64; an = 1.92; al = 2.76;
    } else if (modelToCheck.includes('515') || modelToCheck.includes('516') || modelToCheck.includes('519')) {
      pb = 5.00; ps = 2.95; cu = 2.05; l = 7.34; an = 1.99; al = 2.86;
    } else if (modelToCheck.includes('HIACE') || modelToCheck.includes('COMMUTER')) {
      pb = 3.25; ps = 2.06; cu = 1.13; l = 5.38; an = 1.88; al = 2.28;
    } else if (modelToCheck.includes('MASTER')) {
      pb = 3.90; ps = 2.35; cu = 1.55; l = 6.20; an = 2.07; al = 2.49;
    } else if (modelToCheck.includes('CRAFTER')) {
      pb = 4.00; ps = 2.60; cu = 1.40; l = 6.84; an = 2.04; al = 2.59;
    } else if (modelToCheck.includes('H350')) {
      pb = 4.00; ps = 2.65; cu = 1.35; l = 6.20; an = 2.04; al = 2.69;
    } else if (modelToCheck.includes('TRANSIT')) {
      pb = 4.00; ps = 2.50; cu = 1.50; l = 5.98; an = 2.06; al = 2.78;
    }
  }
  if (pb && ps) {
    cu = Math.round(Math.max(0, pb - ps) * 1000) / 1000;
  }

  const anioActual = new Date().getFullYear();
  const aFab = item?.anio_fabricacion || data.anio_fabricacion || data.anio_modelo || data.ano_fabricacion || null;
  const anioNum = aFab ? Number(aFab) : null;
  const ed = (anioNum && anioNum > 1900) ? (anioActual - anioNum) : (item?.edad || 0);

  const combRaw = String(data.combustible || item?.combustible || 'DIESEL').toUpperCase().trim();
  const combNorm = (combRaw.includes('PETROL') || combRaw.includes('DIESEL') || combRaw.includes('GASOIL') || combRaw.includes('D2') || combRaw.includes('B5')) ? 'DIESEL' : (combRaw.includes('GASOLINA') ? 'GASOLINA' : (combRaw || 'DIESEL'));

  const numAsientos = Number(data.numero_asientos || data.asientos || item?.numero_asientos || item?.asientos) || 16;
  const numPasajeros = Number(data.numero_pasajeros || data.pasajeros || item?.numero_pasajeros || item?.pasajeros) || Math.max(1, numAsientos - 1);
  const numCilindros = Number(data.numero_cilindros || data.cilindros || item?.numero_cilindros || item?.cilindros) || 4;
  const numEjes = Number(data.numero_ejes || data.ejes || item?.numero_ejes || item?.ejes) || 2;
  const numRuedas = Number(data.numero_ruedas || data.ruedas || item?.numero_ruedas || item?.ruedas) || 4;

  const resultado: any = {
    ...item,
    ...data,
    placa: item?.placa || data.placa || data.placa_actual,
    placa_actual: item?.placa || data.placa || data.placa_actual,
    marca: data.marca || data.marca_vehiculo || item?.marca || '',
    modelo: data.modelo || data.modelo_vehiculo || item?.modelo || '',
    anio_fabricacion: anioNum,
    color: data.color || item?.color || 'BLANCO',
    clase: claseVal,
    carroceria: data.carroceria || data.tipo_carroceria || item?.carroceria || 'MINIBUS',
    categoria: catNorm,
    combustible: combNorm,
    numero_motor: data.numero_motor || item?.numero_motor || '',
    vin: data.vin || data.numero_serie || item?.vin || item?.numero_serie || '',
    numero_serie: data.numero_serie || data.vin || item?.numero_serie || item?.vin || '',
    asientos: numAsientos,
    numero_asientos: numAsientos,
    pasajeros: numPasajeros,
    numero_pasajeros: numPasajeros,
    cilindros: numCilindros,
    numero_cilindros: numCilindros,
    ejes: numEjes,
    numero_ejes: numEjes,
    ruedas: numRuedas,
    numero_ruedas: numRuedas,
    peso_bruto: pb,
    peso_neto: ps,
    peso_seco: ps,
    carga_util: cu,
    longitud: l,
    ancho: an,
    altura: al,
    edad: ed,
    alerta_antiguedad: ed >= 15,
    datos_verificados: !!((data.marca || item?.marca) && (data.modelo || item?.modelo) && anioNum)
  };

  resultado.porcentaje_completitud = calcularCompletitudVehiculo(resultado);
  return resultado;
}

@Component({
  selector: 'app-vehiculo-modal',
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
    MatTooltipModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-title">
          <div class="header-icon-box">
            <mat-icon style="color: #2563eb; font-size: 20px;">directions_car</mat-icon>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 class="title-text">Ficha Técnica Vehicular (vehiculos_data)</h2>
              <span 
                [style.background]="porcentajeCompletitud === 100 ? '#dcfce7' : (porcentajeCompletitud >= 70 ? '#e0f2fe' : '#fef3c7')"
                [style.color]="porcentajeCompletitud === 100 ? '#15803d' : (porcentajeCompletitud >= 70 ? '#0369a1' : '#b45309')"
                [style.borderColor]="porcentajeCompletitud === 100 ? '#86efac' : (porcentajeCompletitud >= 70 ? '#7dd3fc' : '#fde68a')"
                style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 5px; border: 1px solid; display: inline-flex; align-items: center; font-family: monospace;">
                <span>{{ porcentajeCompletitud }}% completado</span>
              </span>
            </div>
            <span class="subtitle-text">Especificaciones técnicas completas para habilitación y contraste oficial</span>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" style="color: #64748b;" type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-content">
        <form [formGroup]="form" class="vehiculo-form">
          
          <!-- Sección 1: Placa y Búsqueda en vehiculos_data y API PCM -->
          <div class="form-section-compact">
            <div class="placa-search-row">
              <mat-form-field appearance="outline" class="field-placa" subscriptSizing="dynamic">
                <mat-label>Número de Placa *</mat-label>
                <input matInput formControlName="placa" placeholder="ABC-123" style="font-family: monospace; font-weight: 700; text-transform: uppercase;">
                <button type="button" mat-icon-button matSuffix (click)="buscarPorPlaca()" [disabled]="form.get('placa')?.invalid || buscando || consultandoPcm" matTooltip="Consultar en BD local" color="primary">
                  @if (!buscando) {
                    <mat-icon>search</mat-icon>
                  } @else {
                    <mat-icon class="spin">sync</mat-icon>
                  }
                </button>
              </mat-form-field>

              <button type="button" mat-flat-button class="btn-pcm-consultar" (click)="consultarApiPcm()" [disabled]="form.get('placa')?.invalid || consultandoPcm || buscando" matTooltip="Consultar y sincronizar datos técnicos oficiales desde SUNARP / PCM">
                @if (!consultandoPcm) {
                  <mat-icon style="font-size: 18px; width: 18px; height: 18px;">cloud_sync</mat-icon>
                } @else {
                  <mat-icon class="spin" style="font-size: 18px; width: 18px; height: 18px;">sync</mat-icon>
                }
                <span>Consultar API PCM (SUNARP)</span>
              </button>
              
              @if (mensajeBusqueda) {
                <div class="search-status-box" [ngClass]="{'error': errorBusqueda}">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">{{ errorBusqueda ? 'error' : 'check_circle' }}</mat-icon>
                  <span>{{ mensajeBusqueda }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Sección 2: Identificación General -->
          <div class="form-section-compact">
            <div class="section-badge-header">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #2563eb;">badge</mat-icon>
              <span>1. Identificación y Fabricación</span>
            </div>

            <div class="grid-form-identificacion">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Marca *</mat-label>
                <input matInput formControlName="marca" placeholder="Ej. TOYOTA" [matTooltip]="form.get('marca')?.value || ''" style="text-transform: uppercase;">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Modelo *</mat-label>
                <input matInput formControlName="modelo" placeholder="Ej. HIACE" [matTooltip]="form.get('modelo')?.value || ''" style="text-transform: uppercase; font-weight: 600;">
              </mat-form-field>

              <div style="display: flex; flex-direction: column;">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Año *</mat-label>
                  <input matInput type="number" formControlName="anio_fabricacion" placeholder="2018" [matTooltip]="form.get('anio_fabricacion')?.value ? ('Año fabricación: ' + form.get('anio_fabricacion')?.value) : ''" style="text-align: center; font-weight: 700;">
                </mat-form-field>
                @if (anioPcmSugerido && anioPcmSugerido !== form.get('anio_fabricacion')?.value) {
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 2px; margin-top: 2px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 1px 3px; font-size: 0.60rem; color: #1e40af;" [matTooltip]="'Sugerido PCM: ' + anioPcmSugerido">
                    <span>{{ anioPcmSugerido }}</span>
                    <button type="button" mat-button style="font-size: 0.58rem; height: 16px; line-height: 16px; padding: 0 2px; color: #2563eb; font-weight: 700; min-width: auto;" (click)="aplicarAnioPcm()">
                      Usar
                    </button>
                  </div>
                }
              </div>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Color</mat-label>
                <input matInput formControlName="color" placeholder="Ej. BLANCO" [matTooltip]="form.get('color')?.value || ''" style="text-transform: uppercase;">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Carrocería</mat-label>
                <input matInput formControlName="carroceria" placeholder="Ej. MINIBUS" [matTooltip]="form.get('carroceria')?.value || ''" style="text-transform: uppercase;">
              </mat-form-field>
            </div>
          </div>

          <!-- Sección 3: Clasificación, Combustible y Motor -->
          <div class="form-section-compact">
            <div class="section-badge-header">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #059669;">tune</mat-icon>
              <span>2. Clasificación, Motor e Identificadores</span>
            </div>

            <div class="grid-form-compact-4">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Categoría *</mat-label>
                <mat-select formControlName="categoria" (selectionChange)="onCategoriaChange($event.value)">
                  <mat-option value="M2">M2</mat-option>
                  <mat-option value="M2-C3">M2-C3</mat-option>
                  <mat-option value="M3">M3</mat-option>
                  <mat-option value="M3-C3">M3-C3</mat-option>
                  <mat-option value="M1">M1</mat-option>
                  <mat-option value="M1-C3">M1-C3</mat-option>
                  <mat-option value="N1">N1</mat-option>
                  <mat-option value="N2">N2</mat-option>
                  <mat-option value="N3">N3</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Combustible</mat-label>
                <mat-select formControlName="combustible">
                  <mat-option value="DIESEL">DIESEL</mat-option>
                  <mat-option value="GASOLINA">GASOLINA</mat-option>
                  <mat-option value="GNV">GNV</mat-option>
                  <mat-option value="GLP">GLP</mat-option>
                  <mat-option value="ELECTRICO">ELECTRICO</mat-option>
                  <mat-option value="HIBRIDO">HIBRIDO</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Motor</mat-label>
                <input matInput formControlName="numero_motor" placeholder="Opcional" [matTooltip]="form.get('numero_motor')?.value || ''" style="font-family: monospace; text-transform: uppercase;">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>VIN / N° Serie</mat-label>
                <input matInput formControlName="vin" placeholder="Opcional" [matTooltip]="form.get('vin')?.value || ''" style="font-family: monospace; text-transform: uppercase;">
              </mat-form-field>
            </div>
          </div>

          <!-- Sección 4: Capacidad y Rodaje (Pasajeros antes de Asientos, Cilindros antes de Ejes) -->
          <div class="form-section-compact">
            <div class="section-badge-header">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #d97706;">airline_seat_recline_normal</mat-icon>
              <span>3. Capacidad y Rodaje</span>
            </div>

            <div class="grid-form-compact-5">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Pasajeros</mat-label>
                <input matInput type="number" formControlName="numero_pasajeros" placeholder="Ej. 15">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Asientos</mat-label>
                <input matInput type="number" formControlName="numero_asientos" placeholder="Ej. 16">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Cilindros</mat-label>
                <input matInput type="number" formControlName="numero_cilindros" placeholder="Ej. 4">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Ejes</mat-label>
                <input matInput type="number" formControlName="numero_ejes" placeholder="Ej. 2">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>N° Ruedas</mat-label>
                <input matInput type="number" formControlName="numero_ruedas" placeholder="Ej. 4">
              </mat-form-field>
            </div>
          </div>

          <!-- Sección 5: Pesos y Dimensiones -->
          <div class="form-section-compact">
            <div class="section-badge-header">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #7c3aed;">straighten</mat-icon>
              <span>4. Pesos (Toneladas) y Dimensiones (Metros)</span>
            </div>

            <div class="grid-form-compact-6">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>P. Bruto (t)</mat-label>
                <input matInput type="number" step="0.001" formControlName="peso_bruto" (blur)="onPesoChange()" placeholder="Ej. 3.880">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>P. Seco/Neto (t)</mat-label>
                <input matInput type="number" step="0.001" formControlName="peso_seco" (blur)="onPesoChange()" placeholder="Ej. 2.650">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>C. Útil (t) [Auto]</mat-label>
                <input matInput type="number" step="0.001" formControlName="carga_util" readonly placeholder="Auto" style="font-weight: 700; color: #0284c7; background: #f8fafc;">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Longitud (m)</mat-label>
                <input matInput type="number" step="0.001" formControlName="longitud" (blur)="normalizarDecimalesCampo('longitud')" placeholder="Ej. 5.910">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Ancho (m)</mat-label>
                <input matInput type="number" step="0.001" formControlName="ancho" (blur)="normalizarDecimalesCampo('ancho')" placeholder="Ej. 1.990">
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Altura (m)</mat-label>
                <input matInput type="number" step="0.001" formControlName="altura" (blur)="normalizarDecimalesCampo('altura')" placeholder="Ej. 2.860">
              </mat-form-field>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="form-section-compact" style="margin-bottom: 0;">
            <mat-form-field appearance="outline" style="width: 100%;" subscriptSizing="dynamic">
              <mat-label>Observaciones de Ficha Técnica</mat-label>
              <input matInput formControlName="observaciones" placeholder="Notas sobre la unidad técnica...">
            </mat-form-field>
          </div>

        </form>
      </div>

      <div class="modal-footer">
        <button mat-button (click)="cerrar()" style="color: #64748b;" type="button">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()" style="border-radius: 8px;" type="button">
          <mat-icon>check</mat-icon> Guardar Ficha Técnica
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      background: #f8fafc;
    }
    .modal-header {
      padding: 0.85rem 1.25rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 0.55rem;

      .header-icon-box {
        width: 30px;
        height: 30px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .title-text {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.2;
      }
      .subtitle-text {
        font-size: 0.70rem;
        color: #64748b;
      }
    }
    .modal-content {
      padding: 0.5rem 0.85rem;
      overflow-y: auto;
      max-height: calc(88vh - 90px);
    }
    .form-section-compact {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.45rem 0.65rem;
      margin-bottom: 0.35rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .placa-search-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;

      .field-placa {
        width: 175px;
      }
    }
    .search-status-box {
      font-size: 0.72rem;
      color: #059669;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 4px 8px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      gap: 0.3rem;

      &.error {
        color: #dc2626;
        background: #fef2f2;
        border-color: #fecaca;
      }
    }
    .section-badge-header {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.35rem;
      padding-bottom: 0.2rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .grid-form-identificacion {
      display: grid;
      grid-template-columns: 1.2fr 2.3fr 76px 0.85fr 0.85fr;
      gap: 0.4rem;
    }
    .grid-form-compact {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.4rem;
    }
    .grid-form-compact-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.4rem;
    }
    .grid-form-compact-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.4rem;
    }
    .grid-form-compact-5 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.4rem;
    }
    .grid-form-compact-6 {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.4rem;
    }
    .btn-pcm-consultar {
      background: #0284c7 !important;
      color: white !important;
      height: 35px !important;
      font-weight: 600;
      font-size: 0.75rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0 10px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .modal-footer {
      padding: 0.45rem 1rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    /* Reducción de altura ultra-compacta en los inputs de Material */
    .vehiculo-form {
      ::ng-deep .mat-mdc-text-field-wrapper {
        height: 35px !important;
        border-radius: 6px !important;
        padding-left: 8px !important;
        padding-right: 8px !important;
      }
      ::ng-deep .mat-mdc-form-field-flex {
        height: 35px !important;
        align-items: center !important;
      }
      ::ng-deep .mat-mdc-form-field-infix {
        min-height: 35px !important;
        padding-top: 4px !important;
        padding-bottom: 4px !important;
        display: flex !important;
        align-items: center !important;
      }
      ::ng-deep .mat-mdc-floating-label {
        font-size: 0.78rem !important;
        top: 17px !important;
      }
      ::ng-deep .mat-mdc-floating-label.mdc-floating-label--float-above {
        top: 25px !important;
        font-size: 0.68rem !important;
      }
      ::ng-deep .mat-mdc-form-field-input-control {
        font-size: 0.8rem !important;
      }
      ::ng-deep .mat-mdc-select-value {
        font-size: 0.8rem !important;
      }
      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }
    }
  `]
})
export class VehiculoModalComponent {
  form: FormGroup;
  buscando = false;
  consultandoPcm = false;
  mensajeBusqueda = '';
  errorBusqueda = false;

  private vehiculoDataService = inject(VehiculoDataService);
  anioPcmSugerido: number | null = null;

  get porcentajeCompletitud(): number {
    return calcularCompletitudVehiculo(this.form ? this.form.value : null);
  }

  get tieneClaseC3(): boolean {
    const cat = this.form?.get('categoria')?.value;
    return !!(cat && String(cat).toUpperCase().includes('C3'));
  }

  aplicarAnioPcm() {
    if (this.anioPcmSugerido) {
      this.form.patchValue({ anio_fabricacion: this.anioPcmSugerido });
      this.anioPcmSugerido = null;
    }
  }

  round3(val: any): number | null {
    if (val === undefined || val === null || val === '' || isNaN(Number(val)) || Number(val) <= 0) {
      return null;
    }
    return Math.round(Number(val) * 1000) / 1000;
  }

  normalizarCombustible(comb?: string): string {
    if (!comb) return 'DIESEL';
    const c = String(comb).toUpperCase().trim();
    if (c.includes('PETROL') || c.includes('DIESEL') || c.includes('GASOIL') || c.includes('D2') || c.includes('B5')) {
      return 'DIESEL';
    }
    if (c.includes('GASOLINA') || c.includes('GASOHOL')) {
      return 'GASOLINA';
    }
    if (c.includes('GNV')) return 'GNV';
    if (c.includes('GLP')) return 'GLP';
    if (c.includes('ELEC')) return 'ELECTRICO';
    if (c.includes('HIBRI')) return 'HIBRIDO';
    return 'DIESEL';
  }

  normalizarDecimalesCampo(controlName: string) {
    const val = this.form.get(controlName)?.value;
    const r = this.round3(val);
    if (r !== null) {
      this.form.patchValue({ [controlName]: r });
    }
  }

  recalcularCargaUtil() {
    if (!this.form) return;
    const pbRaw = this.form.get('peso_bruto')?.value;
    const psRaw = this.form.get('peso_seco')?.value;
    if (pbRaw !== undefined && pbRaw !== null && pbRaw !== '' && psRaw !== undefined && psRaw !== null && psRaw !== '') {
      const pb = Number(pbRaw);
      const ps = Number(psRaw);
      if (!isNaN(pb) && !isNaN(ps)) {
        const cu = Math.round(Math.max(0, pb - ps) * 1000) / 1000;
        if (this.form.get('carga_util')?.value !== cu) {
          this.form.patchValue({ carga_util: cu }, { emitEvent: false });
        }
      }
    }
  }

  onPesoChange() {
    this.normalizarDecimalesCampo('peso_bruto');
    this.normalizarDecimalesCampo('peso_seco');
    this.recalcularCargaUtil();
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VehiculoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const v = data?.vehiculo || data || {};

    const anioFab = v.anio_fabricacion || v.anio_modelo || v.ano_fabricacion || v.anio || 2020;
    const catNorm = this.normalizeCategory(v.categoria || 'M2');
    const isM2 = catNorm.includes('M2');

    const asientos = v.asientos || v.numero_asientos || (isM2 ? 16 : 16);
    const pasajeros = v.pasajeros || v.numero_pasajeros || (isM2 ? 15 : Math.max(1, asientos - 1));
    const cilindros = v.cilindros || v.numero_cilindros || 4;
    const pesoNeto = v.peso_neto || v.peso_seco || null;
    const pesoBruto = v.peso_bruto || null;
    const cargaUtil = v.carga_util || null;
    const longitud = v.longitud || v.largo || null;
    const ancho = v.ancho || null;
    const altura = v.altura || v.alto || null;

    const modUpper = String(v.modelo || '').toUpperCase();
    let defPb = pesoBruto;
    let defPs = pesoNeto;
    let defCu = cargaUtil;
    let defL = longitud;
    let defAn = ancho;
    let defAl = altura;

    if (!defPb) {
      if (modUpper.includes('415')) {
        defPb = 3.88; defPs = 2.65; defCu = 1.23; defL = 5.91; defAn = 1.99; defAl = 2.86;
      } else if (modUpper.includes('413')) {
        defPb = 4.60; defPs = 2.89; defCu = 1.71; defL = 6.99; defAn = 1.99; defAl = 2.76;
      } else if (modUpper.includes('313') || modUpper.includes('314') || modUpper.includes('311')) {
        defPb = 3.88; defPs = 2.35; defCu = 1.53; defL = 5.64; defAn = 1.92; defAl = 2.76;
      } else if (modUpper.includes('515') || modUpper.includes('516') || modUpper.includes('519')) {
        defPb = 5.00; defPs = 2.95; defCu = 2.05; defL = 7.34; defAn = 1.99; defAl = 2.86;
      } else if (modUpper.includes('HIACE') || modUpper.includes('COMMUTER')) {
        defPb = 3.25; defPs = 2.06; defCu = 1.13; defL = 5.38; defAn = 1.88; defAl = 2.28;
      } else if (modUpper.includes('MASTER')) {
        defPb = 3.90; defPs = 2.35; defCu = 1.55; defL = 6.20; defAn = 2.07; defAl = 2.49;
      } else if (modUpper.includes('CRAFTER')) {
        defPb = 4.00; defPs = 2.60; defCu = 1.40; defL = 6.84; defAn = 2.04; defAl = 2.59;
      } else if (modUpper.includes('H350')) {
        defPb = 4.00; defPs = 2.65; defCu = 1.35; defL = 6.20; defAn = 2.04; defAl = 2.69;
      } else if (modUpper.includes('TRANSIT')) {
        defPb = 4.00; defPs = 2.50; defCu = 1.50; defL = 5.98; defAn = 2.06; defAl = 2.78;
      }
    }

    this.form = this.fb.group({
      placa: [v.placa || v.placa_actual || '', [Validators.required, Validators.pattern(/^[A-Z0-9-]{6,10}$/i)]],
      marca: [v.marca || '', Validators.required],
      modelo: [v.modelo || '', Validators.required],
      anio_fabricacion: [anioFab, [Validators.required, Validators.min(1950), Validators.max(2030)]],
      color: [v.color || 'BLANCO'],
      clase: [catNorm.includes('C3') ? (v.clase || 'C3') : ''],
      carroceria: [v.carroceria || 'MINIBUS'],
      categoria: [catNorm, Validators.required],
      combustible: [this.normalizarCombustible(v.combustible || 'DIESEL')],
      numero_motor: [v.numero_motor || ''],
      vin: [v.vin || v.numero_serie || ''],
      numero_pasajeros: [pasajeros, [Validators.min(1)]],
      numero_asientos: [asientos, [Validators.min(1)]],
      numero_cilindros: [cilindros, [Validators.min(1)]],
      numero_ejes: [v.numero_ejes || v.ejes || 2, [Validators.min(1)]],
      numero_ruedas: [v.numero_ruedas || v.ruedas || 4, [Validators.min(2)]],
      peso_bruto: [this.round3(defPb), [Validators.min(0)]],
      peso_seco: [this.round3(defPs), [Validators.min(0)]],
      carga_util: [this.round3(defCu), [Validators.min(0)]],
      longitud: [this.round3(defL), [Validators.min(0)]],
      ancho: [this.round3(defAn), [Validators.min(0)]],
      altura: [this.round3(defAl), [Validators.min(0)]],
      observaciones: [v.observaciones || '']
    });

    this.form.get('peso_bruto')?.valueChanges.subscribe(() => this.recalcularCargaUtil());
    this.form.get('peso_seco')?.valueChanges.subscribe(() => this.recalcularCargaUtil());
    this.form.get('categoria')?.valueChanges.subscribe(cat => this.onCategoriaChange(cat));
    this.recalcularCargaUtil();

    const currentPlaca = v.placa || v.placa_actual;
    if (currentPlaca && (!v.marca || !v.modelo || !v.numero_motor || !pesoBruto)) {
      this.buscarPorPlaca();
    }
  }

  normalizeCategory(cat: string): string {
    if (!cat) return 'M2';
    const c = String(cat).toUpperCase().trim().replace(/\s+/g, '');
    if (c === 'M2-C3' || (c.includes('M2') && c.includes('C3'))) return 'M2-C3';
    if (c === 'M3-C3' || (c.includes('M3') && c.includes('C3'))) return 'M3-C3';
    if (c === 'M1-C3' || (c.includes('M1') && c.includes('C3'))) return 'M1-C3';
    if (c === 'M2') return 'M2';
    if (c === 'M3') return 'M3';
    if (c === 'M1') return 'M1';
    if (c === 'N1') return 'N1';
    if (c === 'N2') return 'N2';
    if (c === 'N3') return 'N3';
    return c;
  }

  onCategoriaChange(cat: string) {
    const catUpper = String(cat || '').toUpperCase();
    const isC3 = catUpper.includes('C3');
    const isM2 = catUpper.includes('M2');

    this.form.patchValue({ clase: isC3 ? 'C3' : '' }, { emitEvent: false });

    // Si la categoría contiene M2, la capacidad y rodaje por regla es 15, 16, 4, 2, 4
    if (isM2) {
      this.form.patchValue({
        numero_pasajeros: 15,
        numero_asientos: 16,
        numero_cilindros: 4,
        numero_ejes: 2,
        numero_ruedas: 4
      }, { emitEvent: false });
    }
  }

  buscarPorPlaca() {
    let placa = this.form.get('placa')?.value;
    if (!placa) return;
    
    placa = placa.toUpperCase().trim();
    if (/^[A-Z0-9]{6}$/.test(placa)) {
      placa = `${placa.substring(0, 3)}-${placa.substring(3)}`;
      this.form.get('placa')?.setValue(placa);
    }

    this.buscando = true;
    this.mensajeBusqueda = 'Consultando en vehiculos_data...';
    this.errorBusqueda = false;
    
    this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
      next: (res) => {
        this.buscando = false;
        if (res.success && res.data) {
          const d = res.data;
          this.mensajeBusqueda = 'Datos técnicos cargados desde vehiculos_data';
          this.aplicarDatosTecnicos(d);
        } else {
          this.errorBusqueda = true;
          this.mensajeBusqueda = res.message || 'No se encontraron datos en vehiculos_data';
        }
      },
      error: () => {
        this.buscando = false;
        this.errorBusqueda = true;
        this.mensajeBusqueda = 'Error al consultar vehiculos_data';
      }
    });
  }

  consultarApiPcm() {
    let placa = this.form.get('placa')?.value;
    if (!placa) return;

    placa = placa.toUpperCase().trim();
    if (/^[A-Z0-9]{6}$/.test(placa)) {
      placa = `${placa.substring(0, 3)}-${placa.substring(3)}`;
      this.form.get('placa')?.setValue(placa);
    }

    this.consultandoPcm = true;
    this.mensajeBusqueda = 'Consultando API PCM (SUNARP)...';
    this.errorBusqueda = false;

    this.vehiculoDataService.consultarPcm(placa).subscribe({
      next: (res) => {
        this.consultandoPcm = false;
        if (res.success && res.data) {
          this.mensajeBusqueda = '✓ Datos obtenidos exitosamente de la API PCM (SUNARP)';
          this.aplicarDatosTecnicos(res.data);
        } else {
          this.errorBusqueda = true;
          this.mensajeBusqueda = res.message || 'No se encontraron datos en la API PCM';
        }
      },
      error: () => {
        this.consultandoPcm = false;
        this.errorBusqueda = true;
        this.mensajeBusqueda = 'Error o sin respuesta de la API PCM (SUNARP)';
      }
    });
  }

  private aplicarDatosTecnicos(d: any) {
    const catNorm = this.normalizeCategory(d.categoria || this.form.get('categoria')?.value);
    let claseVal = '';
    if (catNorm.includes('C3')) {
      claseVal = d.clase || this.form.get('clase')?.value || 'C3';
      if (claseVal === 'MICROBUS') claseVal = 'C3';
    } else {
      claseVal = '';
    }

    const valOrKeep = (newVal: any, formField: string, altVal?: any) => {
      if (newVal !== undefined && newVal !== null && newVal !== '' && Number(newVal) !== 0) {
        return Number(newVal);
      }
      if (altVal !== undefined && altVal !== null && altVal !== '' && Number(altVal) !== 0) {
        return Number(altVal);
      }
      const cur = this.form.get(formField)?.value;
      if (cur !== undefined && cur !== null && cur !== '' && Number(cur) !== 0) {
        return Number(cur);
      }
      return null;
    };

    let pb = valOrKeep(d.peso_bruto, 'peso_bruto', d.pesoBruto);
    let ps = valOrKeep(d.peso_seco, 'peso_seco', d.peso_neto || d.pesoNeto);
    let cu = valOrKeep(d.carga_util, 'carga_util', d.cargaUtil);
    let l = valOrKeep(d.longitud, 'longitud', d.largo);
    let an = valOrKeep(d.ancho, 'ancho');
    let al = valOrKeep(d.altura, 'altura', d.alto);

    const modelToCheck = String(d.modelo || d.modelo_vehiculo || this.form.get('modelo')?.value || '').toUpperCase();
    if (!pb) {
      if (modelToCheck.includes('415')) {
        pb = 3.88; ps = 2.65; cu = 1.23; l = 5.91; an = 1.99; al = 2.86;
      } else if (modelToCheck.includes('413')) {
        pb = 4.60; ps = 2.89; cu = 1.71; l = 6.99; an = 1.99; al = 2.76;
      } else if (modelToCheck.includes('313') || modelToCheck.includes('314') || modelToCheck.includes('311')) {
        pb = 3.88; ps = 2.35; cu = 1.53; l = 5.64; an = 1.92; al = 2.76;
      } else if (modelToCheck.includes('515') || modelToCheck.includes('516') || modelToCheck.includes('519')) {
        pb = 5.00; ps = 2.95; cu = 2.05; l = 7.34; an = 1.99; al = 2.86;
      } else if (modelToCheck.includes('HIACE') || modelToCheck.includes('COMMUTER')) {
        pb = 3.25; ps = 2.06; cu = 1.13; l = 5.38; an = 1.88; al = 2.28;
      } else if (modelToCheck.includes('MASTER')) {
        pb = 3.90; ps = 2.35; cu = 1.55; l = 6.20; an = 2.07; al = 2.49;
      } else if (modelToCheck.includes('CRAFTER')) {
        pb = 4.00; ps = 2.60; cu = 1.40; l = 6.84; an = 2.04; al = 2.59;
      } else if (modelToCheck.includes('H350')) {
        pb = 4.00; ps = 2.65; cu = 1.35; l = 6.20; an = 2.04; al = 2.69;
      } else if (modelToCheck.includes('TRANSIT')) {
        pb = 4.00; ps = 2.50; cu = 1.50; l = 5.98; an = 2.06; al = 2.78;
      }
    }
    if (pb && ps) {
      cu = Math.round(Math.max(0, pb - ps) * 1000) / 1000;
    }

    // Lógica para Año de Fabricación:
    // Si ya tenía año (> 1900), no sobreescribir. Se guarda sugerencia de PCM si difiere.
    // Si no tenía año, recién reemplazarlo.
    const curAnio = this.form.get('anio_fabricacion')?.value;
    const anioPcm = d.anio_fabricacion_pcm || d.anio_fabricacion || d.anio_modelo || d.ano_fabricacion;
    let anioFinal = curAnio;

    if (!curAnio || Number(curAnio) <= 1900) {
      anioFinal = anioPcm || null;
      this.anioPcmSugerido = null;
    } else if (anioPcm && Number(anioPcm) > 1900 && Number(anioPcm) !== Number(curAnio)) {
      this.anioPcmSugerido = Number(anioPcm);
    } else {
      this.anioPcmSugerido = null;
    }

    const combFinal = this.normalizarCombustible(d.combustible || this.form.get('combustible')?.value || 'DIESEL');

    this.form.patchValue({
      marca: d.marca || d.marca_vehiculo || this.form.get('marca')?.value,
      modelo: d.modelo || d.modelo_vehiculo || this.form.get('modelo')?.value,
      anio_fabricacion: anioFinal,
      color: d.color || this.form.get('color')?.value || 'BLANCO',
      clase: claseVal,
      carroceria: d.carroceria || d.tipo_carroceria || this.form.get('carroceria')?.value || 'MINIBUS',
      categoria: catNorm,
      combustible: combFinal,
      numero_motor: d.numero_motor || this.form.get('numero_motor')?.value || '',
      vin: d.vin || d.numero_serie || this.form.get('vin')?.value || '',
      numero_pasajeros: valOrKeep(d.numero_pasajeros, 'numero_pasajeros', d.pasajeros) || 15,
      numero_asientos: valOrKeep(d.numero_asientos, 'numero_asientos', d.asientos) || 16,
      numero_cilindros: valOrKeep(d.numero_cilindros, 'numero_cilindros', d.cilindros || d.cilindrada) || 4,
      numero_ejes: valOrKeep(d.numero_ejes, 'numero_ejes', d.ejes) || 2,
      numero_ruedas: valOrKeep(d.numero_ruedas, 'numero_ruedas', d.ruedas) || 4,
      peso_bruto: this.round3(pb),
      peso_seco: this.round3(ps),
      carga_util: this.round3(cu),
      longitud: this.round3(l),
      ancho: this.round3(an),
      altura: this.round3(al),
      observaciones: d.observaciones || (d.propietario ? `Propietario SUNARP: ${d.propietario}` : this.form.get('observaciones')?.value || '')
    });
  }

  cerrar() {
    this.dialogRef.close();
  }

  guardar() {
    if (this.form.valid) {
      const val = this.form.value;
      const cleanPlaca = (val.placa || '').toUpperCase().trim();
      const cuCalculada = (val.peso_bruto && val.peso_seco) 
        ? Math.round(Math.max(0, Number(val.peso_bruto) - Number(val.peso_seco)) * 1000) / 1000 
        : this.round3(val.carga_util);
      const catUpper = String(val.categoria || '').toUpperCase();
      const claseFinal = catUpper.includes('C3') ? 'C3' : '';
      const result = {
        ...val,
        placa: cleanPlaca,
        placa_actual: cleanPlaca,
        clase: claseFinal,
        carga_util: cuCalculada,
        combustible: this.normalizarCombustible(val.combustible),
        asientos: val.numero_asientos,
        numero_asientos: val.numero_asientos,
        pasajeros: val.numero_pasajeros,
        numero_pasajeros: val.numero_pasajeros,
        cilindros: val.numero_cilindros,
        numero_cilindros: val.numero_cilindros,
        ejes: val.numero_ejes,
        numero_ejes: val.numero_ejes,
        ruedas: val.numero_ruedas,
        peso_bruto: this.round3(val.peso_bruto),
        peso_neto: this.round3(val.peso_seco),
        peso_seco: this.round3(val.peso_seco),
        longitud: this.round3(val.longitud),
        ancho: this.round3(val.ancho),
        altura: this.round3(val.altura),
        numero_serie: val.vin,
        porcentaje_completitud: calcularCompletitudVehiculo({ ...val, clase: claseFinal, carga_util: cuCalculada })
      };

      // Guardar ficha técnica en vehiculos_data para permanencia
      this.vehiculoDataService.guardarFichaTecnica(result).subscribe({
        next: () => this.dialogRef.close(result),
        error: (err) => {
          console.warn('Aviso: no se pudo guardar en vehiculos_data:', err);
          this.dialogRef.close(result);
        }
      });
    }
  }
}

