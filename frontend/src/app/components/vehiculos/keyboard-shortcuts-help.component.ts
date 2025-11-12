import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { VehiculoKeyboardNavigationService } from '../../services/vehiculo-keyboard-navigation.service';

/**
 * Componente modal para mostrar ayuda de atajos de teclado
 */
@Component({
  selector: 'app-keyboard-shortcuts-help',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    SmartIconComponent
  ],
  template: `
    <div class="shortcuts-help-dialog">
      <h2 mat-dialog-title>
        <app-smart-icon [iconName]="'keyboard'" [size]="28" aria-hidden="true"></app-smart-icon>
        Atajos de Teclado
      </h2>
      
      <mat-dialog-content>
        <p class="dialog-description">
          Usa estos atajos de teclado para navegar más rápido en el módulo de vehículos.
        </p>

        <div class="shortcuts-section">
          <h3>Acciones Principales</h3>
          <mat-list>
            @for (shortcut of mainShortcuts; track shortcut.key) {
              <mat-list-item>
                <div class="shortcut-item">
                  <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
                  <span class="shortcut-description">{{ shortcut.description }}</span>
                </div>
              </mat-list-item>
            }
          </mat-list>
        </div>

        <mat-divider></mat-divider>

        <div class="shortcuts-section">
          <h3>Navegación</h3>
          <mat-list>
            @for (shortcut of navigationShortcuts; track shortcut.key) {
              <mat-list-item>
                <div class="shortcut-item">
                  <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
                  <span class="shortcut-description">{{ shortcut.description }}</span>
                </div>
              </mat-list-item>
            }
          </mat-list>
        </div>

        <mat-divider></mat-divider>

        <div class="shortcuts-section">
          <h3>Tabla</h3>
          <mat-list>
            @for (shortcut of tableShortcuts; track shortcut.key) {
              <mat-list-item>
                <div class="shortcut-item">
                  <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
                  <span class="shortcut-description">{{ shortcut.description }}</span>
                </div>
              </mat-list-item>
            }
          </mat-list>
        </div>

        <div class="help-tip">
          <app-smart-icon [iconName]="'info'" [size]="20" aria-hidden="true"></app-smart-icon>
          <p>
            Presiona <kbd>?</kbd> en cualquier momento para ver esta ayuda.
          </p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-raised-button color="primary" (click)="close()" aria-label="Cerrar ayuda de atajos">
          <app-smart-icon [iconName]="'close'" [size]="20" aria-hidden="true"></app-smart-icon>
          Cerrar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .shortcuts-help-dialog {
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

    .shortcuts-section {
      margin-bottom: 24px;

      h3 {
        margin: 0 0 12px 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
      }
    }

    mat-list {
      padding: 0;
    }

    mat-list-item {
      height: auto;
      padding: 8px 0;
    }

    .shortcut-item {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
    }

    .shortcut-key {
      display: inline-block;
      min-width: 120px;
      padding: 6px 12px;
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      border: 1px solid #ccc;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      color: #333;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .shortcut-description {
      flex: 1;
      color: #666;
      font-size: 14px;
    }

    mat-divider {
      margin: 20px 0;
    }

    .help-tip {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background-color: #e3f2fd;
      border-left: 4px solid #1976d2;
      border-radius: 4px;
      margin-top: 24px;

      p {
        margin: 0;
        color: #1565c0;
        font-size: 13px;
        line-height: 1.5;

        kbd {
          padding: 2px 6px;
          background: white;
          border: 1px solid #90caf9;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          font-weight: 600;
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .shortcuts-help-dialog {
        min-width: unset;
        width: 100%;
      }

      .shortcut-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .shortcut-key {
        min-width: unset;
        width: 100%;
      }
    }
  `]
})
export class KeyboardShortcutsHelpComponent {
  private dialogRef = inject(MatDialogRef<KeyboardShortcutsHelpComponent>);
  private keyboardNavService = inject(VehiculoKeyboardNavigationService);

  mainShortcuts = [
    { key: 'Ctrl+N', description: 'Crear nuevo vehículo' },
    { key: 'Ctrl+F', description: 'Enfocar búsqueda' },
    { key: 'Ctrl+Shift+F', description: 'Abrir filtros avanzados' },
    { key: 'Ctrl+Shift+C', description: 'Limpiar filtros' },
    { key: 'Ctrl+E', description: 'Exportar vehículos' },
    { key: 'Ctrl+R', description: 'Actualizar lista' }
  ];

  navigationShortcuts = [
    { key: 'Tab', description: 'Navegar al siguiente elemento' },
    { key: 'Shift+Tab', description: 'Navegar al elemento anterior' },
    { key: 'Enter', description: 'Activar elemento enfocado' },
    { key: 'Space', description: 'Seleccionar/deseleccionar' },
    { key: 'Escape', description: 'Cerrar modal o cancelar acción' }
  ];

  tableShortcuts = [
    { key: '↑ / ↓', description: 'Navegar entre filas' },
    { key: 'Home', description: 'Ir a la primera fila' },
    { key: 'End', description: 'Ir a la última fila' },
    { key: 'Page Up', description: 'Subir 10 filas' },
    { key: 'Page Down', description: 'Bajar 10 filas' }
  ];

  close(): void {
    this.dialogRef.close();
  }
}
