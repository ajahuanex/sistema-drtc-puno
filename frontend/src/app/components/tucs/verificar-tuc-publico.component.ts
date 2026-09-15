import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TucService } from '../../services/tuc.service';
import { TucVerificacionPublica } from '../../models/tuc.model';

@Component({
  selector: 'app-verificar-tuc-publico',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-500 selection:text-white">
      
      <!-- Encabezado Institucional -->
      <header class="bg-slate-900 border-b border-slate-800 py-4 px-6 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <mat-icon class="text-2xl">verified_user</mat-icon>
            </div>
            <div>
              <h1 class="text-lg font-bold text-white tracking-tight leading-none">DRTC PUNO</h1>
              <p class="text-xs text-slate-400">Dirección Regional de Transportes y Comunicaciones</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
            Fiscalización en Campo
          </span>
        </div>
      </header>

      <!-- Contenido Principal -->
      <main class="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        
        @if (cargando()) {
          <div class="flex flex-col items-center justify-center py-20 gap-4">
            <mat-spinner diameter="48" color="accent"></mat-spinner>
            <p class="text-slate-400 text-sm animate-pulse">Verificando autenticidad del Título Habilitante en el registro oficial...</p>
          </div>
        } @else if (error()) {
          <div class="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
            <div class="inline-flex p-4 bg-rose-500/20 text-rose-400 rounded-full">
              <mat-icon class="text-4xl">gpp_bad</mat-icon>
            </div>
            <h2 class="text-xl font-bold text-white">Título Habilitante No Encontrado</h2>
            <p class="text-slate-300 text-sm">{{ error() }}</p>
            <p class="text-xs text-slate-500">Si considera que esto es un error, verifique que el código QR escaneado corresponda a una TUC oficial expedida por la DRTC Puno.</p>
          </div>
        } @else if (datos()) {
          <div class="space-y-6">
            
            <!-- Banner de Estado de Habilitación -->
            <div class="p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
                 [ngClass]="{
                   'bg-emerald-950/40 border-emerald-500/50 text-emerald-300': datos()?.esVigente,
                   'bg-rose-950/40 border-rose-500/50 text-rose-300': !datos()?.esVigente
                 }">
              <div class="flex items-center gap-4">
                <div class="p-3 rounded-2xl" [ngClass]="datos()?.esVigente ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'">
                  <mat-icon class="text-4xl">{{ datos()?.esVigente ? 'check_circle' : 'cancel' }}</mat-icon>
                </div>
                <div>
                  <span class="text-xs font-bold uppercase tracking-wider opacity-80">Estado de Habilitación Vehicular</span>
                  <h2 class="text-2xl font-black tracking-tight leading-tight">{{ datos()?.mensajeEstado }}</h2>
                  <p class="text-xs opacity-75 mt-0.5">Emisión: {{ datos()?.tipoEmision }} | N° {{ datos()?.nroTuc }}</p>
                </div>
              </div>

              <div class="text-right sm:text-right text-center border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6">
                <span class="text-xs opacity-75 block">Fecha de Vencimiento</span>
                <span class="text-lg font-mono font-bold">{{ datos()?.fechaVencimiento || 'INDEFINIDO' }}</span>
              </div>
            </div>

            <!-- Ficha Técnica del Vehículo y Empresa -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Vehículo -->
              <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div class="flex items-center gap-2 text-blue-400 pb-2 border-b border-slate-800">
                  <mat-icon>directions_bus</mat-icon>
                  <h3 class="font-bold text-sm text-white uppercase tracking-wider">Ficha Técnica Vehicular</h3>
                </div>

                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span class="text-slate-400 block">Placa de Rodaje</span>
                    <span class="text-base font-extrabold text-white font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 inline-block mt-0.5">
                      {{ datos()?.vehiculo?.['placa'] || 'N/A' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Categoría</span>
                    <span class="text-sm font-semibold text-white mt-0.5 block">{{ datos()?.vehiculo?.['categoria'] || 'M3' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Marca / Modelo</span>
                    <span class="text-sm font-medium text-slate-200 mt-0.5 block">
                      {{ datos()?.vehiculo?.['marca'] || '' }} {{ datos()?.vehiculo?.['modelo'] || 'N/A' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Año Fabricación</span>
                    <span class="text-sm font-medium text-slate-200 mt-0.5 block">{{ datos()?.vehiculo?.['anioFabricacion'] || 'N/A' }}</span>
                  </div>
                  <div class="col-span-2 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2">
                    <div>
                      <span class="text-slate-500 block">N° de Motor</span>
                      <span class="text-xs font-mono text-slate-300">{{ datos()?.vehiculo?.['numeroMotor'] || 'N/A' }}</span>
                    </div>
                    <div>
                      <span class="text-slate-500 block">VIN / Chasis</span>
                      <span class="text-xs font-mono text-slate-300">{{ datos()?.vehiculo?.['numeroSerie'] || datos()?.vehiculo?.['chasis'] || 'N/A' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empresa Transportista -->
              <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div class="flex items-center gap-2 text-blue-400 pb-2 border-b border-slate-800">
                  <mat-icon>business</mat-icon>
                  <h3 class="font-bold text-sm text-white uppercase tracking-wider">Empresa Transportista</h3>
                </div>

                <div class="space-y-3 text-xs">
                  <div>
                    <span class="text-slate-400 block">Razón Social</span>
                    <span class="text-sm font-bold text-white mt-0.5 block">{{ datos()?.empresa?.['razonSocial'] || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Número de RUC</span>
                    <span class="text-sm font-mono text-blue-300 mt-0.5 block font-semibold">{{ datos()?.empresa?.['ruc'] || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Resolución Primigenia</span>
                    <span class="text-sm font-semibold text-emerald-400 mt-0.5 block">{{ datos()?.resolucion?.['nroResolucion'] || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Vigencia Resolución</span>
                    <span class="text-xs text-slate-300 mt-0.5 block">
                      {{ datos()?.resolucion?.['fechaInicioVigencia'] || 'N/A' }} al {{ datos()?.resolucion?.['fechaFinVigencia'] || 'N/A' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rutas Habilitadas -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <div class="flex items-center gap-2 text-blue-400">
                  <mat-icon>alt_route</mat-icon>
                  <h3 class="font-bold text-sm text-white uppercase tracking-wider">Rutas Habilitadas para Operación</h3>
                </div>
                <span class="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                  {{ (datos()?.rutas)!.length }} Ruta(s) Autorizada(s)
                </span>
              </div>

              @if ((datos()?.rutas)!.length === 0) {
                <p class="text-xs text-slate-400 italic py-2">No se registran itinerarios específicos vinculados en esta consulta.</p>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead>
                      <tr class="text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                        <th class="pb-2">Código</th>
                        <th class="pb-2">Origen - Destino</th>
                        <th class="pb-2">Itinerario</th>
                        <th class="pb-2">Frecuencia</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                      @for (r of datos()?.rutas; track r['codigo'] || r['origen']) {
                        <tr>
                          <td class="py-2.5 font-bold text-amber-400 font-mono">{{ r['codigo'] || 'N/A' }}</td>
                          <td class="py-2.5 font-bold text-white">{{ r['origen'] }} - {{ r['destino'] }}</td>
                          <td class="py-2.5 text-slate-300 text-[11px]">{{ r['itinerario'] || '-' }}</td>
                          <td class="py-2.5 text-slate-400">{{ r['frecuencia'] || 'DIARIO' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>

            <!-- Firma de Seguridad SHA-256 -->
            <div class="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2 text-slate-400">
                <mat-icon class="text-emerald-400">security</mat-icon>
                <span>Firma Digital Hash SHA-256 (MTC / DRTC Puno):</span>
              </div>
              <span class="font-mono text-[10px] text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 select-all truncate max-w-full">
                {{ datos()?.hashSeguridad }}
              </span>
            </div>

            <div class="text-center pt-2">
              <button mat-stroked-button (click)="imprimirConstancia()" class="!border-slate-700 !text-slate-300 hover:!text-white">
                <mat-icon>print</mat-icon> Imprimir Constancia de Inspección
              </button>
            </div>
          </div>
        }
      </main>

      <!-- Pie Institucional -->
      <footer class="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>© 2025 Gobierno Regional Puno - Dirección Regional de Transportes y Comunicaciones</p>
        <p class="text-[10px] mt-0.5">Sistema Oficial de Verificación de Títulos Habilitantes según D.S. N° 017-2009-MTC</p>
      </footer>
    </div>
  `
})
export class VerificarTucPublicoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tucService = inject(TucService);

  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  datos = signal<TucVerificacionPublica | null>(null);

  ngOnInit(): void {
    const hash = this.route.snapshot.paramMap.get('hash') || this.route.snapshot.paramMap.get('id');
    if (hash) {
      this.consultar(hash);
    } else {
      this.error.set('No se proporcionó un código o hash de verificación en la URL.');
      this.cargando.set(false);
    }
  }

  consultar(codigo: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.tucService.verificarTucPublico(codigo).subscribe({
      next: (res) => {
        this.datos.set(res);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'El título habilitante no se encuentra registrado o ha sido retirado.');
        this.cargando.set(false);
      }
    });
  }

  imprimirConstancia(): void {
    window.print();
  }
}
