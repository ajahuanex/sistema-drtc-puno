import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LoginRequest } from '../../models/usuario.model';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  public themeService = inject(ThemeService);

  // Estados Reactivos
  isLoading = signal(false);
  showPassword = signal(false);
  selectedRole = signal<'personal' | 'inspector' | 'empresa'>('personal');
  docType = signal<'DNI' | 'CE' | 'RUC' | 'PASAPORTE'>('DNI');
  captchaCode = signal<string>('K7X');
  captchaInput = signal<string>('');
  rememberMe = signal<boolean>(true);
  sedeSeleccionada = signal<string>('Sede Central Puno - Dirección de Circulación Terrestre');

  // Formulario reactivo
  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8,11}$/)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    this.generateCaptcha();
  }

  generateCaptcha(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.captchaCode.set(code);
    this.captchaInput.set('');
  }

  setRole(role: 'personal' | 'inspector' | 'empresa'): void {
    this.selectedRole.set(role);
    if (role === 'empresa') {
      this.onDocTypeChange('RUC');
    } else {
      this.onDocTypeChange('DNI');
    }
  }

  onDocTypeChange(type: 'DNI' | 'CE' | 'RUC' | 'PASAPORTE'): void {
    this.docType.set(type);
    const dniControl = this.loginForm.get('dni');
    if (type === 'RUC') {
      dniControl?.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);
    } else if (type === 'DNI') {
      dniControl?.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
    } else {
      dniControl?.setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9]{6,12}$/)]);
    }
    dniControl?.updateValueAndValidity();
  }

  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      dni: '12345678',
      password: 'admin'
    });
    this.captchaInput.set(this.captchaCode());
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Validar Captcha si fue ingresado
    if (this.captchaInput() && this.captchaInput().trim().toUpperCase() !== this.captchaCode()) {
      this.snackBar.open('Código de verificación Captcha incorrecto', 'Cerrar', { duration: 3000 });
      this.generateCaptcha();
      return;
    }

    this.isLoading.set(true);

    const loginRequest: LoginRequest = {
      username: this.loginForm.get('dni')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(loginRequest).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Acceso concedido al sistema SIRRETT', 'Cerrar', { duration: 2500 });
        setTimeout(() => {
          this.router.navigate(['/empresas'], { replaceUrl: true });
        }, 100);
      },
      error: (error) => {
        this.isLoading.set(false);
        let errorMessage = 'Credenciales no autorizadas';
        if (error.status === 401) {
          errorMessage = 'DNI o contraseña incorrectos';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar al servidor DRTC Puno';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        }
        this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
      }
    });
  }
}