import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const expectedRoles = route.data['roles'] as Array<string>;
    const userRole = user.rolId || user.rol_id || ''; // Dependiendo de cómo lo reciba el frontend

    if (expectedRoles && expectedRoles.length > 0 && !expectedRoles.includes(userRole)) {
      console.warn(`[RoleGuard] Acceso denegado por rol. Rol esperado: ${expectedRoles}, Rol actual: ${userRole}`);
      this.snackBar.open('No tienes los permisos necesarios para acceder a este módulo.', 'Cerrar', { duration: 4000 });
      this.router.navigate(['/dashboard']);
      return false;
    }

    const moduloRequerido = route.data['modulo'] as string;
    if (moduloRequerido) {
      if (!this.authService.canAccessModule(moduloRequerido)) {
        console.warn(`[RoleGuard] Acceso denegado al módulo: ${moduloRequerido}`);
        this.snackBar.open(`No tienes permisos para acceder al módulo de ${moduloRequerido}.`, 'Cerrar', { duration: 4000 });
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}
