import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { Observable, map, startWith, BehaviorSubject, combineLatest } from 'rxjs';

import { Localidad, LocalidadCreate, LocalidadUpdate, TipoLocalidad } from '../../models/localidad.model';
import { LocalidadService } from '../../services/localidad.service';

@Component({
  selector: 'app-localidad-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatExpansionModule
  ],
  templateUrl: './localidad-modal.component.html',
  styleUrls: ['./localidad-modal.component.scss']
})
export class LocalidadModalComponent implements OnInit, OnChanges {
  @Input() localidad: Localidad | null = null;
  @Input() esEdicion: boolean = false;
  @Output() guardar = new EventEmitter<LocalidadCreate | LocalidadUpdate>();
  @Output() cancelar = new EventEmitter<void>();

  @HostBinding('class.modal-active') modalActive = true;

  formulario!: FormGroup;
  guardando = false;
  tipoSeleccionado = 'PUEBLO';
  cargandoOpciones = false;

  // Opciones dinámicas para selectores
  departamentosDisponibles: string[] = [];
  provinciasDisponibles: string[] = [];
  distritosDisponibles: string[] = [];

  // Controles para autocomplete con búsqueda
  provinciaControl = new FormControl('');
  distritoControl = new FormControl('');
  
  // BehaviorSubjects para manejar las opciones reactivamente
  private provinciasSubject = new BehaviorSubject<string[]>([]);
  private distritosSubject = new BehaviorSubject<string[]>([]);
  
  // Observables para opciones filtradas
  provinciasFiltradas!: Observable<string[]>;
  distritosFiltrados!: Observable<string[]>;

  // Opciones disponibles para el select
  tiposLocalidad = [
    { value: 'DEPARTAMENTO', label: 'Departamento' },
    { value: 'PROVINCIA', label: 'Provincia' },
    { value: 'DISTRITO', label: 'Distrito' },
    { value: 'CIUDAD', label: 'Ciudad' },
    { value: 'PUEBLO', label: 'Pueblo' },
    { value: 'LOCALIDAD', label: 'Localidad' },
    { value: 'CENTRO_POBLADO', label: 'Centro Poblado' }
  ];

  constructor(
    private fb: FormBuilder,
    private localidadService: LocalidadService
  ) {
    this.inicializarFormulario();
    this.inicializarAutocomplete();
  }

  private inicializarAutocomplete() {
    // console.log removed for production
    
    // Configurar filtrado reactivo para provincias
    this.provinciasFiltradas = combineLatest([
      this.provinciaControl.valueChanges.pipe(startWith('')),
      this.provinciasSubject.asObservable()
    ]).pipe(
      map(([searchTerm, opciones]) => {
        const filtradas = this.filtrarOpciones(searchTerm || '', opciones);
        // console.log removed for production
        return filtradas;
      })
    );

    // Configurar filtrado reactivo para distritos
    this.distritosFiltrados = combineLatest([
      this.distritoControl.valueChanges.pipe(startWith('')),
      this.distritosSubject.asObservable()
    ]).pipe(
      map(([searchTerm, opciones]) => {
        const filtradas = this.filtrarOpciones(searchTerm || '', opciones);
        // console.log removed for production
        return filtradas;
      })
    );

    // Sincronizar con el formulario principal
    this.provinciaControl.valueChanges.subscribe(value => {
      // console.log removed for production
      if (value && this.provinciasDisponibles.includes(value)) {
        this.formulario.patchValue({ provincia: value });
      }
    });

    this.distritoControl.valueChanges.subscribe(value => {
      // console.log removed for production
      if (value && this.distritosDisponibles.includes(value)) {
        this.formulario.patchValue({ distrito: value });
      }
    });
  }

  private filtrarOpciones(valor: string, opciones: string[]): string[] {
    if (!opciones || opciones.length === 0) {
      // console.log removed for production
      return [];
    }
    
    if (!valor || valor.trim() === '') {
      // console.log removed for production
      return opciones;
    }
    
    const filtro = valor.toLowerCase().trim();
    const resultado = opciones.filter(opcion => 
      opcion.toLowerCase().includes(filtro)
    );
    
    // console.log removed for production
    return resultado;
  }

  // Método para actualizar las opciones disponibles
  private actualizarOpciones() {
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    
    this.provinciasSubject.next(this.provinciasDisponibles);
    this.distritosSubject.next(this.distritosDisponibles);
  }

  ngOnInit() {
    // console.log removed for production
    this.cargarDatos();
    this.cargarOpcionesDinamicas();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['localidad'] || changes['esEdicion']) {
      this.cargarDatos();
    }
  }

  private inicializarFormulario() {
    this.formulario = this.fb.group({
      // ÚNICO CAMPO OBLIGATORIO
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      
      // TIPO POR DEFECTO: PUEBLO
      tipo: [TipoLocalidad.PUEBLO],
      
      // CAMPOS OPCIONALES (valores por defecto PUNO)
      ubigeo: ['', [Validators.pattern(/^\d{6}$/)]],
      departamento: ['PUNO'], // Por defecto PUNO
      provincia: ['PUNO'],    // Por defecto PUNO
      distrito: ['PUNO'],     // Por defecto PUNO
      descripcion: ['', [Validators.maxLength(500)]],
      observaciones: ['', [Validators.maxLength(500)]],
      
      // COORDENADAS
      latitud: ['', [Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.min(-180), Validators.max(180)]]
    });

    // Escuchar cambios en el tipo de localidad
    this.formulario.get('tipo')?.valueChanges.subscribe(tipo => {
      if (tipo) {
        this.onTipoChange(tipo);
      }
    });

    // Escuchar cambios en departamento para filtrar provincias
    this.formulario.get('departamento')?.valueChanges.subscribe(async departamento => {
      // console.log removed for production
      if (departamento) {
        await this.cargarProvinciasPorDepartamento(departamento);
        // Limpiar provincia y distrito cuando cambia departamento
        this.formulario.patchValue({
          provincia: '',
          distrito: ''
        }, { emitEvent: false });
        // Limpiar distritos
        this.distritosDisponibles = [];
        // console.log removed for production
      }
    });

    // Escuchar cambios en provincia para filtrar distritos
    this.formulario.get('provincia')?.valueChanges.subscribe(async provincia => {
      // console.log removed for production
      if (provincia) {
        const departamento = this.formulario.get('departamento')?.value;
        // console.log removed for production
        if (departamento) {
          await this.cargarDistritosPorProvincia(departamento, provincia);
          // console.log removed for production
        }
        // Limpiar distrito cuando cambia provincia
        this.formulario.patchValue({
          distrito: ''
        }, { emitEvent: false });
      } else {
        // Si no hay provincia, limpiar distritos
        this.distritosDisponibles = [];
        // console.log removed for production
      }
    });
  }

  private async cargarDatos() {
    if (this.esEdicion && this.localidad) {
      // Cargar datos de la localidad existente
      const tipoLocalidad = this.localidad.tipo || TipoLocalidad.PUEBLO;
      this.tipoSeleccionado = tipoLocalidad;
      
      // Cargar opciones dinámicas primero
      await this.cargarOpcionesDinamicas();
      
      // Si hay departamento, cargar provincias
      if (this.localidad.departamento) {
        await this.cargarProvinciasPorDepartamento(this.localidad.departamento);
        
        // Si hay provincia, cargar distritos
        if (this.localidad.provincia) {
          await this.cargarDistritosPorProvincia(this.localidad.departamento, this.localidad.provincia);
        }
      }
      
      this.formulario.patchValue({
        nombre: this.localidad.nombre || '',
        tipo: tipoLocalidad,
        ubigeo: this.localidad.ubigeo || '',
        departamento: this.localidad.departamento || 'PUNO',
        provincia: this.localidad.provincia || 'PUNO',
        distrito: this.localidad.distrito || 'PUNO',
        descripcion: this.localidad.descripcion || '',
        observaciones: this.localidad.observaciones || '',
        latitud: this.localidad.coordenadas?.latitud || '',
        longitud: this.localidad.coordenadas?.longitud || ''
      });

      // Sincronizar controles del autocomplete
      this.provinciaControl.setValue(this.localidad.provincia || '');
      this.distritoControl.setValue(this.localidad.distrito || '');
    } else {
      // Resetear formulario para nueva localidad
      this.tipoSeleccionado = TipoLocalidad.PUEBLO;
      
      // Cargar opciones dinámicas primero
      await this.cargarOpcionesDinamicas();
      
      // Establecer valores por defecto y cargar opciones dependientes
      this.formulario.reset({
        nombre: '',
        tipo: TipoLocalidad.PUEBLO,
        ubigeo: '',
        departamento: 'PUNO', // Por defecto PUNO
        provincia: '',        // Vacío inicialmente
        distrito: '',         // Vacío inicialmente
        descripcion: '',
        observaciones: '',
        latitud: '',
        longitud: ''
      });

      // Limpiar controles del autocomplete
      this.provinciaControl.setValue('');
      this.distritoControl.setValue('');

      // Cargar provincias para PUNO por defecto
      await this.cargarProvinciasPorDepartamento('PUNO');
      
      // Si solo hay una provincia, seleccionarla automáticamente
      if (this.provinciasDisponibles.length === 1) {
        const provincia = this.provinciasDisponibles[0];
        this.formulario.patchValue({ provincia });
        this.provinciaControl.setValue(provincia);
        await this.cargarDistritosPorProvincia('PUNO', provincia);
        
        // Si solo hay un distrito, seleccionarlo automáticamente
        if (this.distritosDisponibles.length === 1) {
          const distrito = this.distritosDisponibles[0];
          this.formulario.patchValue({ distrito });
          this.distritoControl.setValue(distrito);
        }
      }
    }
  }

  onGuardar() {
    if (this.formulario.valid) {
      this.guardando = true;
      
      const formValue = this.formulario.value;
      
      // Preparar datos de la localidad
      const datosLocalidad: LocalidadCreate | LocalidadUpdate = {
        nombre: formValue.nombre.trim(),
        tipo: formValue.tipo,
        // Siempre incluir departamento, provincia y distrito con PUNO por defecto
        departamento: formValue.departamento?.trim() || 'PUNO',
        provincia: formValue.provincia?.trim() || 'PUNO',
        distrito: formValue.distrito?.trim() || 'PUNO'
      };

      // Solo agregar campos específicos si el tipo es CENTRO_POBLADO
      if (formValue.tipo === 'CENTRO_POBLADO') {
        if (formValue.ubigeo) datosLocalidad.ubigeo = formValue.ubigeo;
      }

      // Campos opcionales comunes
      if (formValue.descripcion) datosLocalidad.descripcion = formValue.descripcion.trim();
      if (formValue.observaciones) datosLocalidad.observaciones = formValue.observaciones.trim();

      // Agregar coordenadas si están completas
      if (formValue.latitud && formValue.longitud) {
        datosLocalidad.coordenadas = {
          latitud: parseFloat(formValue.latitud),
          longitud: parseFloat(formValue.longitud)
        };
      }

      this.guardar.emit(datosLocalidad);
      
      // Reset guardando después de un tiempo
      setTimeout(() => {
        this.guardando = false;
      }, 1000);
    }
  }

  onCancelar() {
    this.cancelar.emit();
  }

  // Métodos para manejar la lógica condicional
  onTipoChange(tipo: string) {
    this.tipoSeleccionado = tipo;
    
    // Resetear campos según el tipo seleccionado
    switch (tipo) {
      case 'DEPARTAMENTO':
        // Departamento no necesita campos jerárquicos superiores
        this.formulario.patchValue({
          ubigeo: '',
          provincia: '',
          distrito: '',
          departamento: ''
        });
        break;
        
      case 'PROVINCIA':
        // Provincia solo necesita especificar su departamento
        this.formulario.patchValue({
          ubigeo: '',
          provincia: '', // Se limpia porque ES la provincia
          distrito: '',
          departamento: 'PUNO' // Especifica a qué departamento pertenece
        });
        break;
        
      case 'DISTRITO':
        // Distrito necesita especificar departamento y provincia donde se ubica
        this.formulario.patchValue({
          ubigeo: '',
          distrito: '', // Se limpia porque ES el distrito
          departamento: 'PUNO', // Especifica departamento
          provincia: 'PUNO' // Especifica provincia donde se ubica
        });
        break;
        
      case 'PUEBLO':
        // Pueblo necesita especificar departamento, provincia y distrito donde se ubica
        this.formulario.patchValue({
          ubigeo: '',
          departamento: 'PUNO', // Especifica departamento
          provincia: 'PUNO', // Especifica provincia
          distrito: 'PUNO' // Especifica distrito donde se ubica
        });
        break;
        
      case 'CENTRO_POBLADO':
        // Centro poblado puede tener ubicación administrativa completa
        this.formulario.patchValue({
          departamento: 'PUNO',
          provincia: 'PUNO',
          distrito: 'PUNO'
          // Mantiene ubigeo si ya tenía valor
        });
        break;
        
      case 'CIUDAD':
        // Ciudad similar a pueblo
        this.formulario.patchValue({
          ubigeo: '',
          departamento: 'PUNO',
          provincia: 'PUNO',
          distrito: 'PUNO'
        });
        break;
        
      case 'LOCALIDAD':
        // Localidad similar a pueblo
        this.formulario.patchValue({
          ubigeo: '',
          departamento: 'PUNO',
          provincia: 'PUNO',
          distrito: 'PUNO'
        });
        break;
    }
  }

  mostrarCamposJerarquicos(): boolean {
    return ['PUEBLO', 'CENTRO_POBLADO', 'DISTRITO', 'PROVINCIA', 'CIUDAD', 'LOCALIDAD'].includes(this.tipoSeleccionado);
  }

  mostrarCampoDepartamento(): boolean {
    // Solo mostrar departamento para niveles que PERTENECEN a un departamento
    // NO mostrar si estás creando un departamento
    return ['PROVINCIA', 'DISTRITO', 'PUEBLO', 'CENTRO_POBLADO', 'CIUDAD', 'LOCALIDAD'].includes(this.tipoSeleccionado);
  }

  mostrarCampoProvincia(): boolean {
    // Solo mostrar provincia para niveles que PERTENECEN a una provincia
    // NO mostrar si estás creando una provincia o departamento
    return ['DISTRITO', 'PUEBLO', 'CENTRO_POBLADO', 'CIUDAD', 'LOCALIDAD'].includes(this.tipoSeleccionado);
  }

  mostrarCampoDistrito(): boolean {
    // Solo mostrar distrito para niveles que PERTENECEN a un distrito
    // NO mostrar si estás creando un distrito, provincia o departamento
    return ['PUEBLO', 'CENTRO_POBLADO', 'CIUDAD', 'LOCALIDAD'].includes(this.tipoSeleccionado);
  }

  mostrarCampoUbigeo(): boolean {
    return this.tipoSeleccionado === 'CENTRO_POBLADO';
  }

  getTituloSeccionUbicacion(): string {
    switch (this.tipoSeleccionado) {
      case 'PROVINCIA': return 'Ubicación - ¿A qué Departamento pertenece esta Provincia?';
      case 'DISTRITO': return 'Ubicación - ¿A qué Provincia y Departamento pertenece este Distrito?';
      case 'PUEBLO': return 'Ubicación - ¿En qué Distrito, Provincia y Departamento está este Pueblo?';
      case 'CENTRO_POBLADO': return 'Ubicación Administrativa Completa';
      default: return 'Ubicación Administrativa';
    }
  }

  getHintPorTipo(): string {
    switch (this.tipoSeleccionado) {
      case 'DEPARTAMENTO': return 'Nivel territorial más alto - No requiere ubicación superior';
      case 'PROVINCIA': return 'Requiere especificar a qué departamento pertenece';
      case 'DISTRITO': return 'Requiere especificar departamento y provincia donde se ubica';
      case 'CIUDAD': return 'Requiere especificar departamento, provincia y distrito donde se ubica';
      case 'PUEBLO': return 'Requiere especificar departamento, provincia y distrito donde se ubica';
      case 'LOCALIDAD': return 'Requiere especificar departamento, provincia y distrito donde se ubica';
      case 'CENTRO_POBLADO': return 'Puede incluir UBIGEO y ubicación administrativa completa';
      default: return 'Selecciona el tipo de localidad';
    }
  }

  // Métodos de utilidad
  get nombreControl() {
    return this.formulario.get('nombre');
  }

  get tipoControl() {
    return this.formulario.get('tipo');
  }

  get ubigeoControl() {
    return this.formulario.get('ubigeo');
  }

  // Método para seleccionar tipo de localidad
  seleccionarTipo(valor: string) {
    this.tipoSeleccionado = valor;
    
    // Actualizar el FormControl
    this.formulario.get('tipo')?.setValue(valor, { emitEvent: false });
    
    // Aplicar lógica condicional
    this.onTipoChange(valor);
  }

  // Métodos para cargar opciones dinámicas
  async cargarOpcionesDinamicas() {
    try {
      this.cargandoOpciones = true;
      // console.log removed for production
      const localidades = await this.localidadService.obtenerLocalidades();
      
      // Extraer departamentos únicos
      this.departamentosDisponibles = [...new Set(
        localidades
          .map(l => l.departamento)
          .filter((d): d is string => Boolean(d))
      )].sort();

      // console.log removed for production

      // Si solo hay PUNO como departamento, cargar provincias automáticamente
      if (this.departamentosDisponibles.length === 1 && this.departamentosDisponibles[0] === 'PUNO') {
        await this.cargarProvinciasPorDepartamento('PUNO');
      }

      // Reinicializar observables después de cargar opciones
      this.actualizarOpciones();

    } catch (error) {
      console.error('Error cargando opciones dinámicas::', error);
    } finally {
      this.cargandoOpciones = false;
    }
  }

  async cargarProvinciasPorDepartamento(departamento: string) {
    try {
      const localidades = await this.localidadService.obtenerLocalidades();
      
      // Filtrar provincias por departamento
      this.provinciasDisponibles = [...new Set(
        localidades
          .filter(l => l.departamento === departamento)
          .map(l => l.provincia)
          .filter((p): p is string => Boolean(p))
      )].sort();

      // Limpiar distritos cuando cambia departamento
      this.distritosDisponibles = [];

      // Actualizar observables del autocomplete
      this.actualizarOpciones();

    } catch (error) {
      console.error('Error cargando provincias::', error);
    }
  }

  async cargarDistritosPorProvincia(departamento: string, provincia: string) {
    try {
      const localidades = await this.localidadService.obtenerLocalidades();
      
      // Filtrar distritos por departamento y provincia
      this.distritosDisponibles = [...new Set(
        localidades
          .filter(l => l.departamento === departamento && l.provincia === provincia)
          .map(l => l.distrito)
          .filter((d): d is string => Boolean(d))
      )].sort();

      // Actualizar observables del autocomplete
      this.actualizarOpciones();

    } catch (error) {
      console.error('Error cargando distritos::', error);
    }
  }

  // Métodos para verificar si usar input o select
  usarSelectDepartamento(): boolean {
    return this.departamentosDisponibles.length > 1;
  }

  usarSelectProvincia(): boolean {
    return this.provinciasDisponibles.length > 1;
  }

  usarSelectDistrito(): boolean {
    return this.distritosDisponibles.length > 1;
  }

  // Métodos para manejar selecciones del autocomplete
  onProvinciaSelected(event: any) {
    const provincia = event.option.value;
    // console.log removed for production
    
    // Actualizar el formulario principal
    this.formulario.patchValue({ provincia });
    
    // Cargar distritos para la provincia seleccionada
    const departamento = this.formulario.get('departamento')?.value;
    if (departamento && provincia) {
      this.cargarDistritosPorProvincia(departamento, provincia);
      // Limpiar distrito cuando cambia provincia
      this.formulario.patchValue({ distrito: '' });
      this.distritoControl.setValue('');
    }
  }

  onDistritoSelected(event: any) {
    const distrito = event.option.value;
    // console.log removed for production
    
    // Actualizar el formulario principal
    this.formulario.patchValue({ distrito });
  }

  // Métodos de debugging para eventos de select
  onSelectOpen(tipo: string) {
    // console.log removed for production
    // console.log removed for production
  }

  onSelectClose(tipo: string) {
    // console.log removed for production
  }

  onOptionClick(tipo: string, valor: string, event: Event) {
    // console.log removed for production
    // console.log removed for production
    console.log(`🔍 [DEBUG] Formulario antes:`, this.formulario.get(tipo)?.value);
    
    // Forzar el valor manualmente para debugging
    setTimeout(() => {
      console.log(`🔍 [DEBUG] Formulario después:`, this.formulario.get(tipo)?.value);
    }, 100);
  }

  onSelectionChange(tipo: string, event: any) {
    // console.log removed for production
    // console.log removed for production
    console.log(`🔍 [DEBUG] Formulario antes del cambio:`, this.formulario.get(tipo)?.value);
    console.log(`🔍 [DEBUG] FormControl status:`, this.formulario.get(tipo)?.status);
    console.log(`🔍 [DEBUG] FormControl disabled:`, this.formulario.get(tipo)?.disabled);
    
    // Verificar si el cambio se está aplicando
    setTimeout(() => {
      console.log(`🔍 [DEBUG] Formulario después del cambio:`, this.formulario.get(tipo)?.value);
      console.log(`🔍 [DEBUG] Valor en el DOM:`, (document.querySelector(`[formControlName="${tipo}"]`) as any)?.value);
    }, 100);
  }

  // Método adicional para debugging manual
  debugFormulario() {
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
  }

  // Método para probar forzar un valor manualmente
  testSetValue() {
    // console.log removed for production
    this.formulario.get('provincia')?.setValue('AZÁNGARO');
    console.log(`🔍 [DEBUG] Valor después de setValue:`, this.formulario.get('provincia')?.value);
  }
}