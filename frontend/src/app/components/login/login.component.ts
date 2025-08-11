import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/usuario.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <div class="login-background">
        <div class="background-pattern"></div>
        <div class="background-overlay"></div>
      </div>
      
      <div class="login-content">
        <div class="login-header">
          <div class="logo-container">
            <div class="logo-icon">
              <mat-icon>admin_panel_settings</mat-icon>
            </div>
            <h1 class="system-title">Sistema DRTC Puno</h1>
            <p class="system-subtitle">Dirección Regional de Transportes y Comunicaciones</p>
          </div>
        </div>

        <div class="login-form-container">
          <div class="form-card">
            <div class="form-header">
              <h2 class="form-title">Iniciar Sesión</h2>
              <p class="form-subtitle">Ingrese sus credenciales para acceder al sistema</p>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
              <div class="form-field-container">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>
                    <mat-icon class="field-icon">person</mat-icon>
                    DNI
                  </mat-label>
                  <input matInput 
                         formControlName="dni" 
                         placeholder="12345678"
                         maxlength="8"
                         type="text"
                         required>
                  @if (loginForm.get('dni')?.hasError('required') && loginForm.get('dni')?.touched) {
                    <mat-error>El DNI es requerido</mat-error>
                  }
                  @if (loginForm.get('dni')?.hasError('pattern') && loginForm.get('dni')?.touched) {
                    <mat-error>El DNI debe tener 8 dígitos</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-field-container">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>
                    <mat-icon class="field-icon">lock</mat-icon>
                    Contraseña
                  </mat-label>
                  <input matInput 
                         formControlName="password" 
                         placeholder="Ingrese su contraseña"
                         type="password"
                         required>
                  @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                    <mat-error>La contraseña es requerida</mat-error>
                  }
                </mat-form-field>
              </div>

              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      class="login-button"
                      [disabled]="loginForm.invalid || isLoading()">
                @if (isLoading()) {
                  <ng-container>
                    <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                    <span class="button-text">Iniciando Sesión...</span>
                  </ng-container>
                } @else {
                  <ng-container>
                    <mat-icon class="button-icon">login</mat-icon>
                    <span class="button-text">Iniciar Sesión</span>
                  </ng-container>
                }
              </button>
            </form>

            <div class="credentials-info">
              <div class="info-card">
                <div class="info-header">
                  <mat-icon class="info-icon">info</mat-icon>
                  <span class="info-title">Credenciales de Prueba</span>
                </div>
                <div class="info-content">
                  <div class="credential-item">
                    <span class="credential-label">DNI:</span>
                    <span class="credential-value">12345678</span>
                  </div>
                  <div class="credential-item">
                    <span class="credential-label">Contraseña:</span>
                    <span class="credential-value">admin123</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
    }

    .login-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
    }

    .background-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
      animation: float 20s ease-in-out infinite;
    }

    .background-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    .login-content {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 48px;
    }

    .login-header {
      text-align: center;
      color: white;
    }

    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .logo-icon mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: white;
    }

    .system-title {
      margin: 0;
      font-size: 36px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .system-subtitle {
      margin: 0;
      font-size: 18px;
      opacity: 0.9;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .login-form-container {
      width: 100%;
      max-width: 400px;
    }

    .form-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 32px;
      backdrop-filter: blur(10px);
    }

    .form-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .form-title {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
    }

    .form-subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-field-container {
      position: relative;
    }

    .form-field {
      width: 100%;
    }

    .field-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
      color: #6c757d;
    }

    .login-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 48px;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transition: all 0.2s ease-in-out;
    }

    .login-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .login-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .button-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    .button-text {
      font-size: 14px;
      font-weight: 600;
    }

    .credentials-info {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e9ecef;
    }

    .info-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      border-left: 4px solid #667eea;
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #667eea;
    }

    .info-title {
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .credential-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .credential-label {
      font-weight: 500;
      color: #6c757d;
      font-size: 12px;
    }

    .credential-value {
      font-weight: 600;
      color: #2c3e50;
      font-size: 12px;
      background: #e9ecef;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .login-content {
        padding: 16px;
        gap: 32px;
      }

      .system-title {
        font-size: 28px;
      }

      .system-subtitle {
        font-size: 16px;
      }

      .form-card {
        padding: 24px;
      }

      .form-title {
        font-size: 20px;
      }
    }

    @media (max-width: 480px) {
      .login-content {
        padding: 12px;
      }

      .form-card {
        padding: 20px;
      }

      .system-title {
        font-size: 24px;
      }

      .system-subtitle {
        font-size: 14px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Signals
  isLoading = signal(false);

  // Form
  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      
      const loginRequest: LoginRequest = {
        username: this.loginForm.get('dni')?.value,
        password: this.loginForm.get('password')?.value
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error en login:', error);
          
          let errorMessage = 'Error al iniciar sesión';
          if (error.status === 401) {
            errorMessage = 'Credenciales incorrectas';
          } else if (error.status === 0) {
            errorMessage = 'No se puede conectar al servidor';
          } else if (error.error?.detail) {
            errorMessage = error.error.detail;
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
} 