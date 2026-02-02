import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { EmpresaVehiculosBatchComponent } from './components/empresas/empresa-vehiculos-batch.component';
import { VehiculosComponent } from './components/vehiculos/vehiculos.component';
import { VehiculosConsolidadoComponent } from './components/vehiculos/vehiculos-consolidado.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      // RUTAS DE EMPRESAS - CONSOLIDADAS
      { path: 'empresas', loadComponent: () => import('./components/empresas/empresas.component').then(m => m.EmpresasComponent) },
      { path: 'empresas/consolidado', loadComponent: () => import('./components/empresas/empresas-consolidado.component').then(m => m.EmpresasConsolidadoComponent) },
      { path: 'empresas/legacy', loadComponent: () => import('./components/empresas/empresas.component').then(m => m.EmpresasComponent) }, // Mantener versión anterior temporalmente
      { path: 'empresas/carga-masiva', loadComponent: () => import('./components/empresas/carga-masiva-empresas.component').then(m => m.CargaMasivaEmpresasComponent) },
      { path: 'empresas/nueva', loadComponent: () => import('./components/empresas/empresa-form.component').then(m => m.EmpresaFormComponent) },
      { path: 'empresas/:id/editar', loadComponent: () => import('./components/empresas/empresa-form.component').then(m => m.EmpresaFormComponent) },
      { path: 'empresas/:id', loadComponent: () => import('./components/empresas/empresa-detail.component').then(m => m.EmpresaDetailComponent) },
      { path: 'empresas/:id/transferencias', loadComponent: () => import('./components/empresas/historial-transferencias-empresa.component').then(m => m.HistorialTransferenciasEmpresaComponent) },
      { path: 'empresas/:id/bajas-vehiculos', loadComponent: () => import('./components/bajas-vehiculos/bajas-vehiculos.component').then(m => m.BajasVehiculosComponent) },
      { path: 'bajas-vehiculos', loadComponent: () => import('./components/bajas-vehiculos/bajas-vehiculos.component').then(m => m.BajasVehiculosComponent) },
      { path: 'empresas/:id/vehiculos/batch', component: EmpresaVehiculosBatchComponent, canActivate: [AuthGuard] },
      { path: 'empresas/dashboard', loadComponent: () => import('./components/empresas/dashboard-empresas.component').then(m => m.DashboardEmpresasComponent) },
      
      // RUTAS DE VEHÍCULOS - CONSOLIDADAS
      { path: 'vehiculos', component: VehiculosConsolidadoComponent },
      { path: 'vehiculos/legacy', component: VehiculosComponent }, // Mantener versión anterior temporalmente
      { path: 'vehiculos/carga-masiva', loadComponent: () => import('./components/vehiculos/carga-masiva-vehiculos.component').then(m => m.CargaMasivaVehiculosComponent) },
      { path: 'vehiculos/nuevo', loadComponent: () => import('./components/vehiculos/vehiculo-form.component').then(m => m.VehiculoFormComponent) },
      { path: 'vehiculos/solicitudes-baja', loadComponent: () => import('./components/vehiculos/solicitudes-baja.component').then(m => m.SolicitudesBajaComponent) },
      { path: 'vehiculos/:id', loadComponent: () => import('./components/vehiculos/vehiculo-detalle.component').then(m => m.VehiculoDetalleComponent) },
      { path: 'vehiculos/:id/editar', loadComponent: () => import('./components/vehiculos/vehiculo-form.component').then(m => m.VehiculoFormComponent) },
      { path: 'vehiculos/:id/historial', loadComponent: () => import('./components/vehiculos/historial-vehicular.component').then(m => m.HistorialVehicularComponent) },
      { path: 'historial-vehiculos', loadComponent: () => import('./components/vehiculos/historial-vehicular.component').then(m => m.HistorialVehicularComponent) },
      { path: 'conductores', loadComponent: () => import('./components/conductores/conductores.component').then(m => m.ConductoresComponent) },
      { path: 'conductores/nuevo', loadComponent: () => import('./components/conductores/conductor-form.component').then(m => m.ConductorFormComponent) },
      { path: 'conductores/:id', loadComponent: () => import('./components/conductores/conductor-detail.component').then(m => m.ConductorDetailComponent) },
      { path: 'conductores/:id/editar', loadComponent: () => import('./components/conductores/conductor-form.component').then(m => m.ConductorFormComponent) },
      { path: 'rutas', loadComponent: () => import('./components/rutas/rutas.component').then(m => m.RutasComponent) },
      { path: 'rutas/carga-masiva', loadComponent: () => import('./components/rutas/carga-masiva-rutas.component').then(m => m.CargaMasivaRutasComponent) },
      { path: 'rutas/nuevo', loadComponent: () => import('./components/rutas/ruta-form.component').then(m => m.RutaFormComponent) },
      { path: 'rutas/:id', loadComponent: () => import('./components/rutas/ruta-detail.component').then(m => m.RutaDetailComponent) },
      { path: 'rutas/:id/editar', loadComponent: () => import('./components/rutas/ruta-form.component').then(m => m.RutaFormComponent) },
      { path: 'localidades', loadComponent: () => import('./components/localidades/localidades.component').then(m => m.LocalidadesComponent) },
      { path: 'resoluciones', loadComponent: () => import('./components/resoluciones/resoluciones-minimal.component').then(m => m.ResolucionesMinimalComponent) },
      { path: 'resoluciones/carga-masiva', loadComponent: () => import('./components/resoluciones/carga-masiva-resoluciones.component').then(m => m.CargaMasivaResolucionesComponent) },
      { path: 'resoluciones/carga-masiva-padres', loadComponent: () => import('./components/resoluciones/carga-masiva-resoluciones-padres.component').then(m => m.CargaMasivaResolucionesPadresComponent) },
      { path: 'resoluciones/nuevo', loadComponent: () => import('./components/resoluciones/crear-resolucion.component').then(m => m.CrearResolucionComponent) },
      { path: 'resoluciones/:id', loadComponent: () => import('./components/resoluciones/resolucion-detail.component').then(m => m.ResolucionDetailComponent) },
      { path: 'resoluciones/:id/editar', loadComponent: () => import('./components/resoluciones/crear-resolucion.component').then(m => m.CrearResolucionComponent) },
      { path: 'resoluciones/:id/bajas-vehiculares', loadComponent: () => import('./components/resoluciones/gestion-bajas-resolucion.component').then(m => m.GestionBajasResolucionComponent) },
      { path: 'expedientes', loadComponent: () => import('./components/expedientes/expedientes.component').then(m => m.ExpedientesComponent) },
      { path: 'expedientes/carga-masiva', loadComponent: () => import('./components/expedientes/carga-masiva-expedientes.component').then(m => m.CargaMasivaExpedientesComponent) },
      { path: 'expedientes/nuevo', loadComponent: () => import('./components/expedientes/expediente-form.component').then(m => m.ExpedienteFormComponent) },
      { path: 'expedientes/:id', loadComponent: () => import('./components/expedientes/expediente-detail.component').then(m => m.ExpedienteDetailComponent) },
      { path: 'expedientes/:id/editar', loadComponent: () => import('./components/expedientes/expediente-form.component').then(m => m.ExpedienteFormComponent) },
      { path: 'mesa-partes', loadComponent: () => import('./components/mesa-partes/mesa-partes.component').then(m => m.MesaPartesComponent) },
      { path: 'oficinas', loadComponent: () => import('./components/oficinas/oficinas.component').then(m => m.OficinasComponent) },
      { path: 'oficinas/nueva', loadComponent: () => import('./components/oficinas/oficina-form.component').then(m => m.OficinaFormComponent) },
      { path: 'oficinas/:id', loadComponent: () => import('./components/oficinas/oficina-detail.component').then(m => m.OficinaDetailComponent) },
      { path: 'oficinas/:id/editar', loadComponent: () => import('./components/oficinas/oficina-form.component').then(m => m.OficinaFormComponent) },
      { path: 'oficinas/:id/expedientes', loadComponent: () => import('./components/oficinas/oficina-expedientes.component').then(m => m.OficinaExpedientesComponent) },
              { path: 'oficinas/:id/flujo', loadComponent: () => import('./components/oficinas/flujo-expedientes.component').then(m => m.FlujoExpedientesComponent) },
        { path: 'oficinas/flujo', loadComponent: () => import('./components/oficinas/flujo-general-expedientes.component').then(m => m.FlujoGeneralExpedientesComponent) },
      { path: 'tucs', loadComponent: () => import('./components/tucs/tucs.component').then(m => m.TucsComponent) },
      { path: 'tucs/:id', loadComponent: () => import('./components/tucs/tuc-detail.component').then(m => m.TucDetailComponent) },
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
