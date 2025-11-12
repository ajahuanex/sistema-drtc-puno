# Task 8 Verification Guide

## Quick Start

This guide helps you verify that all validations and UX improvements for the vehicle form are working correctly.

## Prerequisites

1. Ensure the Angular development server is running:
   ```bash
   cd frontend
   npm start
   ```

2. Navigate to the vehicles module in your browser
3. Open the browser console to see any validation logs

## Verification Steps

### 1. Placa (License Plate) Validation

#### Test Valid Formats
1. Open the vehicle creation modal
2. Try entering these valid plates:
   - `ABC-123` ✅ Should be valid
   - `AB-1234` ✅ Should be valid
   - `A1B-234` ✅ Should be valid
3. Verify the icon changes to a green check mark
4. Verify no error messages appear

#### Test Invalid Formats
1. Try entering these invalid plates:
   - `ABC123` ❌ Should show format error
   - `ABC-12` ❌ Should show format error
   - `ABCD-123` ❌ Should show format error
   - `AB-12345` ❌ Should show format error
2. Verify the icon changes to a red error icon
3. Verify specific error message appears

#### Test Duplicate Detection
1. Create a vehicle with plate `TEST-001`
2. Try to create another vehicle with the same plate
3. Verify async validation shows hourglass icon briefly
4. Verify error message: "Esta placa ya está registrada en el sistema"

#### Test Edit Mode
1. Edit an existing vehicle
2. Keep the same plate number
3. Verify no duplicate error appears (should allow same plate)
4. Change to a different existing plate
5. Verify duplicate error appears

#### Test Uppercase Conversion
1. Type a plate in lowercase: `abc-123`
2. Verify it automatically converts to: `ABC-123`

### 2. Año de Fabricación (Year) Validation

#### Test Valid Years
1. Enter current year ✅ Should be valid
2. Enter current year + 1 ✅ Should be valid
3. Enter 1990 ✅ Should be valid
4. Enter 2020 ✅ Should be valid

#### Test Invalid Years
1. Enter 1989 ❌ Should show: "El año mínimo permitido es 1990"
2. Enter current year + 2 ❌ Should show: "El año máximo permitido es [year]"
3. Enter "abc" ❌ Should show: "El año debe ser un número válido"

### 3. Capacidad de Pasajeros (Passenger Capacity) Validation

#### Test Valid Capacities
1. Enter 1 ✅ Should be valid
2. Enter 45 ✅ Should be valid
3. Enter 100 ✅ Should be valid

#### Test Invalid Capacities
1. Enter 0 ❌ Should show: "La capacidad mínima es 1 pasajero"
2. Enter 101 ❌ Should show: "La capacidad máxima es 100 pasajeros"
3. Enter -5 ❌ Should show capacity error
4. Enter "abc" ❌ Should show: "La capacidad debe ser un número válido"

### 4. Número de Motor (Engine Number) Validation

#### Test Valid Engine Numbers
1. Enter `ABC123DEF456` ✅ Should be valid (12 chars)
2. Enter `123456` ✅ Should be valid (6 chars minimum)
3. Enter `ABC-123` ✅ Should be valid (with hyphen)

#### Test Invalid Engine Numbers
1. Enter `12345` ❌ Should show: "El número de motor debe tener al menos 6 caracteres"
2. Enter `ABC@123` ❌ Should show: "El número de motor solo puede contener letras, números y guiones"

### 5. Número de Chasis (Chassis Number) Validation

#### Test Valid Chassis Numbers
1. Enter `XYZ789GHI012` ✅ Should be valid (12 chars)
2. Enter `789012` ✅ Should be valid (6 chars minimum)
3. Enter `XYZ-789` ✅ Should be valid (with hyphen)

#### Test Invalid Chassis Numbers
1. Enter `78901` ❌ Should show: "El número de chasis debe tener al menos 6 caracteres"
2. Enter `XYZ@789` ❌ Should show: "El número de chasis solo puede contener letras, números y guiones"

### 6. Número de TUC Validation

#### Test Valid TUC Numbers
1. Enter `T-123456-2025` ✅ Should be valid

#### Test Invalid TUC Numbers
1. Enter `T-12345-2025` ❌ Should show format error (5 digits instead of 6)
2. Enter `T-123456-25` ❌ Should show format error (2 digits instead of 4)
3. Enter `123456-2025` ❌ Should show format error (missing letter)

### 7. Technical Specifications Validation

#### Test Cilindros (Cylinders)
- Valid: 1, 4, 6, 8, 12, 16 ✅
- Invalid: 0 ❌ "Mínimo 1 cilindro"
- Invalid: 17 ❌ "Máximo 16 cilindros"

#### Test Ejes (Axles)
- Valid: 2, 3, 4, 5, 6 ✅
- Invalid: 1 ❌ "Mínimo 2 ejes"
- Invalid: 7 ❌ "Máximo 6 ejes"

#### Test Ruedas (Wheels)
- Valid: 4, 6, 8, 10, 18, 24 ✅
- Invalid: 3 ❌ "Mínimo 4 ruedas"
- Invalid: 25 ❌ "Máximo 24 ruedas"

#### Test Peso Neto (Net Weight)
- Valid: 0, 5000, 50000 ✅
- Invalid: -1 ❌ "El peso no puede ser negativo"
- Invalid: 50001 ❌ "Peso máximo: 50000 kg"

#### Test Peso Bruto (Gross Weight)
- Valid: 0, 8000, 100000 ✅
- Invalid: -1 ❌ "El peso no puede ser negativo"
- Invalid: 100001 ❌ "Peso máximo: 100000 kg"

### 8. Brand Autocomplete

#### Test Autocomplete Functionality
1. Click on the "Marca" field
2. Verify dropdown shows popular brands:
   - TOYOTA
   - HYUNDAI
   - MERCEDES-BENZ
   - VOLVO
   - SCANIA
   - IVECO
   - MITSUBISHI
   - ISUZU
   - HINO
   - JAC
   - YUTONG
   - KING LONG
   - GOLDEN DRAGON
   - ZHONGTONG
   - FOTON

#### Test Custom Brand Entry
1. Type a custom brand name: `CUSTOM BRAND`
2. Verify it accepts the custom value
3. Verify form can be submitted with custom brand

### 9. Success Messages

#### Test Create Success
1. Fill out the form with valid data:
   - Placa: `TEST-999`
   - Marca: `TOYOTA`
2. Submit the form
3. Verify success message: "✓ Vehículo TEST-999 (TOYOTA) creado exitosamente"
4. Verify message duration is 4 seconds

#### Test Update Success
1. Edit an existing vehicle
2. Change some data
3. Submit the form
4. Verify success message: "✓ Vehículo [PLACA] actualizado exitosamente"
5. Verify message duration is 4 seconds

### 10. Error Messages

#### Test Create Error
1. Simulate a server error (disconnect network or use invalid data)
2. Try to create a vehicle
3. Verify error message: "✗ [Error details]"
4. Verify message duration is 5 seconds

#### Test Update Error
1. Simulate a server error
2. Try to update a vehicle
3. Verify error message: "✗ [Error details]"
4. Verify message duration is 5 seconds

## Visual Verification Checklist

### Icons
- [ ] Placa field shows appropriate icon based on validation state
- [ ] Valid icon is green check circle
- [ ] Invalid icon is red error icon
- [ ] Async validation shows hourglass icon
- [ ] Default icons are field-specific (car, calendar, etc.)

### Error Messages
- [ ] Error messages appear below the field
- [ ] Error messages have slide-in animation
- [ ] Error messages are specific and actionable
- [ ] Error messages disappear when field becomes valid

### Hints
- [ ] Hints show valid formats and ranges
- [ ] Hints are visible below the field
- [ ] Hints are helpful and concise

### Success/Error Notifications
- [ ] Success notifications have green background
- [ ] Error notifications have red background
- [ ] Notifications include visual indicators (✓ or ✗)
- [ ] Notifications show for appropriate duration
- [ ] Notifications can be dismissed manually

## Browser Console Verification

### Check for Errors
1. Open browser console (F12)
2. Perform all validation tests
3. Verify no console errors appear
4. Verify validation logs are informative (if any)

### Check Network Requests
1. Open Network tab in browser console
2. Test duplicate plate validation
3. Verify async validation makes appropriate API calls
4. Verify debounce is working (not too many requests)

## Accessibility Verification

### Keyboard Navigation
- [ ] Can tab through all form fields
- [ ] Can submit form with Enter key
- [ ] Can close modal with Escape key
- [ ] Focus indicators are visible

### Screen Reader
- [ ] Error messages are announced
- [ ] Field labels are read correctly
- [ ] Hints are associated with fields
- [ ] Success/error notifications are announced

## Performance Verification

### Validation Performance
- [ ] Synchronous validation is instant
- [ ] Async validation has appropriate debounce (500ms)
- [ ] Form doesn't freeze during validation
- [ ] Multiple rapid inputs don't cause issues

### Form Submission
- [ ] Submit button disables during submission
- [ ] Loading indicator appears during submission
- [ ] Form doesn't allow double submission
- [ ] Form resets properly after successful submission

## Common Issues and Solutions

### Issue: Async validation not working
**Solution:** Check that VehiculoService.verificarPlacaDisponible() is implemented and returns Observable<boolean>

### Issue: Uppercase conversion not working
**Solution:** Verify convertirPlacaMayusculas() method is called on input event

### Issue: Duplicate validation allows same plate in edit mode
**Solution:** Verify vehiculoId is passed to placaDuplicadaValidator in edit mode

### Issue: Error messages not showing
**Solution:** Check that mat-error elements are inside mat-form-field and have proper *ngIf conditions

### Issue: Autocomplete not showing
**Solution:** Verify MatAutocompleteModule is imported and marcasPopulares array is populated

## Regression Testing

After making any changes, verify:
- [ ] All existing functionality still works
- [ ] No new console errors appear
- [ ] Form submission still works
- [ ] Validation doesn't break existing flows
- [ ] Performance hasn't degraded

## Sign-off

- [ ] All validation tests pass
- [ ] All UX improvements verified
- [ ] No console errors
- [ ] Accessibility verified
- [ ] Performance acceptable
- [ ] Documentation updated

**Verified by:** _______________
**Date:** _______________
**Notes:** _______________

---

## Quick Test Script

For rapid verification, run through this minimal test:

1. **Create Vehicle:**
   - Placa: `ABC-123` ✅
   - Marca: Select `TOYOTA` from autocomplete ✅
   - Año: Current year ✅
   - Submit and verify success message ✅

2. **Test Duplicate:**
   - Try to create with same placa `ABC-123` ❌
   - Verify duplicate error appears ✅

3. **Test Invalid Data:**
   - Placa: `ABC123` ❌
   - Año: `1989` ❌
   - Verify error messages appear ✅

4. **Edit Vehicle:**
   - Edit the created vehicle
   - Keep same placa (should be valid) ✅
   - Change marca to `HYUNDAI` ✅
   - Submit and verify success message ✅

If all these tests pass, the implementation is working correctly! ✅
