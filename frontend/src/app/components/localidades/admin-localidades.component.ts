import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminBaseDatosComponent } from './admin-base-datos.component';
import { InfoBaseDatosComponent } from './info-base-datos.component';

@Component({
  selector: 'app-admin-localidades',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    AdminBaseDatosComponent,
    InfoBaseDatosComponent
  ],
  template: `
    <div class="admin-container">
      <!-- Header -->
      <div class="admin-header">
        <div class="header-content">
          <h1>
            <mat-icon>admin_panel_settings</mat-icon>
            Administración de Localidades
          </h1>
          <p>Panel de control para la gestión de la base de datos de localidades</p>
        </div>
      </div>

      <!-- Contenido -->
      <div class="admin-content">
        <mat-tab-group>
          <!-- Tab: Información del Sistema -->
          <mat-tab label="Información del Sistema">
            <div class="tab-content">
              <app-info-base-datos></app-info-base-datos>
              
              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>info</mat-icon>
                    Información del Sistema
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div class="info-item">
                      <mat-icon>description</mat-icon>
                      <div>
                        <strong>Propósito:</strong>
                        <p>Este sistema utiliza un archivo JSON local como inicializador para poblar MongoDB con datos de localidades del Perú (Departamento de Puno).</p>
                      </div>
                    </div>
                    
                    <div class="info-item">
                      <mat-icon>storage</mat-icon>
                      <div>
                        <strong>Base de Datos:</strong>
                        <p>Los datos se almacenan permanentemente en MongoDB. El archivo JSON solo sirve como fuente inicial de datos.</p>
                      </div>
                    </div>
                    
                    <div class="info-item">
                      <mat-icon>sync</mat-icon>
                      <div>
                        <strong>Sincronización:</strong>
                        <p>Una vez inicializada, la base de datos opera independientemente. Los cambios se guardan en MongoDB.</p>
                      </div>
                    </div>
                    
                    <div class="info-item">
                      <mat-icon>security</mat-icon>
                      <div>
                        <strong>Seguridad:</strong>
                        <p>Las operaciones de administración requieren permisos especiales y confirmación del usuario.</p>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Tab: Administración de Base de Datos -->
          <mat-tab label="Administración de Base de Datos">
            <div class="tab-content">
              <app-admin-base-datos></app-admin-base-datos>
              
              <mat-card class="warning-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>warning</mat-icon>
                    Advertencias Importantes
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <ul class="warning-list">
                    <li>
                      <strong>Inicialización:</strong> Solo debe ejecutarse una vez o cuando la base de datos esté vacía.
                    </li>
                    <li>
                      <strong>Reinicialización:</strong> Eliminará TODOS los datos existentes y los reemplazará con los datos iniciales.
                    </li>
                    <li>
                      <strong>Limpieza:</strong> Operación destructiva que elimina todos los registros de localidades.
                    </li>
                    <li>
                      <strong>Backup:</strong> Siempre haga un respaldo antes de operaciones destructivas.
                    </li>
                    <li>
                      <strong>Producción:</strong> Estas operaciones no deben ejecutarse en entornos de producción sin supervisión.
                    </li>
                  </ul>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Tab: Documentación -->
          <mat-tab label="Documentación">
            <div class="tab-content">
              <mat-card class="docs-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>menu_book</mat-icon>
                    Guía de Uso
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="docs-section">
                    <h3>1. Primera Inicialización</h3>
                    <ol>
                      <li>Verificar que MongoDB esté funcionando</li>
                      <li>Confirmar que la base de datos esté vacía</li>
                      <li>Hacer clic en "Inicializar Base de Datos"</li>
                      <li>Esperar a que termine el proceso</li>
                      <li>Verificar las estadísticas</li>
                    </ol>
                  </div>

                  <div class="docs-section">
                    <h3>2. Actualización de Datos</h3>
                    <ol>
                      <li>Modificar el archivo <code>/assets/data/localidades.json</code></li>
                      <li>Usar "Reinicializar" para aplicar cambios</li>
                      <li>O usar "Inicializar" si solo hay nuevos registros</li>
                    </ol>
                  </div>

                  <div class="docs-section">
                    <h3>3. Respaldo y Restauración</h3>
                    <ol>
                      <li>Usar "Exportar Datos" para crear respaldos</li>
                      <li>Guardar el archivo JSON generado</li>
                      <li>Para restaurar: reemplazar el archivo local y reinicializar</li>
                    </ol>
                  </div>

                  <div class="docs-section">
                    <h3>4. Estructura de Datos</h3>
                    <p>Cada localidad contiene:</p>
                    <ul>
                      <li><strong>id:</strong> Identificador único</li>
                      <li><strong>nombre:</strong> Nombre de la localidad</li>
                      <li><strong>ubigeo:</strong> Código UBIGEO del INEI</li>
                      <li><strong>tipo:</strong> PROVINCIA, DISTRITO, CENTRO_POBLADO</li>
                      <li><strong>nivel_territorial:</strong> Nivel administrativo</li>
                      <li><strong>departamento:</strong> Departamento (Puno)</li>
                      <li><strong>provincia:</strong> Provincia correspondiente</li>
                      <li><strong>distrito:</strong> Distrito correspondiente</li>
                      <li><strong>estaActiva:</strong> Estado de la localidad</li>
                    </ul>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 24px;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    .admin-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px;
      margin: -24px -24px 32px -24px;
      border-radius: 0 0 16px 16px;
    }

    .header-content h1 {
      color: white;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-content h1 mat-icon {
      font-size: 36px;
    }

    .header-content p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      margin: 8px 0 0 0;
    }

    .admin-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .tab-content {
      padding: 24px 0;
    }

    .info-card, .warning-card, .docs-card {
      margin-bottom: 24px;
    }

    .info-grid {
      display: grid;
      gap: 20px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .info-item mat-icon {
      color: #667eea;
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-top: 4px;
    }

    .info-item strong {
      color: #495057;
      display: block;
      margin-bottom: 8px;
    }

    .info-item p {
      margin: 0;
      color: #6c757d;
      line-height: 1.5;
    }

    .warning-card {
      border-left: 4px solid #ff9800;
    }

    .warning-card .mat-mdc-card-header {
      background: #fff3e0;
      margin: -24px -24px 16px -24px;
      padding: 16px 24px;
    }

    .warning-card .mat-mdc-card-title {
      color: #f57c00 !important;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .warning-list {
      margin: 0;
      padding-left: 20px;
    }

    .warning-list li {
      margin: 12px 0;
      color: #6c757d;
      line-height: 1.5;
    }

    .warning-list strong {
      color: #f57c00;
    }

    .docs-card .mat-mdc-card-header {
      background: #e3f2fd;
      margin: -24px -24px 16px -24px;
      padding: 16px 24px;
    }

    .docs-card .mat-mdc-card-title {
      color: #1976d2 !important;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .docs-section {
      margin-bottom: 32px;
    }

    .docs-section h3 {
      color: #495057;
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .docs-section ol, .docs-section ul {
      margin: 0;
      padding-left: 20px;
    }

    .docs-section li {
      margin: 8px 0;
      color: #6c757d;
      line-height: 1.5;
    }

    .docs-section code {
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #e83e8c;
      border: 1px solid #e9ecef;
    }

    @media (max-width: 768px) {
      .admin-container {
        padding: 16px;
      }

      .admin-header {
        margin: -16px -16px 24px -16px;
        padding: 24px 16px;
      }

      .header-content h1 {
        font-size: 24px;
      }

      .info-item {
        flex-direction: column;
        gap: 12px;
      }

      .info-item mat-icon {
        margin-top: 0;
      }
    }
  `]
})
export class AdminLocalidadesComponent {
  // Este componente solo actúa como contenedor
  // La lógica está en los componentes hijos
}