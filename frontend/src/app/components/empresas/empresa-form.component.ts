import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { EmpresaService } from '../../services/empresa.service';
import { Empresa, EmpresaCreate, EmpresaUpdate, Socio } from '../../models/empresa.model';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatStepperModule
  ],
  template: `
    <div class="page-container">
      <!-- Header Banner (Stitch Form Hero Banner) -->
      <div class="form-hero-banner" data-purpose="form-hero-banner">
        <div class="hero-left">
          <button mat-stroked-button class="btn-hero-back" (click)="volver()" matTooltip="Volver al Padrón de Empresas">
            <span class="material-symbols-outlined">arrow_back</span>
            <span>Volver</span>
          </button>
          <div class="hero-title-group">
            <div class="hero-icon-badge">
              <span class="material-symbols-outlined">{{ isEditing() ? 'edit_document' : 'domain_add' }}</span>
            </div>
            <div>
              <div class="hero-pill-badge">
                <span class="pulse-dot"></span>
                <span>Padrón Regional de Transportes DRTC Puno (D.S. 017-2009-MTC)</span>
              </div>
              <h1>{{ isEditing() ? 'Actualizar Expediente de la Empresa' : 'Registrar Nueva Empresa de Transporte' }}</h1>
              <p class="hero-subtitle">
                @if (isEditing() && empresaActual()) {
                  <span>RUC {{ empresaActual()!.ruc }} &bull; {{ empresaActual()!.razonSocial.principal }}</span>
                } @else {
                  <span>Alta oficial de títulos habilitantes y operadores interprovinciales con validación SUNAT</span>
                }
              </p>
            </div>
          </div>
        </div>
        <div class="hero-actions">
          <button mat-button class="btn-hero-cancel" type="button" (click)="volver()">
            <span class="material-symbols-outlined">close</span>
            <span>Cancelar</span>
          </button>
          <button mat-flat-button class="btn-hero-submit" type="button" (click)="guardar()" [disabled]="form.invalid || isSubmitting()">
            <span class="material-symbols-outlined">{{ isSubmitting() ? 'sync' : 'save' }}</span>
            <span>{{ isSubmitting() ? 'Guardando...' : (isEditing() ? 'Guardar Cambios' : 'Registrar Empresa') }}</span>
          </button>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-wrapper">
          <mat-spinner diameter="44"></mat-spinner>
          <span>Cargando datos de la empresa...</span>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="form-body">
          <div class="form-layout">
            
            <!-- COLUMNA IZQUIERDA: DATOS BÁSICOS & CONTACTO -->
            <div class="col-left">
              
              <!-- SECCIÓN: DATOS DE LA EMPRESA -->
              <mat-card class="form-section">
                <mat-card-header>
                  <div mat-card-avatar class="s-icon-box">
                    <span class="material-symbols-outlined">apartment</span>
                  </div>
                  <mat-card-title>Datos Generales de la Empresa</mat-card-title>
                  <mat-card-subtitle>Información legal, tributaria y habilitación operativa</mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                  <div class="fields-grid">
                    <!-- RUC con consulta SUNAT integrada -->
                    <div class="col-span-1 ruc-container">
                      <mat-form-field appearance="outline" class="w-full">
                        <mat-label>Número de RUC (11 dígitos)</mat-label>
                        <mat-icon matPrefix>tag</mat-icon>
                        <input matInput formControlName="ruc" maxlength="11" (keyup.enter)="consultarRucSunat()">
                        @if (isConsultandoSunat()) {
                          <mat-spinner matSuffix diameter="20" class="sunat-spinner-suffix"></mat-spinner>
                        } @else {
                          <button mat-icon-button matSuffix type="button" (click)="consultarRucSunat()" 
                                  [disabled]="form.get('ruc')?.invalid || isConsultandoSunat()" 
                                  matTooltip="Consultar datos oficiales en SUNAT y autocompletar">
                            <mat-icon color="primary">travel_explore</mat-icon>
                          </button>
                        }
                        @if (form.get('ruc')?.hasError('required') && form.get('ruc')?.touched) {
                          <mat-error>El RUC es requerido</mat-error>
                        }
                        @if (form.get('ruc')?.hasError('pattern') && form.get('ruc')?.touched) {
                          <mat-error>Debe contener 11 dígitos numéricos</mat-error>
                        }
                      </mat-form-field>

                      <!-- Chip informativo de Estado SUNAT si ya se consultó -->
                      @if (sunatInfo()) {
                        <div class="sunat-status-pill-row animate-fade-in">
                          <span [class]="'badge-sunat-pill ' + (sunatInfo()?.esActivo ? 'sunat-activo' : 'sunat-baja')">
                            {{ sunatInfo()?.esActivo ? 'ACTIVO' : 'BAJA' }}
                          </span>
                          <span [class]="'badge-sunat-pill ' + (sunatInfo()?.esHabido ? 'sunat-habido' : 'sunat-no-habido')">
                            {{ sunatInfo()?.esHabido ? 'HABIDO' : 'NO HABIDO' }}
                          </span>
                          <span class="sunat-confirmed-label">
                            <mat-icon>verified</mat-icon> Verificado en SUNAT
                          </span>
                        </div>
                      }
                    </div>

                    <!-- ESTADO LEGAL -->
                    <mat-form-field appearance="outline" class="col-span-1">
                      <mat-label>Estado Legal / Habilitación</mat-label>
                      <mat-icon matPrefix>flag</mat-icon>
                      <mat-select formControlName="estado">
                        <mat-option value="AUTORIZADA">✅ Autorizada (Habilitada)</mat-option>
                        <mat-option value="EN_TRAMITE">⏳ En Trámite / Renovación</mat-option>
                        <mat-option value="SUSPENDIDA">⚠️ Suspendida</mat-option>
                        <mat-option value="CANCELADA">❌ Cancelada / Sanción</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <!-- PARTIDA REGISTRAL (SUNARP) -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Partida Registral (SUNARP)</mat-label>
                      <mat-icon matPrefix>description</mat-icon>
                      <input matInput formControlName="partidaRegistral">
                      <mat-hint>Asiento o Partida Electrónica registral de la empresa</mat-hint>
                    </mat-form-field>

                    <!-- RAZÓN SOCIAL PRINCIPAL -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Razón Social Principal</mat-label>
                      <mat-icon matPrefix>badge</mat-icon>
                      <input matInput formControlName="razonSocial">
                      @if (form.get('razonSocial')?.hasError('required') && form.get('razonSocial')?.touched) {
                        <mat-error>La razón social es requerida</mat-error>
                      }
                    </mat-form-field>

                    <!-- NOMBRE COMERCIAL / MÍNIMO -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Nombre Comercial o Abreviado (Opcional)</mat-label>
                      <mat-icon matPrefix>short_text</mat-icon>
                      <input matInput formControlName="razonSocialMinimo">
                      <mat-hint>Nombre comercial con el que opera la empresa</mat-hint>
                    </mat-form-field>

                    <!-- DIRECCIÓN FISCAL -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Dirección Fiscal</mat-label>
                      <mat-icon matPrefix>location_on</mat-icon>
                      <input matInput formControlName="direccionFiscal">
                      @if (form.get('direccionFiscal')?.hasError('required') && form.get('direccionFiscal')?.touched) {
                        <mat-error>La dirección fiscal es requerida</mat-error>
                      }
                    </mat-form-field>

                    <!-- TIPOS DE SERVICIO -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Modalidades / Tipos de Servicio Autorizados</mat-label>
                      <mat-icon matPrefix>local_shipping</mat-icon>
                      <mat-select formControlName="tiposServicio" multiple>
                        <mat-option value="PASAJEROS">🚌 Regular Personas (Pasajeros)</mat-option>
                        <mat-option value="TURISMO">🏨 Especial Turismo</mat-option>
                        <mat-option value="TRABAJADORES">👷 Transporte de Trabajadores</mat-option>
                        <mat-option value="MERCANCIAS">📦 Mercancías</mat-option>
                        <mat-option value="CARGA">🚚 Carga General</mat-option>
                        <mat-option value="INFRAESTRUCTURA">🏗️ Terminales / Infraestructura</mat-option>
                        <mat-option value="MIXTO">🔀 Mixto</mat-option>
                        <mat-option value="OTROS">➕ Otros Servicios</mat-option>
                      </mat-select>
                      <mat-hint>Seleccione una o más modalidades habilitadas</mat-hint>
                    </mat-form-field>

                    <!-- OBSERVACIONES -->
                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Observaciones del Expediente</mat-label>
                      <mat-icon matPrefix>notes</mat-icon>
                      <textarea matInput formControlName="observaciones" rows="3"></textarea>
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- SECCIÓN: DATOS DE CONTACTO -->
              <mat-card class="form-section">
                <mat-card-header>
                  <div mat-card-avatar class="s-icon-box s-icon-blue">
                    <span class="material-symbols-outlined">contact_mail</span>
                  </div>
                  <mat-card-title>Canales de Contacto Oficial</mat-card-title>
                  <mat-card-subtitle>Notificaciones administrativas y teléfonos de contacto</mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                  <div class="fields-grid">
                    <mat-form-field appearance="outline" class="col-span-1">
                      <mat-label>Correo Electrónico Institucional</mat-label>
                      <mat-icon matPrefix>email</mat-icon>
                      <input matInput type="email" formControlName="emailContacto">
                      @if (form.get('emailContacto')?.hasError('email')) {
                        <mat-error>Correo electrónico no válido</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="col-span-1">
                      <mat-label>Teléfono de Contacto</mat-label>
                      <mat-icon matPrefix>phone</mat-icon>
                      <input matInput formControlName="telefonoContacto">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="col-span-2">
                      <mat-label>Portal Web Institucional</mat-label>
                      <mat-icon matPrefix>language</mat-icon>
                      <input matInput formControlName="sitioWeb">
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- COLUMNA DERECHA: REPRESENTANTES Y SOCIOS -->
            <div class="col-right">
              <mat-card class="form-section socios-section">
                <mat-card-header>
                  <div mat-card-avatar class="s-icon-box s-icon-emerald">
                    <span class="material-symbols-outlined">group</span>
                  </div>
                  <mat-card-title>Directorio de Representantes y Socios</mat-card-title>
                  <mat-card-subtitle>Representante legal acreditado ante la DRTC y cuadro directivo</mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                  <div formArrayName="socios" class="socios-list">
                    @for (socioCtrl of sociosArray.controls; track $index) {
                      <div [formGroupName]="$index" class="socio-block">
                        <div class="socio-block-header">
                          <div class="s-num">
                            <span class="persona-tag">Persona {{ $index + 1 }}</span>
                            @if (socioCtrl.get('tipoSocio')?.value === 'REPRESENTANTE_LEGAL') {
                              <span class="badge-rep-legal">
                                <span class="material-symbols-outlined">verified</span>
                                Rep. Legal
                              </span>
                            }
                          </div>
                          <button mat-icon-button color="warn" type="button" (click)="eliminarSocio($index)"
                            [disabled]="sociosArray.length === 1"
                            matTooltip="Eliminar esta persona">
                            <span class="material-symbols-outlined delete-icon">delete</span>
                          </button>
                        </div>

                        <div class="fields-grid compact">
                          <!-- ROL -->
                          <mat-form-field appearance="outline" class="col-span-2">
                            <mat-label>Cargo o Atribución Legal</mat-label>
                            <mat-icon matPrefix>work</mat-icon>
                            <mat-select formControlName="tipoSocio">
                              <mat-option value="REPRESENTANTE_LEGAL">⭐ Representante Legal Oficial</mat-option>
                              <mat-option value="GERENTE">🏢 Gerente General</mat-option>
                              <mat-option value="ADMINISTRADOR">👔 Administrador</mat-option>
                              <mat-option value="SOCIO">👤 Socio Accionista</mat-option>
                              <mat-option value="APODERADO">📜 Apoderado con Poder Registrado</mat-option>
                            </mat-select>
                          </mat-form-field>

                          <!-- DNI -->
                          <mat-form-field appearance="outline" class="col-span-1">
                            <mat-label>DNI (8 dígitos)</mat-label>
                            <mat-icon matPrefix>badge</mat-icon>
                            <input matInput formControlName="dni" maxlength="8">
                            @if (socioCtrl.get('dni')?.hasError('required') && socioCtrl.get('dni')?.touched) {
                              <mat-error>DNI requerido</mat-error>
                            }
                          </mat-form-field>

                          <!-- NOMBRES -->
                          <mat-form-field appearance="outline" class="col-span-1">
                            <mat-label>Nombres</mat-label>
                            <input matInput formControlName="nombres">
                            @if (socioCtrl.get('nombres')?.hasError('required') && socioCtrl.get('nombres')?.touched) {
                              <mat-error>Nombres requeridos</mat-error>
                            }
                          </mat-form-field>

                          <!-- APELLIDOS -->
                          <mat-form-field appearance="outline" class="col-span-2">
                            <mat-label>Apellidos Completos</mat-label>
                            <input matInput formControlName="apellidos">
                            @if (socioCtrl.get('apellidos')?.hasError('required') && socioCtrl.get('apellidos')?.touched) {
                              <mat-error>Apellidos requeridos</mat-error>
                            }
                          </mat-form-field>

                          <!-- EMAIL SOCIO -->
                          <mat-form-field appearance="outline" class="col-span-1">
                            <mat-label>Correo Electrónico (Opcional)</mat-label>
                            <mat-icon matPrefix>email</mat-icon>
                            <input matInput type="email" formControlName="email">
                          </mat-form-field>

                          <!-- TEL SOCIO -->
                          <mat-form-field appearance="outline" class="col-span-1">
                            <mat-label>Teléfono Celular (Opcional)</mat-label>
                            <mat-icon matPrefix>phone</mat-icon>
                            <input matInput formControlName="telefono">
                          </mat-form-field>

                          <!-- DIRECCIÓN SOCIO -->
                          <mat-form-field appearance="outline" class="col-span-2">
                            <mat-label>Dirección Domiciliaria (Opcional)</mat-label>
                            <mat-icon matPrefix>home</mat-icon>
                            <input matInput formControlName="direccion">
                          </mat-form-field>
                        </div>
                      </div>
                    }
                  </div>

                  <button mat-stroked-button type="button" (click)="agregarSocio()" class="btn-add-socio">
                    <span class="material-symbols-outlined">person_add</span>
                    <span>+ Agregar Representante o Socio</span>
                  </button>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <!-- FOOTER DE ACCIONES -->
          <div class="form-bottom-bar">
            <div class="footer-left-info">
              <span class="material-symbols-outlined info-icon">info</span>
              <span>Todos los campos marcados son obligatorios para el registro en el Padrón Regional DRTC-P.</span>
            </div>
            <div class="footer-actions">
              <button mat-stroked-button type="button" class="btn-cancel" (click)="volver()">
                <span class="material-symbols-outlined">close</span>
                <span>Cancelar</span>
              </button>
              <button mat-flat-button color="primary" type="submit" class="btn-submit" [disabled]="form.invalid || isSubmitting()">
                <span class="material-symbols-outlined">{{ isSubmitting() ? 'sync' : 'save' }}</span>
                <span>{{ isSubmitting() ? 'Guardando...' : (isEditing() ? 'Actualizar Empresa' : 'Registrar Empresa') }}</span>
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.25rem 1.5rem 3rem;
      max-width: 1440px;
      margin: 0 auto;
    }

    /* ── Hero Banner (Stitch Approved) ──────────────────────────── */
    .form-hero-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%);
      border-radius: 14px;
      padding: 1.25rem 1.75rem;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 20px rgba(37, 99, 235, 0.2);

      @media (max-width: 900px) {
        flex-direction: column;
        align-items: flex-start;
      }

      .hero-left {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        flex-wrap: wrap;
      }

      .btn-hero-back {
        background-color: rgba(255, 255, 255, 0.15);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        padding: 0.4rem 0.85rem;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        transition: all 0.2s ease;

        .material-symbols-outlined { font-size: 18px; }
        &:hover { background-color: rgba(255, 255, 255, 0.25); transform: translateY(-1px); }
      }

      .hero-title-group {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .hero-icon-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.3);

        .material-symbols-outlined {
          font-size: 24px;
          color: #ffffff;
        }
      }

      .hero-pill-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.25);
        padding: 0.15rem 0.6rem;
        border-radius: 20px;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        margin-bottom: 0.25rem;

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
        }
      }

      h1 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: #ffffff;
      }

      .hero-subtitle {
        margin: 0.2rem 0 0;
        font-size: 0.85rem;
        color: #dbeafe;
      }

      .hero-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .btn-hero-cancel {
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 0.45rem 1rem;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;

          .material-symbols-outlined { font-size: 18px; }
          &:hover { background: rgba(255, 255, 255, 0.15); }
        }

        .btn-hero-save {
          background-color: #10b981;
          color: #ffffff;
          border-radius: 8px;
          padding: 0.45rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;

          .material-symbols-outlined { font-size: 18px; }
          &:hover:not([disabled]) {
            background-color: #059669;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
          }
        }
      }
    }

    .loading-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 4rem;
      color: #64748b;
      font-weight: 600;
    }

    /* ── Form Layout ────────────────────────────────────────────── */
    .form-layout {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 1.5rem;
      align-items: start;

      @media (max-width: 1080px) {
        grid-template-columns: 1fr;
      }
    }

    .col-left, .col-right {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── Form Section Cards ─────────────────────────────────────── */
    .form-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      padding: 1.25rem 1.5rem;

      mat-card-header {
        margin-bottom: 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .s-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #eff6ff;
          color: #1d4ed8;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #dbeafe;

          .material-symbols-outlined { font-size: 20px; }

          &.s-icon-blue {
            background: #eff6ff;
            color: #2563eb;
            border-color: #bfdbfe;
          }

          &.s-icon-emerald {
            background: #ecfdf5;
            color: #059669;
            border-color: #a7f3d0;
          }
        }

        mat-card-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        mat-card-subtitle {
          font-size: 0.78rem;
          color: #64748b;
          margin-top: 2px;
        }
      }

      mat-card-content {
        padding: 0;
      }
    }

    /* ── Fields Grid ────────────────────────────────────────────── */
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem 1rem;

      .col-span-1 { grid-column: span 1; }
      .col-span-2 { grid-column: 1 / -1; }

      mat-form-field {
        width: 100%;
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
        .col-span-1 { grid-column: 1; }
      }
    }

    /* RUC container & SUNAT button */
    .ruc-container {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      .w-full { width: 100%; }

      .sunat-spinner-suffix {
        margin-right: 8px;
      }

      .sunat-status-pill-row {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        margin-top: -4px;
        margin-bottom: 4px;

        .sunat-confirmed-label {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #059669;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
      }
    }

    /* Badges SUNAT */
    .badge-sunat-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.03em;
      border-radius: 4px;
      text-transform: uppercase;
      line-height: 1.2;

      &.sunat-activo {
        background-color: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
      }

      &.sunat-habido {
        background-color: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
      }

      &.sunat-baja {
        background-color: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      &.sunat-no-habido {
        background-color: #fffbeb;
        color: #d97706;
        border: 1px solid #fde68a;
      }
    }

    /* ── Socios List ────────────────────────────────────────────── */
    .socios-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .socio-block {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      background: #f8fafc;
      transition: all 0.2s ease;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      .socio-block-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;

        .s-num {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .persona-tag {
            font-size: 0.8rem;
            font-weight: 700;
            color: #475569;
          }

          .badge-rep-legal {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            padding: 1.5px 6px;
            border-radius: 6px;
            font-size: 0.72rem;
            font-weight: 700;

            .material-symbols-outlined {
              font-size: 13px;
            }
          }
        }

        .delete-icon {
          font-size: 18px;
          color: #ef4444;
        }
      }
    }

    .btn-add-socio {
      width: 100%;
      border: 2px dashed #cbd5e1 !important;
      border-radius: 8px !important;
      padding: 0.65rem 1rem !important;
      color: #2563eb !important;
      font-weight: 600 !important;
      font-size: 0.82rem !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: all 0.2s ease;

      .material-symbols-outlined { font-size: 19px; }

      &:hover {
        border-color: #3b82f6 !important;
        background-color: #eff6ff !important;
      }
    }

    /* ── Bottom Action Bar ──────────────────────────────────────── */
    .form-bottom-bar {
      margin-top: 1.5rem;
      padding: 1rem 1.5rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
      }

      .footer-left-info {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.78rem;
        color: #64748b;

        .info-icon { font-size: 17px; color: #3b82f6; }
      }

      .footer-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .btn-cancel {
          border-color: #cbd5e1;
          color: #475569;
          border-radius: 8px;
          padding: 0.45rem 1rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;

          .material-symbols-outlined { font-size: 18px; }
          &:hover { background-color: #f1f5f9; }
        }

        .btn-submit {
          background-color: #2563eb;
          color: #ffffff;
          border-radius: 8px;
          padding: 0.45rem 1.5rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);

          .material-symbols-outlined { font-size: 18px; }
          &:hover:not([disabled]) {
            background-color: #1d4ed8;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.45);
          }
        }
      }
    }

    /* ── STITCH MODO OSCURO (Screen 22b66c09a8ce4c859e57611ab90a5ff8) ── */
    :host-context([data-theme="dark"]), :host-context(.dark-theme), :host-context(.dark-mode) {
      .form-hero-banner {
        background: linear-gradient(135deg, #07152f 0%, #112348 50%, #1e3a8a 100%) !important;
        border: 1px solid #1e293b !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;

        .btn-hero-back {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          &:hover { background-color: rgba(255, 255, 255, 0.2) !important; }
        }

        .hero-pill-badge {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: #93c5fd !important;
        }

        h1 { color: #ffffff !important; }
        .hero-subtitle { color: #94a3b8 !important; }
      }

      .form-section {
        background-color: #0f172a !important;
        border-color: #1e293b !important;

        mat-card-header {
          .s-icon-box {
            background: #131b2e !important;
            border-color: #1e293b !important;
            color: #60a5fa !important;
          }

          mat-card-title { color: #ffffff !important; }
          mat-card-subtitle { color: #94a3b8 !important; }
        }
      }

      .socio-block {
        background-color: #131b2e !important;
        border-color: #1e293b !important;

        .socio-block-header {
          .s-num {
            .persona-tag { color: #94a3b8 !important; }
            .badge-rep-legal {
              background: rgba(59, 130, 246, 0.15) !important;
              color: #60a5fa !important;
              border-color: rgba(59, 130, 246, 0.3) !important;
            }
          }
        }
      }

      .btn-add-socio {
        border-color: #334155 !important;
        color: #60a5fa !important;
        &:hover {
          background-color: #17223b !important;
          border-color: #3b82f6 !important;
        }
      }

      .form-bottom-bar {
        background-color: #0f172a !important;
        border-color: #1e293b !important;

        .footer-left-info { color: #94a3b8 !important; }

        .btn-cancel {
          border-color: #334155 !important;
          color: #cbd5e1 !important;
          &:hover { background-color: #17223b !important; }
        }
      }

      .badge-sunat-pill {
        &.sunat-activo {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #34d399 !important;
          border-color: rgba(52, 211, 153, 0.3) !important;
        }
        &.sunat-habido {
          background-color: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
        &.sunat-baja {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
        }
        &.sunat-no-habido {
          background-color: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
          border-color: rgba(245, 158, 11, 0.3) !important;
        }
      }

      ::ng-deep {
        .mat-mdc-text-field-wrapper {
          background-color: #131b2e !important;
        }
        .mat-mdc-input-element, .mat-mdc-select-value-text {
          color: #f1f5f9 !important;
        }
        .mat-mdc-floating-label {
          color: #94a3b8 !important;
        }
        .mdc-notched-outline__leading,
        .mdc-notched-outline__notch,
        .mdc-notched-outline__trailing {
          border-color: #1e293b !important;
        }
        .mat-mdc-form-field-hint {
          color: #64748b !important;
        }
      }
    }
  `]
})
export class EmpresaFormComponent implements OnInit {
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  isConsultandoSunat = signal(false);
  sunatInfo = signal<{ esActivo: boolean; esHabido: boolean; ddp_nombre: string } | null>(null);
  empresaActual = signal<Empresa | null>(null);
  empresaId: string | null = null;

  form: FormGroup;

  get sociosArray(): FormArray {
    return this.form.get('socios') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      razonSocial: ['', Validators.required],
      razonSocialMinimo: [''],
      direccionFiscal: ['', Validators.required],
      partidaRegistral: [''],
      tiposServicio: [[]],
      estado: ['AUTORIZADA'],
      observaciones: [''],
      emailContacto: ['', Validators.email],
      telefonoContacto: [''],
      sitioWeb: [''],
      socios: this.fb.array([this.crearSocioGroup()])
    });
  }

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.params['id'];
    if (this.empresaId) {
      this.isEditing.set(true);
      this.cargarEmpresa();
    }
  }

  crearSocioGroup(socio?: Partial<Socio>): FormGroup {
    return this.fb.group({
      tipoSocio: [socio?.tipoSocio || 'REPRESENTANTE_LEGAL'],
      dni: [socio?.dni || '', Validators.required],
      nombres: [socio?.nombres || '', Validators.required],
      apellidos: [socio?.apellidos || '', Validators.required],
      email: [socio?.email || ''],
      telefono: [socio?.telefono || ''],
      direccion: [socio?.direccion || '']
    });
  }

  agregarSocio(): void {
    this.sociosArray.push(this.crearSocioGroup());
  }

  eliminarSocio(index: number): void {
    if (this.sociosArray.length > 1) {
      this.sociosArray.removeAt(index);
    }
  }

  consultarRucSunat(): void {
    const ruc = this.form.get('ruc')?.value?.trim();
    if (!ruc || ruc.length !== 11 || !/^\d{11}$/.test(ruc)) {
      this.snackBar.open('Por favor ingrese un RUC válido de 11 dígitos numéricos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isConsultandoSunat.set(true);
    this.empresaService.consultarSunat(ruc).subscribe({
      next: (resp: any) => {
        this.isConsultandoSunat.set(false);
        const data = resp?.data || resp;
        if (data && data.ddp_nombre) {
          const esActivo = data.esActivo !== false;
          const esHabido = data.esHabido !== false;

          this.sunatInfo.set({
            esActivo,
            esHabido,
            ddp_nombre: data.ddp_nombre
          });

          // Armar dirección fiscal
          const partesDir = [
            data.desc_tipvia && data.ddp_nomvia ? `${data.desc_tipvia} ${data.ddp_nomvia}` : '',
            data.ddp_numer1 || '',
            data.desc_tipzon && data.ddp_nomzon ? `${data.desc_tipzon} ${data.ddp_nomzon}` : '',
            data.desc_dist && data.desc_prov ? `${data.desc_dist} - ${data.desc_prov} - ${data.desc_dep || 'PUNO'}` : ''
          ].filter(p => !!p && p !== '-');
          const dirFiscal = data.direccionFiscalSunat || partesDir.join(', ');

          this.form.patchValue({
            razonSocial: data.ddp_nombre,
            direccionFiscal: dirFiscal || this.form.get('direccionFiscal')?.value,
            estado: esActivo ? 'AUTORIZADA' : 'SUSPENDIDA'
          });

          // Sugerir modalidad PASAJEROS si el CIIU contiene transporte y aún no tiene modalidades
          const servs = this.form.get('tiposServicio')?.value || [];
          if (servs.length === 0 && data.desc_ciiu && data.desc_ciiu.toUpperCase().includes('TRANSPORTE')) {
            this.form.patchValue({ tiposServicio: ['PASAJEROS'] });
          }

          this.snackBar.open(`✅ SUNAT verificado con éxito: ${data.ddp_nombre}`, 'OK', { duration: 4500 });
        } else {
          this.snackBar.open('No se encontraron datos registrados en SUNAT para este RUC', 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        this.isConsultandoSunat.set(false);
        console.warn('Error en consulta SUNAT:', err);
        this.snackBar.open('No se pudo conectar con la API de SUNAT. Ingrese los datos manualmente.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  cargarEmpresa(): void {
    if (!this.empresaId) return;
    this.isLoading.set(true);

    this.empresaService.getEmpresa(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresaActual.set(empresa);

        if (empresa.datosSunat) {
          const ds = empresa.datosSunat as any;
          this.sunatInfo.set({
            esActivo: ds.esActivo !== false,
            esHabido: ds.esHabido !== false,
            ddp_nombre: ds.ddp_nombre || empresa.razonSocial.principal
          });
        }

        // Rellenar campos básicos
        this.form.patchValue({
          ruc: empresa.ruc,
          razonSocial: empresa.razonSocial.principal,
          razonSocialMinimo: empresa.razonSocial.minimo || '',
          direccionFiscal: empresa.direccionFiscal,
          partidaRegistral: empresa.partidaRegistral || '',
          estado: empresa.estado,
          observaciones: empresa.observaciones || '',
          emailContacto: empresa.emailContacto || '',
          telefonoContacto: empresa.telefonoContacto || '',
          sitioWeb: empresa.sitioWeb || '',
          tiposServicio: empresa.tiposServicio || []
        });

        // Rellenar socios dinámicamente
        while (this.sociosArray.length > 0) {
          this.sociosArray.removeAt(0);
        }

        if (empresa.socios && empresa.socios.length > 0) {
          empresa.socios.forEach(s => this.sociosArray.push(this.crearSocioGroup(s)));
        } else {
          this.sociosArray.push(this.crearSocioGroup());
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.snackBar.open('Error al cargar la empresa', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);
    const v = this.form.value;

    const data: EmpresaCreate = {
      ruc: v.ruc.trim(),
      razonSocial: {
        principal: v.razonSocial.trim(),
        minimo: v.razonSocialMinimo?.trim() || undefined
      },
      direccionFiscal: v.direccionFiscal.trim(),
      partidaRegistral: v.partidaRegistral?.trim() || undefined,
      tiposServicio: v.tiposServicio || [],
      estado: v.estado,
      socios: (v.socios as any[]).map(s => ({
        tipoSocio: s.tipoSocio,
        dni: s.dni.trim(),
        nombres: s.nombres.trim(),
        apellidos: s.apellidos.trim(),
        email: s.email?.trim() || undefined,
        telefono: s.telefono?.trim() || undefined,
        direccion: s.direccion?.trim() || undefined
      })),
      emailContacto: v.emailContacto?.trim() || undefined,
      telefonoContacto: v.telefonoContacto?.trim() || undefined,
      sitioWeb: v.sitioWeb?.trim() || undefined,
      observaciones: v.observaciones?.trim() || undefined
    };

    const request = this.isEditing() && this.empresaId
      ? this.empresaService.updateEmpresa(this.empresaId, data as EmpresaUpdate)
      : this.empresaService.createEmpresa(data);

    request.subscribe({
      next: (empresa) => {
        const msg = this.isEditing() ? 'Empresa actualizada correctamente' : 'Empresa registrada correctamente';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
        this.router.navigate(['/empresas', empresa.id]);
      },
      error: (error) => {
        console.error('Error guardando empresa:', error);
        const msg = error?.error?.detail || 'Error al guardar la empresa';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        this.isSubmitting.set(false);
      }
    });
  }

  volver(): void {
    if (this.isEditing() && this.empresaId) {
      this.router.navigate(['/empresas', this.empresaId]);
    } else {
      this.router.navigate(['/empresas']);
    }
  }
}
