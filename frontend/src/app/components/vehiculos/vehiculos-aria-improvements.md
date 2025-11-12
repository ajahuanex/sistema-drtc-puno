# ARIA Improvements for Vehiculos Module

## Overview
This document describes the ARIA (Accessible Rich Internet Applications) attributes added to improve accessibility in the vehiculos module.

## ARIA Attributes Added

### 1. Page Header
- `role="banner"` - Identifies the page header
- `aria-label` - Descriptive labels for action buttons

### 2. Stats Dashboard
- `role="region"` - Identifies the stats section
- `aria-label="Estadísticas de vehículos"` - Labels the stats region
- `role="button"` - Identifies clickable stat cards
- `tabindex="0"` - Makes stat cards keyboard accessible
- `aria-label` - Descriptive labels for each stat card

### 3. Search Section
- `role="search"` - Identifies the search region
- `aria-label="Búsqueda de vehículos"` - Labels the search region
- `aria-describedby` - Links search input to hint text

### 4. Filters Section
- `role="form"` - Identifies the filters form
- `aria-label="Filtros avanzados"` - Labels the filters form
- `aria-describedby` - Links form fields to hint text
- `aria-pressed` - Indicates filter button state

### 5. Active Filters
- `role="status"` - Identifies the active filters region
- `aria-live="polite"` - Announces filter changes
- `aria-label` - Labels each filter chip

### 6. Table
- `role="table"` - Identifies the table (implicit in mat-table)
- `aria-label="Tabla de vehículos"` - Labels the table
- `aria-sort` - Indicates sort direction on headers
- `aria-selected` - Indicates selected rows
- `aria-label` - Labels action buttons

### 7. Pagination
- `aria-label="Seleccionar página de vehículos"` - Labels the paginator
- `aria-label` - Labels pagination buttons

### 8. Batch Actions
- `role="toolbar"` - Identifies the batch actions toolbar
- `aria-label="Acciones en lote"` - Labels the toolbar
- `aria-describedby` - Links actions to selection count

## Implementation Notes

1. All interactive elements have appropriate ARIA labels
2. Form fields are linked to their hints and errors using aria-describedby
3. Dynamic content uses aria-live regions
4. Buttons indicate their pressed/selected state
5. All icons have aria-hidden="true" to prevent screen reader confusion
6. Focus management is improved with proper tabindex values

## Testing

To test accessibility:
1. Use a screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate using only keyboard (Tab, Enter, Space, Arrow keys)
3. Check color contrast ratios
4. Verify all interactive elements are announced properly
5. Ensure form validation errors are announced

## WCAG 2.1 AA Compliance

The following WCAG criteria are addressed:
- 1.3.1 Info and Relationships (Level A)
- 2.1.1 Keyboard (Level A)
- 2.4.3 Focus Order (Level A)
- 2.4.6 Headings and Labels (Level AA)
- 3.2.4 Consistent Identification (Level AA)
- 4.1.2 Name, Role, Value (Level A)
- 4.1.3 Status Messages (Level AA)
