import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { VehiculoModalComponent, VehiculoModalData } from '../components/vehiculos/vehiculo-modal.component';
import { TransferirEmpresaModalComponent } from '../components/vehiculos/transferir-empresa-modal.component';
import { SolicitarBajaVehiculoUnifiedComponent } from '../components/vehiculos/solicitar-baja-vehiculo-unified.component';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../models/vehiculo.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
    console.log('🔍 ABRIENDO MODAL CREAR VEHÍCULO');
    console.log('🔍 EmpresaId:', empresaId);
    console.log('🔍 ResolucionId:', resolucionId);
    
    try {
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

      console.log('✅ Modal abierto exitosamente:', dialogRef);

      return dialogRef.afterClosed().pipe(
        map(result => {
          console.log('🔍 Modal cerrado con resultado:', result);
          if (result && result.vehiculo) {
            console.log('✅ Vehículo creado:', result.vehiculo);
            return result.vehiculo;
          }
          throw new Error('Modal cerrado sin crear vehículo');
        })
      );
    } catch (error) {
      console.error('❌ Error abriendo modal:', error);
      return new Observable(observer => {
        observer.error(error);
      });
    }
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

  /**
   * Abre el modal para transferir un vehículo entre empresas
   * @param vehiculo Vehículo a transferir
   * @returns Observable que emite el resultado de la transferencia
   */
  openTransferirModal(vehiculo: Vehiculo): Observable<any> {
    const dialogRef = this.dialog.open(TransferirEmpresaModalComponent, {
      width: '800px',
      data: { vehiculo },
      disableClose: true
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: any) => {
        observer.next(result);
        observer.complete();
      });
    });
  }

  /**
   * Abre el modal para solicitar la baja de un vehículo
   * @param vehiculo Vehículo para solicitar baja
   * @returns Observable que emite el resultado de la solicitud
   */
  openSolicitarBajaModal(vehiculo: Vehiculo): Observable<any> {
    const dialogRef = this.dialog.open(SolicitarBajaVehiculoUnifiedComponent, {
      width: '800px',
      maxHeight: '85vh',
      data: { vehiculo },
      disableClose: true
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: any) => {
        observer.next(result);
        observer.complete();
      });
    });
  }
} 