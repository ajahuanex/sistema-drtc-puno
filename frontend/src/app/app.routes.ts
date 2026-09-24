import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
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
      { 
        path: 'dashboard', 
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'dashboard' }
      },
      
      // EMPRESAS
      { 
        path: 'empresas', 
        loadComponent: () => import('./components/empresas/empresas.component').then(m => m.EmpresasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'empresas' }
      },
      { 
        path: 'empresas/nueva', 
        loadComponent: () => import('./components/empresas/empresa-form.component').then(m => m.EmpresaFormComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'empresas' }
      },
      { 
        path: 'empresas/carga-masiva', 
        loadComponent: () => import('./components/empresas/carga-masiva-empresas.component').then(m => m.CargaMasivaEmpresasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'empresas' }
      },
      { 
        path: 'empresas/carga-masiva-google-sheets', 
        loadComponent: () => import('./components/empresas/carga-masiva-empresas.component').then(m => m.CargaMasivaEmpresasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'empresas' }
      },
      { 
        path: 'empresas/:id', 
        loadComponent: () => import('./components/empresas/empresa-detail.component').then(m => m.EmpresaDetailComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'empresas' }
      },
      { 
        path: 'empresas/:id/editar', 
        loadComponent: () => import('./components/empresas/empresa-form.component').then(m => m.EmpresaFormComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'empresas' }
      },
      
      // RESOLUCIONES
      { 
        path: 'resoluciones-primigenias/carga-masiva', 
        loadComponent: () => import('./components/resoluciones-primigenias/carga-masiva-resoluciones-primigenias.component').then(m => m.CargaMasivaResolucionesPrimigeniasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'resoluciones' }
      },
      { 
        path: 'resoluciones-primigenias', 
        loadComponent: () => import('./components/resoluciones-primigenias/resoluciones-primigenias.component').then(m => m.ResolucionesPrimigeniasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'resoluciones' }
      },
      { 
        path: 'resoluciones-hijas', 
        loadComponent: () => import('./components/resoluciones-hijas/resoluciones-hijas.component').then(m => m.ResolucionesHijasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'resoluciones' }
      },
      { 
        path: 'configuracion', 
        loadComponent: () => import('./components/configuracion/configuracion-layout.component').then(m => m.ConfiguracionLayoutComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'configuracion', roles: ['oti', 'admin'] }
      },
      { 
        path: 'resoluciones', 
        loadComponent: () => import('./components/resoluciones/resoluciones.component').then(m => m.ResolucionesComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'resoluciones' }
      },
      { 
        path: 'resoluciones/carga-masiva', 
        loadComponent: () => import('./components/resoluciones/carga-masiva-resoluciones.component').then(m => m.CargaMasivaResolucionesComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'resoluciones' }
      },
      
      // LOCALIDADES
      { 
        path: 'localidades', 
        loadComponent: () => import('./components/localidades/localidades.component').then(m => m.LocalidadesComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'localidades' }
      },
      { 
        path: 'localidades/alias', 
        loadComponent: () => import('./components/localidades/gestionar-alias.component').then(m => m.GestionarAliasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'localidades' }
      },
      { 
        path: 'localidades/geometrias', 
        loadComponent: () => import('./components/localidades/gestionar-geometrias.component').then(m => m.GestionarGeometriasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'localidades' }
      },
      
      // RUTAS
      { 
        path: 'rutas', 
        loadComponent: () => import('./components/rutas/rutas.component').then(m => m.RutasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'rutas' }
      },
      { 
        path: 'rutas/estadisticas', 
        loadComponent: () => import('./components/rutas/rutas-estadisticas.component').then(m => m.RutasEstadisticasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'rutas' }
      },
      { 
        path: 'rutas/carga-masiva', 
        loadComponent: () => import('./components/rutas/carga-masiva-rutas.component').then(m => m.CargaMasivaRutasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'rutas' }
      },
      { 
        path: 'rutas/mapa', 
        loadComponent: () => import('./components/rutas/mapa-rutas.component').then(m => m.MapaRutasComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'rutas' }
      },
      
      // VEHÍCULOS
      { 
        path: 'vehiculos', 
        loadComponent: () => import('./components/vehiculos/vehiculos.component').then(m => m.VehiculosComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'vehiculos' }
      },
      { 
        path: 'vehiculos/carga-masiva', 
        redirectTo: 'vehiculos-empresa/carga-masiva',
        pathMatch: 'full'
      },
      { 
        path: 'vehiculos-data', 
        loadComponent: () => import('./components/vehiculos-data/vehiculos-data.component').then(m => m.VehiculosDataComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'vehiculos' }
      },
      { 
        path: 'vehiculos-data/carga-masiva', 
        loadComponent: () => import('./components/vehiculos-data/carga-masiva-vehiculos-data.component').then(m => m.CargaMasivaVehiculosDataComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'vehiculos' }
      },
      { 
        path: 'vehiculos-data/carga-masiva-google-sheets', 
        loadComponent: () => import('./components/vehiculos-data/carga-masiva-vehiculos-data.component').then(m => m.CargaMasivaVehiculosDataComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'vehiculos' }
      },
      { path: 'vehiculos-solo', redirectTo: 'vehiculos-data', pathMatch: 'full' },
      { path: 'vehiculos-solo/carga-masiva', redirectTo: 'vehiculos-data/carga-masiva', pathMatch: 'full' },
      { 
        path: 'vehiculos-empresa', 
        loadComponent: () => import('./components/vehiculos-empresa/vehiculos-empresa.component').then(m => m.VehiculosEmpresaComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'vehiculos' }
      },
      { 
        path: 'vehiculos-empresa/carga-masiva', 
        loadComponent: () => import('./components/vehiculos-empresa/carga-masiva-vehiculos-empresa.component').then(m => m.CargaMasivaVehiculosEmpresaComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'vehiculos' }
      },
      { 
        path: 'vehiculos-empresa/carga-masiva-google-sheets', 
        loadComponent: () => import('./components/vehiculos-empresa/carga-masiva-vehiculos-empresa.component').then(m => m.CargaMasivaVehiculosEmpresaComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'vehiculos' }
      },
      
      // TUCS (Tarjetas Únicas de Circulación)
      { 
        path: 'tucs', 
        loadComponent: () => import('./components/tucs/tuc-catalogo.component').then(m => m.TucCatalogoComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'tucs' }
      },

      // INFRAESTRUCTURA COMPLEMENTARIA (Terminales Terrestres, Estaciones de Ruta)
      { 
        path: 'infraestructura', 
        loadComponent: () => import('./components/infraestructura/infraestructura.component').then(m => m.InfraestructuraComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'infraestructura' }
      },
      { 
        path: 'infraestructura/:id', 
        loadComponent: () => import('./components/infraestructura/infraestructura-detail.component').then(m => m.InfraestructuraDetailComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'infraestructura' }
      },
      // Alias para navegación directa a Terminales Terrestres
      { path: 'terminales', redirectTo: 'infraestructura', pathMatch: 'full' },
      { path: 'terminales-terrestres', redirectTo: 'infraestructura', pathMatch: 'full' },
      { path: 'terminales/:id', redirectTo: 'infraestructura/:id', pathMatch: 'full' },


      // AUDITORÍA Y TRAZABILIDAD DEL SISTEMA (Control Interno & Fiscalización)
      { 
        path: 'auditoria', 
        loadComponent: () => import('./components/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'auditoria' }
      },
      
      // MÓDULO DE BAJAS EXTERNAS (MTC, etc)
      { 
        path: 'bajas-externas', 
        loadComponent: () => import('./components/bajas-externas/bajas-externas-list/bajas-externas-list.component').then(m => m.BajasExternasListComponent),
        canActivate: [RoleGuard],
        data: { modulo: 'vehiculos' }
      },

      // CENTRO DE TRAMITES
      { 
        path: 'centro-tramites', 
        loadComponent: () => import('./components/centro-tramites/centro-tramites.component').then(m => m.CentroTramites),
        canActivate: [RoleGuard],
        data: { modulo: 'resoluciones' }
      },
    ]
  },
  
  // PORTAL PÚBLICO VERIFICACIÓN QR (Sin requerir inicio de sesión)
  { path: 'verificar-tuc/:hash', loadComponent: () => import('./components/tucs/verificar-tuc-publico.component').then(m => m.VerificarTucPublicoComponent) },

  { path: '**', redirectTo: '/login' }
];
