import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BajaExternaService, BajaExterna } from '../../../services/baja-externa.service';
import { BajaExternaFormComponent } from '../baja-externa-form/baja-externa-form.component';

@Component({
  selector: 'app-bajas-externas-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatDialogModule],
  template: `
    <div class="bajas-container p-6">
      <div class="header-section flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 m-0">Módulo de Bajas Externas</h1>
          <p class="text-gray-500 m-0 mt-1">Gestión de notificaciones al MTC y otras entidades</p>
        </div>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Registrar Baja Externa
        </button>
      </div>

      <!-- Control Flow (@if) en lugar de *ngIf -->
      @if (bajaService.loading()) {
        <div class="flex justify-center p-8">
          <p>Cargando registros...</p>
        </div>
      } @else if (bajaService.error()) {
        <div class="bg-red-50 text-red-600 p-4 rounded-md">
          {{ bajaService.error() }}
        </div>
      } @else {
        <div class="table-container bg-white rounded-lg shadow overflow-hidden">
          <table mat-table [dataSource]="bajaService.bajas()" class="w-full">
            
            <ng-container matColumnDef="placa">
              <th mat-header-cell *matHeaderCellDef> Placa </th>
              <td mat-cell *matCellDef="let element" class="font-bold"> {{element.placa}} </td>
            </ng-container>

            <ng-container matColumnDef="empresa">
              <th mat-header-cell *matHeaderCellDef> Empresa Origen </th>
              <td mat-cell *matCellDef="let element">
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{{element.razon_social}}</span>
                  <span class="text-xs text-gray-500">RUC: {{element.ruc_empresa}}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="motivo">
              <th mat-header-cell *matHeaderCellDef> Motivo </th>
              <td mat-cell *matCellDef="let element"> {{element.motivo}} </td>
            </ng-container>

            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef> Estado </th>
              <td mat-cell *matCellDef="let element">
                <mat-chip-set>
                  <mat-chip [color]="element.estado_notificacion === 'PENDIENTE' ? 'warn' : 'primary'" highlighted>
                    {{element.estado_notificacion}}
                  </mat-chip>
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef> Fecha Registro </th>
              <td mat-cell *matCellDef="let element"> {{element.fecha_registro | date:'dd/MM/yyyy HH:mm'}} </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef class="w-32 text-center"> Acciones </th>
              <td mat-cell *matCellDef="let element" class="text-center">
                <button mat-icon-button color="primary" [title]="'Ver Evidencia'" *ngIf="element.archivo_evidencia" (click)="verEvidencia(element)">
                  <mat-icon>attach_file</mat-icon>
                </button>
                <button mat-icon-button color="accent" [title]="'Marcar como Notificado'" *ngIf="element.estado_notificacion === 'PENDIENTE'" (click)="marcarNotificado(element)">
                  <mat-icon>check_circle</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell text-center py-8" colspan="6">No hay registros de bajas externas</td>
            </tr>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .bajas-container { max-width: 1200px; margin: 0 auto; }
  `]
})
export class BajasExternasListComponent implements OnInit {
  bajaService = inject(BajaExternaService);
  dialog = inject(MatDialog);

  displayedColumns: string[] = ['placa', 'empresa', 'motivo', 'estado', 'fecha', 'acciones'];

  ngOnInit() {
    this.bajaService.loadBajas();
  }

  openForm() {
    this.dialog.open(BajaExternaFormComponent, {
      width: '600px',
      disableClose: true
    });
  }

  verEvidencia(baja: BajaExterna) {
    if (baja.archivo_evidencia) {
      window.open(baja.archivo_evidencia, '_blank');
    }
  }

  marcarNotificado(baja: BajaExterna) {
    if (confirm(`¿Estás seguro de marcar la placa ${baja.placa} como NOTIFICADA al MTC?`)) {
      this.bajaService.notificarBaja(baja.id!).subscribe();
    }
  }
}
