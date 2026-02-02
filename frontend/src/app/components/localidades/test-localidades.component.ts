import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LocalidadConsolidadoService } from '../../services/localidad-consolidado.service';

@Component({
  selector: 'app-test-localidades',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div style="padding: 20px;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>🧪 Test de Conectividad - Localidades</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div style="margin: 20px 0;">
            <button mat-raised-button color="primary" (click)="probarConectividad()" [disabled]="cargando">
              🔬 Probar Conectividad
            </button>
            
            <button mat-raised-button color="accent" (click)="cargarLocalidades()" [disabled]="cargando" style="margin-left: 10px;">
              📥 Cargar Localidades
            </button>
            
            <button mat-raised-button color="warn" (click)="diagnosticar()" [disabled]="cargando" style="margin-left: 10px;">
              🔧 Diagnóstico Completo
            </button>
          </div>
          
          <mat-spinner *ngIf="cargando" diameter="40"></mat-spinner>
          
          <div *ngIf="resultado" style="margin-top: 20px;">
            <h3>📊 Resultado:</h3>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">{{ resultado }}</pre>
          </div>
          
          <div *ngIf="localidades.length > 0" style="margin-top: 20px;">
            <h3>🏘️ Localidades Cargadas ({{ (localidades)?.length || 0 }}):</h3>
            <div *ngFor="let localidad of localidades.slice(0, 5)" style="margin: 5px 0; padding: 10px; background: #e3f2fd; border-radius: 3px;">
              <strong>{{ localidad.nombre }}</strong> - {{ localidad.departamento }} / {{ localidad.provincia }}
              <span *ngIf="localidad.esta_activa" style="color: green;"> ✅ Activa</span>
              <span *ngIf="!localidad.esta_activa" style="color: red;"> ❌ Inactiva</span>
            </div>
            <p *ngIf="localidades.length > 5" style="color: #666;">
              ... y {{ localidades.length - 5 }} más
            </p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class TestLocalidadesComponent implements OnInit {
  cargando = false;
  resultado = '';
  localidades: any[] = [];

  constructor(private localidadService: LocalidadConsolidadoService) {}

  ngOnInit() {
    // console.log removed for production
    this.mostrarEstadisticas();
  }

  async mostrarEstadisticas() {
    const stats = this.localidadService.getEstadisticasCache();
    // console.log removed for production
    this.resultado = `📊 ESTADÍSTICAS INICIALES:\n${JSON.stringify(stats, null, 2)}`;
  }

  async probarConectividad() {
    this.cargando = true;
    this.resultado = '🔄 Probando conectividad...';
    
    try {
      // console.log removed for production
      
      // Probar conexión directa al backend
      const response = await fetch('http://localhost:8000/api/v1/localidades', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // console.log removed for production
      
      if (response.ok) {
        const data = await response.json();
        // console.log removed for production
        console.log('🔍 MUESTRA DE DATOS:', data.slice(0, 2));
        
        this.resultado = `✅ CONECTIVIDAD EXITOSA!\n\n` +
                        `Status: ${response.status} ${response.statusText}\n` +
                        `Localidades encontradas: ${data.length}\n\n` +
                        `Muestra de datos:\n${JSON.stringify(data.slice(0, 2), null, 2)}`;
      } else {
        const errorText = await response.text();
        console.error('❌ ERROR DEL BACKEND::', response.status, errorText);
        
        this.resultado = `❌ ERROR DE CONECTIVIDAD!\n\n` +
                        `Status: ${response.status} ${response.statusText}\n` +
                        `Error: ${errorText}`;
      }
      
    } catch (error: any) {
      console.error('❌ ERROR DE CONEXIÓN::', error);
      this.resultado = `❌ ERROR DE CONEXIÓN!\n\n` +
                      `Error: ${error.message}\n` +
                      `Tipo: ${error.name}`;
    } finally {
      this.cargando = false;
    }
  }

  async cargarLocalidades() {
    this.cargando = true;
    this.resultado = '📥 Cargando localidades...';
    
    try {
      // console.log removed for production
      
      const localidades = await this.localidadService.obtenerLocalidades();
      
      // console.log removed for production
      console.log('🔍 MUESTRA:', localidades.slice(0, 3));
      
      this.localidades = localidades;
      
      const stats = this.localidadService.getEstadisticasCache();
      
      this.resultado = `✅ LOCALIDADES CARGADAS EXITOSAMENTE!\n\n` +
                      `Total: ${localidades.length}\n` +
                      `Activas: ${stats.activas}\n` +
                      `Inactivas: ${stats.inactivas}\n` +
                      `Cache actualizado: ${stats.cacheActualizado}\n\n` +
                      `Estadísticas completas:\n${JSON.stringify(stats, null, 2)}`;
      
    } catch (error: any) {
      console.error('❌ ERROR CARGANDO LOCALIDADES::', error);
      this.resultado = `❌ ERROR CARGANDO LOCALIDADES!\n\n` +
                      `Error: ${error.message}\n` +
                      `Stack: ${error.stack}`;
    } finally {
      this.cargando = false;
    }
  }

  async diagnosticar() {
    this.cargando = true;
    this.resultado = '🔧 Ejecutando diagnóstico completo...';
    
    try {
      // console.log removed for production
      
      const diagnostico = await this.localidadService.diagnosticarConectividad();
      
      // console.log removed for production
      
      this.resultado = `🔧 DIAGNÓSTICO COMPLETO:\n\n${JSON.stringify(diagnostico, null, 2)}`;
      
    } catch (error: any) {
      console.error('❌ ERROR EN DIAGNÓSTICO::', error);
      this.resultado = `❌ ERROR EN DIAGNÓSTICO!\n\n` +
                      `Error: ${error.message}\n` +
                      `Stack: ${error.stack}`;
    } finally {
      this.cargando = false;
    }
  }
}