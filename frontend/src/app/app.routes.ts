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
      // DASHBOARD
      { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      
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
      { path: 'resoluciones', redirectTo: 'resoluciones-primigenias', pathMatch: 'full' },
      { path: 'resoluciones/carga-masiva', redirectTo: 'resoluciones-primigenias/carga-masiva', pathMatch: 'full' },
      
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
      
      // TUCS (Tarjetas Únicas de Circulación)
      { path: 'tucs', loadComponent: () => import('./components/tucs/tuc-catalogo.component').then(m => m.TucCatalogoComponent) },

      // INFRAESTRUCTURA COMPLEMENTARIA (Terminales Terrestres, Estaciones de Ruta)
      { path: 'infraestructura', loadComponent: () => import('./components/infraestructura/infraestructura.component').then(m => m.InfraestructuraComponent) },
      { path: 'infraestructura/:id', loadComponent: () => import('./components/infraestructura/infraestructura-detail.component').then(m => m.InfraestructuraDetailComponent) },

      // AUDITORÍA Y TRAZABILIDAD DEL SISTEMA (Control Interno & Fiscalización)
      { path: 'auditoria', loadComponent: () => import('./components/auditoria/auditoria.component').then(m => m.AuditoriaComponent) },
    ]
  },
  
  // PORTAL PÚBLICO VERIFICACIÓN QR (Sin requerir inicio de sesión)
  { path: 'verificar-tuc/:hash', loadComponent: () => import('./components/tucs/verificar-tuc-publico.component').then(m => m.VerificarTucPublicoComponent) },

  { path: '**', redirectTo: '/login' }
];
