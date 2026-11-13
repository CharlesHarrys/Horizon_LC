# BLUEPRINT ARQUITECTÓNICO & ESPECIFICACIÓN TÉCNICA MAESTRA
# HORIZON LC (HORIZON LEDGER CORE) & ENTERPRISE ERP SUITE

**Versión:** 4.0.0 (Baseline de Producción & Cierre de Sprints 1, 2, 3, 4 y C)  
**Entorno de Datos:** Dual SQLite (Desarrollo Local) / PostgreSQL 15+ (Producción Cloud)  
**Motor de Migraciones:** Alembic (`backend/alembic/`)  
**Cobertura de Pruebas:** 120 / 120 Tests Automatizados en Verde (100% OK)  

---

## 1. VISIÓN GENERAL Y ARQUITECTURA DEL SISTEMA

**Horizon LC (Horizon Ledger Core)** es una plataforma ERP modular de grado empresarial diseñada bajo principios de arquitectura limpia, diseño guiado por el dominio (DDD) y segregación de responsabilidades de comando y consulta (CQRS).

```
                               ┌────────────────────────────────────────────────────────┐
                               │               HORIZON LEDGER COCKPIT UI                │
                               │  (Lobby, Compras, Inventario, Producción, CxP, Bancos) │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           │ HTTP / JSON REST
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                   FASTAPI BACKEND CORE                 │
                               │  - Multi-tenant Context (company_id)                   │
                               │  - API Router v1 (/api/v1/*)                           │
                               │  - Dependency Injection & Security (JWT)               │
                               └───────────┬────────────────────────────────┬───────────┘
                                           │                                │
                  ┌────────────────────────┴──────────────┐                 │
                  ▼                                       ▼                 ▼
     ┌────────────────────────┐              ┌────────────────────────┐ ┌────────────────────────┐
     │   COMMAND PIPELINE     │              │     QUERY PIPELINE     │ │  AI CFO COPILOT / OCR  │
     │  - Partida Doble Core  │              │  - Ledgers NIIF        │ │  - NLU Determinista    │
     │  - Kardex Perpetuo CPP │              │  - Antigüedad CxP / CxC│ │  - Simulación FX BCH   │
     │  - 3-Way Match & OPs   │              │  - Expediente 360°     │ │  - Parser Fiscal SAR   │
     └────────────┬───────────┘              └────────────┬───────────┘ └───────────┬────────────┘
                  │                                       │                         │
                  └────────────────────────┬──────────────┴─────────────────────────┘
                                           │
                                           │ SQLAlchemy 2.0 ORM + Alembic
                                           ▼
                               ┌────────────────────────────────────────┐
                               │           PERSISTENCE LAYER            │
                               │  SQLite (dev_erp.db) / PostgreSQL 15+  │
                               │  56 Tablas Mapeadas & Versionadas      │
                               └────────────────────────────────────────┘
```

---

## 2. LOS 6 ESQUEMAS LÓGICOS Y LAS 56 TABLAS EMPRESARIALES

La base de datos se estructura en 6 dominios transaccionales estrictamente particionados por `company_id`:

### 2.1. Sistema, Seguridad & Metadatos Dinámicos (`sys_*`, `audit_*`, `ai_*`)
1. `sys_companies`: Empresas y razones sociales multi-inquilino (RTN, nivel operativo 1..3, moneda base, datos de contacto).
2. `sys_custom_field_definitions`: Definición de campos dinámicos sin DDL en tiempo de ejecución.
3. `sys_transaction_attachments`: Repositorio inmutable de evidencias documentales y hashes de verificación.
4. `audit_logs`: Trazabilidad forense inmutable (usuario, acción, tabla, entidad, diferencial antes/después).
5. `ai_assistant_logs`: Historial de consultas y auditorías ejecutadas por el Asistente Financiero Copiloto CFO.

### 2.2. Contabilidad Central & Libro Mayor NIIF (`acc_*`, `ast_*`)
6. `acc_accounts`: Catálogo jerárquico NIIF (`X.X.XX.XX.XXXX`) con validación de cuentas de último nivel postables.
7. `acc_fiscal_periods`: Control estricto de períodos mensuales, bloqueo operacional (*Soft Close*) y cierre anual (*Hard Close*).
8. `acc_journal_entries`: Cabecera de asientos de diario bimoneda con verificación estricta de partida doble.
9. `acc_journal_entry_lines`: Renglones contables con triple columna monetaria (`amount_currency`, `debit`, `credit`).
10. `acc_cost_center_allocations`: Distribuciones porcentuales multicentro de costo (Administración, Ventas, Operaciones).
11. `acc_prepaid_expenses`: Registro de cargos diferidos y pólizas de seguro pagadas por anticipado.
12. `acc_prepaid_expense_schedules`: Tabla de amortización mensual proyectada para gastos diferidos.
13. `ast_fixed_assets`: Padrón maestro de activos fijos (NIC 16), método de depreciación, costo de adquisición y vida útil.
14. `ast_fixed_asset_schedules`: Calendario de depreciación acumulada y gasto mensual proyectado.

### 2.3. Inventario Perpetuo, Kardex CPP & Logística Muelle (`inv_*`)
15. `inv_warehouses`: Bodegas operativas, centros de distribución y depósitos aduaneros.
16. `inv_items`: Catálogo maestro de artículos (Mercaderías, Materia Prima, Producto Terminado, Suministros, Servicios).
17. `inv_lots`: Control de lotes, números de serie y fechas de expiración.
18. `inv_stock_levels`: Existencias físicas por bodega, cantidad reservada, costo promedio ponderado y valuación total.
19. `inv_kardex_movements`: Kardex perpetuo inmutable valorado por Costo Promedio Ponderado continuo.
20. `inv_goods_receipts`: Recepciones físicas en muelle (GRN) para control logístico de entrada.
21. `inv_goods_receipt_lines`: Renglones de recepción en muelle con verificación de lote y cantidad recibida.
22. `inv_landed_costs`: Liquidación de importaciones y prorrateo de costos en destino (*Landed Cost* DUA).
23. `inv_landed_cost_lines`: Desglose de gastos de importación (Flete, Seguro, DAI, Gastos Portuarios).
24. `inv_transfer_orders`: Órdenes de traslado y transferencias entre bodegas.
25. `inv_transfer_order_lines`: Detalle de artículos y cantidades trasladadas con partida contable automática.

### 2.4. Compras, Fiscalidad SAR & Cuentas por Pagar (`pur_*`, `sup_*`)
26. `pur_suppliers`: Padrón oficial de proveedores (RTN de 14 dígitos, datos bancarios y perfiles de retención).
27. `pur_cai_ranges`: Rangos de facturación y códigos CAI autorizados por el SAR para cada proveedor.
28. `pur_purchase_orders`: Órdenes de compra autorizadas con precios y condiciones pactadas.
29. `pur_purchase_order_lines`: Líneas de detalle de órdenes de compra con control de cantidades pendientes.
30. `pur_invoices`: Facturas de compra y comprobantes fiscales SAR (Factura 01, Honorarios 02, NC 06, ND 07).
31. `pur_invoice_lines`: Detalle de facturas con imputación heterogénea (Inventario, Gastos, Activos Fijos).
32. `pur_accounts_payable`: Auxiliar de cartera CxP con saldo pendiente, cubeta de antigüedad y estado de saldado.
33. `pur_vendor_advances`: Anticipos otorgados a proveedores con cruce contable posterior.
34. `sup_payment_batches`: Lotes masivos de pago a proveedores para emisión bancaria ACH.
35. `sup_payment_batch_details`: Facturas agrupadas en lotes de pago con soporte de retenciones y deducciones.

### 2.5. Ventas Adaptativas, Facturación SAR & Cobros CxC (`sal_*`, `pos_*`)
36. `sal_customers`: Clientes comerciales y corporativos (RTN/DNI, límite de crédito, condiciones).
37. `sal_cai_ranges`: Rango de autorización CAI de emisión propia de facturas del emisor.
38. `sal_sales_invoices`: Facturas de venta multicanal (POS, Mayoreo, Contratos) con correlativo SAR oficial.
39. `sal_sales_invoice_lines`: Líneas de facturación con desglose fiscal (Gravado 15%, 18%, Exento, ISV).
40. `sal_payments`: Recibos de cobro y pagos recibidos en múltiples formas de liquidación.
41. `sal_factura_pago_detalles`: Desglose fraccionado de medios de pago (Efectivo, Tarjeta, Cheque, Transferencia).
42. `sal_customer_advances`: Anticipos de clientes y depósitos en garantía.
43. `sal_pos_sessions`: Sesiones operativas de cajas registradoras y turnos de facturación POS.
44. `sal_banco_movimientos_pendientes`: Depósitos bancarios de ventas pendientes de conciliar.
45. `pos_batch_settlements`: Liquidación y conciliación de lotes de terminales adquirentes POS (Pinpad).

### 2.6. Tesorería, Bancos & Manufactura Industrial (`bnk_*`, `caja_*`, `prd_*`)
46. `bnk_transactions`: Extracto bancario omnicanal unificado con hash anti-duplicidad de transacciones.
47. `bnk_rule_patterns`: Reglas heurísticas de auto-posteo contable de comisiones, intereses e impuestos bancarios.
48. `bnk_learning_memories`: Memoria predictiva de asociación entre descripciones bancarias y cuentas NIIF.
49. `bnk_email_accounts`: Cuentas IMAP configuradas para ingestión y lectura automática de notificaciones bancarias.
50. `caja_sesiones`: Control de apertura, operación y cierre de fondos de caja chica y ventanilla.
51. `caja_arqueo_denominaciones`: Arqueo físico de billetes y monedas en cierres de caja.
52. `caja_movimientos_internos`: Entradas y salidas de efectivo por gastos menores o reposición de fondo fijo.
53. `prd_recipes`: Recetas maestras de manufactura (BOM / Escandallos) con costo estándar teórico.
54. `prd_recipe_lines`: Insumos y materias primas requeridas por unidad de producto terminado con merma permitida.
55. `prd_production_orders`: Órdenes de producción (DRAFT, IN_PROGRESS, COMPLETED, CANCELLED) con costos reales liquidados.
56. `prd_order_consumptions`: Consumo real de materias primas y registro de mermas anormales imputadas al gasto.

---

## 3. MOTOR CONTABLE BIMONEDA & DIFERENCIAL CAMBIARIO

### 3.1. Triple Columna Monetaria en Cada Asiento
Cada línea contable en `acc_journal_entry_lines` implementa de forma obligatoria:
- `currency_code`: Código ISO 4217 de la transacción original (`HNL` o `USD`).
- `amount_currency`: Monto en la moneda origen de la transacción.
- `exchange_rate`: Tipo de cambio de referencia del Banco Central de Honduras (BCH).
- `debit`: Débito convertido a moneda funcional local (HNL).
- `credit`: Crédito convertido a moneda funcional local (HNL).

### 3.2. Asientos Cuadrados Inmutables
Toda transacción exige equilibrio algebraico estricto en moneda funcional:
$$\sum \text{Debe} - \sum \text{Haber} = 0.0000$$

### 3.3. Ganancia y Pérdida por Diferencial Cambiario Automático
Al registrar el pago de una factura en USD con tasa de cambio distinta a la tasa de emisión:
- **Tasa de Emisión:** $TC_1$ &rarr; Saldo pasivo inicial registrado en CxP.
- **Tasa de Liquidación:** $TC_2$ &rarr; Monto efectivamente desembolsado del banco.
- **Variación:**
  $$\Delta = \text{Monto USD} \times (TC_2 - TC_1)$$
  - Si $\Delta > 0$ (Depreciación de la moneda local): Se debita automáticamente a la cuenta **`5.3.01.01 - Pérdida por Diferencial Cambiario`**.
  - Si $\Delta < 0$ (Apreciación de la moneda local): Se acredita automáticamente a la cuenta **`4.2.01.01 - Ganancia por Diferencial Cambiario`**.

---

## 4. CAPA FISCAL SAR HONDURAS

### 4.1. Validación Estricta de Formatos Fiscales
- **RTN (Registro Tributario Nacional):** 14 dígitos numéricos obligatorios.
- **CAI (Código de Autorización de Impresión):** 32 caracteres hexadecimales organizados en bloques SAR (`XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX`).
- **Número Correlativo SAR:** 16 dígitos en formato `PPP-SSS-TD-NNNNNNNN` donde:
  - `PPP`: Establecimiento (Punto de Emisión).
  - `SSS`: Punto de Emisión (Sub-establecimiento).
  - `TD`: Tipo de Documento:
    - `01`: Factura Comercial
    - `02`: Recibo por Honorarios Profesionales
    - `06`: Nota de Crédito
    - `07`: Nota de Débito
    - `08`: Guía de Remisión
  - `NNNNNNNN`: Secuencia correlativa de 8 dígitos.

### 4.2. Régimen de Retenciones Tributarias
- **Retención 1% ISV (Decreto 17-2010):** Aplicable si la empresa compradora es agente retenedor calificado por el SAR sobre proveedores nacionales.
- **Retención 12.5% ISR:** Retención automática sobre honorarios profesionales (Tipo Documento `02`).
- **Retención 10% ISR Alquileres:** Aplicable sobre arrendamientos comerciales a personas naturales.

### 4.3. Pólizas DUA de Importación
Integración completa de declaraciones aduaneras desglosando Valor FOB USD, Flete Marítimo/Aéreo, Seguro, Derechos Arancelarios a la Importación (DAI) e ISV Aduanal 15%, incorporándolos al costo del inventario (*Landed Cost*).

---

## 5. MÓDULO DE MANUFACTURA (BOM / WIP / MERMAS)

1. **Estructura de Costeo Tripartito (NIC 2):**
   - **Materia Prima Directa (MPD):** Despacho desde almacén con salida de Kardex por Costo Promedio Ponderado.
   - **Mano de Obra Directa (MOD):** Imputación por horas estándar u operativas a la orden.
   - **Costos Indirectos de Fabricación (CIF):** Cuota absorbente aplicada de energía y depreciación de planta.
2. **Ciclo de Estados de la Orden de Producción:**
   - `DRAFT`: Planificación y reserva de materiales.
   - `IN_PROGRESS`: Consumo real de MPD en bodega; débito a cuenta de Inventario en Proceso (WIP).
   - `COMPLETED`: Liquidación final; traslado contable de WIP a Producto Terminado (`1.1.03.03`) y entrada a Kardex.
3. **Mermas y Variaciones:**
   - Merma normal (dentro del BOM): Se absorbe en el costo unitario del producto terminado.
   - Merma anormal (excedente): Se segrega contablemente y se debita a cuenta de pérdida operativa (`5.2.01.95 - Pérdida por Merma Anormal de Producción`).

---

## 6. BUSCADOR GLOBAL 360° Y EXPEDIENTES POR HILO (`thread_id`)

- **Búsqueda Federada Multientidad:** Localización concurrente en menos de 50 ms a través de Facturas SAR, Órdenes de Compra, Recepciones en Muelle (GRN), Notas de Crédito, Asientos de Diario y Movimientos de Kardex.
- **Búsqueda por Lotes:** Admite términos múltiples separados por comas (ej. `001-001-01-00001, GRN-2026-00045, BAC-998812`).
- **Expediente Completo del Hilo (`thread_id`):** Consolida en una vista unificada la orden de compra original, la recepción en bodega, la factura SAR, los pagos ACH y las notas de crédito de devolución, calculando en tiempo real el saldo neto del expediente.

---

## 7. COPILOTO FINANCIERO AI CFO & MOTOR OCR SAR / DUA

### 7.1. Cero Alucinaciones Numéricas
El motor analítico (`AIFinancialAssistantService`) implementa un pipeline determinístico que consulta directamente las tablas reales de `dev_erp.db`:
- **Cartera CxP y Simulación BCH:** Cálculo exacto de deudas en USD y simulación del impacto en lempiras ante variaciones de la tasa de cambio oficial.
- **Costos y Mermas:** Comparativa en vivo de costos BOM vs costos liquidados.
- **Inventario Crítico:** Detección de artículos bajo el punto de reorden y recepciones en muelle no facturadas.
- **Auditoría Fiscal:** Cuadratura del Crédito Fiscal ISV del período y retenciones SAR.

### 7.2. Experiencia de Usuario & Accesibilidad Universal
- **Atajo Global `Ctrl + J` / Botón Flotante:** Disponible en todos los Workspaces (`workspace_lobby.html`, `workspace_compras.html`, `workspace_inventarios.html`, `workspace_produccion.html`, `workspace_cxp.html`).
- **Auto-Captura OCR en Compras:** Dropzone con soporte de arrastrar, pegar (`Ctrl + V`) y muestras interactivas que autocompleta el formulario fiscal de compras y muestra alertas preventivas en vivo.

---

## 8. CONFIGURACIÓN DE BASE DE DATOS Y MIGRACIONES (ALEMBIC)

### 8.1. Estructura de Alembic
- **Archivo de Configuración:** `backend/alembic.ini` con `script_location = %(here)s/alembic`.
- **Entorno de Migración:** `backend/alembic/env.py` configurado con resolución dinámica de `DATABASE_URL` y soporte de `render_as_batch=True` para SQLite y soporte nativo para PostgreSQL.
- **Revisión Baseline Oficial:** `backend/alembic/versions/8d4a3649ba7b_horizon_lc_complete_enterprise_baseline.py` con el esquema completo de las 56 tablas, índices y restricciones de integridad referencial.

### 8.2. Variables de Entorno de Conexión (`connect.env` / `.env`)
```bash
# Desarrollo Local (SQLite)
DATABASE_URL=sqlite:///./dev_erp.db

# Producción Empresarial (PostgreSQL)
# DATABASE_URL=postgresql://usuario_erp:password_seguro@localhost:5432/erp_horizon_production
```

---

## 9. REPORTE DE CERTIFICACIÓN Y PRUEBAS

```text
Suite de Pruebas: backend/tests/run_tests.py
Estado Global:    120 / 120 Tests Pasando (100% Verde)
Errores / Fallas: 0 Errores, 0 Fallas, 0 Regresiones
Tiempo de Corrida: 9.258 segundos
```