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
      { path: 'empresas/carga-masiva', loadComponent: () => import('./components/empresas/carga-masiva-empresas.component').then(m => m.CargaMasivaEmpresasComponent) },
      { path: 'empresas/carga-masiva-google-sheets', loadComponent: () => import('./components/empresas/carga-masiva-empresas.component').then(m => m.CargaMasivaEmpresasComponent) },
      { path: 'empresas/:id', loadComponent: () => import('./components/empresas/empresa-detail.component').then(m => m.EmpresaDetailComponent) },
      { path: 'empresas/:id/editar', loadComponent: () => import('./components/empresas/empresa-form.component').then(m => m.EmpresaFormComponent) },
      
      // RESOLUCIONES
      { path: 'resoluciones-primigenias/carga-masiva', loadComponent: () => import('./components/resoluciones-primigenias/carga-masiva-resoluciones-primigenias.component').then(m => m.CargaMasivaResolucionesPrimigeniasComponent) },
      { path: 'resoluciones-primigenias', loadComponent: () => import('./components/resoluciones-primigenias/resoluciones-primigenias.component').then(m => m.ResolucionesPrimigeniasComponent) },
      { path: 'resoluciones-hijas', loadComponent: () => import('./components/resoluciones-hijas/resoluciones-hijas.component').then(m => m.ResolucionesHijasComponent) },
      { path: 'resoluciones', loadComponent: () => import('./components/resoluciones/resoluciones.component').then(m => m.ResolucionesComponent) },
      { path: 'resoluciones/carga-masiva', loadComponent: () => import('./components/resoluciones/carga-masiva-resoluciones.component').then(m => m.CargaMasivaResolucionesComponent) },
      
      // LOCALIDADES
      { path: 'localidades', loadComponent: () => import('./components/localidades/localidades.component').then(m => m.LocalidadesComponent) },
      { path: 'localidades/alias', loadComponent: () => import('./components/localidades/gestionar-alias.component').then(m => m.GestionarAliasComponent) },
      { path: 'localidades/geometrias', loadComponent: () => import('./components/localidades/gestionar-geometrias.component').then(m => m.GestionarGeometriasComponent) },
      
      // RUTAS
      { path: 'rutas', loadComponent: () => import('./components/rutas/rutas.component').then(m => m.RutasComponent) },
      { path: 'rutas/estadisticas', loadComponent: () => import('./components/rutas/rutas-estadisticas.component').then(m => m.RutasEstadisticasComponent) },
      { path: 'rutas/carga-masiva', loadComponent: () => import('./components/rutas/carga-masiva-rutas.component').then(m => m.CargaMasivaRutasComponent) },
      { path: 'rutas/mapa', loadComponent: () => import('./components/rutas/mapa-rutas.component').then(m => m.MapaRutasComponent) },
      
      // VEHÍCULOS
      { path: 'vehiculos', loadComponent: () => import('./components/vehiculos/vehiculos.component').then(m => m.VehiculosComponent) },
      { path: 'vehiculos/carga-masiva', loadComponent: () => import('./components/vehiculos/carga-masiva-vehiculos.component').then(m => m.CargaMasivaVehiculosComponent) },
      { path: 'vehiculos-data', loadComponent: () => import('./components/vehiculos-data/vehiculos-data.component').then(m => m.VehiculosDataComponent) },
      { path: 'vehiculos-data/carga-masiva', loadComponent: () => import('./components/vehiculos-data/carga-masiva-vehiculos-data.component').then(m => m.CargaMasivaVehiculosDataComponent) },
      { path: 'vehiculos-data/carga-masiva-google-sheets', loadComponent: () => import('./components/vehiculos-data/carga-masiva-vehiculos-data.component').then(m => m.CargaMasivaVehiculosDataComponent) },
      { path: 'vehiculos-solo', redirectTo: 'vehiculos-data', pathMatch: 'full' },
      { path: 'vehiculos-solo/carga-masiva', redirectTo: 'vehiculos-data/carga-masiva', pathMatch: 'full' },
      { path: 'vehiculos-empresa', loadComponent: () => import('./components/vehiculos-empresa/vehiculos-empresa.component').then(m => m.VehiculosEmpresaComponent) },
      { path: 'vehiculos-empresa/carga-masiva', loadComponent: () => import('./components/vehiculos-empresa/carga-masiva-vehiculos-empresa.component').then(m => m.CargaMasivaVehiculosEmpresaComponent) },
      { path: 'vehiculos-empresa/carga-masiva-google-sheets', loadComponent: () => import('./components/vehiculos-empresa/carga-masiva-vehiculos-empresa.component').then(m => m.CargaMasivaVehiculosEmpresaComponent) },
      { path: 'historial-vehiculos', loadComponent: () => import('./components/historial-vehiculos/historial-vehiculos.component').then(m => m.HistorialVehiculosComponent) },
      
      // DESHABILITADO - Dashboard
      // { path: 'dashboard', component: DashboardComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
