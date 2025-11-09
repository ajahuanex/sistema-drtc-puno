import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NotificationPreferences {
  enableSound: boolean;
  enableBrowserNotifications: boolean;
  enableEmailNotifications: boolean;
  notifyOnDerivacion: boolean;
  notifyOnRecepcion: boolean;
  notifyOnUrgente: boolean;
  notifyOnProximoVencer: boolean;
  notifyOnAtendido: boolean;
  diasAnticipacionVencimiento: number[];
}

@Component({
  selector: 'app-notificaciones-preferencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="preferences-container">
      <h4>Preferencias de Notificaciones</h4>
      
      <div class="preference-section">
        <h5>Canales de Notificación</h5>
        
        <div class="preference-item">
          <label>
            <input type="checkbox" [(ngModel)]="preferences.enableSound" (change)="savePreferences()">
            <span>Sonido de notificación</span>
          </label>
          <p class="help-text">Reproducir sonido cuando llegue una notificación urgente</p>
        </div>
        
        <div class="preference-item">
          <label>
            <input type="checkbox" [(ngModel)]="preferences.enableBrowserNotifications" (change)="handleBrowserNotificationToggle()">
            <span>Notificaciones del navegador</span>
          </label>
          <p class="help-text">Mostrar notificaciones incluso cuando la pestaña no esté activa</p>
          <button class="btn-secondary btn-sm" *ngIf="!browserNotificationPermission" (click)="requestBrowserNotificationPermission()">
            Solicitar permiso
          </button>
        </div>
        
        <div class="preference-item">
          <label>
            <input type="checkbox" [(ngModel)]="preferences.enableEmailNotifications" (change)="savePreferences()">
            <span>Notificaciones por email</span>
          </label>
          <p class="help-text">Recibir resumen diario de notificaciones por correo electrónico</p>
        </div>
      </div>
      
      <div class="preference-section">
        <h5>Tipos de Notificación</h5>
        
        <div class="preference-item">
          <label>
            <input type="checkbox" [(ngModel)]="preferences.notifyOnDerivacion" (change)="savePreferences()">
            <span>Documento derivado a mi área</span>
          </label>
        </div>
        
        <div class="preference-item">
          <label>
            <input type="checkbox" [(ngModel)]="preferences.notifyOnRecepcion" (change)="savePreferences()">
            <span>Documento recibido</span>
          </label>
        </div>
        
        <div class="preference-item">
          <label>
            <input type="checkbox" [(ngModel)]="preferences.notifyOnUrgente" (change)="savePreferences()">
            <span>Documento urgente</span>
          </label>
        </div>
        
        <div class="preference-item">
          <label>
            <input type="checkbox" [(ngModel)]="preferences.notifyOnProximoVencer" (change)="savePreferences()">
            <span>Documento próximo a vencer</span>
          </label>
          
          <div class="sub-options" *ngIf="preferences.notifyOnProximoVencer">
            <p class="help-text">Notificar con anticipación de:</p>
            <div class="checkbox-group">
              <label>
                <input type="checkbox" [checked]="preferences.diasAnticipacionVencimiento.includes(1)" (change)="toggleDiasAnticipacion(1)">
                <span>1 día</span>
              </label>
              <label>
                <input type="checkbox" [checked]="preferences.diasAnticipacionVencimiento.includes(2)" (change)="toggleDiasAnticipacion(2)">
                <span>2 días</span>
              </label>
              <label>
                <input type="checkbox" [checked]="preferences.diasAnticipacionVencimiento.includes(3)" (change)="toggleDiasAnticipacion(3)">
                <span>3 días</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="preference-item">
          <label>
            <input type="checkbox" [(ngModel)]="preferences.notifyOnAtendido" (change)="savePreferences()">
            <span>Documento atendido</span>
          </label>
        </div>
      </div>
      
      <div class="actions">
        <button class="btn-primary" (click)="savePreferences()">Guardar Preferencias</button>
        <button class="btn-secondary" (click)="resetToDefaults()">Restaurar Valores Predeterminados</button>
      </div>
      
      <div class="alert alert-success" *ngIf="showSaveMessage">
        Preferencias guardadas correctamente
      </div>
    </div>
  `,
  styles: [`
    .preferences-container {
      max-width: 600px;
      padding: 20px;
    }
    
    h4 {
      margin-bottom: 24px;
      color: #333;
    }
    
    .preference-section {
      margin-bottom: 32px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .preference-section h5 {
      margin-bottom: 16px;
      color: #555;
      font-size: 16px;
    }
    
    .preference-item {
      margin-bottom: 16px;
    }
    
    .preference-item label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: 500;
    }
    
    .preference-item input[type="checkbox"] {
      margin-right: 8px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    
    .help-text {
      margin: 4px 0 8px 26px;
      font-size: 13px;
      color: #666;
    }
    
    .sub-options {
      margin-left: 26px;
      margin-top: 12px;
      padding: 12px;
      background: white;
      border-radius: 4px;
    }
    
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .checkbox-group label {
      font-weight: normal;
    }
    
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }
    
    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background: #0056b3;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #545b62;
    }
    
    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
      margin-left: 26px;
    }
    
    .alert {
      padding: 12px;
      border-radius: 4px;
      margin-top: 16px;
    }
    
    .alert-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
  `]
})
export class NotificacionesPreferenciasComponent implements OnInit {
  preferences: NotificationPreferences = {
    enableSound: true,
    enableBrowserNotifications: false,
    enableEmailNotifications: false,
    notifyOnDerivacion: true,
    notifyOnRecepcion: true,
    notifyOnUrgente: true,
    notifyOnProximoVencer: true,
    notifyOnAtendido: false,
    diasAnticipacionVencimiento: [1, 2, 3]
  };
  
  browserNotificationPermission = false;
  showSaveMessage = false;
  
  ngOnInit(): void {
    this.loadPreferences();
    this.checkBrowserNotificationPermission();
  }
  
  loadPreferences(): void {
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      try {
        this.preferences = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }
  
  savePreferences(): void {
    localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    this.showSaveMessage = true;
    setTimeout(() => {
      this.showSaveMessage = false;
    }, 3000);
  }
  
  resetToDefaults(): void {
    this.preferences = {
      enableSound: true,
      enableBrowserNotifications: false,
      enableEmailNotifications: false,
      notifyOnDerivacion: true,
      notifyOnRecepcion: true,
      notifyOnUrgente: true,
      notifyOnProximoVencer: true,
      notifyOnAtendido: false,
      diasAnticipacionVencimiento: [1, 2, 3]
    };
    this.savePreferences();
  }
  
  toggleDiasAnticipacion(dias: number): void {
    const index = this.preferences.diasAnticipacionVencimiento.indexOf(dias);
    if (index > -1) {
      this.preferences.diasAnticipacionVencimiento.splice(index, 1);
    } else {
      this.preferences.diasAnticipacionVencimiento.push(dias);
    }
    this.savePreferences();
  }
  
  checkBrowserNotificationPermission(): void {
    if ('Notification' in window) {
      this.browserNotificationPermission = Notification.permission === 'granted';
    }
  }
  
  async requestBrowserNotificationPermission(): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.browserNotificationPermission = permission === 'granted';
      
      if (this.browserNotificationPermission) {
        this.preferences.enableBrowserNotifications = true;
        this.savePreferences();
      }
    }
  }
  
  handleBrowserNotificationToggle(): void {
    if (this.preferences.enableBrowserNotifications && !this.browserNotificationPermission) {
      this.requestBrowserNotificationPermission();
    } else {
      this.savePreferences();
    }
  }
}
