import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      console.log('Usuario no autenticado, redirigiendo al login...');
      // Usar replaceUrl para evitar conflictos de navegación
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }
  }
} 