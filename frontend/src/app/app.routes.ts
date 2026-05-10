import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { VehiculosComponent } from './components/vehiculos/vehiculos.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // EMPRESAS
      { path: 'empresas', loadComponent: () => import('./components/empresas/empresas.component').then(m => m.EmpresasComponent) },
      { path: 'empresas/nueva', loadComponent: () => import('./components/empresas/empresa-form.component').then(m => m.EmpresaFormComponent) },
      { path: 'empresas/carga-masiva-google-sheets', loadComponent: () => import('./components/empresas/carga-masiva-empresas.component').then(m => m.CargaMasivaEmpresasComponent) },
      { path: 'empresas/:id', loadComponent: () => import('./components/empresas/empresa-detail.component').then(m => m.EmpresaDetailComponent) },
      { path: 'empresas/:id/editar', loadComponent: () => import('./components/empresas/empresa-form.component').then(m => m.EmpresaFormComponent) },
      
      // RESOLUCIONES
      { path: 'resoluciones', loadComponent: () => import('./components/resoluciones/resoluciones.component').then(m => m.ResolucionesComponent) },
      { path: 'resoluciones/carga-masiva', loadComponent: () => import('./components/resoluciones/carga-masiva-resoluciones.component').then(m => m.CargaMasivaResolucionesComponent) },
      
      // LOCALIDADES
      { path: 'localidades', loadComponent: () => import('./components/localidades/localidades.component').then(m => m.LocalidadesComponent) },
      { path: 'localidades/alias', loadComponent: () => import('./components/localidades/gestionar-alias.component').then(m => m.GestionarAliasComponent) },
      { path: 'localidades/geometrias', loadComponent: () => import('./components/localidades/gestionar-geometrias.component').then(m => m.GestionarGeometriasComponent) },
      
      // RUTAS
      { path: 'rutas', loadComponent: () => import('./components/rutas/rutas.component').then(m => m.RutasComponent) },
      { path: 'rutas/carga-masiva', loadComponent: () => import('./components/rutas/carga-masiva-rutas.component').then(m => m.CargaMasivaRutasComponent) },
      { path: 'rutas/mapa', loadComponent: () => import('./components/rutas/mapa-rutas.component').then(m => m.MapaRutasComponent) },
      
      // VEHÍCULOS
      { path: 'vehiculos', loadComponent: () => import('./components/vehiculos/vehiculos.component').then(m => m.VehiculosComponent) },
      { path: 'vehiculos/carga-masiva', loadComponent: () => import('./components/vehiculos/carga-masiva-vehiculos.component').then(m => m.CargaMasivaVehiculosComponent) },
      { path: 'vehiculos-solo', loadComponent: () => import('./components/vehiculos-solo/vehiculos-solo.component').then(m => m.VehiculosSoloComponent) },
      { path: 'vehiculos-solo/carga-masiva', loadComponent: () => import('./components/vehiculos-solo/carga-masiva-vehiculos-solo.component').then(m => m.CargaMasivaVehiculosSoloComponent) },
      { path: 'historial-vehiculos', loadComponent: () => import('./components/historial-vehiculos/historial-vehiculos.component').then(m => m.HistorialVehiculosComponent) },
      
      // DESHABILITADO - Dashboard
      // { path: 'dashboard', component: DashboardComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
