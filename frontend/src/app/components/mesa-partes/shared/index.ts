// Shared Components for Mesa de Partes Module
export { DocumentoCardComponent } from './documento-card.component';
export { EstadoBadgeComponent, type BadgeSize, type BadgeVariant } from './estado-badge.component';
export { PrioridadIndicatorComponent, type IndicatorSize, type IndicatorStyle } from './prioridad-indicator.component';
export { QRCodeGeneratorComponent, type QRCodeOptions, type QRCodeData } from './qr-code-generator.component';

// Re-export types for convenience
export type { Documento, EstadoDocumento, PrioridadDocumento } from '../../../models/mesa-partes/documento.model';