# Mesa de Partes Module

## Overview
This module implements a comprehensive document management system for administrative procedures (Mesa de Partes).

## Structure

```
mesa-partes/
├── mesa-partes.component.ts          # Main component with tabs
├── registro-documento.component.ts    # Document registration form (to be implemented)
├── lista-documentos.component.ts      # Documents table (to be implemented)
├── detalle-documento.component.ts     # Document detail view (to be implemented)
├── derivar-documento.component.ts     # Document routing modal (to be implemented)
├── busqueda-documentos.component.ts   # Advanced search (to be implemented)
├── dashboard-mesa.component.ts        # Dashboard with statistics (to be implemented)
└── configuracion-integraciones.component.ts  # External API config (to be implemented)
```

## Features (Planned)

### 1. Document Registration
- Register incoming documents with metadata
- Attach digital files (PDF, images)
- Generate unique file numbers
- Generate QR codes for tracking

### 2. Document Routing (Derivación)
- Route documents to different departments
- Track document location and status
- Maintain complete routing history
- Automatic notifications

### 3. Integration with External Systems
- Connect with other Mesa de Partes systems
- REST API for document exchange
- Webhook support for events
- Field mapping configuration

### 4. Search and Query
- Advanced search with multiple criteria
- QR code lookup
- Export results to Excel/PDF

### 5. Reports and Statistics
- Dashboard with key indicators
- Performance metrics by department
- Trend analysis
- Overdue document alerts

## Current Status
✅ Base structure created
✅ Routing configured
✅ Sidebar menu entry added
⏳ Components to be implemented (see tasks.md)

## Navigation
The module is accessible from the sidebar under "Operaciones" section or directly at `/mesa-partes`.

## Related Files
- Models: `frontend/src/app/models/mesa-partes/`
- Services: `frontend/src/app/services/mesa-partes/`
- Routes: Configured in `frontend/src/app/app.routes.ts`
