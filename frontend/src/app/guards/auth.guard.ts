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
    const token = this.authService.getToken();
    const user = this.authService.getCurrentUser();
    
    console.log('🔒 AuthGuard - Verificando acceso:', {
      isAuthenticated,
      currentUrl,
      hasToken: !!token,
      hasUser: !!user,
      tokenLength: token?.length || 0
    });
    
    if (isAuthenticated) {
      console.log('✅ AuthGuard - Acceso permitido');
      return true;
    } else {
      console.error('❌ AuthGuard - Acceso denegado, redirigiendo a login');
      // Solo redirigir si no estamos ya en login
      if (!currentUrl.includes('/login')) {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
      return false;
    }
  }
} 