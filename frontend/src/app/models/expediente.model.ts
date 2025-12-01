export interface Expediente {
  id: string;
  nroExpediente: string; // Formato: E-1234-2025 (según el brief)
  folio: number; // Cantidad de hojas/páginas del expediente
  fechaEmision: Date;
  tipoTramite: TipoTramite;
  estado: EstadoExpediente;
  estaActivo: boolean;

  // ========== RELACIONES PRINCIPALES ==========
  // El expediente PUEDE estar relacionado con diferentes tipos de solicitantes
  empresaId?: string; // Para expedientes empresariales (autorizaciones, renovaciones, etc.)
  solicitanteId?: string; // Para expedientes personales (ciudadanos, funcionarios, etc.)
  tipoSolicitante: TipoSolicitante; // EMPRESA, PERSONA_NATURAL, FUNCIONARIO, OTRO

  // El expediente PUEDE generar diferentes tipos de documentos resultantes
  resolucionFinalId?: string; // ID de la resolución final emitida (para expedientes empresariales)
  constanciaFinalId?: string; // ID de la constancia emitida (para solicitudes de información)
  certificadoFinalId?: string; // ID del certificado emitido (para copias de documentos)
  documentoResultadoId?: string; // ID del documento final (genérico)

  // Para expedientes de INCREMENTO/SUSTITUCION, pueden basarse en una resolución anterior
  resolucionPadreId?: string; // ID de la resolución padre para expedientes derivados
  // Para expedientes de RENOVACION, se basan en una resolución primigenia
  resolucionPrimigeniaId?: string; // ID de la resolución primigenia base para expedientes de renovación

  // ========== CONTENIDO DEL EXPEDIENTE ==========
  descripcion?: string; // Descripción automática según tipo de trámite
  fechaRegistro?: Date;
  fechaActualizacion?: Date;
  documentos?: DocumentoExpediente[]; // Documentos adjuntos al expediente
  observaciones?: string;

  // ========== FLUJO POR OFICINAS ==========
  // El expediente se mueve entre oficinas hasta su resolución final
  oficinaActual?: OficinaExpediente; // Oficina donde se encuentra actualmente
  historialOficinas?: HistorialOficina[]; // Historial de movimientos entre oficinas
  tiempoEstimadoOficina?: number; // Tiempo estimado en días en la oficina actual
  fechaLlegadaOficina?: Date; // Fecha cuando llegó a la oficina actual
  proximaRevision?: Date; // Fecha de la próxima revisión programada
  urgencia?: NivelUrgencia; // Nivel de urgencia del expediente

  // ========== INTEGRACIÓN CON SISTEMAS EXTERNOS ==========
  // Campos para integración con sistemas externos de gestión documentaria
  sistemaOrigen?: SistemaOrigen; // Sistema del que proviene el expediente
  idExterno?: string; // ID del expediente en el sistema externo
  codigoExterno?: string; // Código de referencia en el sistema externo
  fechaSincronizacion?: Date; // Última fecha de sincronización
  estadoSincronizacion?: EstadoSincronizacion; // Estado de la sincronización
  metadatosExternos?: MetadatosExternos; // Metadatos adicionales del sistema externo
  urlExterna?: string; // URL del expediente en el sistema externo
  hashVerificacion?: string; // Hash para verificar integridad de datos
  versionDatos?: string; // Versión de los datos recibidos
  prioridad?: PrioridadExpediente; // Prioridad asignada por el sistema externo
  categoria?: CategoriaExpediente; // Categoría del expediente
  tags?: string[]; // Etiquetas para clasificación
  flujoAprobacion?: FlujoAprobacion; // Flujo de aprobación definido externamente
  responsables?: ResponsableExpediente[]; // Responsables asignados
  plazos?: PlazosExpediente; // Plazos y fechas límite
  costo?: number; // Costo asociado al trámite
  moneda?: string; // Moneda del costo
  requisitos?: RequisitoExpediente[]; // Requisitos específicos
  dependencias?: string[]; // IDs de expedientes de los que depende
  impacto?: ImpactoExpediente; // Impacto del expediente
  riesgo?: NivelRiesgo; // Nivel de riesgo asociado
}

export interface DocumentoExpediente {
  id: string;
  nombre: string;
  tipo: TipoDocumentoExpediente;
  url: string;
  fechaSubida: Date;
  fechaVencimiento?: Date;
  estaActivo: boolean;
  hash?: string; // Para verificar integridad
  tamano?: number; // Tamaño en bytes
  formato?: string; // Formato del archivo
  version?: string; // Versión del documento
  comentarios?: string;
}

export interface MetadatosExternos {
  [key: string]: any; // Metadatos dinámicos del sistema externo
  sistema?: string; // Nombre del sistema externo
  modulo?: string; // Módulo específico del sistema
  usuarioCreacion?: string; // Usuario que creó el expediente en el sistema externo
  departamento?: string; // Departamento responsable en el sistema externo
  area?: string; // Área específica
  proyecto?: string; // Proyecto asociado
  cliente?: string; // Cliente o solicitante
  proveedor?: string; // Proveedor de servicios
  ubicacion?: string; // Ubicación geográfica
  coordenadas?: { lat: number; lng: number }; // Coordenadas GPS
  horario?: string; // Horario de atención
  contacto?: string; // Información de contacto
  notas?: string; // Notas adicionales
}

export interface ResponsableExpediente {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: RolResponsable;
  fechaAsignacion: Date;
  fechaVencimiento?: Date;
  estaActivo: boolean;
}

export interface PlazosExpediente {
  fechaLimite: Date;
  fechaAdvertencia?: Date; // Fecha para mostrar advertencia
  fechaCritica?: Date; // Fecha crítica
  plazoExtension?: number; // Días de extensión permitidos
  recordatorios?: RecordatorioExpediente[];
}

export interface RecordatorioExpediente {
  id: string;
  tipo: TipoRecordatorio;
  fecha: Date;
  mensaje: string;
  enviado: boolean;
  destinatarios: string[];
}

export interface RequisitoExpediente {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoRequisito;
  obligatorio: boolean;
  cumplido: boolean;
  fechaCumplimiento?: Date;
  documento?: string; // URL del documento que cumple el requisito
  observaciones?: string;
}

export interface FlujoAprobacion {
  id: string;
  nombre: string;
  pasos: PasoAprobacion[];
  fechaInicio: Date;
  fechaFin?: Date;
  estado: EstadoFlujoAprobacion;
  aprobadores: string[]; // IDs de usuarios aprobadores
}

export interface PasoAprobacion {
  id: string;
  nombre: string;
  orden: number;
  responsable: string; // ID del responsable
  fechaLimite: Date;
  completado: boolean;
  fechaCompletado?: Date;
  comentarios?: string;
  documentos?: string[]; // URLs de documentos requeridos
}

// Enums para los nuevos campos
export enum SistemaOrigen {
  INTERNO = 'INTERNO',
  SISTEMA_GESTION_DOCUMENTARIA = 'SISTEMA_GESTION_DOCUMENTARIA',
  SISTEMA_TRAMITES = 'SISTEMA_TRAMITES',
  SISTEMA_FISCALIZACION = 'SISTEMA_FISCALIZACION',
  SISTEMA_EMPRESAS = 'SISTEMA_EMPRESAS',
  API_EXTERNA = 'API_EXTERNA',
  IMPORTACION_MASIVA = 'IMPORTACION_MASIVA',
  SINCRONIZACION_AUTOMATICA = 'SINCRONIZACION_AUTOMATICA'
}

export enum EstadoSincronizacion {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADO = 'COMPLETADO',
  ERROR = 'ERROR',
  CONFLICTO = 'CONFLICTO',
  DESACTUALIZADO = 'DESACTUALIZADO'
}

export enum PrioridadExpediente {
  BAJA = 'BAJA',
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
  CRITICA = 'CRITICA',
  MEDIA = 'MEDIA'
}

export enum CategoriaExpediente {
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  OPERATIVO = 'OPERATIVO',
  LEGAL = 'LEGAL',
  FINANCIERO = 'FINANCIERO',
  TECNICO = 'TECNICO',
  COMERCIAL = 'COMERCIAL',
  RECURSOS_HUMANOS = 'RECURSOS_HUMANOS',
  INFRAESTRUCTURA = 'INFRAESTRUCTURA',
  SEGURIDAD = 'SEGURIDAD',
  CALIDAD = 'CALIDAD'
}

export enum TipoDocumentoExpediente {
  SOLICITUD = 'SOLICITUD',
  DOCUMENTO_IDENTIDAD = 'DOCUMENTO_IDENTIDAD',
  CERTIFICADO = 'CERTIFICADO',
  CONSTANCIA = 'CONSTANCIA',
  INFORME = 'INFORME',
  RESOLUCION = 'RESOLUCION',
  ACTA = 'ACTA',
  CONTRATO = 'CONTRATO',
  FACTURA = 'FACTURA',
  RECIBO = 'RECIBO',
  OTRO = 'OTRO'
}

export enum RolResponsable {
  SOLICITANTE = 'SOLICITANTE',
  REVISOR = 'REVISOR',
  APROBADOR = 'APROBADOR',
  SUPERVISOR = 'SUPERVISOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
  COORDINADOR = 'COORDINADOR',
  DIRECTOR = 'DIRECTOR',
  GERENTE = 'GERENTE'
}

export enum TipoRecordatorio {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  NOTIFICACION_SISTEMA = 'NOTIFICACION_SISTEMA',
  PUSH = 'PUSH',
  TELEFONO = 'TELEFONO'
}

export enum TipoRequisito {
  DOCUMENTO = 'DOCUMENTO',
  PAGO = 'PAGO',
  APROBACION = 'APROBACION',
  VERIFICACION = 'VERIFICACION',
  INSPECCION = 'INSPECCION',
  AUDITORIA = 'AUDITORIA',
  CAPACITACION = 'CAPACITACION',
  CERTIFICACION = 'CERTIFICACION'
}

export enum EstadoFlujoAprobacion {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  SUSPENDIDO = 'SUSPENDIDO',
  CANCELADO = 'CANCELADO'
}

export enum ImpactoExpediente {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO'
}

export enum NivelRiesgo {
  MINIMO = 'MINIMO',
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO'
}

// Interfaces para creación y actualización
export interface ExpedienteCreate {
  nroExpediente: string;
  folio: number;
  fechaEmision: Date;
  tipoTramite: TipoTramite;
  estado?: EstadoExpediente;

  // ========== SOLICITANTE ==========
  empresaId?: string;
  representanteId?: string;

  // ========== DOCUMENTOS RESULTANTES ==========
  resolucionPadreId?: string;
  resolucionPrimigeniaId?: string;

  // ========== CONTENIDO ==========
  descripcion?: string;
  observaciones?: string;

  // ========== SEGUIMIENTO POR OFICINA ==========
  prioridad?: PrioridadExpediente;
  oficinaInicialId?: string;
  urgencia?: NivelUrgencia;
  tiempoEstimadoOficina?: number;

  // ========== CAMPOS OPCIONALES PARA SISTEMAS EXTERNOS ==========
  sistemaOrigen?: SistemaOrigen;
  idExterno?: string;
  codigoExterno?: string;
  metadatosExternos?: MetadatosExternos;
  urlExterna?: string;
  categoria?: CategoriaExpediente;
  tags?: string[];
  costo?: number;
  moneda?: string;
  plazos?: PlazosExpediente;
  impacto?: ImpactoExpediente;
  riesgo?: NivelRiesgo;
}

export interface ExpedienteUpdate {
  nroExpediente?: string;
  folio?: number;
  fechaEmision?: Date;
  tipoTramite?: TipoTramite;
  estado?: EstadoExpediente;
  empresaId?: string;
  resolucionPadreId?: string;
  resolucionPrimigeniaId?: string;
  descripcion?: string;
  observaciones?: string;

  // Campos para seguimiento por oficina
  oficinaActualId?: string;
  urgencia?: NivelUrgencia;
  tiempoEstimadoOficina?: number;
  proximaRevision?: Date;
  motivoTransferencia?: string;

  // Campos para actualización de expedientes externos
  sistemaOrigen?: SistemaOrigen;
  idExterno?: string;
  codigoExterno?: string;
  metadatosExternos?: MetadatosExternos;
  urlExterna?: string;
  prioridad?: PrioridadExpediente;
  categoria?: CategoriaExpediente;
  tags?: string[];
  costo?: number;
  moneda?: string;
  plazos?: PlazosExpediente;
  impacto?: ImpactoExpediente;
  riesgo?: NivelRiesgo;
}

// Interface para sincronización con sistemas externos
export interface ExpedienteSincronizacion {
  idExterno: string;
  codigoExterno: string;
  sistemaOrigen: SistemaOrigen;
  datos: Partial<Expediente>;
  fechaSincronizacion: Date;
  hashVerificacion: string;
  versionDatos: string;
  conflictos?: string[];
  estadoSincronizacion: EstadoSincronizacion;
}

// Interface para respuesta de sincronización
export interface RespuestaSincronizacion {
  exitosa: boolean;
  mensaje: string;
  expedienteId?: string;
  conflictos?: string[];
  recomendaciones?: string[];
  fechaProcesamiento: Date;
}

export interface ValidacionExpediente {
  numero: string;
  folio: number;
  empresaId?: string;
  tipoTramite: TipoTramite;
  fechaEmision: Date;
  expedienteIdExcluir?: string; // ID del expediente a excluir de la validación (para edición)
}

export interface RespuestaValidacion {
  valido: boolean;
  mensaje: string;
  expedienteExistente?: {
    id: string;
    nroExpediente: string;
    folio: number;
    empresaId?: string;
    estado: EstadoExpediente;
  };
  conflictos?: string[];
}

export type EstadoExpediente = 'EN PROCESO' | 'APROBADO' | 'RECHAZADO' | 'SUSPENDIDO' | 'ARCHIVADO';

// Actualizar TipoTramite según el briefing consolidado
export type TipoTramite = 'AUTORIZACION_NUEVA' | 'RENOVACION' | 'INCREMENTO' | 'SUSTITUCION' | 'OTROS';

// Nuevos tipos para expedientes no empresariales
export enum TipoSolicitante {
  EMPRESA = 'EMPRESA',
  PERSONA_NATURAL = 'PERSONA_NATURAL',
  FUNCIONARIO = 'FUNCIONARIO',
  ORGANIZACION = 'ORGANIZACION',
  OTROS = 'OTROS'
}

export enum TipoExpediente {
  // Expedientes empresariales (transporte)
  AUTORIZACION_TRANSPORTE = 'AUTORIZACION_TRANSPORTE',
  RENOVACION_TRANSPORTE = 'RENOVACION_TRANSPORTE',
  INCREMENTO_FLOTA = 'INCREMENTO_FLOTA',
  SUSTITUCION_VEHICULOS = 'SUSTITUCION_VEHICULOS',

  // Expedientes de información y documentación
  SOLICITUD_INFORMACION = 'SOLICITUD_INFORMACION',
  COPIA_DOCUMENTO = 'COPIA_DOCUMENTO',
  CERTIFICADO = 'CERTIFICADO',
  CONSTANCIA = 'CONSTANCIA',

  // Expedientes administrativos
  SOLICITUD_ADMINISTRATIVA = 'SOLICITUD_ADMINISTRATIVA',
  RECLAMO = 'RECLAMO',
  SUGERENCIA = 'SUGERENCIA',
  CONSULTA = 'CONSULTA',

  // Expedientes de fiscalización
  DENUNCIA = 'DENUNCIA',
  INSPECCION = 'INSPECCION',
  AUDITORIA = 'AUDITORIA',

  // Categoría general para cualquier otro trámite
  OTROS = 'OTROS'
}

export enum TipoDocumentoResultado {
  RESOLUCION = 'RESOLUCION',
  CONSTANCIA = 'CONSTANCIA',
  CERTIFICADO = 'CERTIFICADO',
  INFORME = 'INFORME',
  ACTA = 'ACTA',
  DECISION = 'DECISION',
  NOTIFICACION = 'NOTIFICACION',
  OTROS = 'OTROS'
}

// Nuevas interfaces para seguimiento por oficina
export interface OficinaExpediente {
  id: string;
  nombre: string;
  codigo: string; // Código interno de la oficina
  ubicacion: string; // Dirección física de la oficina
  telefono?: string;
  email?: string;
  horarioAtencion?: string;
  responsable?: ResponsableOficina;
  tipoOficina: TipoOficina;
  estaActiva: boolean;
}

export interface ResponsableOficina {
  id: string;
  nombre: string;
  cargo: string;
  email: string;
  telefono?: string;
  extension?: string;
  horarioDisponibilidad?: string;
}

export interface HistorialOficina {
  id: string;
  oficinaId: string;
  oficinaNombre: string;
  fechaEntrada: Date;
  fechaSalida?: Date;
  responsableId?: string;
  responsableNombre?: string;
  motivo: string; // Por qué llegó a esta oficina
  observaciones?: string;
  tiempoEnOficina?: number; // Días que estuvo en esta oficina
  estado: EstadoHistorialOficina;
}

export enum TipoOficina {
  RECEPCION = 'RECEPCION',
  REVISION_TECNICA = 'REVISION_TECNICA',
  LEGAL = 'LEGAL',
  FINANCIERA = 'FINANCIERA',
  APROBACION = 'APROBACION',
  FISCALIZACION = 'FISCALIZACION',
  ARCHIVO = 'ARCHIVO',
  COORDINACION = 'COORDINACION',
  DIRECCION = 'DIRECCION',
  OTRA = 'OTRA'
}

export enum EstadoHistorialOficina {
  EN_TRAMITE = 'EN_TRAMITE',
  COMPLETADO = 'COMPLETADO',
  DEVUELTO = 'DEVUELTO',
  TRANSFERIDO = 'TRANSFERIDO',
  ARCHIVADO = 'ARCHIVADO'
}

export enum NivelUrgencia {
  NORMAL = 'NORMAL',
  URGENTE = 'URGENTE',
  MUY_URGENTE = 'MUY_URGENTE',
  CRITICO = 'CRITICO'
}

// Interface para movimiento de expedientes entre oficinas
export interface MovimientoExpediente {
  expedienteId: string;
  oficinaOrigenId?: string;
  oficinaDestinoId: string;
  motivo: string;
  observaciones?: string;
  documentosRequeridos?: string[];
  documentosEntregados?: string[];
  fechaMovimiento: string; // ISO date string
  usuarioId: string;
  usuarioNombre: string;
}

// Interface para flujo completo del expediente
export interface FlujoExpediente {
  expedienteId: string;
  expedienteNumero: string;
  expedienteTipo: string;
  expedienteEmpresa: string;
  oficinaActual: string;
  estado: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
  movimientos: MovimientoExpediente[];
}

// Interface para respuesta de expediente con información completa
export interface ExpedienteResponse extends Expediente {
  oficinaActual?: OficinaExpedienteCompleta;
  tiempoRestanteOficina?: number; // Días restantes en la oficina actual
  proximaOficina?: OficinaExpedienteCompleta; // Próxima oficina en el flujo
  estadisticasOficina?: EstadisticasOficina; // Estadísticas de tiempo en oficinas
}

export interface OficinaExpedienteCompleta extends OficinaExpediente {
  tiempoPromedioTramite: number; // Tiempo promedio en días para este tipo de trámite
  expedientesEnCola: number; // Cantidad de expedientes en cola en esta oficina
  tiempoEstimadoCola: number; // Tiempo estimado en días para atender la cola
  ultimaActualizacion: Date; // Última vez que se actualizó la información
}

export interface EstadisticasOficina {
  totalOficinasVisitadas: number;
  tiempoTotalTramite: number; // Días totales desde el inicio
  tiempoPromedioPorOficina: number;
  oficinaMasLenta: string;
  oficinaMasRapida: string;
  retrasos: number; // Cantidad de veces que se excedió el tiempo estimado
}