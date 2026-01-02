un monton, primero # Guía de Contribución - Sistema SIRRET

## 🎯 Estándares de Código

### Backend (FastAPI)
- Seguir las reglas en `.cursor/rules/fastapi.mdc`
- Usar type hints en todas las funciones
- Documentar APIs con docstrings
- Implementar tests unitarios

### Frontend (Angular 20)
- Seguir las reglas en `.cursor/rules/angular20.mdc`
- Usar componentes standalone
- Implementar Signals para estado
- Escribir tests para componentes

## 🔄 Flujo de Trabajo

1. **Fork** del repositorio
2. **Clone** tu fork localmente
3. **Crea** una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
4. **Desarrolla** siguiendo las reglas de Cursor
5. **Testea** tu código
6. **Commit** con mensajes descriptivos
7. **Push** a tu fork
8. **Crea** un Pull Request

## 📝 Convenciones de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato de código
refactor: refactorización
test: tests
chore: tareas de mantenimiento
```

### Ejemplos:
- `feat: agregar gestión de empresas`
- `fix: corregir validación de RUC`
- `docs: actualizar README`
- `style: formatear código según reglas`

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/
```

### Frontend
```bash
cd frontend
ng test
ng e2e
```

## 📋 Checklist de PR

- [ ] Código sigue las reglas de Cursor
- [ ] Tests pasan
- [ ] Documentación actualizada
- [ ] No hay conflictos de merge
- [ ] Mensaje de commit descriptivo 