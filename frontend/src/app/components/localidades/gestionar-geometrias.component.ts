import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-gestionar-geometrias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDialogModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1><mat-icon>map</mat-icon> Gestionar Geometrías</h1>
        <p>Importa geometrías desde GeoJSON y administra sus datos vinculados a localidades</p>
      </div>

      <mat-tab-group>
        <mat-tab label="Importar Geometrías">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title><mat-icon>cloud_upload</mat-icon> Cargar Geometrías desde GeoJSON</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-box">
                  <mat-icon>info</mat-icon>
                  <div>
                    <strong>Fuentes de datos:</strong>
                    <ul>
                      <li><strong>Centros Poblados:</strong> puno-centrospoblados.geojson (IDCCPP: 10 dígitos)</li>
                      <li><strong>Distritos:</strong> puno-distritos.geojson (UBIGEO: 6 dígitos)</li>
                      <li><strong>Provincias:</strong> puno-provincias.geojson (IDPROV: 4 dígitos)</li>
                      <li><strong>Centroides:</strong> puno-distritos-point.geojson, puno-provincias-point.geojson (editables)</li>
                    </ul>
                  </div>
                </div>

                <div class="button-group">
                  <button mat-raised-button color="primary" (click)="debugProvincias()" [disabled]="cargando()">
                    <mat-icon>bug_report</mat-icon> DEBUG: Verificar Provincias
                  </button>
                  <button mat-raised-button color="primary" (click)="importarCentrosPoblados()" [disabled]="cargando()">
                    <mat-icon>location_on</mat-icon> Importar Centros Poblados
                  </button>
                  <button mat-raised-button color="primary" (click)="importarDistritos()" [disabled]="cargando()">
                    <mat-icon>polygon</mat-icon> Importar Distritos
                  </button>
                  <button mat-raised-button color="primary" (click)="importarProvincias()" [disabled]="cargando()">
                    <mat-icon>polygon</mat-icon> Importar Provincias
                  </button>
                </div>

                @if (cargando()) {
                  <div class="loading">
                    <mat-spinner diameter="40"></mat-spinner>
                    <p>{{ mensajeProgreso() }}</p>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Centros Poblados">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title><mat-icon>location_on</mat-icon> Centros Poblados ({{ totalCentrosPoblados() }})</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (cargando()) {
                  <div class="loading">
                    <mat-spinner diameter="40"></mat-spinner>
                  </div>
                } @else {
                  <table mat-table [dataSource]="centrosPoblados()" class="data-table">
                    <ng-container matColumnDef="nombre">
                      <th mat-header-cell *matHeaderCellDef>Nombre</th>
                      <td mat-cell *matCellDef="let e">{{ e.nombre }}</td>
                    </ng-container>
                    <ng-container matColumnDef="ubigeo">
                      <th mat-header-cell *matHeaderCellDef>UBIGEO (IDCCPP)</th>
                      <td mat-cell *matCellDef="let e">{{ e.ubigeo }}</td>
                    </ng-container>
                    <ng-container matColumnDef="localidad_vinculada">
                      <th mat-header-cell *matHeaderCellDef>Localidad Vinculada</th>
                      <td mat-cell *matCellDef="let e">
                        @if (e.localidad_vinculada) {
                          <mat-chip class="success-chip">✓ Vinculada</mat-chip>
                        } @else {
                          <mat-chip class="warning-chip">✗ Sin vincular</mat-chip>
                        }
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let e">
                        <button mat-icon-button color="warn" (click)="eliminarGeometria(e.id)" matTooltip="Eliminar">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="['nombre', 'ubigeo', 'localidad_vinculada', 'acciones']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['nombre', 'ubigeo', 'localidad_vinculada', 'acciones'];"></tr>
                  </table>
                  <mat-paginator [length]="totalCentrosPoblados()" [pageSize]="pageSize" [pageSizeOptions]="[10, 25, 50]" (page)="onPageChange($event, 'centro')"></mat-paginator>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Distritos">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title><mat-icon>polygon</mat-icon> Distritos ({{ totalDistritos() }})</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (cargando()) {
                  <div class="loading">
                    <mat-spinner diameter="40"></mat-spinner>
                  </div>
                } @else {
                  <table mat-table [dataSource]="distritos()" class="data-table">
                    <ng-container matColumnDef="nombre">
                      <th mat-header-cell *matHeaderCellDef>Nombre</th>
                      <td mat-cell *matCellDef="let e">{{ e.nombre }}</td>
                    </ng-container>
                    <ng-container matColumnDef="ubigeo">
                      <th mat-header-cell *matHeaderCellDef>UBIGEO</th>
                      <td mat-cell *matCellDef="let e">{{ e.ubigeo }}</td>
                    </ng-container>
                    <ng-container matColumnDef="localidad_vinculada">
                      <th mat-header-cell *matHeaderCellDef>Localidad Vinculada</th>
                      <td mat-cell *matCellDef="let e">
                        @if (e.localidad_vinculada) {
                          <mat-chip class="success-chip">✓ Vinculada</mat-chip>
                        } @else {
                          <mat-chip class="warning-chip">✗ Sin vincular</mat-chip>
                        }
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let e">
                        <button mat-icon-button color="warn" (click)="eliminarGeometria(e.id)" matTooltip="Eliminar">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="['nombre', 'ubigeo', 'localidad_vinculada', 'acciones']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['nombre', 'ubigeo', 'localidad_vinculada', 'acciones'];"></tr>
                  </table>
                  <mat-paginator [length]="totalDistritos()" [pageSize]="pageSize" [pageSizeOptions]="[10, 25, 50]" (page)="onPageChange($event, 'distrito')"></mat-paginator>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Provincias">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title><mat-icon>polygon</mat-icon> Provincias ({{ totalProvincias() }})</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (cargando()) {
                  <div class="loading">
                    <mat-spinner diameter="40"></mat-spinner>
                  </div>
                } @else {
                  <table mat-table [dataSource]="provincias()" class="data-table">
                    <ng-container matColumnDef="nombre">
                      <th mat-header-cell *matHeaderCellDef>Nombre</th>
                      <td mat-cell *matCellDef="let e">{{ e.nombre }}</td>
                    </ng-container>
                    <ng-container matColumnDef="ubigeo">
                      <th mat-header-cell *matHeaderCellDef>UBIGEO (IDPROV)</th>
                      <td mat-cell *matCellDef="let e">{{ e.ubigeo }}</td>
                    </ng-container>
                    <ng-container matColumnDef="localidad_vinculada">
                      <th mat-header-cell *matHeaderCellDef>Localidad Vinculada</th>
                      <td mat-cell *matCellDef="let e">
                        @if (e.localidad_vinculada) {
                          <mat-chip class="success-chip">✓ Vinculada</mat-chip>
                        } @else {
                          <mat-chip class="warning-chip">✗ Sin vincular</mat-chip>
                        }
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let e">
                        <button mat-icon-button color="warn" (click)="eliminarGeometria(e.id)" matTooltip="Eliminar">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="['nombre', 'ubigeo', 'localidad_vinculada', 'acciones']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['nombre', 'ubigeo', 'localidad_vinculada', 'acciones'];"></tr>
                  </table>
                  <mat-paginator [length]="totalProvincias()" [pageSize]="pageSize" [pageSizeOptions]="[10, 25, 50]" (page)="onPageChange($event, 'provincia')"></mat-paginator>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .container { padding: 20px; max-width: 1400px; margin: 0 auto; }
    .header { margin-bottom: 30px; }
    .header h1 { display: flex; align-items: center; gap: 12px; margin: 0 0 8px 0; font-size: 28px; font-weight: 500; }
    .header p { margin: 0; color: #666; }
    .tab-content { padding: 20px 0; }
    mat-card { margin-bottom: 20px; }
    mat-card-header { margin-bottom: 20px; }
    mat-card-title { display: flex; align-items: center; gap: 12px; margin: 0; font-size: 18px; }
    .info-box { background: #e3f2fd; border-left: 4px solid #1976d2; padding: 16px; margin: 16px 0; border-radius: 4px; display: flex; gap: 12px; }
    .info-box mat-icon { color: #1976d2; flex-shrink: 0; margin-top: 2px; }
    .info-box ul { margin: 8px 0 0 0; padding-left: 20px; }
    .info-box li { margin: 4px 0; font-size: 13px; }
    .button-group { display: flex; gap: 12px; flex-wrap: wrap; margin: 20px 0; }
    .button-group button { display: flex; align-items: center; gap: 8px; }
    .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 16px; }
    .loading p { margin: 0; color: #666; }
    .data-table { width: 100%; margin-top: 20px; }
    .data-table th { background-color: #f5f5f5; font-weight: 600; }
    .data-table td { padding: 12px; }
    .data-table tr:hover { background-color: #fafafa; }
    .success-chip { background-color: #4caf50 !important; color: white !important; }
    .warning-chip { background-color: #ff9800 !important; color: white !important; }
  `]
})
export class GestionarGeometriasComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  centrosPoblados = signal<any[]>([]);
  distritos = signal<any[]>([]);
  provincias = signal<any[]>([]);

  cargando = signal(false);
  mensajeProgreso = signal('');

  totalCentrosPoblados = signal(0);
  totalDistritos = signal(0);
  totalProvincias = signal(0);

  pageSize = 10;
  pageIndex = 0;

  ngOnInit() {
    this.cargarGeometrias();
  }

  async debugProvincias() {
    this.cargando.set(true);
    this.mensajeProgreso.set('Verificando provincias...');
    try {
      const response = await fetch('/assets/geojson/puno-provincias-geometria.geojson');
      if (!response.ok) throw new Error('No se pudo cargar el archivo GeoJSON');

      const geojson = await response.json();

      const geometrias = geojson.features.map((feature: any) => ({
        ubigeo: feature.properties.IDPROV,
        nombre: feature.properties.NOMBPROV,
        geometry: feature.geometry
      }));

      const resultado: any = await this.http.post('http://localhost:8000/api/v1/debug/verificar-geometrias', {
        tipo: 'provincia',
        geometrias
      }).toPromise();

      console.log('DEBUG Resultado:', resultado);
      this.mostrarMensaje(`✅ DEBUG: ${JSON.stringify(resultado.primeras_3[0])}`, 'info');
    } catch (error: any) {
      console.error('Error:', error);
      this.mostrarMensaje(`❌ Error: ${error.error?.detail || error.message}`, 'error');
    } finally {
      this.cargando.set(false);
      this.mensajeProgreso.set('');
    }
  }

  async importarCentrosPoblados() {
    this.cargando.set(true);
    this.mensajeProgreso.set('Importando centros poblados...');
    try {
      const response = await fetch('/assets/geojson/puno-centrospoblados.geojson');
      if (!response.ok) throw new Error('No se pudo cargar el archivo GeoJSON');

      const geojson = await response.json();

      const geometrias = geojson.features.map((feature: any) => ({
        ubigeo: feature.properties.IDCCPP,
        nombre: feature.properties.NOMB_CCPP,
        geometry: feature.geometry
      }));

      const resultado: any = await this.http.post('http://localhost:8000/api/v1/localidades/importar-geometrias', {
        tipo: 'centro_poblado',
        geometrias
      }).toPromise();

      const msg = `✅ Centros poblados: ${resultado.total_vinculados} importados, ${resultado.total_errores} errores`;
      this.mostrarMensaje(msg, resultado.total_errores === 0 ? 'success' : 'info');
      await this.cargarGeometrias();
    } catch (error: any) {
      console.error('Error:', error);
      this.mostrarMensaje(`❌ Error: ${error.error?.detail || error.message}`, 'error');
    } finally {
      this.cargando.set(false);
      this.mensajeProgreso.set('');
    }
  }

  async importarDistritos() {
    this.cargando.set(true);
    this.mensajeProgreso.set('Importando distritos...');
    try {
      // Cargar ambos archivos
      const geomResponse = await fetch('/assets/geojson/puno-distritos-geometria.geojson');
      const pointResponse = await fetch('/assets/geojson/puno-distritos-point.geojson');

      if (!geomResponse.ok || !pointResponse.ok) throw new Error('No se pudo cargar los archivos GeoJSON');

      const geomGeojson = await geomResponse.json();
      const pointGeojson = await pointResponse.json();

      // Crear mapa de puntos por UBIGEO
      const pointsMap = new Map();
      pointGeojson.features.forEach((feature: any) => {
        const ubigeo = feature.properties.UBIGEO;
        pointsMap.set(ubigeo, feature.geometry.coordinates);
      });

      // Combinar geometrías con centroides
      const geometrias = geomGeojson.features.map((feature: any) => {
        const ubigeo = feature.properties.UBIGEO;
        const coords = pointsMap.get(ubigeo) || [0, 0];

        return {
          ubigeo: ubigeo,
          nombre: feature.properties.DISTRITO,
          geometry: feature.geometry,
          centroide: coords
        };
      });

      const resultado: any = await this.http.post('http://localhost:8000/api/v1/localidades/importar-geometrias', {
        tipo: 'distrito',
        geometrias
      }).toPromise();

      const msg = `✅ Distritos: ${resultado.total_vinculados} importados, ${resultado.total_errores} errores`;
      this.mostrarMensaje(msg, resultado.total_errores === 0 ? 'success' : 'info');
      await this.cargarGeometrias();
    } catch (error: any) {
      console.error('Error:', error);
      this.mostrarMensaje(`❌ Error: ${error.error?.detail || error.message}`, 'error');
    } finally {
      this.cargando.set(false);
      this.mensajeProgreso.set('');
    }
  }

  async importarProvincias() {
    this.cargando.set(true);
    this.mensajeProgreso.set('Importando provincias...');
    try {
      // Cargar ambos archivos
      const geomResponse = await fetch('/assets/geojson/puno-provincias-geometria.geojson');
      const pointResponse = await fetch('/assets/geojson/puno-provincias-point.geojson');

      if (!geomResponse.ok || !pointResponse.ok) throw new Error('No se pudo cargar los archivos GeoJSON');

      const geomGeojson = await geomResponse.json();
      const pointGeojson = await pointResponse.json();

      // Crear mapa de puntos por IDPROV
      const pointsMap = new Map();
      pointGeojson.features.forEach((feature: any) => {
        const idprov = feature.properties.IDPROV;
        pointsMap.set(idprov, feature.geometry.coordinates);
      });

      // Combinar geometrías con centroides
      const geometrias = geomGeojson.features.map((feature: any) => {
        const ubigeo = feature.properties.IDPROV;
        const coords = pointsMap.get(ubigeo) || [0, 0];

        return {
          ubigeo: ubigeo,
          nombre: feature.properties.NOMBPROV,
          geometry: feature.geometry,
          centroide: coords  // Agregar centroide
        };
      });

      const resultado: any = await this.http.post('http://localhost:8000/api/v1/localidades/importar-geometrias', {
        tipo: 'provincia',
        geometrias
      }).toPromise();

      const msg = `✅ Provincias: ${resultado.total_vinculados} importadas, ${resultado.total_errores} errores`;
      this.mostrarMensaje(msg, resultado.total_errores === 0 ? 'success' : 'info');
      await this.cargarGeometrias();
    } catch (error: any) {
      console.error('Error:', error);
      this.mostrarMensaje(`❌ Error: ${error.error?.detail || error.message}`, 'error');
    } finally {
      this.cargando.set(false);
      this.mensajeProgreso.set('');
    }
  }

  async cargarGeometrias() {
    this.cargando.set(true);
    try {
      // Cargar centros poblados
      const cpResponse: any = await this.http.get(
        `http://localhost:8000/api/v1/localidades/geometrias/centro_poblado?skip=${this.pageIndex * this.pageSize}&limit=${this.pageSize}`
      ).toPromise();

      this.centrosPoblados.set(cpResponse.geometrias || []);
      this.totalCentrosPoblados.set(cpResponse.total || 0);

      // Cargar distritos
      const distResponse: any = await this.http.get(
        `http://localhost:8000/api/v1/localidades/geometrias/distrito?skip=${this.pageIndex * this.pageSize}&limit=${this.pageSize}`
      ).toPromise();

      this.distritos.set(distResponse.geometrias || []);
      this.totalDistritos.set(distResponse.total || 0);

      // Cargar provincias
      const provResponse: any = await this.http.get(
        `http://localhost:8000/api/v1/localidades/geometrias/provincia?skip=${this.pageIndex * this.pageSize}&limit=${this.pageSize}`
      ).toPromise();

      this.provincias.set(provResponse.geometrias || []);
      this.totalProvincias.set(provResponse.total || 0);
    } catch (error: any) {
      console.error('Error cargando geometrías:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  editarCentro(centro: any) {
    // Implementar edición de centros poblados (centroides) si es necesario
    console.log('Editar centro:', centro);
  }

  async eliminarGeometria(id: string) {
    if (!confirm('¿Eliminar esta geometría?')) return;

    try {
      await this.http.delete(`http://localhost:8000/api/v1/localidades/geometrias/${id}`).toPromise();
      this.mostrarMensaje('✅ Geometría eliminada', 'success');
      await this.cargarGeometrias();
    } catch (error: any) {
      this.mostrarMensaje(`❌ Error eliminando`, 'error');
    }
  }

  onPageChange(event: PageEvent, tipo: string) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarGeometrias();
  }

  private mostrarMensaje(msg: string, tipo: 'success' | 'error' | 'info') {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}
