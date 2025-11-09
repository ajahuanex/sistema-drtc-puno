# Integration Tests - Mesa de Partes Module

This directory contains comprehensive integration tests for the Mesa de Partes module.

## Test Coverage

### 1. Flujo Completo (test_flujo_completo.py)
Tests the complete document workflow from registration to completion:
- ✅ Document registration
- ✅ Document derivation to areas
- ✅ Document reception
- ✅ Document attention/completion
- ✅ Complete history tracking
- ✅ Multiple derivations in chain
- ✅ Flow with file attachments

### 2. Integración Externa (test_integracion_externa.py)
Tests external integration with other mesa de partes systems:
- ✅ Sending documents to external systems
- ✅ Receiving documents from external systems
- ✅ State synchronization
- ✅ Webhook reception and validation
- ✅ HMAC signature validation
- ✅ Field mapping between systems
- ✅ Synchronization logs
- ✅ Automatic retry on failure
- ✅ Connection testing

### 3. Sistema de Notificaciones (test_sistema_notificaciones.py)
Tests the complete notification system:
- ✅ Automatic notifications on derivation
- ✅ Priority notifications for urgent documents
- ✅ Alerts for documents about to expire
- ✅ Email notifications
- ✅ Mark notifications as read
- ✅ Filter notifications (read/unread)
- ✅ Real-time WebSocket notifications
- ✅ Daily notification summary
- ✅ Notification preferences configuration
- ✅ Automatic cleanup of old notifications

### 4. Generación de Reportes (test_generacion_reportes.py)
Tests report generation and statistics:
- ✅ General statistics
- ✅ Statistics by date range
- ✅ Distribution by document type
- ✅ Distribution by area
- ✅ Attention time metrics
- ✅ Custom report generation
- ✅ Excel export
- ✅ PDF export
- ✅ Temporal trend charts
- ✅ Overdue documents report
- ✅ Report by user
- ✅ Dashboard key indicators
- ✅ Comparative report between periods
- ✅ Automatic report scheduling

## Requirements

Install test dependencies:

```bash
pip install pytest pytest-asyncio httpx sqlalchemy aiosqlite openpyxl
```

## Running Tests

### Run all integration tests:
```bash
cd backend/app/tests/integration
pytest
```

### Run specific test file:
```bash
pytest test_flujo_completo.py
pytest test_integracion_externa.py
pytest test_sistema_notificaciones.py
pytest test_generacion_reportes.py
```

### Run specific test class:
```bash
pytest test_flujo_completo.py::TestFlujoCompletoDocumento
```

### Run specific test method:
```bash
pytest test_flujo_completo.py::TestFlujoCompletoDocumento::test_flujo_registro_derivacion_atencion
```

### Run with verbose output:
```bash
pytest -v
```

### Run with coverage:
```bash
pytest --cov=app.services.mesa_partes --cov=app.routers.mesa_partes --cov-report=html
```

### Run only slow tests:
```bash
pytest -m slow
```

### Run excluding slow tests:
```bash
pytest -m "not slow"
```

## Test Structure

Each test file follows this structure:

```python
@pytest.mark.asyncio
class TestClassName:
    """Test description"""
    
    async def test_method_name(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_fixtures...
    ):
        """Test specific functionality"""
        
        # Arrange
        # ... setup test data
        
        # Act
        response = await async_client.post(...)
        
        # Assert
        assert response.status_code == 200
        # ... more assertions
```

## Fixtures

Common fixtures available in `conftest.py`:

- `async_client`: HTTP client for API testing
- `db_session`: Database session
- `test_user`: Test user
- `test_area_origen`: Origin area
- `test_area_destino`: Destination area
- `test_tipo_documento`: Document type
- `test_documento`: Single test document
- `test_documentos_multiples`: Multiple test documents
- `test_integracion`: External integration
- `test_notificacion`: Test notification

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use fixtures with proper cleanup to avoid test pollution
3. **Assertions**: Use clear, specific assertions
4. **Naming**: Use descriptive test names that explain what is being tested
5. **Documentation**: Add docstrings to explain complex test scenarios

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Integration Tests
  run: |
    cd backend
    pytest app/tests/integration -v --tb=short
```

## Troubleshooting

### Database Issues
If you encounter database issues, ensure:
- SQLite is properly installed
- Test database is being created in memory
- Fixtures are properly cleaning up after tests

### Async Issues
If async tests fail:
- Ensure `pytest-asyncio` is installed
- Check that `asyncio_mode = auto` is set in pytest.ini
- Verify all async functions use `async def` and `await`

### Import Issues
If imports fail:
- Ensure you're running tests from the correct directory
- Check that all required packages are installed
- Verify PYTHONPATH includes the backend directory

## Coverage Goals

Target coverage for integration tests:
- Services: 90%+
- Routers: 85%+
- Critical flows: 100%

## Contributing

When adding new integration tests:
1. Follow the existing test structure
2. Add appropriate fixtures if needed
3. Update this README with new test descriptions
4. Ensure tests pass locally before committing
5. Add markers for slow or special tests
