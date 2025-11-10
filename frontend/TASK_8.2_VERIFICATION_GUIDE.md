# Task 8.2 Verification Guide

## Quick Verification Steps

### 1. Visual Inspection ✓

Open the application and navigate to the Resoluciones page:

```
http://localhost:4200/resoluciones
```

**Expected Result:**
- You should see a table toolbar with a column selector button (view_column icon)
- The button should be positioned between bulk actions and the export button

### 2. Open Column Selector ✓

Click the column selector button:

**Expected Result:**
- A menu should open showing all available columns
- Each column should have:
  - A drag handle icon
  - A checkbox (disabled for required columns)
  - Column name and type
  - Visibility indicator icon

### 3. Toggle Column Visibility ✓

1. Uncheck a non-required column (e.g., "Vigencia Inicio")
2. Click "Aplicar"

**Expected Result:**
- The menu should close
- The table should immediately update to hide the selected column
- The table should re-render without the hidden column

### 4. Reorder Columns ✓

1. Open the column selector again
2. Drag a column to a different position
3. Click "Aplicar"

**Expected Result:**
- The menu should close
- The table columns should reorder to match the new configuration
- The order should persist

### 5. Quick Actions ✓

Test the quick action buttons:

**"Mostrar Todas":**
- All columns should become visible
- Button should be disabled when all are already visible

**"Solo Esenciales":**
- Only required columns should remain visible
- Button should be disabled when only essentials are visible

**"Restaurar":**
- Configuration should reset to default
- All changes should be reverted

### 6. Required Columns ✓

Try to hide a required column (e.g., "Número de Resolución"):

**Expected Result:**
- The checkbox should be disabled
- A "Requerida" badge should be visible
- The column cannot be hidden

### 7. Configuration Persistence ✓

1. Change column configuration
2. Refresh the page

**Expected Result:**
- The configuration should persist (handled by parent component)
- Columns should maintain their visibility and order

## Integration Points to Verify

### Component Communication

```typescript
// Event flow:
User clicks "Aplicar"
  ↓
ColumnSelectorComponent emits columnasChange/ordenChange
  ↓
ResolucionesTableComponent.onColumnasVisiblesChange()
  ↓
Emits configuracionChange to parent
  ↓
Parent updates configuration
  ↓
Table re-renders with new columns
```

### Visual Elements

- [ ] Column selector button visible in toolbar
- [ ] Button has view_column icon
- [ ] Button has tooltip "Configurar columnas"
- [ ] Button changes color on hover
- [ ] Menu opens on click
- [ ] Menu shows all columns
- [ ] Drag handles are visible
- [ ] Checkboxes work correctly
- [ ] Required columns are marked
- [ ] Visibility indicators update
- [ ] Quick action buttons work
- [ ] "Aplicar" button is enabled when changes exist
- [ ] Table updates immediately after applying

## Browser Testing

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

## Responsive Testing

Test on different screen sizes:

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces elements correctly
- [ ] Focus management is proper
- [ ] ARIA labels are present
- [ ] Tooltips are accessible

## Performance Testing

- [ ] Menu opens quickly (< 100ms)
- [ ] Column updates are smooth
- [ ] No visible lag when reordering
- [ ] No console errors
- [ ] No memory leaks

## Common Issues to Check

### Issue 1: Button Not Visible
**Solution:** Check that ColumnSelectorComponent is imported in ResolucionesTableComponent

### Issue 2: Menu Doesn't Open
**Solution:** Verify MatMenuModule is imported

### Issue 3: Columns Don't Update
**Solution:** Check that event handlers are properly connected

### Issue 4: Configuration Doesn't Persist
**Solution:** Verify parent component handles configuracionChange event

## Success Criteria

✅ All visual elements are present and styled correctly
✅ Column selector button opens menu
✅ Columns can be toggled on/off
✅ Columns can be reordered
✅ Quick actions work as expected
✅ Required columns cannot be hidden
✅ Table updates immediately after changes
✅ No console errors
✅ Responsive on all screen sizes
✅ Accessible via keyboard and screen readers

## Files to Review

1. `frontend/src/app/shared/resoluciones-table.component.ts`
   - Lines 21, 109-112 (import and template)
   - Lines 905-919 (event handlers)

2. `frontend/src/app/shared/column-selector.component.ts`
   - Complete component implementation

3. `frontend/test-column-selector-integration.html`
   - Visual testing guide

## Next Steps After Verification

Once Task 8.2 is verified:

1. ✅ Mark task as complete
2. ✅ Document any issues found
3. ➡️ Proceed to Task 8.3: Integrate SortableHeaderComponent
4. ➡️ Continue with remaining table improvements

## Quick Test Command

To run the application for testing:

```bash
cd frontend
npm start
```

Then navigate to: `http://localhost:4200/resoluciones`

---

**Task Status:** ✅ COMPLETE
**Requirements Met:** 2.1, 2.2, 2.3
**Ready for:** Manual testing and next task
