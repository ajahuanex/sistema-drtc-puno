# Sistema de Agentes Especializados e Indexación Vectorial de Código (DRTC Puno)

Este documento detalla la estructura de **Agentes Especializados** creada para el monorepo y el **Sistema de Búsqueda Vectorial Semántica** diseñado para navegar y analizar el código consumiendo una cantidad mínima de tokens.

---

## 🤖 Agentes Especializados Creados

Los archivos de definición de agentes se ubican en la carpeta `.kiro/agents/`:

1. ⚙️ **Agente Backend** (`.kiro/agents/backend_agent.md`):
   - **Especialidad**: FastAPI, Python 3.11, Motor/PyMongo asíncrono, Pydantic v2.
   - **Reglas**: Estándar de `ObjectId` (`PyObjectId`), endpoints asíncronos, validaciones strictas y manejo de JWT.

2. 🎨 **Agente Frontend** (`.kiro/agents/frontend_agent.md`):
   - **Especialidad**: Angular 20 Standalone Components, Signals (`signal`, `computed`), Control Flow (`@if`, `@for`).
   - **Reglas**: Ausencia de `*ngIf`/`*ngFor`, uso obligatorio de `track`, reactividad limpia y componentes Angular Material.

3. 🗄️ **Agente Base de Datos** (`.kiro/agents/database_agent.md`):
   - **Especialidad**: MongoDB NoSQL, PyMongo, Agregaciones complejas e Índices Geoespaciales.
   - **Reglas**: Índices `2dsphere` para geometrías de rutas, scripts de migración idempotentes y preservación de `_id`.

4. 📜 **Agente Lógica de Negocio** (`.kiro/agents/business_logic_agent.md`):
   - **Especialidad**: Dominio normativo DRTC Puno.
   - **Reglas**: Vinculación obligatoria de resoluciones de `Renovación` a autorizaciones vigentes, ciclo de vida de vehículos/TUC y trazado de rutas regionales.

---

## 🔍 Búsqueda Vectorial e Indexación Semántica (Ahorro de Tokens)

Para evitar leer archivos gigantes de 500+ líneas y gastar tokens innecesarios, se han creado dos scripts optimizados en la carpeta `scripts/`:

### 1. Indexación del Código (`scripts/vector_code_indexer.py`)
Genera vectores semánticos y TF-IDF comprimidos de todas las funciones, clases, componentes y schemas de `backend/` y `frontend/`.
- **Ejecución manual**:
  ```bash
  python scripts/vector_code_indexer.py
  ```
- **O ejecutando**:
  ```cmd
  INSTALAR_BUSQUEDA_VECTORIAL.bat
  ```

### 2. Búsqueda Vectorial CLI (`scripts/vector_code_search.py`)
Permite consultar el código usando lenguaje natural y retorna **únicamente** los fragmentos exactos de 30-50 líneas más relevantes con sus enlaces directos al archivo y número de línea.

#### Ejemplos de uso:
- **Buscar lógica de renovación de resoluciones**:
  ```bash
  python scripts/vector_code_search.py "renovacion resolucion empresa"
  ```
- **Buscar componentes de tabla o select de vehículos**:
  ```bash
  python scripts/vector_code_search.py "mat-select vehiculo empresa"
  ```
- **Buscar modelos de Pydantic de rutas**:
  ```bash
  python scripts/vector_code_search.py "rutas pydantic schema"
  ```

---

## 💡 Ventajas de Token Optimization
- **Reducción del 80% al 90%** en la lectura de contexto innecesario.
- Mayor precisión en la detección de funciones, variables y componentes.
- Enlaces con formato `file:///` con línea de inicio y fin para salto directo en la IDE.
