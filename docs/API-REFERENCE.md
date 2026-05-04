# 📒 ERP Contable Enterprise — Referencia de API Completa

> **Base de datos:** SQLite (Prisma ORM) — `db/custom.db`  
> **Entidades:** 18 modelos  
> **Endpoints:** 100 rutas API  
> **Servidor:** Next.js 16 App Router en puerto **3000**  
> **Proxy:** Caddy reverse proxy en puerto **81**  
> **Stack:** TypeScript 5, Tailwind CSS 4, shadcn/ui  

---

## Formato de Respuesta

Todas las APIs responden en este formato:

```jsonc
// ✅ Éxito
{ "success": true, "data": { ... } }

// ✅ Éxito con paginación
{ "success": true, "data": { "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5, "hasNext": true, "hasPrev": false } } }

// ❌ Error
{ "success": false, "error": "Descripción del error" }
```

**Paginación estándar (GET listas):** `?page=1&limit=20&sortBy=createdAt&sortOrder=desc`  
**Filtros de búsqueda:** `?search=banco` (busca por campos de texto)  
**Aislamiento por empresa:** casi todas las rutas requieren `?companyId=ID`

---

## Entidades de BD (18)

| # | Modelo | Descripción | Relaciones principales |
|---|--------|-------------|----------------------|
| 1 | **Company** | Empresa / Tenant | → Periods, Accounts, Entries, ThirdParties, Invoices, Banks, Users, etc. |
| 2 | **AccountingPeriod** | Período contable (mes/año) | → Company, JournalEntries, DepreciationEntries |
| 3 | **Account** | Cuenta contable (árbol) | → Company, Parent↔Children (auto-ref), JournalLines, FixedAssets, Budgets |
| 4 | **CostCenter** | Centro de costo (árbol) | → Company, Parent↔Children, JournalLines, Budgets |
| 5 | **JournalEntry** | Póliza / Asiento contable | → Company, Period, Lines, Invoices, DepreciationEntries |
| 6 | **JournalEntryLine** | Partida de la póliza | → JournalEntry (cascade), Account, CostCenter |
| 7 | **ThirdParty** | Cliente / Proveedor | → Company, Invoices |
| 8 | **Invoice** | Factura (CxC / CxP) | → Company, ThirdParty, JournalEntry |
| 9 | **BankAccount** | Cuenta bancaria | → Company, BankMovements |
| 10 | **BankMovement** | Movimiento bancario | → BankAccount |
| 11 | **User** | Usuario del sistema | → Company, AuditLogs |
| 12 | **AuditLog** | Bitácora de auditoría | → Company, User |
| 13 | **ExchangeRate** | Tipo de cambio moneda | → Company |
| 14 | **FixedAsset** | Activo fijo | → Company, Account, DepreciationEntries |
| 15 | **DepreciationEntry** | Entrada de depreciación | → Company, FixedAsset, Period, JournalEntry |
| 16 | **Budget** | Presupuesto | → Company, Account, CostCenter |
| 17 | **Notification** | Notificación | → Company, User |
| 18 | **FileAttachment** | Archivo adjunto | → Company |

---

## Reglas de Negocio Críticas

1. **Partida doble estricta:** `SUM(debit) === SUM(credit)` en toda póliza. Se valida antes de persistir.
2. **Período cerrado = inmutable:** Períodos con status `CLOSED` o `LOCKED` no aceptan nuevas pólizas.
3. **Solo cuentas hoja en partidas:** `is_group=false` obligatorio en `JournalEntryLine.accountId`.
4. **Pólizas POSTED son inmutables:** No se pueden modificar ni eliminar después de publicar.
5. **Transacciones atómicas:** Toda escritura multi-entidad usa `db.$transaction()`.
6. **Secuencia de póliza:** Auto-generada por período (`0001`, `0002`, …).
7. **Unicidad por empresa:** Códigos de cuenta, números de factura, y combos empresa+período son únicos.

---

## Flujo de Trabajo Contable

```
1. SETUP
   POST /api/companies          → Crear empresa
   POST /api/periods/batch      → Crear 12 períodos del año
   POST /api/accounts           → Crear plan de cuentas (padres primero)
   POST /api/cost-centers       → Crear centros de costo
   POST /api/bank-accounts      → Registrar cuentas bancarias
   POST /api/third-parties      → Registrar clientes/proveedores

2. OPERACIÓN DIARIA
   POST /api/journal-entries    → Crear póliza (valida partida doble)
   POST /api/journal-entries/[id]/post → Publicar (afecta saldos)
   POST /api/invoices           → Registrar facturas
   POST /api/invoices/[id]/pay  → Registrar pagos
   POST /api/bank-movements     → Cargar movimientos bancarios

3. CIERRE DE PERÍODO
   POST /api/fixed-assets/bulk-depreciate → Depreciar activos
   POST /api/periods/[id]/close → Cerrar período

4. REPORTES Y ANÁLISIS
   GET /api/reports/trial-balance     → Balanza de comprobación
   GET /api/reports/balance-sheet     → Balance general
   GET /api/reports/income-statement  → Estado de resultados
   GET /api/reports/cash-flow         → Flujo de efectivo
   GET /api/dashboard/kpis            → KPIs del dashboard
```

---

## Configuración de IA Local (Ollama + Llama 3.2:1b)

La IA funciona en modo **fallback** por defecto (respuestas basadas en keywords). Para IA real:

```bash
# 1. Instalar Ollama en tu Linux
curl -fsSL https://ollama.com/install.sh | sh

# 2. Descargar el modelo
ollama pull llama3.2:1b

# 3. Iniciar el servicio (corre en http://localhost:11434)
ollama serve

# 4. Configurar en .env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b

# 5. Verificar
curl http://localhost:3000/api/ai/status
```

---

## 1. 🏢 Empresas (`/api/companies`) — 5 endpoints

| # | Method | Path | Descripción |
|---|--------|------|-------------|
| 1 | `POST` | `/api/companies` | Crear nueva empresa |
| 2 | `GET` | `/api/companies` | Listar empresas (paginación, búsqueda) |
| 3 | `GET` | `/api/companies/[id]` | Obtener empresa por ID |
| 4 | `PUT` | `/api/companies/[id]` | Actualizar empresa |
| 5 | `DELETE` | `/api/companies/[id]` | Eliminar empresa |

**POST /api/companies**
```json
{ "name": "Mi Empresa S.A.", "taxId": "MIE200101ABC", "currency": "MXN", "email": "info@miempresa.com", "address": "Av. Principal 123" }
```
**GET params:** `?page=1&limit=20&search=empresa`

---

## 2. 📅 Períodos Contables (`/api/periods`) — 7 endpoints

| # | Method | Path | Descripción |
|---|--------|------|-------------|
| 1 | `POST` | `/api/periods` | Crear período |
| 2 | `GET` | `/api/periods` | Listar períodos |
| 3 | `GET` | `/api/periods/[id]` | Obtener período |
| 4 | `PUT` | `/api/periods/[id]` | Actualizar período (cambiar status) |
| 5 | `DELETE` | `/api/periods/[id]` | Eliminar (solo OPEN sin pólizas) |
| 6 | `POST` | `/api/periods/[id]/close` | Cerrar período (no admite DRAFTs) |
| 7 | `POST` | `/api/periods/batch` | Crear año completo (12 meses) |

**POST /api/periods**
```json
{ "companyId": "ID", "year": 2024, "month": 1 }
```
**POST /api/periods/batch**
```json
{ "companyId": "ID", "year": 2024 }
```
**GET params:** `?companyId=ID&status=OPEN&year=2024`

---

## 3. 📋 Plan de Cuentas (`/api/accounts`) — 7 endpoints

| # | Method | Path | Descripción |
|---|--------|------|-------------|
| 1 | `POST` | `/api/accounts` | Crear cuenta |
| 2 | `GET` | `/api/accounts` | Listar cuentas (con hijos) |
| 3 | `GET` | `/api/accounts/tree` | Árbol completo |
| 4 | `GET` | `/api/accounts/search` | Autocompletar búsqueda |
| 5 | `GET` | `/api/accounts/[id]` | Obtener cuenta con hijos |
| 6 | `PUT` | `/api/accounts/[id]` | Actualizar (solo nombre/isActive) |
| 7 | `DELETE` | `/api/accounts/[id]` | Eliminar (sin partidas ni hijos) |

**POST /api/accounts**
```json
{ "companyId": "ID", "code": "1.1.01", "name": "Bancos", "parentId": "PARENT_ID", "accountType": "ASSET", "nature": "DEBITOR", "isGroup": false }
```
> `accountType`: ASSET, LIABILITY, EQUITY, INCOME, EXPENSE  
> `nature`: DEBITOR (activo/gasto), ACREEDOR (pasivo/patrimonio/ingreso)  
> `isGroup`: true = título/padre, false = hoja/movimiento

---

## 4. 🏷️ Centros de Costo (`/api/cost-centers`) — 6 endpoints

| # | Method | Path | Descripción |
|---|--------|------|-------------|
| 1 | `POST` | `/api/cost-centers` | Crear centro |
| 2 | `GET` | `/api/cost-centers` | Listar centros |
| 3 | `GET` | `/api/cost-centers/tree` | Árbol completo |
| 4 | `GET` | `/api/cost-centers/[id]` | Obtener con hijos |
| 5 | `PUT` | `/api/cost-centers/[id]` | Actualizar |
| 6 | `DELETE` | `/api/cost-centers/[id]` | Eliminar |

**POST /api/cost-centers**
```json
{ "companyId": "ID", "code": "ADM01", "name": "Dirección General", "parentId": "PARENT_ID" }
```

---

## 5. 📝 Pólizas / Libro Diario (`/api/journal-entries`) — 11 endpoints

| # | Method | Path | Descripción |
|---|--------|------|-------------|
| 1 | `POST` | `/api/journal-entries` | Crear póliza con partidas |
| 2 | `GET` | `/api/journal-entries` | Listar pólizas |
| 3 | `GET` | `/api/journal-entries/[id]` | Obtener con partidas |
| 4 | `PUT` | `/api/journal-entries/[id]` | Actualizar (solo DRAFT) |
| 5 | `DELETE` | `/api/journal-entries/[id]` | Eliminar (solo DRAFT) |
| 6 | `POST` | `/api/journal-entries/[id]/post` | Publicar póliza (DRAFT→POSTED) |
| 7 | `GET` | `/api/journal-entries/[id]/lines` | Obtener partidas |
| 8 | `POST` | `/api/journal-entries/[id]/lines` | Agregar partida |
| 9 | `PUT` | `/api/journal-entries/[id]/lines` | Actualizar partidas (bulk) |
| 10 | `DELETE` | `/api/journal-entries/[id]/lines/[lineId]` | Eliminar partida |
| 11 | `POST` | `/api/journal-entries/validate` | Validar sin guardar |

**POST /api/journal-entries** (el más crítico)
```json
{
  "companyId": "ID",
  "periodId": "PERIOD_ID",
  "description": "Venta de mercancía al contado",
  "entryDate": "2024-01-15",
  "entryType": "DIARIO",
  "lines": [
    { "accountId": "BANCO_ID", "costCenterId": null, "description": "Pago en BBVA", "debit": 118750, "credit": 0 },
    { "accountId": "VENTA_ID", "costCenterId": null, "description": "Venta contado", "debit": 0, "credit": 100000 },
    { "accountId": "IVA_ID", "costCenterId": null, "description": "IVA trasladado", "debit": 0, "credit": 18750 }
  ]
}
```
> Validaciones: período OPEN, cuentas hoja, partida doble cuadra, mínimo 2 partidas.  
> `entryType`: DIARIO, EGRESO, INGRESO, TRASPASO

**POST /api/journal-entries/validate** (dry-run)
```json
{ "companyId": "ID", "periodId": "ID", "lines": [...] }
```
→ Retorna `{ valid, errors, totalDebit, totalCredit, difference }`

**GET params:** `?companyId=ID&periodId=ID&status=POSTED&entryType=DIARIO&dateFrom=2024-01-01&dateTo=2024-01-31`

---

## 6. 👥 Terceros (`/api/third-parties`) — 5 endpoints

| # | Method | Path | Descripción |
|---|--------|------|-------------|
| 1 | `POST` | `/api/third-parties` | Crear tercero |
| 2 | `GET` | `/api/third-parties` | Listar terceros |
| 3 | `GET` | `/api/third-parties/search` | Autocompletar |
| 4 | `GET` | `/api/third-parties/[id]` | Obtener con resumen de facturas |
| 5 | `PUT` | `/api/third-parties/[id]` | Actualizar |
| 6 | `DELETE` | `/api/third-parties/[id]` | Eliminar |

**POST /api/third-parties**
```json
{ "companyId": "ID", "type": "CUSTOMER", "name": "Cliente S.A.", "taxId": "CLS200101ABC", "email": "ventas@cliente.com" }
```
> `type`: CUSTOMER, SUPPLIER, BOTH

---

## 7. 🧾 Facturas (`/api/invoices`) — 8 endpoints

| # | Method | Path | Descripción |
|---|--------|------|-------------|
| 1 | `POST` | `/api/invoices` | Crear factura |
| 2 | `GET` | `/api/invoices` | Listar facturas (con días morosos) |
| 3 | `GET` | `/api/invoices/[id]` | Obtener factura |
| 4 | `PUT` | `/api/invoices/[id]` | Actualizar estado/saldo |
| 5 | `DELETE` | `/api/invoices/[id]` | Eliminar (solo PENDING) |
| 6 | `POST` | `/api/invoices/[id]/pay` | Registrar pago |
| 7 | `GET` | `/api/invoices/aging` | Antigüedad de saldos (4 buckets) |
| 8 | `GET` | `/api/invoices/summary` | Resumen por estado |

**POST /api/invoices**
```json
{ "companyId": "ID", "thirdPartyId": "ID", "invoiceType": "SALE", "number": "FC-2024-0001", "issueDate": "2024-01-15", "dueDate": "2024-02-15", "totalAmount": 100000 }
```
> `invoiceType`: SALE (CxC), PURCHASE (CxP)  
> `balanceDue` se inicializa igual a `totalAmount`  
> `status`: PENDING → PARTIAL → PAID (se actualiza automáticamente al registrar pagos)

**GET /api/invoices/aging?companyId=ID&invoiceType=SALE&asOfDate=2024-06-30**
```json
{ "buckets": { "current": {"count":2, "total":405000}, "overdue_31_60": {...}, "overdue_61_90": {...}, "overdue_90_plus": {...} }, "totalOutstanding": 757000, "details": [...] }
```

---

## 8. 🏦 Bancos y Conciliación (`/api/bank-accounts` + `/api/bank-movements`) — 7 endpoints

| # | Method | Path | Descripción |
|---|--------|------|-------------|
| 1 | `POST` | `/api/bank-accounts` | Crear cuenta bancaria |
| 2 | `GET` | `/api/bank-accounts` | Listar (con conteo de movimientos) |
| 3 | `GET` | `/api/bank-accounts/[id]` | Obtener cuenta |
| 4 | `PUT` | `/api/bank-accounts/[id]` | Actualizar |
| 5 | `DELETE` | `/api/bank-accounts/[id]` | Eliminar |
| 6 | `POST` | `/api/bank-movements` | Crear movimiento bancario |
| 7 | `GET` | `/api/bank-movements` | Listar movimientos |
| 8 | `GET` | `/api/bank-movements/[id]` | Obtener movimiento |
| 9 | `PUT` | `/api/bank-movements/[id]` | Cambiar estado (RECONCILED) |
| 10 | `POST` | `/api/bank-movements/reconcile` | Conciliar automáticamente |

**POST /api/bank-movements/reconcile**
```json
{ "bankAccountId": "ID" }
```
→ Cruza movimientos PENDING con partidas contables por monto y fecha (±3 días).

---

## 9. 📊 Reportes Financieros (`/api/reports`) — 3 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `GET` | `/api/reports/trial-balance` | Balanza de comprobación (saldos por cuenta) |
| 2 | `GET` | `/api/reports/balance-sheet` | Balance general (activo=pasivo+patrimonio) |
| 3 | `GET` | `/api/reports/income-statement` | Estado de resultados (ingresos - gastos) |

**Params comunes:** `?companyId=ID&year=2024&month=1` (o `&periodId=ID`)

**GET /api/reports/trial-balance** → Saldos deudores/acreedores por cuenta (solo POSTED).  
**GET /api/reports/balance-sheet** → Total assets, liabilities, equity.  
**GET /api/reports/income-statement** → Total income, expenses, net income, gross margin %.

---

## 10. 📈 Reportes Avanzados (`/api/reports/*`) — 6 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `GET` | `/api/reports/cash-flow` | Estado de flujo de efectivo |
| 2 | `GET` | `/api/reports/changes-equity` | Estado de cambios en patrimonio |
| 3 | `GET` | `/api/reports/general-ledger` | Libro mayor (movimientos de una cuenta) |
| 4 | `GET` | `/api/reports/subsidiary-ledger` | Mayor auxiliar (movimientos de un tercero) |
| 5 | `GET` | `/api/reports/comparative` | Comparativo entre dos períodos |
| 6 | `GET` | `/api/reports/account-movements` | Todos los movimientos de una cuenta |

**GET /api/reports/general-ledger?companyId=ID&accountId=ID&year=2024&month=1**

---

## 11. 📉 Dashboard (`/api/dashboard`) — 2 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `GET` | `/api/dashboard/kpis` | KPIs: ingresos, egresos, utilidad, capital de trabajo, gráficos 6 meses |
| 2 | `GET` | `/api/dashboard/recent-movements` | Últimas 5 pólizas POSTED |

---

## 12. 📉 Dashboard Avanzado (`/api/dashboard/*`) — 8 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `GET` | `/api/dashboard/cash-positions` | Posición de efectivo en bancos |
| 2 | `GET` | `/api/dashboard/top-customers` | Top N clientes por ventas |
| 3 | `GET` | `/api/dashboard/top-suppliers` | Top N proveedores por compras |
| 4 | `GET` | `/api/dashboard/expense-trends` | Tendencias mensuales de gastos |
| 5 | `GET` | `/api/dashboard/receivables-summary` | Resumen CxC: total, vencido, buckets |
| 6 | `GET` | `/api/dashboard/payables-summary` | Resumen CxP: total, vencido, buckets |
| 7 | `GET` | `/api/dashboard/tax-summary` | IVA e ISR del período |
| 8 | `GET` | `/api/dashboard/period-overview` | Vista general: KPIs + alertas + pendientes |

---

## 13. 🏗️ Activos Fijos (`/api/fixed-assets`) — 9 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `POST` | `/api/fixed-assets` | Registrar activo fijo |
| 2 | `GET` | `/api/fixed-assets` | Listar activos |
| 3 | `GET` | `/api/fixed-assets/[id]` | Obtener activo |
| 4 | `PUT` | `/api/fixed-assets/[id]` | Actualizar / dar de baja |
| 5 | `DELETE` | `/api/fixed-assets/[id]` | Eliminar |
| 6 | `POST` | `/api/fixed-assets/[id]/depreciate` | Depreciar un activo |
| 7 | `POST` | `/api/fixed-assets/bulk-depreciate` | Depreciar TODOS los activos |
| 8 | `GET` | `/api/fixed-assets/summary` | Resumen: total, valor en libros, depreciación acumulada |
| 9 | `GET` | `/api/fixed-assets/[id]/history` | Historial de depreciación |

**POST /api/fixed-assets**
```json
{ "companyId": "ID", "code": "EQ-001", "name": "Servidor Principal", "assetType": "COMPUTER", "purchaseDate": "2024-01-01", "purchaseAmount": 80000, "salvageValue": 5000, "usefulLifeMonths": 60, "accountId": "ACCOUNT_ID" }
```
> `assetType`: BUILDING, FURNITURE, COMPUTER, VEHICLE, MACHINERY, OTHER

---

## 14. 💰 Presupuestos (`/api/budgets`) — 5 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `POST` | `/api/budgets` | Crear presupuesto |
| 2 | `GET` | `/api/budgets` | Listar presupuestos |
| 3 | `GET` | `/api/budgets/[id]` | Obtener |
| 4 | `PUT` | `/api/budgets/[id]` | Actualizar |
| 5 | `DELETE` | `/api/budgets/[id]` | Eliminar |
| 6 | `POST` | `/api/budgets/bulk` | Crear masivamente |
| 7 | `GET` | `/api/budgets/report` | Presupuesto vs real |
| 8 | `GET` | `/api/budgets/variance` | Mayores variaciones |

---

## 15. 💱 Tipos de Cambio (`/api/exchange-rates`) — 4 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `POST` | `/api/exchange-rates` | Registrar tipo de cambio |
| 2 | `GET` | `/api/exchange-rates` | Listar (por moneda y fecha) |
| 3 | `GET` | `/api/exchange-rates/[id]` | Obtener |
| 4 | `PUT` | `/api/exchange-rates/[id]` | Actualizar |
| 5 | `DELETE` | `/api/exchange-rates/[id]` | Eliminar |
| 6 | `GET` | `/api/exchange-rates/latest` | Último tipo (USD→MXN) |
| 7 | `GET` | `/api/exchange-rates/convert` | Convertir monto entre monedas |

**GET /api/exchange-rates/convert?companyId=ID&from=USD&to=MXN&amount=1000&date=2024-01-15**

---

## 16. 👤 Usuarios (`/api/users`) — 7 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `POST` | `/api/users` | Crear usuario |
| 2 | `GET` | `/api/users` | Listar usuarios |
| 3 | `GET` | `/api/users/[id]` | Obtener usuario |
| 4 | `PUT` | `/api/users/[id]` | Actualizar |
| 5 | `DELETE` | `/api/users/[id]` | Eliminar |
| 6 | `POST` | `/api/users/login` | Iniciar sesión |
| 7 | `GET` | `/api/users/stats` | Estadísticas (total, por rol) |
| 8 | `GET` | `/api/users/[id]/activity` | Actividad reciente (audit log) |
| 9 | `POST` | `/api/users/[id]/change-password` | Cambiar contraseña |
| 10 | `POST` | `/api/users/[id]/reset-password` | Reset contraseña (admin) |

**POST /api/users**
```json
{ "companyId": "ID", "email": "admin@empresa.com", "name": "Admin", "password": "hashed", "role": "ADMIN" }
```
> `role`: ADMIN, ACCOUNTANT, MANAGER, VIEWER

---

## 17. 🔍 Auditoría (`/api/audit`) — 4 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `GET` | `/api/audit` | Listar bitácora |
| 2 | `GET` | `/api/audit/[id]` | Ver entrada completa |
| 3 | `GET` | `/api/audit/stats` | Estadísticas (acciones por tipo/usuario/día) |
| 4 | `GET` | `/api/audit/export` | Exportar a JSON |

**GET params:** `?companyId=ID&action=CREATE&entityType=JournalEntry&dateFrom=2024-01-01`

---

## 18. 🔔 Notificaciones (`/api/notifications`) — 5 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `GET` | `/api/notifications` | Listar notificaciones |
| 2 | `POST` | `/api/notifications` | Crear notificación |
| 3 | `GET` | `/api/notifications/[id]` | Ver notificación |
| 4 | `PUT` | `/api/notifications/[id]` | Actualizar |
| 5 | `POST` | `/api/notifications/[id]/read` | Marcar como leída |
| 6 | `POST` | `/api/notifications/mark-all-read` | Marcar todas |
| 7 | `GET` | `/api/notifications/unread-count` | Cantidad no leídas |

> `type`: OVERDUE_INVOICE, PERIOD_CLOSE, BALANCE_MISMATCH, LOW_CASH, TASK_ASSIGNED, SYSTEM  
> `priority`: LOW, NORMAL, HIGH, URGENT

---

## 19. 📎 Adjuntos (`/api/attachments`) — 3 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `GET` | `/api/attachments` | Listar adjuntos |
| 2 | `POST` | `/api/attachments` | Crear registro de adjunto |
| 3 | `GET` | `/api/attachments/[id]` | Ver adjunto |
| 4 | `DELETE` | `/api/attachments/[id]` | Eliminar |
| 5 | `GET` | `/api/attachments/by-entity` | Adjuntos de una entidad |

**GET /api/attachments/by-entity?companyId=ID&entityType=Invoice&entityId=ID**

---

## 20. 🔎 Búsqueda (`/api/search`) — 2 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `GET` | `/api/search/global` | Búsqueda global (mín 3 chars) |
| 2 | `POST` | `/api/search/advanced` | Búsqueda avanzada multi-criterio |

**GET /api/search/global?companyId=ID&q=banco**
→ Busca en cuentas, terceros, pólizas, facturas simultáneamente.

---

## 21. 📤 Import/Export (`/api/data`) — 3 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `POST` | `/api/data/export` | Exportar datos a JSON |
| 2 | `POST` | `/api/data/import` | Importar datos desde JSON |
| 3 | `GET` | `/api/data/export-csv` | Exportar a CSV |

---

## 22. ⚙️ Sistema (`/api/system`) — 4 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `GET` | `/api/system/health` | Health check (DB connection + conteos) |
| 2 | `GET` | `/api/system/stats` | Estadísticas globales |
| 3 | `POST` | `/api/system/validate-integrity` | Validar integridad (partidas cuadran, sin huérfanos) |
| 4 | `POST` | `/api/system/cleanup` | Limpiar registros huérfanos |

---

## 23. 🤖 IA / Ollama (`/api/ai`) — 4 endpoints

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `POST` | `/api/ai/chat` | Chat con IA contable (Ollama o fallback) |
| 2 | `GET` | `/api/ai/status` | Estado de conexión Ollama |
| 3 | `GET` | `/api/ai/models` | Modelos disponibles en Ollama |
| 4 | `GET` | `/api/ai/tools` | Herramientas (function calling) disponibles |

**POST /api/ai/chat**
```json
{ "message": "Dame el balance de enero", "companyId": "ID", "history": [] }
```
→ Retorna `{ response, toolCalls?, usedFallback, ollamaAvailable }`  
→ Si Ollama no corre, devuelve respuestas fallback con guía de APIs.

**GET /api/ai/status** → `{ ollamaAvailable, model, url, loadedModels }`

---

## 24. 🗃️ Seed (`/api/seed`) — 1 endpoint

| # | Method | Path | ¿Para qué sirve? |
|---|--------|------|-----------------|
| 1 | `POST` | `/api/seed` | Poblar BD con datos de prueba |

```bash
curl -X POST http://localhost:3000/api/seed
```
→ Crea: 1 empresa, 6 períodos, ~85 cuentas, 13 centros de costo, 10 terceros, 25 pólizas, 15 facturas, 2 cuentas bancarias, 20 movimientos, 3 usuarios, 5 audit logs, 6 tipos de cambio, 4 activos fijos, 5 presupuestos, 3 notificaciones, 2 adjuntos.

---

## Resumen Total: 100 Endpoints

| Módulo | Endpoints |
|--------|-----------|
| Empresas | 5 |
| Períodos | 7 |
| Plan de Cuentas | 7 |
| Centros de Costo | 6 |
| Pólizas / Libro Diario | 11 |
| Terceros | 5 |
| Facturas | 8 |
| Bancos | 7 |
| Reportes Financieros | 3 |
| Reportes Avanzados | 6 |
| Dashboard | 2 |
| Dashboard Avanzado | 8 |
| Activos Fijos | 9 |
| Presupuestos | 5 |
| Tipos de Cambio | 4 |
| Usuarios | 7 |
| Auditoría | 4 |
| Notificaciones | 5 |
| Adjuntos | 3 |
| Búsqueda | 2 |
| Import/Export | 3 |
| Sistema | 4 |
| IA / Ollama | 4 |
| Seed | 1 |
| **TOTAL** | **100** |
