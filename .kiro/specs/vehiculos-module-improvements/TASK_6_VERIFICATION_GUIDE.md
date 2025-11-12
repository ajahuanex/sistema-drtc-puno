# Task 6: Verification Guide - Improved Vehicles Table

## Quick Start

### Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend server running on `http://localhost:4200`
3. Test data loaded (vehicles, empresas, resoluciones)

### Access
Navigate to: `http://localhost:4200/vehiculos`

---

## Visual Verification Checklist

### ✅ 1. Multiple Selection (Subtask 6.1)

**What to Look For:**
- [ ] Checkbox column appears as first column in table
- [ ] Master checkbox in table header
- [ ] Individual checkboxes for each vehicle row

**Test Steps:**
1. Click the master checkbox in the header
   - **Expected:** All vehicles on current page are selected
   - **Expected:** Master checkbox shows checked state
   
2. Click the master checkbox again
   - **Expected:** All vehicles are deselected
   - **Expected:** Master checkbox shows unchecked state

3. Select 2-3 individual vehicles
   - **Expected:** Master checkbox shows indeterminate state (dash)
   - **Expected:** Selected vehicles have checked checkboxes

4. Navigate to next page
   - **Expected:** Selection is maintained for previously selected vehicles
   - **Expected:** New page vehicles are not selected

**Screenshot Locations:**
- Master checkbox checked
- Indeterminate state
- Individual selections

---

### ✅ 2. Enhanced Visual Columns (Subtask 6.2)

**What to Look For:**
- [ ] Placa column shows marca/modelo below placa
- [ ] Empresa column shows RUC below empresa name
- [ ] Estado column uses colored chips with icons
- [ ] Column headers have icons

**Test Steps:**

#### Placa Column
1. Look at any vehicle row
   - **Expected:** Placa in bold blue text (e.g., "ABC-123")
   - **Expected:** Marca and modelo below in smaller gray text (e.g., "Toyota Hiace")

#### Empresa Column
1. Look at any vehicle row
   - **Expected:** Empresa name in bold (e.g., "Transportes Unidos S.A.")
   - **Expected:** RUC below in smaller text (e.g., "RUC: 20123456789")

#### Estado Column
1. Find a vehicle with ACTIVO status
   - **Expected:** Green chip with check_circle icon
   - **Expected:** Text "ACTIVO" in uppercase

2. Find a vehicle with SUSPENDIDO status
   - **Expected:** Orange chip with warning icon
   - **Expected:** Text "SUSPENDIDO" in uppercase

3. Find a vehicle with INACTIVO status
   - **Expected:** Red chip with cancel icon
   - **Expected:** Text "INACTIVO" in uppercase

4. Find a vehicle with EN_REVISION status
   - **Expected:** Blue chip with schedule icon
   - **Expected:** Text "EN_REVISION" in uppercase

**Color Reference:**
- ACTIVO: Green (#e8f5e8 background, #2e7d32 text)
- INACTIVO: Red (#ffebee background, #c62828 text)
- SUSPENDIDO: Orange (#fff3e0 background, #ef6c00 text)
- EN_REVISION: Blue (#e3f2fd background, #1976d2 text)

**Screenshot Locations:**
- Placa column with marca/modelo
- Empresa column with RUC
- All estado chip variations

---

### ✅ 3. Quick Actions Menu (Subtask 6.3)

**What to Look For:**
- [ ] Three-dot menu button in Acciones column
- [ ] Menu opens with all actions
- [ ] All actions have icons

**Test Steps:**
1. Click the three-dot menu button (⋮) for any vehicle
   - **Expected:** Menu opens with following options:
     - Ver detalle (eye icon)
     - Ver historial (history icon)
     - Transferir empresa (swap arrows icon)
     - Solicitar baja (remove circle icon)
     - Editar (edit icon)
     - Duplicar (copy icon)
     - Divider line
     - Eliminar (delete icon, red text)

2. Hover over each menu item
   - **Expected:** Hover effect (background color change)
   - **Expected:** Cursor changes to pointer

3. Click "Ver detalle"
   - **Expected:** Navigates to vehicle detail page

4. Click "Transferir empresa"
   - **Expected:** Opens transfer modal

**Screenshot Locations:**
- Actions menu open
- Hover state on menu item

---

### ✅ 4. Batch Actions (Subtask 6.4)

**What to Look For:**
- [ ] Batch actions card appears when vehicles selected
- [ ] Card shows selection count
- [ ] Three action buttons present

**Test Steps:**

#### Batch Actions Card Appearance
1. Select 3 vehicles using checkboxes
   - **Expected:** Purple gradient card appears below table
   - **Expected:** Card shows "3 vehículo(s) seleccionado(s)"
   - **Expected:** Three buttons visible:
     - "Transferir Seleccionados" (orange)
     - "Solicitar Baja Seleccionados" (red)
     - "Limpiar Selección" (outlined)

2. Select 1 more vehicle (total 4)
   - **Expected:** Count updates to "4 vehículo(s) seleccionado(s)"

3. Deselect all vehicles
   - **Expected:** Batch actions card disappears

#### Transfer Batch
1. Select 2-3 vehicles
2. Click "Transferir Seleccionados"
   - **Expected:** Confirmation dialog appears
   - **Expected:** Dialog shows list of selected vehicle placas
   - **Expected:** Dialog asks for confirmation

3. Click "Cancelar" in dialog
   - **Expected:** Dialog closes
   - **Expected:** Selection remains
   - **Expected:** No transfer occurs

4. Click "Transferir Seleccionados" again
5. Click "Confirmar" in dialog
   - **Expected:** Transfer modal opens
   - **Expected:** Success message after transfer
   - **Expected:** Selection clears
   - **Expected:** Table reloads

#### Request Deletion Batch
1. Select 2-3 vehicles
2. Click "Solicitar Baja Seleccionados"
   - **Expected:** Confirmation dialog appears
   - **Expected:** Dialog shows list of selected vehicle placas
   - **Expected:** Dialog mentions supervisor approval needed

3. Click "Cancelar" in dialog
   - **Expected:** Dialog closes
   - **Expected:** Selection remains

4. Click "Solicitar Baja Seleccionados" again
5. Click "Confirmar" in dialog
   - **Expected:** Deletion request modal opens
   - **Expected:** Success message after submission
   - **Expected:** Selection clears

#### Clear Selection
1. Select 3-4 vehicles
2. Click "Limpiar Selección"
   - **Expected:** All checkboxes uncheck
   - **Expected:** Batch actions card disappears
   - **Expected:** Master checkbox unchecks

**Screenshot Locations:**
- Batch actions card with 3 vehicles selected
- Transfer confirmation dialog
- Deletion confirmation dialog

---

## Additional Features Verification

### ✅ Column Management

**Test Steps:**
1. Click the column selector icon (view_column) in table controls
   - **Expected:** Menu opens with all columns listed
   - **Expected:** Visible columns have eye icon
   - **Expected:** Hidden columns have eye-off icon

2. Click "Modelo" to hide it
   - **Expected:** Modelo column disappears from table
   - **Expected:** Menu item shows eye-off icon

3. Click "Modelo" again to show it
   - **Expected:** Modelo column reappears
   - **Expected:** Menu item shows eye icon

4. Try to hide "Selección" or "Acciones"
   - **Expected:** Nothing happens (these columns are protected)

---

### ✅ Export Functionality

**Test Steps:**
1. Apply some filters (e.g., filter by empresa)
2. Click the download icon in table controls
   - **Expected:** CSV file downloads immediately
   - **Expected:** Filename format: `vehiculos_YYYY-MM-DD.csv`
   - **Expected:** Success message appears

3. Open the downloaded CSV file
   - **Expected:** Headers: Placa, Empresa, RUC, Resolución, Categoría, Marca, Modelo, Año, Estado
   - **Expected:** Data matches filtered vehicles in table
   - **Expected:** All fields properly quoted

4. Try export with no vehicles (apply filter that returns 0 results)
   - **Expected:** Error message: "No hay vehículos para exportar"
   - **Expected:** No file downloads

---

## Responsive Design Verification

### Mobile View (< 768px)

**Test Steps:**
1. Resize browser to mobile width (e.g., 375px)
2. Select 2-3 vehicles
   - **Expected:** Batch actions card stacks vertically
   - **Expected:** Buttons expand to full width
   - **Expected:** Selection count centered

**Screenshot Locations:**
- Mobile batch actions card

---

## Performance Verification

### Large Dataset Test

**Test Steps:**
1. Load page with 100+ vehicles
2. Click master checkbox
   - **Expected:** All vehicles on page select instantly (< 100ms)
   - **Expected:** No lag or freeze

3. Navigate between pages with selection
   - **Expected:** Page changes smoothly
   - **Expected:** Selection state maintained

4. Export 100+ vehicles
   - **Expected:** Export completes in < 2 seconds
   - **Expected:** No browser freeze

---

## Accessibility Verification

### Keyboard Navigation

**Test Steps:**
1. Tab through the table
   - **Expected:** Focus moves to master checkbox
   - **Expected:** Focus moves to each row checkbox
   - **Expected:** Focus moves to action menu buttons

2. Press Space on master checkbox
   - **Expected:** Selects/deselects all vehicles

3. Press Enter on action menu button
   - **Expected:** Opens menu

4. Use arrow keys in menu
   - **Expected:** Navigates through menu items

### Screen Reader Test

**Test Steps:**
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate to master checkbox
   - **Expected:** Announces "Seleccionar todos"

3. Navigate to vehicle checkbox
   - **Expected:** Announces vehicle placa

4. Navigate to estado chip
   - **Expected:** Announces status text

---

## Error Handling Verification

### Edge Cases

**Test Steps:**

1. **Empty Selection Batch Action:**
   - Click "Transferir Seleccionados" with no selection
   - **Expected:** Error message: "No hay vehículos seleccionados"

2. **Network Error During Export:**
   - Disconnect network
   - Try to export
   - **Expected:** Error message displayed
   - **Expected:** No file downloads

3. **Invalid Estado:**
   - Create vehicle with invalid estado (via API)
   - **Expected:** Shows default gray chip
   - **Expected:** Shows info icon

---

## Browser Compatibility

### Test in Multiple Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest, if available)

**What to Verify:**
- Checkboxes render correctly
- Chips display with proper colors
- Icons load properly
- CSV export works
- Batch actions function

---

## Known Issues / Limitations

### Current Limitations
1. **Batch Transfer:** Currently opens modal for first vehicle only
   - Future: Create dedicated batch transfer modal
   
2. **Batch Deletion:** Currently opens modal for first vehicle only
   - Future: Create dedicated batch deletion modal

3. **Selection Across Pages:** Selection is maintained but not visually indicated on other pages
   - Future: Add "X vehicles selected across all pages" indicator

4. **Column Reordering:** Not yet implemented
   - Future: Add drag-and-drop column reordering

---

## Success Criteria

### All Tests Pass When:
- ✅ Multiple selection works smoothly
- ✅ Visual columns display correctly
- ✅ Quick actions menu is accessible
- ✅ Batch actions execute properly
- ✅ Export generates valid CSV
- ✅ Column management works
- ✅ Responsive design adapts
- ✅ No console errors
- ✅ Build completes successfully

---

## Troubleshooting

### Common Issues

**Issue:** Checkboxes don't appear
- **Solution:** Verify MatCheckboxModule is imported
- **Solution:** Check displayedColumns includes 'select'

**Issue:** Chips don't have colors
- **Solution:** Verify SCSS file is loaded
- **Solution:** Check getEstadoClass() returns correct class

**Issue:** Batch actions card doesn't appear
- **Solution:** Verify selection.hasValue() is true
- **Solution:** Check @if condition in template

**Issue:** Export doesn't work
- **Solution:** Check browser allows downloads
- **Solution:** Verify generarCSV() method exists

---

## Reporting Issues

### Information to Include
1. Browser and version
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots
6. Console errors (if any)

### Where to Report
- Create issue in project repository
- Tag with `vehiculos-module` and `table-improvements`
- Assign to development team

---

## Conclusion

This verification guide covers all aspects of Task 6 implementation. Follow each section systematically to ensure complete functionality.

**Estimated Testing Time:** 30-45 minutes
**Priority:** High (Core functionality)
**Complexity:** Medium
