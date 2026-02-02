import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocalidadesComponent } from './localidades.component';
import { AdminLocalidadesComponent } from './admin-localidades.component';

const routes: Routes = [
  {
    path: '',
    component: LocalidadesComponent,
    data: { 
      title: 'Localidades',
      breadcrumb: 'Localidades'
    }
  },
  {
    path: 'admin',
    component: AdminLocalidadesComponent,
    data: { 
      title: 'Administración de Localidades',
      breadcrumb: 'Administración'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LocalidadesRoutingModule { }