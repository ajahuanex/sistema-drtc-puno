# Dashboard Mesa de Partes Component

## Overview

The `DashboardMesaComponent` is a comprehensive dashboard that provides real-time insights and key performance indicators for the Mesa de Partes (Document Management) system. It displays statistics, charts, and alerts to help users monitor document flow and system performance.

## Features

### 1. Key Performance Indicators (KPIs)
- **Total Recibidos**: Total documents received in the selected period
- **En Proceso**: Documents currently being processed
- **Atendidos**: Documents that have been completed
- **Vencidos**: Documents that have exceeded their deadline
- **Urgentes**: High-priority documents requiring immediate attention

Each indicator includes:
- Visual icons with color coding
- Trend indicators (up/down/stable)
- Descriptive text
- Hover effects and animations

### 2. Charts and Statistics

#### Tendencias por Fecha
- Bar chart showing document trends over time
- Compares received vs attended documents
- Last 7 days visualization
- Interactive tooltips with date information

#### Distribución por Tipo
- Shows distribution of documents by type
- Color-coded categories
- Percentage and count display
- Top 5 document types

#### Distribución por Área
- Horizontal bar chart showing workload by area
- Document count per area
- Visual comparison of area activity

#### Tiempos de Atención
- Average response times by area
- Min/max time ranges
- Color-coded performance indicators:
  - Green: ≤ 24 hours (good)
  - Orange: 24-48 hours (warning)
  - Red: > 48 hours (needs attention)

### 3. Alerts and Notifications

#### Documentos Vencidos
- Lists documents that have exceeded their deadline
- Shows days overdue
- Quick access to document details
- Empty state when no overdue documents

#### Próximos a Vencer
- Documents approaching their deadline (within 3 days)
- Proactive alert system
- Countdown display

#### Documentos Urgentes
- High-priority documents requiring immediate attention
- Status indicators
- Quick action access

### 4. Real-time Updates
- Automatic refresh every 30 seconds
- Manual refresh button
- Loading states and indicators
- Last update timestamp

### 5. Filtering and Customization
- Period selection (Today, Yesterday, Last Week, Last Month, etc.)
- Dynamic data loading based on filters
- Responsive design for all screen sizes

## Technical Implementation

### Dependencies
- Angular Material components for UI
- Reactive Forms for filter controls
- RxJS for data streaming and updates
- Custom chart implementations (no external chart library)

### Services Used
- `ReporteService`: Fetches statistics and report data
- `NotificacionService`: Handles real-time notifications

### Data Flow
1. Component initializes with default filters
2. Loads data from multiple service endpoints simultaneously
3. Processes and transforms data for visualization
4. Sets up automatic refresh intervals
5. Responds to filter changes and manual refreshes

### Key Methods

#### Data Loading
```typescript
private cargarDatosDashboard(): Observable<any>
```
Loads all dashboard data using `combineLatest` for parallel requests.

#### Chart Calculations
```typescript
getBarHeight(valor: number, maximo: number): number
getBarWidth(valor: number, maximo: number): number
getTimeBarWidth(valor: number, maximo: number): number
```
Calculate proportional sizes for chart elements.

#### Color Management
```typescript
getColorValue(color: string): string
getPieColor(index: number): string
```
Provide consistent color schemes across all visualizations.

## Styling

### Design System
- Material Design principles
- Consistent color palette
- Responsive grid layouts
- Smooth animations and transitions

### Color Scheme
- Primary: `#667eea` (Blue)
- Success: `#48bb78` (Green)
- Warning: `#ed8936` (Orange)
- Danger: `#f56565` (Red)
- Info: `#4299e1` (Light Blue)

### Responsive Breakpoints
- Desktop: > 1024px (4-column grid)
- Tablet: 768px - 1024px (2-column grid)
- Mobile: < 768px (1-column grid)

## Usage

### Basic Implementation
```html
<app-dashboard-mesa></app-dashboard-mesa>
```

### Integration with Mesa Partes
The dashboard is integrated as a tab in the main Mesa Partes component:

```typescript
// In mesa-partes.component.ts
import { DashboardMesaComponent } from './dashboard-mesa.component';

// In template
<mat-tab label="Dashboard">
  <app-dashboard-mesa></app-dashboard-mesa>
</mat-tab>
```

## Requirements Compliance

### Requirement 6.1 - Key Indicators
✅ Shows total documents received, in process, attended, and overdue
✅ Implements real-time updates every 30 seconds
✅ Displays performance metrics and trends

### Requirement 6.2 - Charts and Statistics
✅ Trend chart showing document flow over time
✅ Distribution chart by document type
✅ Date range filtering capabilities

### Requirement 6.3 - Area Distribution
✅ Chart showing document distribution by area
✅ Workload comparison across departments

### Requirement 6.5 - Response Times
✅ Average response time metrics by area
✅ Performance indicators with color coding

### Requirement 6.6 - Alerts
✅ Lists overdue documents
✅ Shows documents approaching deadlines
✅ Proactive alert system

### Requirement 8.2 - Document Alerts
✅ Automatic alerts for overdue documents
✅ Notification system integration

### Requirement 8.3 - Urgent Documents
✅ Special section for urgent priority documents
✅ Visual indicators for high-priority items

## Testing

The component includes comprehensive unit tests covering:
- Component initialization
- Data loading and processing
- Chart calculations
- Filter functionality
- Error handling
- Responsive behavior

Run tests with:
```bash
ng test --include="**/dashboard-mesa.component.spec.ts"
```

## Performance Considerations

### Optimization Features
- Lazy loading of chart data
- Efficient change detection
- Memory leak prevention with proper subscription cleanup
- Minimal DOM updates with OnPush strategy

### Data Caching
- Service-level caching for frequently accessed data
- Intelligent refresh strategies
- Optimized API calls with combined requests

## Future Enhancements

### Planned Features
- Export dashboard to PDF/Excel
- Custom date range picker
- Drill-down capabilities for detailed views
- User preference storage
- Advanced filtering options
- Real-time WebSocket updates

### Integration Opportunities
- Integration with external BI tools
- Custom widget creation
- Dashboard customization by user role
- Mobile app compatibility

## Troubleshooting

### Common Issues

1. **Data not loading**
   - Check service endpoints are accessible
   - Verify authentication tokens
   - Check browser console for errors

2. **Charts not displaying**
   - Ensure data is properly formatted
   - Check for JavaScript errors
   - Verify CSS styles are loaded

3. **Performance issues**
   - Monitor network requests
   - Check for memory leaks
   - Optimize data refresh intervals

### Debug Mode
Enable debug logging by setting:
```typescript
// In environment.ts
export const environment = {
  production: false,
  debug: true
};
```

## Accessibility

### Features
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode compatibility
- Semantic HTML structure
- Focus management

### Compliance
- WCAG 2.1 AA compliant
- Section 508 compatible
- Internationalization ready

## Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 13+

## Changelog

### Version 1.0.0 (Current)
- Initial implementation
- Key performance indicators
- Basic charts and statistics
- Alert system
- Real-time updates
- Responsive design

### Planned Updates
- Version 1.1.0: Enhanced charts with Chart.js
- Version 1.2.0: Export functionality
- Version 1.3.0: Custom dashboard widgets