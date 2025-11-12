import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { UserPreferencesService } from '../../services/user-preferences.service';

/**
 * Componente modal para configurar preferencias de usuario y accesibilidad
 */
@Component({
  selector: 'app-user-preferences-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatDividerModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  template: `
    <div class="preferences-dialog">
      <h2 mat-dialog-title>
        <app-smart-icon [iconName]="'settings'" [size]="28" aria-hidden="true"></app-smart-icon>
        Preferencias de Accesibilidad
      </h2>
      
      <mat-dialog-content>
        <p class="dialog-description">
          Personaliza la experiencia del módulo de vehículos según tus necesidades.
        </p>

        <!-- Animaciones -->
        <div class="preference-section">
          <div class="preference-header">
            <app-smart-icon [iconName]="'animation'" [size]="24" aria-hidden="true"></app-smart-icon>
            <h3>Animaciones</h3>
          </div>
          <mat-slide-toggle
            [(ngModel)]="reducedMotion"
            (change)="onReducedMotionChange()"
            color="primary"
            matTooltip="Reduce o elimina las animaciones y transiciones"
            aria-label="Reducir movimiento">
            Reducir movimiento
          </mat-slide-toggle>
          <p class="preference-hint">
            Desactiva las animaciones y transiciones para una experiencia más estática.
          </p>
        </div>

        <mat-divider></mat-divider>

        <!-- Contraste -->
        <div class="preference-section">
          <div class="preference-header">
            <app-smart-icon [iconName]="'contrast'" [size]="24" aria-hidden="true"></app-smart-icon>
            <h3>Contraste</h3>
          </div>
          <mat-slide-toggle
            [(ngModel)]="highContrast"
            (change)="onHighContrastChange()"
            color="primary"
            matTooltip="Aumenta el contraste de colores para mejor visibilidad"
            aria-label="Alto contraste">
            Alto contraste
          </mat-slide-toggle>
          <p class="preference-hint">
            Aumenta el contraste de colores y bordes para mejor visibilidad.
          </p>
        </div>

        <mat-divider></mat-divider>

        <!-- Tema -->
        <div class="preference-section">
          <div class="preference-header">
            <app-smart-icon [iconName]="'dark_mode'" [size]="24" aria-hidden="true"></app-smart-icon>
            <h3>Tema</h3>
          </div>
          <mat-slide-toggle
            [(ngModel)]="darkMode"
            (change)="onDarkModeChange()"
            color="primary"
            matTooltip="Activa el modo oscuro para reducir la fatiga visual"
            aria-label="Modo oscuro">
            Modo oscuro
          </mat-slide-toggle>
          <p class="preference-hint">
            Usa colores oscuros para reducir la fatiga visual en ambientes con poca luz.
          </p>
        </div>

        <mat-divider></mat-divider>

        <!-- Tamaño de fuente -->
        <div class="preference-section">
          <div class="preference-header">
            <app-smart-icon [iconName]="'text_fields'" [size]="24" aria-hidden="true"></app-smart-icon>
            <h3>Tamaño de texto</h3>
          </div>
          <mat-radio-group
            [(ngModel)]="fontSize"
            (change)="onFontSizeChange()"
            aria-label="Seleccionar tamaño de texto">
            <mat-radio-button value="small" color="primary">
              Pequeño
            </mat-radio-button>
            <mat-radio-button value="medium" color="primary">
              Mediano (recomendado)
            </mat-radio-button>
            <mat-radio-button value="large" color="primary">
              Grande
            </mat-radio-button>
          </mat-radio-group>
          <p class="preference-hint">
            Ajusta el tamaño del texto para mejor legibilidad.
          </p>
        </div>

        <mat-divider></mat-divider>

        <!-- Modo de daltonismo -->
        <div class="preference-section">
          <div class="preference-header">
            <app-smart-icon [iconName]="'palette'" [size]="24" aria-hidden="true"></app-smart-icon>
            <h3>Modo de daltonismo</h3>
          </div>
          <mat-radio-group
            [(ngModel)]="colorBlindMode"
            (change)="onColorBlindModeChange()"
            aria-label="Seleccionar modo de daltonismo">
            <mat-radio-button value="none" color="primary">
              Ninguno
            </mat-radio-button>
            <mat-radio-button value="protanopia" color="primary">
              Protanopia (rojo-verde)
            </mat-radio-button>
            <mat-radio-button value="deuteranopia" color="primary">
              Deuteranopia (rojo-verde)
            </mat-radio-button>
            <mat-radio-button value="tritanopia" color="primary">
              Tritanopia (azul-amarillo)
            </mat-radio-button>
          </mat-radio-group>
          <p class="preference-hint">
            Ajusta los colores para diferentes tipos de daltonismo.
          </p>
        </div>

        <mat-divider></mat-divider>

        <!-- Cumplimiento WCAG -->
        <div class="wcag-section">
          <div class="wcag-header">
            <app-smart-icon [iconName]="'verified'" [size]="24" aria-hidden="true"></app-smart-icon>
            <h3>Cumplimiento WCAG 2.1 AA</h3>
          </div>
          <div class="wcag-checks">
            <div class="wcag-check" [class.passed]="wcagCompliance.contrastRatio">
              <app-smart-icon 
                [iconName]="wcagCompliance.contrastRatio ? 'check_circle' : 'cancel'" 
                [size]="20"
                aria-hidden="true">
              </app-smart-icon>
              <span>Ratio de contraste adecuado</span>
            </div>
            <div class="wcag-check" [class.passed]="wcagCompliance.textSize">
              <app-smart-icon 
                [iconName]="wcagCompliance.textSize ? 'check_circle' : 'cancel'" 
                [size]="20"
                aria-hidden="true">
              </app-smart-icon>
              <span>Tamaño de texto legible</span>
            </div>
            <div class="wcag-check" [class.passed]="wcagCompliance.focusVisible">
              <app-smart-icon 
                [iconName]="wcagCompliance.focusVisible ? 'check_circle' : 'cancel'" 
                [size]="20"
                aria-hidden="true">
              </app-smart-icon>
              <span>Indicadores de foco visibles</span>
            </div>
            <div class="wcag-check" [class.passed]="wcagCompliance.keyboardAccessible">
              <app-smart-icon 
                [iconName]="wcagCompliance.keyboardAccessible ? 'check_circle' : 'cancel'" 
                [size]="20"
                aria-hidden="true">
              </app-smart-icon>
              <span>Accesible por teclado</span>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="resetToDefaults()" aria-label="Restablecer preferencias a valores por defecto">
          <app-smart-icon [iconName]="'restore'" [size]="20" aria-hidden="true"></app-smart-icon>
          Restablecer
        </button>
        <button mat-raised-button color="primary" (click)="close()" aria-label="Guardar y cerrar preferencias">
          <app-smart-icon [iconName]="'save'" [size]="20" aria-hidden="true"></app-smart-icon>
          Guardar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .preferences-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1976d2;
      margin: 0;
      padding: 20px 24px;
      border-bottom: 2px solid #e0e0e0;
    }

    mat-dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .dialog-description {
      margin: 0 0 24px 0;
      color: #666;
      font-size: 14px;
    }

    .preference-section {
      margin-bottom: 24px;
    }

    .preference-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      h3 {
        margin: 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
      }
    }

    mat-slide-toggle {
      margin-bottom: 8px;
    }

    .preference-hint {
      margin: 8px 0 0 0;
      color: #666;
      font-size: 13px;
      line-height: 1.5;
    }

    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 8px;
    }

    mat-divider {
      margin: 20px 0;
    }

    .wcag-section {
      background-color: #e8f5e9;
      border-left: 4px solid #4caf50;
      border-radius: 4px;
      padding: 16px;
      margin-top: 24px;
    }

    .wcag-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      h3 {
        margin: 0;
        color: #2e7d32;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .wcag-checks {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .wcag-check {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;

      &.passed {
        color: #2e7d32;
        font-weight: 500;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      gap: 12px;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .preferences-dialog {
        min-width: unset;
        width: 100%;
      }

      mat-radio-group {
        gap: 8px;
      }
    }
  `]
})
export class UserPreferencesModalComponent {
  private dialogRef = inject(MatDialogRef<UserPreferencesModalComponent>);
  private preferencesService = inject(UserPreferencesService);

  // Propiedades vinculadas a las preferencias
  reducedMotion = this.preferencesService.reducedMotion();
  highContrast = this.preferencesService.highContrast();
  darkMode = this.preferencesService.darkMode();
  fontSize = this.preferencesService.fontSize();
  colorBlindMode = this.preferencesService.colorBlindMode();

  // Cumplimiento WCAG
  wcagCompliance = this.preferencesService.checkWCAGCompliance();

  onReducedMotionChange(): void {
    this.preferencesService.reducedMotion.set(this.reducedMotion);
    this.updateWCAGCompliance();
  }

  onHighContrastChange(): void {
    this.preferencesService.highContrast.set(this.highContrast);
    this.updateWCAGCompliance();
  }

  onDarkModeChange(): void {
    this.preferencesService.darkMode.set(this.darkMode);
    this.updateWCAGCompliance();
  }

  onFontSizeChange(): void {
    this.preferencesService.setFontSize(this.fontSize);
    this.updateWCAGCompliance();
  }

  onColorBlindModeChange(): void {
    this.preferencesService.setColorBlindMode(this.colorBlindMode);
    this.updateWCAGCompliance();
  }

  resetToDefaults(): void {
    this.preferencesService.resetToDefaults();
    this.reducedMotion = this.preferencesService.reducedMotion();
    this.highContrast = this.preferencesService.highContrast();
    this.darkMode = this.preferencesService.darkMode();
    this.fontSize = this.preferencesService.fontSize();
    this.colorBlindMode = this.preferencesService.colorBlindMode();
    this.updateWCAGCompliance();
  }

  private updateWCAGCompliance(): void {
    this.wcagCompliance = this.preferencesService.checkWCAGCompliance();
  }

  close(): void {
    this.dialogRef.close();
  }
}
