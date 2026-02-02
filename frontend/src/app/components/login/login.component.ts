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
              <img src="assets/logo-test.svg" alt="SIRRET Logo" class="logo-image" (error)="onLogoError($event)">
              <div class="logo-fallback" [style.display]="logoError() ? 'flex' : 'none'">SIRRET</div>
            </div>
            <h1 class="system-title">SIRRET</h1>
            <p class="system-subtitle">Sistema Regional de Registros de Transporte (SIRRET)</p>
            <p class="system-organization">Dirección Regional de Transportes y Comunicaciones - Puno</p>
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
      background: linear-gradient(135deg, #0066ff 0%, #00ccff 50%, #87ceeb 100%);
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
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      animation: float 25s ease-in-out infinite;
    }

    .background-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.05);
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
      width: 160px;
      height: 120px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
      backdrop-filter: blur(15px);
      border: 3px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      padding: 16px;
    }

    .logo-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
    }

    .logo-fallback {
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 900;
      color: white;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      letter-spacing: 2px;
    }

    .logo-text {
      font-size: 32px;
      font-weight: 900;
      color: white;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      letter-spacing: 2px;
    }

    .system-title {
      margin: 0;
      font-size: 48px;
      font-weight: 900;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      letter-spacing: 3px;
      background: linear-gradient(45deg, #ffffff 0%, #e6f3ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .system-subtitle {
      margin: 8px 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      opacity: 0.95;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      letter-spacing: 0.5px;
    }

    .system-organization {
      margin: 0;
      font-size: 14px;
      opacity: 0.85;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      font-style: italic;
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
      background: linear-gradient(135deg, #0066ff 0%, #00ccff 50%, #0099ff 100%);
      transition: all 0.3s ease-in-out;
      box-shadow: 0 4px 15px rgba(0, 102, 255, 0.3);
    }

    .login-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 102, 255, 0.4);
      background: linear-gradient(135deg, #0052cc 0%, #00b3ff 50%, #0080ff 100%);
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
      border-left: 4px solid #0066ff;
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
      color: #0066ff;
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
  logoError = signal(false);

  // Form
  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogoError(event: any): void {
    this.logoError.set(true);
    event.target.style.display = 'none';
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
          // console.log removed for production
          
          // Usar setTimeout para asegurar que el estado se actualice antes de navegar
          setTimeout(() => {
            this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', { duration: 3000 });
            this.router.navigate(['/dashboard'], { replaceUrl: true });
          }, 100);
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error en login::', error);
          
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