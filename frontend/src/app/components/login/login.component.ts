import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    MatIconModule
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
                  <mat-error *ngIf="loginForm.get('dni')?.hasError('required')">
                    El DNI es requerido
                  </mat-error>
                  <mat-error *ngIf="loginForm.get('dni')?.hasError('pattern')">
                    El DNI debe tener 8 dígitos
                  </mat-error>
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
                  <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                    La contraseña es requerida
                  </mat-error>
                </mat-form-field>
              </div>

              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      class="login-button"
                      [disabled]="loginForm.invalid || isLoading">
                <mat-icon class="button-icon">{{ isLoading ? 'hourglass_empty' : 'login' }}</mat-icon>
                <span class="button-text">{{ isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión' }}</span>
              </button>
            </form>

            <div class="credentials-info">
              <div class="info-header">
                <mat-icon class="info-icon">info</mat-icon>
                <span>Credenciales de Prueba</span>
              </div>
              <div class="credentials-grid">
                <div class="credential-item">
                  <span class="credential-label">DNI:</span>
                  <span class="credential-value">12345678</span>
                </div>
                <div class="credential-item">
                  <span class="credential-label">Contraseña:</span>
                  <span class="credential-value">password123</span>
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
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .login-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: -1;
    }

    .background-pattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
      animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-20px) rotate(1deg); }
      66% { transform: translateY(-10px) rotate(-1deg); }
    }

    .background-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
    }

    .login-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .login-header {
      text-align: center;
      margin-bottom: 40px;
      color: #fff;
    }

    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }

    .logo-icon {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      padding: 20px;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .logo-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #fff;
    }

    .system-title {
      font-size: 2.5em;
      font-weight: 700;
      margin-bottom: 8px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      letter-spacing: 1px;
    }

    .system-subtitle {
      font-size: 1.1em;
      color: #e0e0e0;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      font-weight: 300;
    }

    .login-form-container {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .form-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 500px;
      padding: 40px;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
      overflow: hidden;
    }

    .form-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #4CAF50, #45a049);
    }

    .form-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .form-title {
      font-size: 2em;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .form-subtitle {
      font-size: 1em;
      color: #7f8c8d;
      margin-bottom: 25px;
      font-weight: 400;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-field-container {
      width: 100%;
    }

    .form-field {
      width: 100%;
    }

    .form-field ::ng-deep .mat-form-field-wrapper {
      padding-bottom: 0;
    }

    .form-field ::ng-deep .mat-form-field-outline {
      border-radius: 12px;
    }

    .form-field ::ng-deep .mat-form-field-outline-thick {
      border-color: #4CAF50;
    }

    .form-field ::ng-deep .mat-form-field-label {
      color: #555;
      font-weight: 500;
    }

    .form-field ::ng-deep .mat-form-field-outline-start,
    .form-field ::ng-deep .mat-form-field-outline-end,
    .form-field ::ng-deep .mat-form-field-outline-gap {
      border-width: 2px;
    }

    .field-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-right: 10px;
      color: #4CAF50;
    }

    .login-button {
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      color: white;
      padding: 16px;
      font-size: 1.1em;
      font-weight: 600;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .login-button:hover {
      background: linear-gradient(135deg, #45a049 0%, #388E3C 100%);
      transform: translateY(-2px);
      box-shadow: 0 12px 25px rgba(76, 175, 80, 0.4);
    }

    .login-button:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
      color: #7f8c8d;
      transform: none;
      box-shadow: none;
    }

    .button-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .button-text {
      font-size: 1em;
      font-weight: 600;
    }

    .credentials-info {
      margin-top: 30px;
      padding-top: 25px;
      border-top: 2px solid #ecf0f1;
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
      color: #2c3e50;
      font-size: 1.1em;
      font-weight: 600;
    }

    .info-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #4CAF50;
    }

    .credentials-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .credential-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95em;
      color: #555;
      padding: 8px 0;
    }

    .credential-label {
      font-weight: 500;
      color: #2c3e50;
    }

    .credential-value {
      font-weight: 600;
      color: #4CAF50;
      font-family: 'Courier New', monospace;
      background: #e8f5e8;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #c8e6c9;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .login-container {
        padding: 10px;
      }

      .login-header {
        margin-bottom: 30px;
      }

      .system-title {
        font-size: 2em;
      }

      .system-subtitle {
        font-size: 0.9em;
      }

      .form-card {
        padding: 30px;
      }

      .form-title {
        font-size: 1.8em;
      }

      .form-subtitle {
        font-size: 0.9em;
      }

      .credentials-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 5px;
      }

      .login-header {
        margin-bottom: 25px;
      }

      .system-title {
        font-size: 1.8em;
      }

      .system-subtitle {
        font-size: 0.8em;
      }

      .logo-icon {
        padding: 15px;
      }

      .logo-icon mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }

      .form-card {
        padding: 25px;
      }

      .form-title {
        font-size: 1.5em;
      }

      .form-subtitle {
        font-size: 0.8em;
      }

      .field-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-right: 8px;
      }

      .button-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .button-text {
        font-size: 0.9em;
      }

      .info-header {
        font-size: 1em;
      }

      .info-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .credential-item {
        font-size: 0.85em;
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

  loginForm: FormGroup;
  isLoading = false;

  constructor() {
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { dni, password } = this.loginForm.value;

      const credentials: LoginRequest = {
        username: dni,
        password: password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', { duration: 3000 });
          // Usar replaceUrl para evitar conflictos de navegación
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error de login:', error);
          this.snackBar.open('Error en el inicio de sesión', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
} 