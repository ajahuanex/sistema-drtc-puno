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
    const isAuthenticated = this.authService.isAuthenticated();
    const currentUrl = this.router.url;
    
    console.log('AuthGuard - Verificando acceso:', {
      isAuthenticated,
      currentUrl,
      hasToken: !!this.authService.getToken()
    });
    
    if (isAuthenticated) {
      return true;
    } else {
      // Solo redirigir si no estamos ya en login
      if (!currentUrl.includes('/login')) {
        // console.log removed for production
        this.router.navigate(['/login'], { replaceUrl: true });
      }
      return false;
    }
  }
} 