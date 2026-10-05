import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TucService } from '../../services/tuc.service';
import { TucVerificacionPublica } from '../../models/tuc.model';
import { formatoFechaLatina } from '../../pipes/fecha-latina.pipe';

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
  templateUrl: './verificar-tuc-publico.component.html',
  styleUrl: './verificar-tuc-publico.component.scss'
})
export class VerificarTucPublicoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private tucService = inject(TucService);

  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  datos = signal<TucVerificacionPublica | null>(null);

  // Estados de retroalimentación de copiado
  copiadoPlaca = signal<boolean>(false);
  copiadoHash = signal<boolean>(false);
  copiadoMotor = signal<boolean>(false);
  copiadoChasis = signal<boolean>(false);
  copiadoLink = signal<boolean>(false);

  // Reloj de telemetría en tiempo real
  fechaHoraActual = signal<string>('');
  private timerId: any = null;

  ngOnInit(): void {
    this.iniciarReloj();

    const hash = this.route.snapshot.paramMap.get('hash') || this.route.snapshot.paramMap.get('id');
    if (hash) {
      this.consultar(hash);
    } else {
      this.error.set('No se proporcionó un código o hash de verificación en la URL.');
      this.cargando.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private iniciarReloj(): void {
    const actualizar = () => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      this.fechaHoraActual.set(`${dd}/${mm}/${yyyy} • ${hh}:${min}:${ss} (UTC-5)`);
    };

    actualizar();
    this.timerId = setInterval(actualizar, 1000);
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
        this.error.set(
          err?.error?.detail || 
          'El título habilitante no se encuentra registrado en la base de datos oficial o ha sido retirado.'
        );
        this.cargando.set(false);
      }
    });
  }

  reintentar(): void {
    const hash = this.route.snapshot.paramMap.get('hash') || this.route.snapshot.paramMap.get('id');
    if (hash) {
      this.consultar(hash);
    }
  }

  consultarNuevamente(): void {
    this.reintentar();
  }

  obtenerPlaca(): string {
    const d = this.datos();
    return d?.vehiculo?.['placa'] || (d as any)?.['placa'] || 'SIN-PLACA';
  }

  formatearFechaLatina(fechaStr: string | null | undefined): string {
    return formatoFechaLatina(fechaStr);
  }

  diasRestantes(): { dias: number; texto: string; vencido: boolean } | null {
    const fechaVenc = this.datos()?.fechaVencimiento;
    if (!fechaVenc) return null;

    try {
      const fv = new Date(fechaVenc);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fv.setHours(0, 0, 0, 0);

      const diffTime = fv.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const fechaLat = this.formatearFechaLatina(fechaVenc);

      if (diffDays < 0) {
        return {
          dias: Math.abs(diffDays),
          texto: `Venció hace ${Math.abs(diffDays)} días (${fechaLat})`,
          vencido: true
        };
      } else if (diffDays === 0) {
        return {
          dias: 0,
          texto: `Vence el día de hoy (${fechaLat})`,
          vencido: false
        };
      } else {
        return {
          dias: diffDays,
          texto: `Quedan ${diffDays} días de vigencia legal (${fechaLat})`,
          vencido: false
        };
      }
    } catch {
      return null;
    }
  }

  copiarTexto(texto: string, tipo: 'placa' | 'hash' | 'motor' | 'chasis'): void {
    if (!texto) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(texto).then(() => {
        this.setSignalCopiado(tipo, true);
        setTimeout(() => this.setSignalCopiado(tipo, false), 2000);
      }).catch(() => {
        this.fallbackCopiar(texto, tipo);
      });
    } else {
      this.fallbackCopiar(texto, tipo);
    }
  }

  copiarLink(): void {
    const url = window.location.href;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.copiadoLink.set(true);
        setTimeout(() => this.copiadoLink.set(false), 2000);
      }).catch(() => {
        this.fallbackCopiar(url, 'link');
      });
    } else {
      this.fallbackCopiar(url, 'link');
    }
  }

  private setSignalCopiado(tipo: string, val: boolean): void {
    switch (tipo) {
      case 'placa': this.copiadoPlaca.set(val); break;
      case 'hash': this.copiadoHash.set(val); break;
      case 'motor': this.copiadoMotor.set(val); break;
      case 'chasis': this.copiadoChasis.set(val); break;
      case 'link': this.copiadoLink.set(val); break;
    }
  }

  private fallbackCopiar(texto: string, tipo: string): void {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.setSignalCopiado(tipo, true);
      setTimeout(() => this.setSignalCopiado(tipo, false), 2000);
    } catch {
      // Ignorar si falla
    } finally {
      document.body.removeChild(ta);
    }
  }

  imprimirConstancia(): void {
    window.print();
  }
}
