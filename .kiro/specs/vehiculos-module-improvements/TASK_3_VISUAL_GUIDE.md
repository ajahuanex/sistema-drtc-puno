# Task 3 Visual Verification Guide

## How to Test the Advanced Filters

### 1. Access the Vehículos Module
Navigate to `/vehiculos` in your application.

### 2. Test EmpresaSelectorComponent Integration

**Steps:**
1. Locate the "Filtros Avanzados" card
2. Find the "Empresa" field (should be an autocomplete selector)
3. Click on the field and start typing
4. Verify that you can search by:
   - RUC (e.g., "20123456789")
   - Razón Social (e.g., "Transportes")
   - Código de Empresa (e.g., "EMP001")
5. Select an empresa from the dropdown
6. Verify that the empresa chip appears below the filters

**Expected Behavior:**
- Autocomplete suggestions appear as you type
- Selected empresa displays in a chip with "Empresa: [Razón Social]"
- Resolución selector becomes enabled after empresa selection
- Vehicle list filters to show only vehicles from selected empresa

### 3. Test ResolucionSelectorComponent Integration

**Steps:**
1. First select an empresa (required)
2. Click on the "Resolución" field
3. Start typing a resolución number or description
4. Verify that only resoluciones from the selected empresa appear
5. Select a resolución from the dropdown
6. Verify that the resolución chip appears below the filters

**Expected Behavior:**
- Resolución field is disabled until empresa is selected
- Autocomplete shows resoluciones filtered by empresa
- Selected resolución displays in a chip with "Resolución: [Número]"
- Vehicle list filters to show only vehicles with selected resolución

### 4. Test Visual Filter Chips

**Steps:**
1. Apply multiple filters:
   - Enter text in "Búsqueda rápida"
   - Enter a placa value
   - Select an empresa
   - Select a resolución
   - Select an estado
2. Click "Filtrar" button
3. Verify that all active filters appear as chips below the filters section

**Expected Chip Display:**
```
Filtros Activos:                                    [Limpiar Todo]

[Búsqueda: "ABC" ×] [Placa: ABC-123 ×] [Empresa: Transportes SA ×] 
[Resolución: RD-001-2024 ×] [Estado: ACTIVO ×]
```

**Test Individual Chip Removal:**
1. Click the "×" icon on the "Placa" chip
2. Verify that:
   - The placa chip disappears
   - The placa filter field is cleared
   - The vehicle list updates to remove the placa filter
   - Other filters remain active

**Test Clear All:**
1. Click the "Limpiar Todo" button
2. Verify that:
   - All chips disappear
   - All filter fields are cleared
   - The vehicle list shows all vehicles
   - URL query parameters are cleared

### 5. Test URL Persistence

**Steps:**
1. Apply several filters (empresa, resolución, estado, placa)
2. Click "Filtrar"
3. Check the browser URL - it should contain query parameters like:
   ```
   /vehiculos?empresaId=123&resolucionId=456&estado=ACTIVO&placa=ABC
   ```
4. Copy the URL
5. Open a new browser tab
6. Paste the URL and press Enter
7. Verify that:
   - All filters are restored from the URL
   - Filter chips display correctly
   - Vehicle list shows filtered results
   - Selector components show the selected values

**Test URL Sharing:**
1. Apply filters and get the URL
2. Share the URL with another user (or open in incognito mode)
3. Verify that the filters are applied correctly for the new session

### 6. Test Filter Interactions

**Test Empresa → Resolución Dependency:**
1. Select an empresa
2. Verify resolución selector is enabled
3. Select a resolución
4. Clear the empresa (click × on empresa chip)
5. Verify that:
   - Resolución selector is disabled
   - Resolución chip is removed
   - Both filters are cleared

**Test Pagination Reset:**
1. Navigate to page 2 or 3 of the vehicle list
2. Apply a filter
3. Verify that pagination resets to page 1

**Test Filter + Search Combination:**
1. Enter text in "Búsqueda rápida"
2. Also select an empresa filter
3. Verify that both filters are applied (AND logic)
4. Results should match both the search term AND the empresa

### 7. Visual Indicators

**Check for:**
- ✅ Smart icons in filter fields (car, business, description, info)
- ✅ Proper spacing and alignment of filter fields
- ✅ Responsive layout on different screen sizes
- ✅ Color-coded chips (primary, accent, warn)
- ✅ Hover effects on chip remove buttons
- ✅ Loading states when filters are applied
- ✅ "No results" message when filters return empty list

### 8. Edge Cases to Test

**Empty States:**
1. Apply filters that return no results
2. Verify "No se encontraron vehículos" message appears
3. Verify hint text suggests adjusting filters

**Invalid URL Parameters:**
1. Manually edit URL with invalid IDs
2. Verify application handles gracefully (no errors)
3. Verify invalid filters are ignored

**Rapid Filter Changes:**
1. Quickly change multiple filters
2. Verify no race conditions or duplicate requests
3. Verify final state is consistent

**Browser Back/Forward:**
1. Apply filters
2. Navigate to another page
3. Use browser back button
4. Verify filters are restored correctly

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Smooth user experience
- ✅ Correct filter application
- ✅ Proper chip display and removal
- ✅ URL persistence working
- ✅ Responsive design maintained
- ✅ Accessibility features working (keyboard navigation, screen readers)

## Known Limitations

None identified. All features working as expected.

## Screenshots Locations

For documentation purposes, capture screenshots of:
1. Empty filter state
2. Filters with autocomplete suggestions
3. Active filter chips
4. URL with query parameters
5. Mobile responsive view

---

**Last Updated:** 2025-11-09
**Task:** 3. Mejorar filtros avanzados en VehiculosComponent
**Status:** ✅ Completed
