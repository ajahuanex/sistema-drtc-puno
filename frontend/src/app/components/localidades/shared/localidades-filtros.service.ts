import { Injectable, signal, computed } from '@angular/core';
import { Localidad } from '../../../models/localidad.model';

export interface FiltrosLocalidades {
  texto: string;
  departamento: string;
  provincia: string;
  tipo: string;
  nivel: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalidadesFiltrosService {
  // Signals para filtros
  private filtroTexto = signal('');
  private filtroDepartamento = signal('');
  private filtroProvincia = signal('');
  private filtroTipo = signal('');
  private filtroNivel = signal('');
  private filtroEstado = signal('');

  // Computed para obtener todos los filtros
  filtros = computed((): FiltrosLocalidades => ({
    texto: this.filtroTexto(),
    departamento: this.filtroDepartamento(),
    provincia: this.filtroProvincia(),
    tipo: this.filtroTipo(),
    nivel: this.filtroNivel(),
    estado: this.filtroEstado()
  }));

  // Getters para acceso individual
  get texto() { return this.filtroTexto(); }
  get departamento() { return this.filtroDepartamento(); }
  get provincia() { return this.filtroProvincia(); }
  get tipo() { return this.filtroTipo(); }
  get nivel() { return this.filtroNivel(); }
  get estado() { return this.filtroEstado(); }

  // Setters para actualizar filtros
  setTexto(valor: string) {
    this.filtroTexto.set(valor);
  }

  setDepartamento(valor: string) {
    this.filtroDepartamento.set(valor);
  }

  setProvincia(valor: string) {
    this.filtroProvincia.set(valor);
  }

  setTipo(valor: string) {
    this.filtroTipo.set(valor);
  }

  setNivel(valor: string) {
    this.filtroNivel.set(valor);
  }

  setEstado(valor: string) {
    this.filtroEstado.set(valor);
  }

  // Limpiar todos los filtros
  limpiarFiltros() {
    this.filtroTexto.set('');
    this.filtroDepartamento.set('');
    this.filtroProvincia.set('');
    this.filtroTipo.set('');
    this.filtroNivel.set('');
    this.filtroEstado.set('');
  }

  // Aplicar filtros a una lista de localidades
  aplicarFiltros(localidades: Localidad[]): Localidad[] {
    let filtradas = [...localidades];

    // Filtro por texto
    const textoFiltro = this.filtroTexto();
    if (textoFiltro && textoFiltro.trim()) {
      const texto = textoFiltro.toLowerCase();
      filtradas = filtradas.filter(l => 
        l.nombre?.toLowerCase().includes(texto) ||
        l.departamento?.toLowerCase().includes(texto) ||
        l.provincia?.toLowerCase().includes(texto) ||
        l.distrito?.toLowerCase().includes(texto)
      );
    }

    // Filtro por departamento
    const departamentoFiltro = this.filtroDepartamento();
    if (departamentoFiltro) {
      if (departamentoFiltro === 'OTROS') {
        // Filtrar localidades que no tengan datos completos de ubicación
        filtradas = filtradas.filter(l => 
          // Sin departamento o departamento vacío
          (!l.departamento || l.departamento.trim() === '') ||
          // Sin provincia o provincia vacía
          (!l.provincia || l.provincia.trim() === '') ||
          // Sin distrito o distrito vacío
          (!l.distrito || l.distrito.trim() === '')
        );
      } else {
        filtradas = filtradas.filter(l => l.departamento === departamentoFiltro);
      }
    }

    // Filtro por provincia
    const provinciaFiltro = this.filtroProvincia();
    if (provinciaFiltro) {
      filtradas = filtradas.filter(l => l.provincia === provinciaFiltro);
    }

    // Filtro por tipo
    const tipoFiltro = this.filtroTipo();
    if (tipoFiltro) {
      filtradas = filtradas.filter(l => l.tipo === tipoFiltro);
    }

    // Filtro por nivel territorial
    const nivelFiltro = this.filtroNivel();
    if (nivelFiltro) {
      filtradas = filtradas.filter(l => l.nivel_territorial === nivelFiltro);
    }

    // Filtro por estado
    const estadoFiltro = this.filtroEstado();
    if (estadoFiltro !== '') {
      const estado = estadoFiltro === 'true';
      filtradas = filtradas.filter(l => l.estaActiva === estado);
    }

    return filtradas;
  }

  // Búsqueda jerárquica inteligente
  busquedaJerarquica(localidades: Localidad[], termino: string): Localidad[] {
    if (!termino || !termino.trim()) {
      return localidades.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    }

    const texto = termino.toLowerCase().trim();
    
    const localidadesConPuntaje = localidades.map(l => {
      let puntaje = 0;
      let coincide = false;
      let esJerarquico = false;

      // Coincidencia exacta en nombre (máxima prioridad)
      if (l.nombre && l.nombre.toLowerCase() === texto) {
        puntaje += 1000;
        coincide = true;
      }
      // Coincidencia parcial en nombre
      else if (l.nombre && l.nombre.toLowerCase().includes(texto)) {
        puntaje += 500;
        coincide = true;
      }

      // Búsqueda jerárquica por departamento
      if (l.departamento && l.departamento.toLowerCase() === texto) {
        if (l.tipo === 'DEPARTAMENTO') {
          puntaje += 1000 + 50;
          coincide = true;
        } else if (l.tipo === 'PROVINCIA') {
          puntaje += 800 + 40;
          coincide = true;
          esJerarquico = true;
        } else if (l.tipo === 'DISTRITO') {
          puntaje += 200 + 30;
          coincide = true;
          esJerarquico = true;
        }
      }

      // Búsqueda jerárquica por provincia
      if (l.provincia && l.provincia.toLowerCase() === texto) {
        if (l.tipo === 'PROVINCIA') {
          puntaje += 1000 + 40;
          coincide = true;
        } else if (l.tipo === 'DISTRITO') {
          puntaje += 700 + 30;
          coincide = true;
          esJerarquico = true;
        } else if (['CENTRO_POBLADO', 'PUEBLO', 'LOCALIDAD', 'CIUDAD'].includes(l.tipo || '')) {
          puntaje += 400 + 20;
          coincide = true;
          esJerarquico = true;
        }
      }

      // Búsqueda jerárquica por distrito
      if (l.distrito && l.distrito.toLowerCase() === texto) {
        if (l.tipo === 'DISTRITO') {
          puntaje += 1000 + 30;
          coincide = true;
        } else if (['CENTRO_POBLADO', 'PUEBLO', 'LOCALIDAD', 'CIUDAD'].includes(l.tipo || '')) {
          puntaje += 600 + 20;
          coincide = true;
          esJerarquico = true;
        }
      }

      // Coincidencias parciales en ubicación
      if (!coincide) {
        if (l.departamento && l.departamento.toLowerCase().includes(texto)) {
          puntaje += 100;
          coincide = true;
        }
        if (l.provincia && l.provincia.toLowerCase().includes(texto)) {
          puntaje += 80;
          coincide = true;
        }
        if (l.distrito && l.distrito.toLowerCase().includes(texto)) {
          puntaje += 60;
          coincide = true;
        }
        if (l.ubigeo && l.ubigeo.includes(texto)) {
          puntaje += 40;
          coincide = true;
        }
      }

      // Bonificación por jerarquía territorial
      if (coincide && !esJerarquico) {
        const jerarquia = this.getJerarquiaNumerica(l.tipo);
        puntaje += jerarquia * 5;
      }

      return { localidad: l, puntaje, coincide, esJerarquico };
    })
    .filter(item => item.coincide)
    .sort((a, b) => {
      if (b.puntaje !== a.puntaje) {
        return b.puntaje - a.puntaje;
      }
      
      const jerarquiaA = this.getJerarquiaNumerica(a.localidad.tipo);
      const jerarquiaB = this.getJerarquiaNumerica(b.localidad.tipo);
      if (jerarquiaB !== jerarquiaA) {
        return jerarquiaB - jerarquiaA;
      }
      
      return (a.localidad.nombre || '').localeCompare(b.localidad.nombre || '');
    });

    return localidadesConPuntaje.map(item => item.localidad);
  }

  private getJerarquiaNumerica(tipo?: string): number {
    switch (tipo) {
      case 'DEPARTAMENTO': return 7;
      case 'PROVINCIA': return 6;
      case 'DISTRITO': return 5;
      case 'CIUDAD': return 4;
      case 'CENTRO_POBLADO': return 3;
      case 'PUEBLO': return 2;
      case 'LOCALIDAD': return 1;
      default: return 0;
    }
  }
}