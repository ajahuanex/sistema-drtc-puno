import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { EmpresaVehiculosBatchComponent } from './components/empresas/empresa-vehiculos-batch.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'empresas', loadComponent: () => import('./components/empresas/empresas.component').then(m => m.EmpresasComponent) },
      { path: 'empresas/nueva', loadComponent: () => import('./components/empresas/empresa-form.component').then(m => m.EmpresaFormComponent) },
      { path: 'empresas/:id/editar', loadComponent: () => import('./components/empresas/empresa-form.component').then(m => m.EmpresaFormComponent) },
      { path: 'empresas/:id', loadComponent: () => import('./components/empresas/empresa-detail.component').then(m => m.EmpresaDetailComponent) },
      { path: 'empresas/:id/vehiculos/batch', component: EmpresaVehiculosBatchComponent, canActivate: [AuthGuard] },
      { path: 'vehiculos', loadComponent: () => import('./components/vehiculos/vehiculos.component').then(m => m.VehiculosComponent) },
      { path: 'vehiculos/nuevo', loadComponent: () => import('./components/vehiculos/vehiculo-form.component').then(m => m.VehiculoFormComponent) },
      { path: 'vehiculos/:id', loadComponent: () => import('./components/vehiculos/vehiculo-detail.component').then(m => m.VehiculoDetailComponent) },
      { path: 'vehiculos/:id/editar', loadComponent: () => import('./components/vehiculos/vehiculo-form.component').then(m => m.VehiculoFormComponent) },
      { path: 'conductores', loadComponent: () => import('./components/conductores/conductores.component').then(m => m.ConductoresComponent) },
      { path: 'tucs', loadComponent: () => import('./components/tucs/tucs.component').then(m => m.TucsComponent) },
      { path: 'fiscalizaciones', loadComponent: () => import('./components/fiscalizaciones/fiscalizaciones.component').then(m => m.FiscalizacionesComponent) },
      { path: 'reportes', loadComponent: () => import('./components/reportes/reportes.component').then(m => m.ReportesComponent) },
      { path: 'configuracion', loadComponent: () => import('./components/configuracion/configuracion.component').then(m => m.ConfiguracionComponent) },
      { path: 'ayuda', loadComponent: () => import('./components/ayuda/ayuda.component').then(m => m.AyudaComponent) },
      { path: 'perfil', loadComponent: () => import('./components/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: 'cambiar-contrasena', loadComponent: () => import('./components/cambiar-contrasena/cambiar-contrasena.component').then(m => m.CambiarContrasenaComponent) },
      { path: 'notificaciones', loadComponent: () => import('./components/notificaciones/notificaciones.component').then(m => m.NotificacionesComponent) }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
