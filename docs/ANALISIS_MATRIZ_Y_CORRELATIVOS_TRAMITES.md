# Análisis Técnico: Matriz Operacional y Correlativos por Año en Centro de Trámites

**Fecha:** 21 de Octubre de 2026  
**Sistema:** SIRRETT - DRTC Puno  
**Módulos Afectados:** Centro de Trámites, Inicializador de Datos (`DB_MATRIZ`), Resoluciones Hijas, Flota Empresa.

---

## 1. Contexto y Problemática Detectada
En la implementación inicial del Centro de Trámites:
1. El listado ordenaba prioritariamente por la `fecha_resolucion` (fecha física/legal del acto administrativo), dejando al fondo los trámites recién registrados si correspondían a resoluciones con fechas pasadas.
2. El código correlativo (`TR-XXXX-YY`) se generaba en memoria en el navegador de manera volátil, recalculándose según la posición del elemento en el array ordenado.
3. Se detectó la necesidad crítica de:
   - Que el orden por defecto muestre **el último trámite realizado en el sistema** (`fecha_registro` DESC).
   - Que los trámites estén **segmentados por año** de manera inmutable.
   - Definir claramente la línea base entre **Años Recientes (2025 y 2026)** y **Años Anteriores (< 2025: Históricos)**.

---

## 2. Radiografía de la Matriz Oficial (`DB_MATRIZ` Google Sheets)
Tras analizar las **7,123 filas** reales del archivo maestro de la DRTC Puno:

| Bloque / Categoría | Filas en Matriz | Trámites / Resoluciones Únicas | Tratamiento en el Sistema |
| :--- | :---: | :---: | :--- |
| **Flota Matriz (Sin RDR)** | **4,799** | — | **No generan trámite**. Representan el padrón original vehicular autorizado con la concesión matriz (`RDR_PRIMIGENIA`). |
| **Año 2026** | **606** | **390** | Trámites activos del periodo en curso (`0004-2026-I`, `0059-2026-S`, etc.). Tienen Expediente (85%) y Fecha de Emisión (98%). |
| **Año 2025** | **529** | **383** | Trámites del año inmediato anterior. Forman parte del periodo reciente base. |
| **Año 2024** | **505** | **333** | Histórico documental. |
| **Año 2023** | **311** | **192** | Histórico documental. |
| **<= 2022 y anteriores** | **373** | **~130** | Acervo histórico documental de archivo físico. |

---

## 3. Política de Correlativos y Segmentación por Año

### A. Periodo Histórico (< 2025)
* **Principio:** No existía sistema informático en esos años; no se debe inventar un código transaccional `TR-XXXX`.
* **Identificador:** Su propio **Número de Resolución** (`R-0623-2022`, `R-0829-2023`).
* **Campo `correlativo_tramite`:** `null` o etiqueta `DOCUMENTAL`.

### B. Periodo Activo (2025 - 2026)
* **Principio:** Transacciones con trazabilidad digital y correlativo anual del sistema:
  $$\text{TR-}XXXX-\text{AAAA}$$
* **Inicialización de Datos:**
  1. Los 390 trámites de 2026 se ordenan de forma ascendente por el número de resolución / fecha de emisión oficial.
  2. Se les asigna correlativo base desde `TR-0001-2026` hasta `TR-0390-2026`.
  3. El contador en base de datos MongoDB para el 2026 se fija en **390**.
* **Operación en Vivo (Nuevos Trámites):**
  - Cualquier nuevo trámite procesado en el Centro de Trámites recibe automáticamente:
    $$\text{TR-0391-2026}, \text{TR-0392-2026}, \dots$$
  - Queda guardado permanentemente en la base de datos (inmutable).
  - Aparece en la **primera fila** de la tabla ordenado por `fecha_registro` descendente.

---

## 4. Tareas Acordadas para la Próxima Sesión
1. **Inicializador (`FlotaEmpresaExcelService`)**:
   - Ajustar la ingesta de la etapa 5 para distinguir el padrón matriz (sin RDR) de los trámites.
   - Numerar los 390 trámites de 2026 con `TR-0001-2026` a `TR-0390-2026` y fijar el contador anual.
2. **Backend (`flota_empresa_service.py`)**:
   - Asignar el siguiente correlativo secuencial anual (`TR-XXXX-AAAA`) de forma atómica en cada nuevo trámite masivo.
3. **Frontend (`CentroTramites`)**:
   - Cambiar el orden por defecto para priorizar `fecha_registro` DESC (último trámite arriba).
   - Agregar selector o pestañas de visualización por año (`2026`, `2025`, `Histórico < 2025`, `Todos`).
