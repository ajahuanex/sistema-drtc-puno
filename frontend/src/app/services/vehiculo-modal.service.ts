import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { VehiculoModalComponent, VehiculoModalData } from '../components/vehiculos/vehiculo-modal.component';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../models/vehiculo.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VehiculoModalService {
  private dialog = inject(MatDialog);

  /**
   * Abre el modal para crear un nuevo vehículo
   * @param empresaId ID de la empresa (opcional)
   * @param resolucionId ID de la resolución (opcional)
   * @returns Observable que emite el vehículo creado
   */
  openCreateModal(empresaId?: string, resolucionId?: string): Observable<VehiculoCreate> {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        mode: 'create',
        empresaId,
        resolucionId
      } as VehiculoModalData,
      disableClose: true
    });

    return new Observable(observer => {
      dialogRef.componentInstance.vehiculoCreated.subscribe((vehiculo: VehiculoCreate) => {
        observer.next(vehiculo);
        observer.complete();
      });

      dialogRef.componentInstance.modalClosed.subscribe(() => {
        observer.complete();
      });

      dialogRef.afterClosed().subscribe(() => {
        observer.complete();
      });
    });
  }

  /**
   * Abre el modal para editar un vehículo existente
   * @param vehiculo Vehículo a editar
   * @returns Observable que emite el vehículo actualizado
   */
  openEditModal(vehiculo: Vehiculo): Observable<VehiculoUpdate> {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        mode: 'edit',
        vehiculo
      } as VehiculoModalData,
      disableClose: true
    });

    return new Observable(observer => {
      dialogRef.componentInstance.vehiculoUpdated.subscribe((vehiculo: VehiculoUpdate) => {
        observer.next(vehiculo);
        observer.complete();
      });

      dialogRef.componentInstance.modalClosed.subscribe(() => {
        observer.complete();
      });

      dialogRef.afterClosed().subscribe(() => {
        observer.complete();
      });
    });
  }

  /**
   * Abre el modal para crear un vehículo en una empresa específica
   * @param empresaId ID de la empresa
   * @returns Observable que emite el vehículo creado
   */
  openCreateForEmpresa(empresaId: string): Observable<VehiculoCreate> {
    return this.openCreateModal(empresaId);
  }

  /**
   * Abre el modal para crear un vehículo en una resolución específica
   * @param empresaId ID de la empresa
   * @param resolucionId ID de la resolución
   * @returns Observable que emite el vehículo creado
   */
  openCreateForResolucion(empresaId: string, resolucionId: string): Observable<VehiculoCreate> {
    return this.openCreateModal(empresaId, resolucionId);
  }
} 