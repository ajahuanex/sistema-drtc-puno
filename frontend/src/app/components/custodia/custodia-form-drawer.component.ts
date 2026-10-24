import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CustodiaService, DocumentoCustodia } from '../../services/custodia.service';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa } from '../../models/empresa.model';

@Component({
  selector: 'app-custodia-form-drawer',
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule,
    MatAutocompleteModule
  ],
  template: `
    @if (isOpen) {
      <!-- Backdrop oscurecido al hacer clic cierra el drawer -->
      <div class="drawer-backdrop" (click)="cerrar()"></div>
    }

    <!-- Panel lateral deslizante desde la derecha -->
    <aside class="side-drawer" [class.drawer-open]="isOpen">
      <!-- Encabezado compacto del Drawer -->
      <div class="drawer-header">
        <div class="header-info">
          <div class="header-icon-pill" [class.icon-acumular]="modoAcumulacion()">
            <mat-icon>{{ modoAcumulacion() ? 'library_add' : (isEdit ? 'edit_document' : 'archive') }}</mat-icon>
          </div>
          <div>
            <h3 class="drawer-title">
              {{ modoAcumulacion() ? 'Acumular / Anexar a Documento en Custodia' : (isEdit ? 'Editar Registro de Documento' : 'Nuevo Ingreso a Custodia de Documentos') }}
            </h3>
            <span class="drawer-badge">Custodia de Documentos • DRTC Puno</span>
          </div>
        </div>
        <button mat-icon-button (click)="cerrar()" class="btn-close" type="button" title="Cerrar panel lateral">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Segmented Buttons: Modo Nuevo vs Acumular (Solo en alta, no en edición) -->
      @if (!isEdit) {
        <div class="mode-switcher-bar">
          <button 
            type="button" 
            class="switch-tab" 
            [class.active]="!modoAcumulacion()" 
            (click)="setModo(false)">
            <mat-icon>post_add</mat-icon>
            <span>Nuevo Documento Independiente</span>
          </button>
          <button 
            type="button" 
            class="switch-tab" 
            [class.active]="modoAcumulacion()" 
            (click)="setModo(true)">
            <mat-icon>library_add</mat-icon>
            <span>Acumular a Documento Existente</span>
          </button>
        </div>
      }

      <!-- CUERPO SEGÚN EL MODO: NUEVO REGISTRO O ACUMULACIÓN -->
      @if (!modoAcumulacion()) {
        <!-- ============================================================= -->
        <!-- MODO A: NUEVO REGISTRO INDEPENDIENTE O EDICIÓN                 -->
        <!-- ============================================================= -->
        <form [formGroup]="form" (ngSubmit)="guardar()" class="drawer-body">

          <!-- 1. DOCUMENTO DE REMISIÓN (MEMO / OFICIO - OPCIONAL) -->
          <div class="form-section">
            <div class="section-label">
              <mat-icon class="sec-ic text-indigo">mail</mat-icon>
              <span>1. Documento de Remisión (Opcional)</span>
            </div>

            <div class="form-row-2">
              <!-- N° Memo / Oficio (OPCIONAL) -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>N° Memorándum u Oficio (Opcional)</mat-label>
                <input matInput formControlName="nro_memorandum" placeholder="Ej. MEMO N° 0124-2026, OFICIO N° 45...">
                <mat-icon matPrefix>tag</mat-icon>
              </mat-form-field>

              <!-- Fecha del Documento -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Fecha de Emisión</mat-label>
                <input matInput type="date" formControlName="fecha_memorandum">
                <mat-icon matPrefix>calendar_today</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row-2">
              <!-- Área / Dependencia Remitente (TEXTO EDITABLE, DEFECTO SUB DIRECCIÓN...) -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Área / Dependencia Remitente</mat-label>
                <input 
                  matInput 
                  formControlName="area_remitente" 
                  list="listaAreasSugeridas" 
                  placeholder="SUB DIRECCION DE TRANSPORTE TERRESTRE">
                <datalist id="listaAreasSugeridas">
                  @for (a of areasOpciones; track a) {
                    <option [value]="a"></option>
                  }
                </datalist>
                <mat-icon matPrefix>corporate_fare</mat-icon>
              </mat-form-field>

              <!-- Remitente / Suscribe (EDITABLE, DEFECTO Lic. Edgar Burneo Gonzales) -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Remitente / Suscribe</mat-label>
                <input 
                  matInput 
                  formControlName="remitente_nombre" 
                  placeholder="Lic. Edgar Burneo Gonzales">
                <mat-icon matPrefix>person</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row-1">
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Sumilla o Asunto del Envío (Opcional)</mat-label>
                <input matInput formControlName="asunto_memorandum" placeholder="Ej. Remite actuados para custodia y archivo definitivo">
                <mat-icon matPrefix>subject</mat-icon>
              </mat-form-field>
            </div>
          </div>

          <!-- 2. DOCUMENTO O ACTUADO A CUSTODIAR (EXPEDIENTE/RESOLUCIÓN/DOC OPCIONAL) -->
          <div class="form-section">
            <div class="section-label">
              <mat-icon class="sec-ic text-blue">folder_open</mat-icon>
              <span>2. Documento, Resolución o Acervo a Custodiar</span>
            </div>

            <div class="form-row-3">
              <!-- N° Documento / Expediente (OPCIONAL) -->
              <mat-form-field appearance="outline" class="dense-field flex-2">
                <mat-label>N° Expediente / Resolución / Doc (Opcional)</mat-label>
                <input matInput formControlName="nro_expediente" placeholder="Ej. R-0120-2024, E-0145-2025, Of. 45...">
                <mat-icon matPrefix>description</mat-icon>
              </mat-form-field>

              <!-- Folios -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>N° Folios *</mat-label>
                <input matInput type="number" formControlName="nro_folios" min="1" required>
                <mat-icon matPrefix>format_list_numbered</mat-icon>
              </mat-form-field>

              <!-- Tomos -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Tomos</mat-label>
                <input matInput type="number" formControlName="nro_tomos" min="1">
                <mat-icon matPrefix>layers</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row-1">
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Tipo de Trámite o Materia</mat-label>
                <mat-select formControlName="tipo_tramite">
                  @for (t of tiposTramite; track t.valor) {
                    <mat-option [value]="t.valor">{{ t.label }}</mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>category</mat-icon>
              </mat-form-field>
            </div>

            <!-- ASUNTO MULTITEXTO (TEXTAREA) -->
            <div class="form-row-1">
              <mat-form-field appearance="outline" class="dense-field textarea-field">
                <mat-label>Asunto o Materia del Documento / Expediente *</mat-label>
                <textarea 
                  matInput 
                  formControlName="asunto_expediente" 
                  rows="2" 
                  placeholder="Describa el contenido, asunto o materia del documento bajo custodia..." 
                  required>
                </textarea>
                <mat-icon matPrefix>edit_note</mat-icon>
              </mat-form-field>
            </div>
          </div>

          <!-- 3. BÚSQUEDA EN BD DE EMPRESAS / ENTRADA MANUAL Y UBICACIÓN FÍSICA -->
          <div class="form-section">
            <div class="section-label">
              <mat-icon class="sec-ic text-amber">business</mat-icon>
              <span>3. Empresa / Administrado y Ubicación Física</span>
            </div>

            <!-- BUSCADOR EN BASE DE DATOS DE EMPRESAS (OPCIONAL) -->
            <div class="empresa-search-container">
              <div class="search-header-text">
                <mat-icon class="search-icon">search</mat-icon>
                <span>Buscar en Base de Datos de Empresas (Opcional):</span>
              </div>

              <div class="search-field-box">
                <input 
                  type="text" 
                  class="search-text-input" 
                  [formControl]="empresaSearchControl"
                  placeholder="Buscar por RUC o Razón Social registrada..."
                  (input)="onEmpresaSearchInput()"
                />
                @if (buscandoEmpresas()) {
                  <mat-icon class="spin-icon">sync</mat-icon>
                } @else if (empresaSearchControl.value) {
                  <button type="button" class="btn-clear-input" (click)="limpiarBuscadorEmpresas()">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>

              <!-- Menú flotante con resultados sugeridos -->
              @if (empresasSugeridas().length > 0) {
                <div class="sugerencias-dropdown">
                  @for (emp of empresasSugeridas(); track emp.id || emp.ruc) {
                    <div class="sugerencia-item" (click)="seleccionarEmpresaBD(emp)">
                      <div class="sug-ruc">{{ emp.ruc }}</div>
                      <div class="sug-name">{{ getRazonSocialTexto(emp) }}</div>
                    </div>
                  }
                </div>
              }

              <!-- Notificación de empresa vinculada -->
              @if (empresaSeleccionadaBD()) {
                <div class="empresa-picked-badge">
                  <mat-icon>check_circle</mat-icon>
                  <span class="emp-picked-text">
                    Empresa seleccionada de BD: <strong>{{ getRazonSocialTexto(empresaSeleccionadaBD()) }}</strong> (RUC: {{ empresaSeleccionadaBD()?.ruc }})
                  </span>
                  <button type="button" class="btn-desvincular" (click)="desvincularEmpresaBD()" title="Quitar selección">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            </div>

            <!-- AVISO DE ACUMULACIÓN SI LA EMPRESA YA TIENE DOCUMENTOS EN CUSTODIA -->
            @if (documentosExistentesMismaEmpresa().length > 0) {
              <div class="acumulacion-hint-card">
                <div class="hint-header">
                  <mat-icon class="text-amber">info</mat-icon>
                  <span>Esta empresa ya tiene <strong>{{ documentosExistentesMismaEmpresa().length }}</strong> registro(s) en custodia:</span>
                </div>
                <div class="hint-body">
                  @for (docPrevio of documentosExistentesMismaEmpresa(); track docPrevio.id || docPrevio._id) {
                    <div class="doc-previo-pill">
                      <span><strong>{{ docPrevio.codigo_custodia }}</strong> • {{ docPrevio.nro_expediente || docPrevio.nro_memorandum || 'S/N' }} ({{ docPrevio.nro_folios }} folios)</span>
                      <button type="button" class="btn-acumular-aqui" (click)="activarAcumulacionPara(docPrevio)">
                        <mat-icon>library_add</mat-icon>
                        <span>Acumular a este</span>
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- CAMPOS EDITABLES MANUALMENTE (SI NO ES EMPRESA REGISTRADA O SE DESEA MODIFICAR) -->
            <div class="form-row-2">
              <!-- RUC / DNI -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>RUC o DNI Administrado</mat-label>
                <input matInput formControlName="ruc" placeholder="Ej. 20448833921" (blur)="onRucBlur()">
                <mat-icon matPrefix>badge</mat-icon>
              </mat-form-field>

              <!-- Razón Social o Nombre -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Razón Social o Administrado (Manual)</mat-label>
                <input matInput formControlName="razon_social" placeholder="Nombre de empresa o particular">
                <mat-icon matPrefix>corporate_fare</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row-2">
              <!-- Resolución vinculada -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Resolución Directoral Vinculada (Opcional)</mat-label>
                <input matInput formControlName="nro_resolucion" placeholder="Ej. R-0141-2024">
                <mat-icon matPrefix>gavel</mat-icon>
              </mat-form-field>

              <!-- Estado de Conservación -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Estado de Conservación</mat-label>
                <mat-select formControlName="estado_conservacion">
                  <mat-option value="BUENO">Bueno (Íntegro y legible)</mat-option>
                  <mat-option value="REGULAR">Regular (Desgaste normal)</mat-option>
                  <mat-option value="DETERIORADO">Deteriorado (Frágil)</mat-option>
                </mat-select>
                <mat-icon matPrefix>health_and_safety</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row-3">
              <!-- Estante -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Estante / Módulo</mat-label>
                <input matInput formControlName="ubicacion_estante" placeholder="Estante 01">
                <mat-icon matPrefix>table_rows</mat-icon>
              </mat-form-field>

              <!-- Archivador / Caja -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Caja / Archivador</mat-label>
                <input matInput formControlName="ubicacion_archivador" placeholder="Caja 01">
                <mat-icon matPrefix>archive</mat-icon>
              </mat-form-field>

              <!-- Código de Ubicación -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Marbete / Código</mat-label>
                <input matInput formControlName="codigo_ubicacion" placeholder="E01-C01">
                <mat-icon matPrefix>qr_code</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row-1">
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Observaciones Técnicas o Anotaciones (Opcional)</mat-label>
                <input matInput formControlName="observaciones" placeholder="Ej. Contiene tarjetas de circulación originales o planos adjuntos">
              </mat-form-field>
            </div>
          </div>

          <!-- 4. ADJUNTAR ARCHIVOS DIGITALIZADOS (PDF) -->
          <div class="form-section">
            <div class="section-label">
              <mat-icon class="sec-ic text-emerald">cloud_upload</mat-icon>
              <span>4. Archivos Digitales Escaneados (Opcional)</span>
            </div>

            <div class="files-grid">
              <!-- Archivo 1: Documento de Remisión (Memo/Oficio) -->
              <div class="file-picker-card" [class.has-file]="archivoMemoSeleccionado() || (isEdit && documento?.archivo_memo)">
                <div class="file-icon-box memo-icon">
                  <mat-icon>picture_as_pdf</mat-icon>
                </div>
                <div class="file-details">
                  <span class="file-card-title">Doc. de Remisión (PDF)</span>
                  @if (archivoMemoSeleccionado()) {
                    <span class="file-name-tag text-emerald">
                      <mat-icon>check_circle</mat-icon>
                      {{ archivoMemoSeleccionado()?.name }}
                    </span>
                  } @else if (isEdit && documento?.archivo_memo) {
                    <span class="file-name-tag text-blue">
                      <mat-icon>link</mat-icon>
                      {{ documento?.nombre_archivo_memo || 'Memo Escaneado' }}
                    </span>
                  } @else {
                    <span class="file-hint">Memorándum, Oficio o Carta</span>
                  }
                </div>
                <input type="file" #fileMemoInput accept=".pdf,.doc,.docx,image/*" (change)="onMemoFileSelected($event)" style="display: none;">
                <div class="file-actions">
                  @if (archivoMemoSeleccionado()) {
                    <button type="button" mat-icon-button (click)="quitarArchivoMemo($event)" title="Quitar archivo">
                      <mat-icon class="text-red">close</mat-icon>
                    </button>
                  }
                  <button type="button" mat-stroked-button class="btn-picker" (click)="fileMemoInput.click()">
                    <mat-icon>upload_file</mat-icon>
                    <span>{{ (archivoMemoSeleccionado() || (isEdit && documento?.archivo_memo)) ? 'Cambiar' : 'Elegir PDF' }}</span>
                  </button>
                </div>
              </div>

              <!-- Archivo 2: Expediente / Actuados -->
              <div class="file-picker-card" [class.has-file]="archivoExpedienteSeleccionado() || (isEdit && documento?.archivo_expediente)">
                <div class="file-icon-box exp-icon">
                  <mat-icon>folder_zip</mat-icon>
                </div>
                <div class="file-details">
                  <span class="file-card-title">Expediente / Actuados (PDF)</span>
                  @if (archivoExpedienteSeleccionado()) {
                    <span class="file-name-tag text-emerald">
                      <mat-icon>check_circle</mat-icon>
                      {{ archivoExpedienteSeleccionado()?.name }}
                    </span>
                  } @else if (isEdit && documento?.archivo_expediente) {
                    <span class="file-name-tag text-blue">
                      <mat-icon>link</mat-icon>
                      {{ documento?.nombre_archivo_expediente || 'Expediente Escaneado' }}
                    </span>
                  } @else {
                    <span class="file-hint">Digitalización de los actuados a resguardar</span>
                  }
                </div>
                <input type="file" #fileExpInput accept=".pdf,.zip,.rar" (change)="onExpedienteFileSelected($event)" style="display: none;">
                <div class="file-actions">
                  @if (archivoExpedienteSeleccionado()) {
                    <button type="button" mat-icon-button (click)="quitarArchivoExpediente($event)" title="Quitar archivo">
                      <mat-icon class="text-red">close</mat-icon>
                    </button>
                  }
                  <button type="button" mat-stroked-button class="btn-picker" (click)="fileExpInput.click()">
                    <mat-icon>upload_file</mat-icon>
                    <span>{{ (archivoExpedienteSeleccionado() || (isEdit && documento?.archivo_expediente)) ? 'Cambiar' : 'Elegir PDF' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer fijo con botones de acción -->
          <div class="drawer-footer">
            <button mat-button type="button" (click)="cerrar()" [disabled]="guardando()" class="btn-cancelar">
              Cancelar
            </button>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || guardando()" class="btn-submit">
              <mat-icon>{{ guardando() ? 'sync' : 'save' }}</mat-icon>
              <span>{{ guardando() ? 'Guardando...' : (isEdit ? 'Actualizar Documento' : 'Registrar en Custodia') }}</span>
            </button>
          </div>

        </form>
      } @else {
        <!-- ============================================================= -->
        <!-- MODO B: ACUMULACIÓN / ANEXO A UN DOCUMENTO EXISTENTE           -->
        <!-- ============================================================= -->
        <form [formGroup]="formAcumular" (ngSubmit)="guardarAcumulacion()" class="drawer-body">

          <!-- 1. SELECCIÓN DEL DOCUMENTO PRINCIPAL DESTINO -->
          <div class="form-section section-dest">
            <div class="section-label">
              <mat-icon class="sec-ic text-indigo">folder_special</mat-icon>
              <span>1. Seleccionar Registro Destino en Custodia</span>
            </div>

            <mat-form-field appearance="outline" class="dense-field">
              <mat-label>Documento Principal al que se acumulará</mat-label>
              <mat-select [formControl]="docDestinoControl" (selectionChange)="onDocDestinoChange($event.value)" required>
                @for (d of custodiaService.documentos(); track d.id || d._id) {
                  <mat-option [value]="d">
                    <strong>{{ d.codigo_custodia }}</strong> — {{ d.razon_social || 'Particular' }} ({{ d.nro_expediente || d.nro_memorandum || 'S/N' }}) • {{ d.nro_folios }} folios
                  </mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>inventory_2</mat-icon>
            </mat-form-field>

            <!-- Tarjeta resumen del expediente principal destino -->
            @if (docDestinoSeleccionado()) {
              <div class="target-card">
                <div class="target-head">
                  <span class="target-code">{{ docDestinoSeleccionado()?.codigo_custodia }}</span>
                  <span class="target-status">{{ docDestinoSeleccionado()?.estado_custodia }}</span>
                </div>
                <div class="target-title">
                  {{ docDestinoSeleccionado()?.razon_social || 'Administrado no consignado' }}
                </div>
                <div class="target-meta">
                  <span>Doc: <strong>{{ docDestinoSeleccionado()?.nro_expediente || docDestinoSeleccionado()?.nro_memorandum || 'S/N' }}</strong></span>
                  <span>Folios actuales: <strong>{{ docDestinoSeleccionado()?.nro_folios }}</strong></span>
                  <span>Ubicación: <strong>{{ docDestinoSeleccionado()?.ubicacion_estante }} / {{ docDestinoSeleccionado()?.ubicacion_archivador }}</strong></span>
                </div>
              </div>
            }
          </div>

          <!-- 2. DATOS DEL DOCUMENTO O ACTUADO A ACUMULAR -->
          <div class="form-section">
            <div class="section-label">
              <mat-icon class="sec-ic text-blue">add_to_photos</mat-icon>
              <span>2. Datos del Documento a Acumular / Anexar</span>
            </div>

            <div class="form-row-2">
              <!-- N° Documento que se acumula -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>N° de Documento a Acumular</mat-label>
                <input matInput formControlName="nro_documento" placeholder="Ej. OFICIO N° 230-2026, MEMO 88...">
                <mat-icon matPrefix>tag</mat-icon>
              </mat-form-field>

              <!-- Fecha -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Fecha del Documento</mat-label>
                <input matInput type="date" formControlName="fecha_documento">
                <mat-icon matPrefix>calendar_today</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row-2">
              <!-- Folios a sumar -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Folios Útiles a Sumar *</mat-label>
                <input matInput type="number" formControlName="folios_agregados" min="0" placeholder="0">
                <mat-icon matPrefix>format_list_numbered</mat-icon>
              </mat-form-field>

              <!-- Área remitente -->
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Área Remitente</mat-label>
                <input matInput formControlName="area_remitente" placeholder="SUB DIRECCION DE TRANSPORTE TERRESTRE">
                <mat-icon matPrefix>corporate_fare</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row-1">
              <mat-form-field appearance="outline" class="dense-field">
                <mat-label>Remitente / Suscribe</mat-label>
                <input matInput formControlName="remitente_nombre" placeholder="Lic. Edgar Burneo Gonzales">
                <mat-icon matPrefix>person</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row-1">
              <mat-form-field appearance="outline" class="dense-field textarea-field">
                <mat-label>Asunto o Motivo de la Acumulación *</mat-label>
                <textarea 
                  matInput 
                  formControlName="asunto" 
                  rows="2" 
                  placeholder="Describa el contenido del documento o informe que se acumula al expediente principal..." 
                  required>
                </textarea>
                <mat-icon matPrefix>subject</mat-icon>
              </mat-form-field>
            </div>
          </div>

          <!-- 3. ADJUNTAR ARCHIVO PDF DEL ACTUADO ACUMULADO -->
          <div class="form-section">
            <div class="section-label">
              <mat-icon class="sec-ic text-emerald">attach_file</mat-icon>
              <span>3. Escaneo del Documento Acumulado (PDF)</span>
            </div>

            <div class="file-picker-card" [class.has-file]="archivoAcumuladoSeleccionado()">
              <div class="file-icon-box memo-icon">
                <mat-icon>picture_as_pdf</mat-icon>
              </div>
              <div class="file-details">
                <span class="file-card-title">Documento / Actuado Acumulado (PDF)</span>
                @if (archivoAcumuladoSeleccionado()) {
                  <span class="file-name-tag text-emerald">
                    <mat-icon>check_circle</mat-icon>
                    {{ archivoAcumuladoSeleccionado()?.name }}
                  </span>
                } @else {
                  <span class="file-hint">Suba el PDF escaneado del informe, memo o documento acumulado</span>
                }
              </div>
              <input type="file" #fileAcumInput accept=".pdf,.doc,.docx,image/*" (change)="onAcumuladoFileSelected($event)" style="display: none;">
              <div class="file-actions">
                @if (archivoAcumuladoSeleccionado()) {
                  <button type="button" mat-icon-button (click)="quitarArchivoAcumulado($event)" title="Quitar archivo">
                    <mat-icon class="text-red">close</mat-icon>
                  </button>
                }
                <button type="button" mat-stroked-button class="btn-picker" (click)="fileAcumInput.click()">
                  <mat-icon>upload_file</mat-icon>
                  <span>{{ archivoAcumuladoSeleccionado() ? 'Cambiar' : 'Elegir PDF' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer fijo Acumular -->
          <div class="drawer-footer">
            <button mat-button type="button" (click)="cerrar()" [disabled]="guardando()" class="btn-cancelar">
              Cancelar
            </button>
            <button 
              mat-flat-button 
              color="primary" 
              type="submit" 
              [disabled]="!docDestinoSeleccionado() || formAcumular.invalid || guardando()" 
              class="btn-submit btn-accum">
              <mat-icon>{{ guardando() ? 'sync' : 'library_add' }}</mat-icon>
              <span>{{ guardando() ? 'Acumulando...' : 'Acumular al Documento' }}</span>
            </button>
          </div>

        </form>
      }

    </aside>
  `,
  styles: [`
    /* ── BACKDROP ─────────────────────────────────────────────── */
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      z-index: 1040;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ── SIDE DRAWER (LATERAL DERECHA) ────────────────────────── */
    .side-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 580px;
      max-width: 95vw;
      background: #ffffff;
      z-index: 1050;
      box-shadow: -6px 0 28px rgba(0, 0, 0, 0.16);
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: inherit;
    }

    .side-drawer.drawer-open {
      transform: translateX(0);
    }

    /* ── HEADER ──────────────────────────────────────────────── */
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1.25rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;

      .header-info {
        display: flex;
        align-items: center;
        gap: 10px;

        .header-icon-pill {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          &.icon-acumular {
            background: #eef2ff;
            color: #4f46e5;
          }
        }

        .drawer-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .drawer-badge {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 500;
        }
      }

      .btn-close {
        color: #64748b;
        &:hover { color: #0f172a; }
      }
    }

    /* ── MODE SWITCHER TABS ──────────────────────────────────── */
    .mode-switcher-bar {
      display: flex;
      background: #f1f5f9;
      padding: 4px;
      gap: 4px;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;

      .switch-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: #64748b;
        font-size: 0.76rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }

        &:hover {
          color: #1e293b;
          background: rgba(255, 255, 255, 0.6);
        }

        &.active {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          font-weight: 700;
        }
      }
    }

    /* ── BODY ────────────────────────────────────────────────── */
    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.25rem 5rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      background: #fafafa;
    }

    /* ── SECTIONS ────────────────────────────────────────────── */
    .form-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

      .section-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.76rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #334155;
        margin-bottom: 0.2rem;

        .sec-ic {
          font-size: 17px;
          width: 17px;
          height: 17px;
        }
      }
    }

    .text-indigo { color: #4f46e5; }
    .text-blue { color: #2563eb; }
    .text-amber { color: #d97706; }
    .text-emerald { color: #059669; }
    .text-red { color: #dc2626; }

    /* ── FORM ROWS & GRIDS ───────────────────────────────────── */
    .form-row-1 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.55rem;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.55rem;
    }

    .form-row-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.55rem;

      .flex-2 {
        grid-column: span 1;
      }
    }

    @media (max-width: 540px) {
      .form-row-2, .form-row-3 {
        grid-template-columns: 1fr;
      }
    }

    /* ── DENSE FORM FIELDS ───────────────────────────────────── */
    .dense-field {
      width: 100%;
      font-size: 0.82rem;

      ::ng-deep .mat-mdc-text-field-wrapper {
        padding: 0 10px;
      }

      ::ng-deep .mat-mdc-form-field-icon-prefix {
        padding-right: 6px;
        color: #64748b;
        .mat-icon {
          font-size: 17px;
          width: 17px;
          height: 17px;
        }
      }

      ::ng-deep input.mat-mdc-input-element {
        font-size: 0.82rem;
      }
    }

    .textarea-field {
      ::ng-deep textarea.mat-mdc-input-element {
        font-size: 0.82rem;
        line-height: 1.4;
        resize: vertical;
      }
    }

    /* ── BÚSQUEDA EN BD DE EMPRESAS ──────────────────────────── */
    .empresa-search-container {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 6px;

      .search-header-text {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.74rem;
        font-weight: 700;
        color: #3b82f6;

        .search-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .search-field-box {
        display: flex;
        align-items: center;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 4px 8px;
        position: relative;

        .search-text-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.82rem;
          color: #0f172a;
          background: transparent;

          &::placeholder {
            color: #94a3b8;
          }
        }

        .spin-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: #3b82f6;
          animation: spin 1s infinite linear;
        }

        .btn-clear-input {
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }

          &:hover { color: #dc2626; }
        }
      }

      .sugerencias-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        max-height: 180px;
        overflow-y: auto;
        z-index: 50;
        margin-top: 2px;

        .sugerencia-item {
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.78rem;

          &:hover {
            background: #eff6ff;
          }

          .sug-ruc {
            font-family: monospace;
            font-weight: 700;
            color: #2563eb;
            background: #e0f2fe;
            padding: 1px 5px;
            border-radius: 4px;
            font-size: 0.74rem;
          }

          .sug-name {
            color: #1e293b;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      .empresa-picked-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 6px;
        padding: 4px 8px;
        color: #065f46;
        font-size: 0.74rem;

        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
          color: #059669;
        }

        .emp-picked-text {
          flex: 1;
        }

        .btn-desvincular {
          border: none;
          background: transparent;
          color: #059669;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;

          mat-icon {
            font-size: 15px;
            width: 15px;
            height: 15px;
          }

          &:hover { color: #dc2626; }
        }
      }
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* ── NOTIFICACIÓN DE ACUMULACIÓN RECOMENDADA ──────────────── */
    .acumulacion-hint-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 0.6rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .hint-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.74rem;
        color: #92400e;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .hint-body {
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-top: 2px;

        .doc-previo-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid #fef3c7;
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 0.72rem;
          color: #78350f;

          .btn-acumular-aqui {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            border: 1px solid #d97706;
            background: #fffbeb;
            color: #b45309;
            font-size: 0.68rem;
            font-weight: 700;
            border-radius: 4px;
            padding: 2px 6px;
            cursor: pointer;

            mat-icon {
              font-size: 13px;
              width: 13px;
              height: 13px;
            }

            &:hover {
              background: #d97706;
              color: white;
            }
          }
        }
      }
    }

    /* ── RESUMEN EXPEDIENTE DESTINO (MODO ACUMULAR) ────────────── */
    .target-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 0.65rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 3px;

      .target-head {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .target-code {
          font-family: monospace;
          font-weight: 800;
          color: #1d4ed8;
          font-size: 0.88rem;
        }

        .target-status {
          font-size: 0.68rem;
          font-weight: 700;
          color: #1e40af;
          background: #dbeafe;
          padding: 1px 6px;
          border-radius: 4px;
        }
      }

      .target-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: #0f172a;
      }

      .target-meta {
        display: flex;
        gap: 12px;
        font-size: 0.72rem;
        color: #475569;
      }
    }

    /* ── FILES CARDS ─────────────────────────────────────────── */
    .files-grid {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .file-picker-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0.6rem 0.85rem;
      border: 1.5px dashed #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      transition: all 0.2s;

      &.has-file {
        border-color: #10b981;
        background: #f0fdf4;
      }

      .file-icon-box {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.memo-icon {
          background: #fee2e2;
          color: #dc2626;
        }
        &.exp-icon {
          background: #eff6ff;
          color: #2563eb;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .file-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;

        .file-card-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #1e293b;
        }

        .file-hint {
          font-size: 0.7rem;
          color: #64748b;
        }

        .file-name-tag {
          font-size: 0.72rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
      }

      .file-actions {
        display: flex;
        align-items: center;
        gap: 4px;

        .btn-picker {
          height: 32px;
          font-size: 0.74rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0 10px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }
    }

    /* ── FOOTER FIJO ─────────────────────────────────────────── */
    .drawer-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 0.8rem 1.25rem;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      box-shadow: 0 -3px 12px rgba(0, 0, 0, 0.04);
      z-index: 20;

      .btn-cancelar {
        font-size: 0.82rem;
        font-weight: 600;
        color: #64748b;
      }

      .btn-submit {
        font-size: 0.82rem;
        font-weight: 700;
        padding: 0 1.2rem;
        height: 38px;
        display: inline-flex;
        align-items: center;
        gap: 6px;

        &.btn-accum {
          background: #4f46e5;
          color: white;
        }
      }
    }
  `]
})
export class CustodiaFormDrawerComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  public custodiaService = inject(CustodiaService);
  private empresaService = inject(EmpresaService);
  private snackBar = inject(MatSnackBar);

  @Input() isOpen = false;
  @Input() isEdit = false;
  @Input() documento: DocumentoCustodia | null = null;
  @Input() initialModoAcumulacion = false;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<boolean>();

  // Modo: false = Registro/Edición normal, true = Acumulación
  modoAcumulacion = signal<boolean>(false);

  // Estados de búsqueda de empresas
  empresaSearchControl = new FormControl('');
  buscandoEmpresas = signal<boolean>(false);
  empresasSugeridas = signal<Empresa[]>([]);
  empresaSeleccionadaBD = signal<Empresa | null>(null);

  // Documentos de custodia ya existentes para la misma empresa
  documentosExistentesMismaEmpresa = signal<DocumentoCustodia[]>([]);

  // Estado para modo Acumulación
  docDestinoControl = new FormControl<DocumentoCustodia | null>(null);
  docDestinoSeleccionado = signal<DocumentoCustodia | null>(null);
  archivoAcumuladoSeleccionado = signal<File | null>(null);

  guardando = signal<boolean>(false);
  archivoMemoSeleccionado = signal<File | null>(null);
  archivoExpedienteSeleccionado = signal<File | null>(null);

  areasOpciones = [
    'SUB DIRECCION DE TRANSPORTE TERRESTRE',
    'SUBDIRECCIÓN DE AUTORIZACIONES',
    'SUBDIRECCIÓN DE FISCALIZACIÓN',
    'DIRECCIÓN DE CIRCULACIÓN TERRESTRE',
    'DIRECCIÓN REGIONAL DRTC PUNO',
    'ASESORÍA JURÍDICA',
    'MESA DE PARTES / TRÁMITE DOCUMENTARIO',
    'ARCHIVO CENTRAL GORE PUNO'
  ];

  tiposTramite = [
    { valor: 'TRAMITE_GENERAL', label: 'Trámite Administrativo General' },
    { valor: 'CONCESION_RUTA', label: 'Concesión / Autorización de Ruta' },
    { valor: 'INCREMENTO_FLOTA', label: 'Incremento de Flota Vehicular' },
    { valor: 'SUSTITUCION_FLOTA', label: 'Sustitución de Flota Vehicular' },
    { valor: 'RENOVACION_PERMISO', label: 'Renovación de Permiso de Operación' },
    { valor: 'MODIFICACION_RUTA', label: 'Modificación de Ruta / Itinerario' },
    { valor: 'BAJA_VEHICULAR', label: 'Baja e Inhabilitación Vehicular' },
    { valor: 'SANCION_FISCALIZACION', label: 'Procedimiento Sancionador / PAD / Fiscalización' },
    { valor: 'DUPLICADO_TUC', label: 'Duplicado o Canje de TUC' }
  ];

  // Formulario de Registro o Edición Normal
  form: FormGroup = this.fb.group({
    nro_memorandum: [''],
    fecha_memorandum: [new Date().toISOString().substring(0, 10)],
    area_remitente: ['SUB DIRECCION DE TRANSPORTE TERRESTRE'],
    remitente_nombre: ['Lic. Edgar Burneo Gonzales'],
    asunto_memorandum: [''],

    nro_expediente: [''],
    fecha_expediente: [''],
    nro_folios: [1, [Validators.required, Validators.min(1)]],
    nro_tomos: [1, [Validators.min(1)]],
    tipo_tramite: ['TRAMITE_GENERAL'],
    asunto_expediente: ['', Validators.required],

    ruc: [''],
    razon_social: [''],
    nro_resolucion: [''],
    ubicacion_estante: ['Estante 01'],
    ubicacion_archivador: ['Caja 01 / Archivador A'],
    codigo_ubicacion: [''],
    estado_conservacion: ['BUENO'],
    observaciones: ['']
  });

  // Formulario para Acumular Documento a registro existente
  formAcumular: FormGroup = this.fb.group({
    nro_documento: [''],
    fecha_documento: [new Date().toISOString().substring(0, 10)],
    folios_agregados: [1, [Validators.required, Validators.min(0)]],
    area_remitente: ['SUB DIRECCION DE TRANSPORTE TERRESTRE'],
    remitente_nombre: ['Lic. Edgar Burneo Gonzales'],
    asunto: ['', Validators.required]
  });

  ngOnInit(): void {
    this.initFormData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (changes['initialModoAcumulacion'] !== undefined) {
        this.modoAcumulacion.set(this.initialModoAcumulacion);
      } else {
        this.modoAcumulacion.set(false);
      }
      this.initFormData();
    }
    if (changes['initialModoAcumulacion'] && this.isOpen) {
      this.modoAcumulacion.set(this.initialModoAcumulacion);
      if (this.initialModoAcumulacion && this.documento) {
        this.docDestinoControl.setValue(this.documento);
        this.docDestinoSeleccionado.set(this.documento);
      }
    }
  }

  setModo(esAcumular: boolean): void {
    this.modoAcumulacion.set(esAcumular);
  }

  private initFormData(): void {
    this.archivoMemoSeleccionado.set(null);
    this.archivoExpedienteSeleccionado.set(null);
    this.archivoAcumuladoSeleccionado.set(null);
    this.empresaSearchControl.setValue('');
    this.empresasSugeridas.set([]);
    this.empresaSeleccionadaBD.set(null);
    this.documentosExistentesMismaEmpresa.set([]);
    this.guardando.set(false);

    if (this.isEdit && this.documento) {
      this.modoAcumulacion.set(false);
      const d = this.documento;
      this.form.patchValue({
        nro_memorandum: d.nro_memorandum || '',
        fecha_memorandum: d.fecha_memorandum || new Date().toISOString().substring(0, 10),
        area_remitente: d.area_remitente || 'SUB DIRECCION DE TRANSPORTE TERRESTRE',
        remitente_nombre: d.remitente_nombre || 'Lic. Edgar Burneo Gonzales',
        asunto_memorandum: d.asunto_memorandum || '',
        nro_expediente: d.nro_expediente || '',
        fecha_expediente: d.fecha_expediente || '',
        nro_folios: d.nro_folios || 1,
        nro_tomos: d.nro_tomos || 1,
        tipo_tramite: d.tipo_tramite || 'TRAMITE_GENERAL',
        asunto_expediente: d.asunto_expediente || '',
        ruc: d.ruc || '',
        razon_social: d.razon_social || '',
        nro_resolucion: d.nro_resolucion || '',
        ubicacion_estante: d.ubicacion_estante || 'Estante 01',
        ubicacion_archivador: d.ubicacion_archivador || 'Caja 01 / Archivador A',
        codigo_ubicacion: d.codigo_ubicacion || '',
        estado_conservacion: d.estado_conservacion || 'BUENO',
        observaciones: d.observaciones || ''
      });
    } else {
      // Valores por defecto al registrar nuevo
      this.form.reset({
        nro_memorandum: '',
        fecha_memorandum: new Date().toISOString().substring(0, 10),
        area_remitente: 'SUB DIRECCION DE TRANSPORTE TERRESTRE',
        remitente_nombre: 'Lic. Edgar Burneo Gonzales',
        asunto_memorandum: '',
        nro_expediente: '',
        fecha_expediente: '',
        nro_folios: 1,
        nro_tomos: 1,
        tipo_tramite: 'TRAMITE_GENERAL',
        asunto_expediente: '',
        ruc: '',
        razon_social: '',
        nro_resolucion: '',
        ubicacion_estante: 'Estante 01',
        ubicacion_archivador: 'Caja 01 / Archivador A',
        codigo_ubicacion: '',
        estado_conservacion: 'BUENO',
        observaciones: ''
      });

      this.formAcumular.reset({
        nro_documento: '',
        fecha_documento: new Date().toISOString().substring(0, 10),
        folios_agregados: 1,
        area_remitente: 'SUB DIRECCION DE TRANSPORTE TERRESTRE',
        remitente_nombre: 'Lic. Edgar Burneo Gonzales',
        asunto: ''
      });

      if (this.documento) {
        this.docDestinoControl.setValue(this.documento);
        this.docDestinoSeleccionado.set(this.documento);
      } else {
        const primero = this.custodiaService.documentos()?.[0] || null;
        this.docDestinoControl.setValue(primero);
        this.docDestinoSeleccionado.set(primero);
      }
    }
  }

  // ==========================================
  // BÚSQUEDA Y VINCULACIÓN DE EMPRESAS
  // ==========================================
  onEmpresaSearchInput(): void {
    const term = this.empresaSearchControl.value?.trim();
    if (!term || term.length < 2) {
      this.empresasSugeridas.set([]);
      return;
    }

    this.buscandoEmpresas.set(true);
    this.empresaService.buscarEmpresas(term).subscribe({
      next: (res) => {
        this.buscandoEmpresas.set(false);
        this.empresasSugeridas.set(res || []);
      },
      error: () => {
        this.buscandoEmpresas.set(false);
        this.empresasSugeridas.set([]);
      }
    });
  }

  limpiarBuscadorEmpresas(): void {
    this.empresaSearchControl.setValue('');
    this.empresasSugeridas.set([]);
  }

  getRazonSocialTexto(emp?: any): string {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
    if (typeof emp.razonSocial === 'string') return emp.razonSocial;
    if (emp.razonSocial && typeof emp.razonSocial === 'object') {
      return emp.razonSocial.principal || emp.razonSocial.sunat || '';
    }
    return '';
  }

  seleccionarEmpresaBD(emp: Empresa): void {
    this.empresaSeleccionadaBD.set(emp);
    const nombre = this.getRazonSocialTexto(emp);
    this.empresaSearchControl.setValue(`${emp.ruc} - ${nombre}`);
    this.empresasSugeridas.set([]);

    // Actualizar campos del formulario
    this.form.patchValue({
      ruc: emp.ruc,
      razon_social: nombre
    });

    // Verificar si esta empresa ya tiene registros en custodia
    this.verificarDocumentosPreviosEmpresa(emp.ruc, nombre);
    this.snackBar.open(`✓ Empresa vinculada: ${nombre}`, 'OK', { duration: 2500 });
  }

  desvincularEmpresaBD(): void {
    this.empresaSeleccionadaBD.set(null);
    this.empresaSearchControl.setValue('');
    this.empresasSugeridas.set([]);
    this.documentosExistentesMismaEmpresa.set([]);
  }

  onRucBlur(): void {
    const ruc = this.form.get('ruc')?.value?.trim();
    if (ruc && ruc.length === 11) {
      this.empresaService.getEmpresas(0, 100).subscribe({
        next: (empresas) => {
          const emp = empresas.find(e => e.ruc === ruc);
          if (emp) {
            const nombre = this.getRazonSocialTexto(emp);
            this.form.patchValue({ razon_social: nombre });
            this.empresaSeleccionadaBD.set(emp);
            this.verificarDocumentosPreviosEmpresa(emp.ruc, nombre);
            this.snackBar.open(`✓ Empresa autocompletada: ${nombre}`, 'OK', { duration: 2500 });
          } else {
            this.verificarDocumentosPreviosEmpresa(ruc, this.form.get('razon_social')?.value);
          }
        }
      });
    }
  }

  private verificarDocumentosPreviosEmpresa(ruc?: string, razonSocial?: string): void {
    if (!ruc && !razonSocial) return;
    const docs = this.custodiaService.documentos().filter(d => {
      const matchRuc = ruc && d.ruc && d.ruc.trim() === ruc.trim();
      const matchRazon = razonSocial && d.razon_social && d.razon_social.toLowerCase().includes(razonSocial.toLowerCase().trim());
      return matchRuc || matchRazon;
    });
    this.documentosExistentesMismaEmpresa.set(docs);
  }

  activarAcumulacionPara(docPrevio: DocumentoCustodia): void {
    this.docDestinoControl.setValue(docPrevio);
    this.docDestinoSeleccionado.set(docPrevio);
    this.modoAcumulacion.set(true);
    this.snackBar.open(`Cambiando a modo Acumular hacia: ${docPrevio.codigo_custodia}`, 'OK', { duration: 3000 });
  }

  onDocDestinoChange(doc: DocumentoCustodia | null): void {
    this.docDestinoSeleccionado.set(doc);
  }

  // ==========================================
  // ARCHIVOS ADJUNTOS
  // ==========================================
  onMemoFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.archivoMemoSeleccionado.set(file);
    }
  }

  quitarArchivoMemo(event: Event): void {
    event.stopPropagation();
    this.archivoMemoSeleccionado.set(null);
  }

  onExpedienteFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.archivoExpedienteSeleccionado.set(file);
    }
  }

  quitarArchivoExpediente(event: Event): void {
    event.stopPropagation();
    this.archivoExpedienteSeleccionado.set(null);
  }

  onAcumuladoFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.archivoAcumuladoSeleccionado.set(file);
    }
  }

  quitarArchivoAcumulado(event: Event): void {
    event.stopPropagation();
    this.archivoAcumuladoSeleccionado.set(null);
  }

  // ==========================================
  // GUARDAR: NUEVO O ACTUALIZAR
  // ==========================================
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const val = { ...this.form.value };

    if (!val.asunto_expediente || !val.asunto_expediente.trim()) {
      val.asunto_expediente = 'Documento derivado a custodia';
    }

    if (this.isEdit && this.documento) {
      // Modo Edición
      const docId = this.documento.id || this.documento._id!;
      this.custodiaService.actualizar(docId, val).subscribe({
        next: () => {
          const promesas: Promise<any>[] = [];
          if (this.archivoMemoSeleccionado()) {
            promesas.push(this.custodiaService.subirArchivoMemo(docId, this.archivoMemoSeleccionado()!).toPromise());
          }
          if (this.archivoExpedienteSeleccionado()) {
            promesas.push(this.custodiaService.subirArchivoExpediente(docId, this.archivoExpedienteSeleccionado()!).toPromise());
          }

          Promise.all(promesas).then(() => {
            this.guardando.set(false);
            this.snackBar.open('✓ Registro de custodia actualizado correctamente', 'Cerrar', { duration: 3500 });
            this.saved.emit(true);
          }).catch(() => {
            this.guardando.set(false);
            this.snackBar.open('✓ Metadatos actualizados con éxito', 'OK', { duration: 3500 });
            this.saved.emit(true);
          });
        },
        error: (err) => {
          this.guardando.set(false);
          this.snackBar.open(`❌ Error al actualizar: ${err.message || 'Error en servidor'}`, 'Cerrar', { duration: 5000 });
        }
      });
    } else {
      // Modo Nuevo Registro (Multipart con FormData)
      const fd = new FormData();
      Object.keys(val).forEach(k => {
        if (val[k] !== null && val[k] !== undefined && val[k] !== '') {
          fd.append(k, val[k]);
        }
      });

      if (this.archivoMemoSeleccionado()) {
        fd.append('archivo_memo', this.archivoMemoSeleccionado()!);
      }
      if (this.archivoExpedienteSeleccionado()) {
        fd.append('archivo_expediente', this.archivoExpedienteSeleccionado()!);
      }

      this.custodiaService.crearConArchivos(fd).subscribe({
        next: (nuevo) => {
          this.guardando.set(false);
          this.snackBar.open(`✓ Documento archivado en custodia: ${nuevo.codigo_custodia || nuevo.nro_expediente || 'Registrado'}`, 'Cerrar', { duration: 4000 });
          this.saved.emit(true);
        },
        error: (err) => {
          this.guardando.set(false);
          this.snackBar.open(`❌ Error al registrar en custodia: ${err.message || 'Error en servidor'}`, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  // ==========================================
  // GUARDAR: MODO ACUMULACIÓN
  // ==========================================
  guardarAcumulacion(): void {
    const destino = this.docDestinoSeleccionado();
    if (!destino) {
      this.snackBar.open('Por favor seleccione el documento de custodia destino', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.formAcumular.invalid) {
      this.formAcumular.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const val = this.formAcumular.value;
    const docId = destino.id || destino._id!;

    const fd = new FormData();
    if (val.nro_documento) fd.append('nro_documento', val.nro_documento);
    if (val.fecha_documento) fd.append('fecha_documento', val.fecha_documento);
    fd.append('folios_agregados', String(val.folios_agregados || 0));
    if (val.area_remitente) fd.append('area_remitente', val.area_remitente);
    if (val.remitente_nombre) fd.append('remitente_nombre', val.remitente_nombre);
    if (val.asunto) fd.append('asunto', val.asunto);

    if (this.archivoAcumuladoSeleccionado()) {
      fd.append('archivo', this.archivoAcumuladoSeleccionado()!);
    }

    this.custodiaService.acumularDocumento(docId, fd).subscribe({
      next: (actualizado) => {
        this.guardando.set(false);
        this.snackBar.open(`✓ Documento acumulado con éxito a ${actualizado.codigo_custodia}. Folios totales: ${actualizado.nro_folios}`, 'Cerrar', { duration: 4500 });
        this.saved.emit(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.snackBar.open(`❌ Error al acumular documento: ${err.message || 'Error en servidor'}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  cerrar(): void {
    if (!this.guardando()) {
      this.closed.emit();
    }
  }
}
