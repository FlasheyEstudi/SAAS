'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Building2,
  Calendar,
  ListTree,
  FolderTree,
  FileText,
  Users,
  Receipt,
  Landmark,
  FileBarChart,
  LayoutDashboard,
  Sparkles,
  Settings,
  Send,
  Loader2,
  Database,
  Trash2,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  Building,
  Target,
  ArrowLeftRight,
  UserCog,
  Shield,
  Bell,
  Paperclip,
  FileBarChart2,
  BarChart3,
  Search,
  ArrowDownToLine,
  Cog,
  ReceiptText,
  Calculator,
  Clock,
  BookX,
  Tags,
  GitBranch,
  Scale,
  Link as LinkIcon,
  Code as CodeIcon,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface EndpointDef {
  id: string
  method: HttpMethod
  url: string
  description: string
  body?: string
  queryParams?: string
}

interface ModuleDef {
  id: string
  name: string
  icon: React.ElementType
  endpoints: EndpointDef[]
}

interface ApiResult {
  status: number
  data: unknown
  time: number
}

// ─── Endpoint Definitions ────────────────────────────────────────────────────

const MODULES: ModuleDef[] = [
  // ──────── Módulos Core ─────────────────────────────────────────────────
  {
    id: 'empresas',
    name: 'Empresas',
    icon: Building2,
    endpoints: [
      { id: 'companies-list', method: 'GET', url: '/api/companies', description: 'Listar empresas', queryParams: '{\n  "limit": 10\n}' },
      { id: 'companies-create', method: 'POST', url: '/api/companies', description: 'Crear empresa', body: '{\n  "name": "Mi Empresa S.A.",\n  "taxId": "MIE200101ABC",\n  "currency": "MXN"\n}' },
      { id: 'companies-get', method: 'GET', url: '/api/companies/REPLACE_ID', description: 'Obtener empresa' },
      { id: 'companies-update', method: 'PUT', url: '/api/companies/REPLACE_ID', description: 'Actualizar empresa', body: '{\n  "name": "Mi Empresa Actualizada S.A.",\n  "taxId": "MIE200101XYZ",\n  "currency": "MXN"\n}' },
      { id: 'companies-delete', method: 'DELETE', url: '/api/companies/REPLACE_ID', description: 'Eliminar empresa' },
    ],
  },
  {
    id: 'periodos',
    name: 'Períodos Contables',
    icon: Calendar,
    endpoints: [
      { id: 'periods-list', method: 'GET', url: '/api/periods', description: 'Listar períodos', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'periods-create', method: 'POST', url: '/api/periods', description: 'Crear período', body: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'periods-get', method: 'GET', url: '/api/periods/REPLACE_ID', description: 'Obtener período' },
      { id: 'periods-update', method: 'PUT', url: '/api/periods/REPLACE_ID', description: 'Actualizar período', body: '{\n  "status": "OPEN"\n}' },
      { id: 'periods-close', method: 'POST', url: '/api/periods/REPLACE_ID/close', description: 'Cerrar período' },
      { id: 'periods-batch', method: 'POST', url: '/api/periods/batch', description: 'Crear año completo', body: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025\n}' },
    ],
  },
  {
    id: 'plan-cuentas',
    name: 'Plan de Cuentas',
    icon: ListTree,
    endpoints: [
      { id: 'accounts-list', method: 'GET', url: '/api/accounts', description: 'Listar cuentas', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'accounts-create', method: 'POST', url: '/api/accounts', description: 'Crear cuenta', body: '{\n  "companyId": "REPLACE_ID",\n  "code": "1000",\n  "name": "Activo",\n  "accountType": "ASSET",\n  "isGroup": true\n}' },
      { id: 'accounts-tree', method: 'GET', url: '/api/accounts/tree', description: 'Árbol completo', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'accounts-search', method: 'GET', url: '/api/accounts/search', description: 'Buscar cuentas', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "query": "banco"\n}' },
      { id: 'accounts-get', method: 'GET', url: '/api/accounts/REPLACE_ID', description: 'Obtener cuenta' },
      { id: 'accounts-update', method: 'PUT', url: '/api/accounts/REPLACE_ID', description: 'Actualizar cuenta', body: '{\n  "name": "Activo Corriente",\n  "isActive": true\n}' },
      { id: 'accounts-delete', method: 'DELETE', url: '/api/accounts/REPLACE_ID', description: 'Eliminar cuenta' },
    ],
  },
  {
    id: 'centros-costo',
    name: 'Centros de Costo',
    icon: FolderTree,
    endpoints: [
      { id: 'costcenters-list', method: 'GET', url: '/api/cost-centers', description: 'Listar centros', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'costcenters-create', method: 'POST', url: '/api/cost-centers', description: 'Crear centro', body: '{\n  "companyId": "REPLACE_ID",\n  "code": "CC01",\n  "name": "Administración Central"\n}' },
      { id: 'costcenters-tree', method: 'GET', url: '/api/cost-centers/tree', description: 'Árbol completo', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'costcenters-get', method: 'GET', url: '/api/cost-centers/REPLACE_ID', description: 'Obtener centro' },
      { id: 'costcenters-update', method: 'PUT', url: '/api/cost-centers/REPLACE_ID', description: 'Actualizar centro', body: '{\n  "name": "Admon. Central (Actualizado)",\n  "isActive": true\n}' },
      { id: 'costcenters-delete', method: 'DELETE', url: '/api/cost-centers/REPLACE_ID', description: 'Eliminar centro' },
    ],
  },
  {
    id: 'polizas',
    name: 'Pólizas / Libro Diario',
    icon: FileText,
    endpoints: [
      { id: 'journal-list', method: 'GET', url: '/api/journal-entries', description: 'Listar pólizas', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "periodId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'journal-create', method: 'POST', url: '/api/journal-entries', description: 'Crear póliza', body: '{\n  "companyId": "REPLACE_ID",\n  "periodId": "REPLACE_ID",\n  "entryType": "DIARIO",\n  "description": "Póliza de prueba",\n  "entryDate": "2025-01-15",\n  "lines": [\n    {\n      "accountId": "REPLACE_ACCOUNT_ID",\n      "description": "Cargo a banco",\n      "debit": 15000.00,\n      "credit": 0\n    },\n    {\n      "accountId": "REPLACE_ACCOUNT_ID_2",\n      "description": "Abono a ingresos",\n      "debit": 0,\n      "credit": 15000.00\n    }\n  ]\n}' },
      { id: 'journal-get', method: 'GET', url: '/api/journal-entries/REPLACE_ID', description: 'Obtener póliza con partidas' },
      { id: 'journal-update', method: 'PUT', url: '/api/journal-entries/REPLACE_ID', description: 'Actualizar póliza', body: '{\n  "description": "Póliza de prueba (actualizada)",\n  "entryDate": "2025-01-16"\n}' },
      { id: 'journal-delete', method: 'DELETE', url: '/api/journal-entries/REPLACE_ID', description: 'Eliminar póliza' },
      { id: 'journal-post', method: 'POST', url: '/api/journal-entries/REPLACE_ID/post', description: 'Publicar póliza' },
      { id: 'journal-lines-get', method: 'GET', url: '/api/journal-entries/REPLACE_ID/lines', description: 'Obtener partidas' },
      { id: 'journal-lines-add', method: 'POST', url: '/api/journal-entries/REPLACE_ID/lines', description: 'Agregar partida', body: '{\n  "accountId": "REPLACE_ACCOUNT_ID",\n  "description": "Nueva partida",\n  "debit": 5000.00,\n  "credit": 0\n}' },
      { id: 'journal-line-delete', method: 'DELETE', url: '/api/journal-entries/REPLACE_ID/lines/REPLACE_LINE_ID', description: 'Eliminar partida' },
      { id: 'journal-validate', method: 'POST', url: '/api/journal-entries/validate', description: 'Validar póliza (sin guardar)', body: '{\n  "companyId": "REPLACE_ID",\n  "periodId": "REPLACE_ID",\n  "entryType": "DIARIO",\n  "description": "Póliza de validación",\n  "entryDate": "2025-01-15",\n  "lines": [\n    {\n      "accountId": "REPLACE_ACCOUNT_ID",\n      "description": "Cargo",\n      "debit": 10000.00,\n      "credit": 0\n    },\n    {\n      "accountId": "REPLACE_ACCOUNT_ID_2",\n      "description": "Abono",\n      "debit": 0,\n      "credit": 10000.00\n    }\n  ]\n}' },
    ],
  },
  {
    id: 'terceros',
    name: 'Terceros',
    icon: Users,
    endpoints: [
      { id: 'thirdparties-list', method: 'GET', url: '/api/third-parties', description: 'Listar terceros', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'thirdparties-create', method: 'POST', url: '/api/third-parties', description: 'Crear tercero', body: '{\n  "companyId": "REPLACE_ID",\n  "name": "Juan Pérez García",\n  "type": "CUSTOMER",\n  "taxId": "PEGJ800101ABC",\n  "email": "juan@example.com",\n  "phone": "+52 555 123 4567"\n}' },
      { id: 'thirdparties-search', method: 'GET', url: '/api/third-parties/search', description: 'Buscar terceros', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "query": "Juan"\n}' },
      { id: 'thirdparties-get', method: 'GET', url: '/api/third-parties/REPLACE_ID', description: 'Obtener tercero' },
      { id: 'thirdparties-update', method: 'PUT', url: '/api/third-parties/REPLACE_ID', description: 'Actualizar tercero', body: '{\n  "name": "Juan Pérez García (Actualizado)",\n  "email": "juan.perez@example.com",\n  "type": "BOTH"\n}' },
      { id: 'thirdparties-delete', method: 'DELETE', url: '/api/third-parties/REPLACE_ID', description: 'Eliminar tercero' },
    ],
  },
  {
    id: 'facturas',
    name: 'Facturas',
    icon: Receipt,
    endpoints: [
      { id: 'invoices-list', method: 'GET', url: '/api/invoices', description: 'Listar facturas', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'invoices-create', method: 'POST', url: '/api/invoices', description: 'Crear factura', body: '{\n  "companyId": "REPLACE_ID",\n  "thirdPartyId": "REPLACE_ID",\n  "invoiceType": "SALE",\n  "number": "FAC-2025-001",\n  "issueDate": "2025-01-15",\n  "dueDate": "2025-02-15",\n  "totalAmount": 25000.00,\n  "description": "Factura de servicios profesionales"\n}' },
      { id: 'invoices-get', method: 'GET', url: '/api/invoices/REPLACE_ID', description: 'Obtener factura' },
      { id: 'invoices-update', method: 'PUT', url: '/api/invoices/REPLACE_ID', description: 'Actualizar factura', body: '{\n  "balanceDue": 20000.00,\n  "description": "Factura actualizada"\n}' },
      { id: 'invoices-delete', method: 'DELETE', url: '/api/invoices/REPLACE_ID', description: 'Eliminar factura' },
      { id: 'invoices-pay', method: 'POST', url: '/api/invoices/REPLACE_ID/pay', description: 'Registrar pago', body: '{\n  "amount": 10000.00,\n  "description": "Pago parcial"\n}' },
      { id: 'invoices-aging', method: 'GET', url: '/api/invoices/aging', description: 'Antigüedad de saldos', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "invoiceType": "SALE"\n}' },
      { id: 'invoices-summary', method: 'GET', url: '/api/invoices/summary', description: 'Resumen de facturas', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
    ],
  },
  {
    id: 'bancos',
    name: 'Bancos',
    icon: Landmark,
    endpoints: [
      { id: 'bankaccounts-list', method: 'GET', url: '/api/bank-accounts', description: 'Listar cuentas bancarias', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'bankaccounts-create', method: 'POST', url: '/api/bank-accounts', description: 'Crear cuenta bancaria', body: '{\n  "companyId": "REPLACE_ID",\n  "bankName": "BANPRO Nicaragua",\n  "accountNumber": "100123456789",\n  "accountType": "CHECKING"\n}' },
      { id: 'bankaccounts-get', method: 'GET', url: '/api/bank-accounts/REPLACE_ID', description: 'Obtener cuenta bancaria' },
      { id: 'bankmovements-list', method: 'GET', url: '/api/bank-movements', description: 'Listar movimientos', queryParams: '{\n  "bankAccountId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'bankmovements-create', method: 'POST', url: '/api/bank-movements', description: 'Crear movimiento', body: '{\n  "bankAccountId": "REPLACE_ID",\n  "movementDate": "2025-01-15",\n  "description": "Depósito de cliente",\n  "amount": 50000.00,\n  "movementType": "CREDIT"\n}' },
      { id: 'bankmovements-reconcile', method: 'POST', url: '/api/bank-movements/reconcile', description: 'Conciliar automáticamente', body: '{\n  "bankAccountId": "REPLACE_ID"\n}' },
    ],
  },

  // ──────── Módulos Nuevos ────────────────────────────────────────────────
  {
    id: 'activos-fijos',
    name: 'Activos Fijos',
    icon: Building,
    endpoints: [
      { id: 'fixedassets-list', method: 'GET', url: '/api/fixed-assets', description: 'Listar activos fijos', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'fixedassets-create', method: 'POST', url: '/api/fixed-assets', description: 'Crear activo fijo', body: '{\n  "companyId": "REPLACE_ID",\n  "code": "AF-001",\n  "name": "Servidor HP ProLiant",\n  "assetType": "MACHINERY",\n  "purchaseDate": "2025-01-15",\n  "purchaseAmount": 85000.00,\n  "usefulLife": 60,\n  "residualValue": 5000.00,\n  "accountId": "REPLACE_ID"\n}' },
      { id: 'fixedassets-get', method: 'GET', url: '/api/fixed-assets/REPLACE_ID', description: 'Obtener activo fijo' },
      { id: 'fixedassets-update', method: 'PUT', url: '/api/fixed-assets/REPLACE_ID', description: 'Actualizar activo fijo', body: '{\n  "name": "Servidor HP ProLiant (Actualizado)",\n  "usefulLife": 72,\n  "residualValue": 3000.00\n}' },
      { id: 'fixedassets-delete', method: 'DELETE', url: '/api/fixed-assets/REPLACE_ID', description: 'Eliminar activo fijo' },
      { id: 'fixedassets-depreciate', method: 'POST', url: '/api/fixed-assets/REPLACE_ID/depreciate', description: 'Depreciar activo', body: '{\n  "periodId": "REPLACE_ID",\n  "method": "STRAIGHT_LINE"\n}' },
      { id: 'fixedassets-bulk-depreciate', method: 'POST', url: '/api/fixed-assets/bulk-depreciate', description: 'Depreciar todos', body: '{\n  "companyId": "REPLACE_ID",\n  "periodId": "REPLACE_ID",\n  "method": "STRAIGHT_LINE"\n}' },
      { id: 'fixedassets-summary', method: 'GET', url: '/api/fixed-assets/summary', description: 'Resumen de activos', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'fixedassets-history', method: 'GET', url: '/api/fixed-assets/REPLACE_ID/history', description: 'Historial depreciación', queryParams: '{\n  "limit": 20\n}' },
    ],
  },
  {
    id: 'presupuestos',
    name: 'Presupuestos',
    icon: Target,
    endpoints: [
      { id: 'budgets-list', method: 'GET', url: '/api/budgets', description: 'Listar presupuestos', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "limit": 10\n}' },
      { id: 'budgets-create', method: 'POST', url: '/api/budgets', description: 'Crear presupuesto', body: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1,\n  "accountId": "REPLACE_ID",\n  "costCenterId": "REPLACE_ID",\n  "budgetedAmount": 50000.00,\n  "description": "Presupuesto de ventas enero"\n}' },
      { id: 'budgets-get', method: 'GET', url: '/api/budgets/REPLACE_ID', description: 'Obtener presupuesto' },
      { id: 'budgets-update', method: 'PUT', url: '/api/budgets/REPLACE_ID', description: 'Actualizar presupuesto', body: '{\n  "budgetedAmount": 60000.00,\n  "description": "Presupuesto actualizado"\n}' },
      { id: 'budgets-delete', method: 'DELETE', url: '/api/budgets/REPLACE_ID', description: 'Eliminar presupuesto' },
      { id: 'budgets-bulk', method: 'POST', url: '/api/budgets/bulk', description: 'Crear masivamente', body: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "budgets": [\n    {\n      "accountId": "REPLACE_ID",\n      "month": 1,\n      "budgetedAmount": 50000.00,\n      "description": "Enero"\n    },\n    {\n      "accountId": "REPLACE_ID",\n      "month": 2,\n      "budgetedAmount": 55000.00,\n      "description": "Febrero"\n    }\n  ]\n}' },
      { id: 'budgets-report', method: 'GET', url: '/api/budgets/report', description: 'Reporte presupuestal', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025\n}' },
      { id: 'budgets-variance', method: 'GET', url: '/api/budgets/variance', description: 'Variaciones', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
    ],
  },
  {
    id: 'tipos-cambio',
    name: 'Tipos de Cambio',
    icon: ArrowLeftRight,
    endpoints: [
      { id: 'exchangerates-list', method: 'GET', url: '/api/exchange-rates', description: 'Listar tipos de cambio', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'exchangerates-create', method: 'POST', url: '/api/exchange-rates', description: 'Crear tipo de cambio', body: '{\n  "companyId": "REPLACE_ID",\n  "fromCurrency": "USD",\n  "toCurrency": "MXN",\n  "rate": 17.25,\n  "date": "2025-01-15"\n}' },
      { id: 'exchangerates-get', method: 'GET', url: '/api/exchange-rates/REPLACE_ID', description: 'Obtener tipo de cambio' },
      { id: 'exchangerates-update', method: 'PUT', url: '/api/exchange-rates/REPLACE_ID', description: 'Actualizar tipo de cambio', body: '{\n  "rate": 17.50\n}' },
      { id: 'exchangerates-delete', method: 'DELETE', url: '/api/exchange-rates/REPLACE_ID', description: 'Eliminar tipo de cambio' },
      { id: 'exchangerates-latest', method: 'GET', url: '/api/exchange-rates/latest', description: 'Último tipo de cambio', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "fromCurrency": "USD",\n  "toCurrency": "MXN"\n}' },
      { id: 'exchangerates-convert', method: 'GET', url: '/api/exchange-rates/convert', description: 'Convertir moneda', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "fromCurrency": "USD",\n  "toCurrency": "MXN",\n  "amount": 1000\n}' },
    ],
  },
  {
    id: 'usuarios',
    name: 'Usuarios',
    icon: UserCog,
    endpoints: [
      { id: 'users-list', method: 'GET', url: '/api/users', description: 'Listar usuarios', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'users-create', method: 'POST', url: '/api/users', description: 'Crear usuario', body: '{\n  "companyId": "REPLACE_ID",\n  "name": "María López",\n  "email": "maria@example.com",\n  "password": "SecurePass123!",\n  "role": "ACCOUNTANT"\n}' },
      { id: 'users-get', method: 'GET', url: '/api/users/REPLACE_ID', description: 'Obtener usuario' },
      { id: 'users-update', method: 'PUT', url: '/api/users/REPLACE_ID', description: 'Actualizar usuario', body: '{\n  "name": "María López García",\n  "role": "MANAGER",\n  "isActive": true\n}' },
      { id: 'users-delete', method: 'DELETE', url: '/api/users/REPLACE_ID', description: 'Eliminar usuario' },
      { id: 'users-login', method: 'POST', url: '/api/users/login', description: 'Iniciar sesión', body: '{\n  "email": "maria@example.com",\n  "password": "SecurePass123!"\n}' },
      { id: 'users-stats', method: 'GET', url: '/api/users/stats', description: 'Estadísticas de usuarios', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'users-activity', method: 'GET', url: '/api/users/REPLACE_ID/activity', description: 'Actividad del usuario', queryParams: '{\n  "limit": 20\n}' },
      { id: 'users-change-password', method: 'POST', url: '/api/users/REPLACE_ID/change-password', description: 'Cambiar contraseña', body: '{\n  "currentPassword": "SecurePass123!",\n  "newPassword": "NewSecurePass456!"\n}' },
      { id: 'users-reset-password', method: 'POST', url: '/api/users/REPLACE_ID/reset-password', description: 'Reset contraseña', body: '{\n  "newPassword": "TempPass789!"\n}' },
    ],
  },

  // ──────── Reportes y Dashboard ────────────────────────────────────────
  {
    id: 'reportes',
    name: 'Reportes',
    icon: FileBarChart,
    endpoints: [
      { id: 'reports-trial', method: 'GET', url: '/api/reports/trial-balance', description: 'Balanza de Comprobación', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'reports-balance', method: 'GET', url: '/api/reports/balance-sheet', description: 'Balance General', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'reports-income', method: 'GET', url: '/api/reports/income-statement', description: 'Estado de Resultados', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
    ],
  },
  {
    id: 'reportes-avanzados',
    name: 'Reportes Avanzados',
    icon: FileBarChart2,
    endpoints: [
      { id: 'reports-cashflow', method: 'GET', url: '/api/reports/cash-flow', description: 'Flujo de efectivo', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'reports-equity', method: 'GET', url: '/api/reports/changes-equity', description: 'Cambios en patrimonio', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'reports-general-ledger', method: 'GET', url: '/api/reports/general-ledger', description: 'Libro mayor', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'reports-subsidiary-ledger', method: 'GET', url: '/api/reports/subsidiary-ledger', description: 'Mayor auxiliar', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "accountId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'reports-comparative', method: 'GET', url: '/api/reports/comparative', description: 'Comparativo', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year1": 2025,\n  "month1": 1,\n  "year2": 2024,\n  "month2": 1\n}' },
      { id: 'reports-account-movements', method: 'GET', url: '/api/reports/account-movements', description: 'Movimientos de cuenta', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "accountId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    endpoints: [
      { id: 'dashboard-kpis', method: 'GET', url: '/api/dashboard/kpis', description: 'KPIs del Dashboard', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'dashboard-recent', method: 'GET', url: '/api/dashboard/recent-movements', description: 'Últimos movimientos', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
    ],
  },
  {
    id: 'dashboard-avanzado',
    name: 'Dashboard Avanzado',
    icon: BarChart3,
    endpoints: [
      { id: 'dashboard-cash-positions', method: 'GET', url: '/api/dashboard/cash-positions', description: 'Posición de efectivo', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'dashboard-top-customers', method: 'GET', url: '/api/dashboard/top-customers', description: 'Top clientes', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'dashboard-top-suppliers', method: 'GET', url: '/api/dashboard/top-suppliers', description: 'Top proveedores', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'dashboard-expense-trends', method: 'GET', url: '/api/dashboard/expense-trends', description: 'Tendencias de gastos', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "months": 6\n}' },
      { id: 'dashboard-receivables', method: 'GET', url: '/api/dashboard/receivables-summary', description: 'Resumen CxC', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'dashboard-payables', method: 'GET', url: '/api/dashboard/payables-summary', description: 'Resumen CxP', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'dashboard-tax-summary', method: 'GET', url: '/api/dashboard/tax-summary', description: 'Resumen fiscal', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025\n}' },
      { id: 'dashboard-period-overview', method: 'GET', url: '/api/dashboard/period-overview', description: 'Vista general período', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
    ],
  },

  // ──────── Auditoría y Seguridad ────────────────────────────────────────
  {
    id: 'auditoria',
    name: 'Auditoría',
    icon: Shield,
    endpoints: [
      { id: 'audit-list', method: 'GET', url: '/api/audit', description: 'Listar bitácora', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 20\n}' },
      { id: 'audit-get', method: 'GET', url: '/api/audit/REPLACE_ID', description: 'Ver entrada de auditoría' },
      { id: 'audit-stats', method: 'GET', url: '/api/audit/stats', description: 'Estadísticas de auditoría', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'audit-export', method: 'GET', url: '/api/audit/export', description: 'Exportar auditoría', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "format": "csv",\n  "fromDate": "2025-01-01",\n  "toDate": "2025-06-30"\n}' },
    ],
  },

  // ──────── Notificaciones ───────────────────────────────────────────────
  {
    id: 'notificaciones',
    name: 'Notificaciones',
    icon: Bell,
    endpoints: [
      { id: 'notifications-list', method: 'GET', url: '/api/notifications', description: 'Listar notificaciones', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 20\n}' },
      { id: 'notifications-create', method: 'POST', url: '/api/notifications', description: 'Crear notificación', body: '{\n  "companyId": "REPLACE_ID",\n  "userId": "REPLACE_ID",\n  "title": "Período por cerrar",\n  "message": "El período de enero 2025 está próximo a cerrar.",\n  "priority": "HIGH",\n  "entityType": "AccountingPeriod",\n  "entityId": "REPLACE_ID"\n}' },
      { id: 'notifications-get', method: 'GET', url: '/api/notifications/REPLACE_ID', description: 'Ver notificación' },
      { id: 'notifications-update', method: 'PUT', url: '/api/notifications/REPLACE_ID', description: 'Actualizar notificación', body: '{\n  "title": "Período por cerrar (Actualizado)",\n  "priority": "MEDIUM"\n}' },
      { id: 'notifications-read', method: 'POST', url: '/api/notifications/REPLACE_ID/read', description: 'Marcar como leída', body: '{}' },
      { id: 'notifications-mark-all-read', method: 'POST', url: '/api/notifications/mark-all-read', description: 'Marcar todas como leídas', body: '{\n  "companyId": "REPLACE_ID",\n  "userId": "REPLACE_ID"\n}' },
      { id: 'notifications-unread-count', method: 'GET', url: '/api/notifications/unread-count', description: 'Cantidad no leídas', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "userId": "REPLACE_ID"\n}' },
    ],
  },

  // ──────── Adjuntos ─────────────────────────────────────────────────────
  {
    id: 'adjuntos',
    name: 'Adjuntos',
    icon: Paperclip,
    endpoints: [
      { id: 'attachments-list', method: 'GET', url: '/api/attachments', description: 'Listar adjuntos', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 20\n}' },
      { id: 'attachments-create', method: 'POST', url: '/api/attachments', description: 'Crear adjunto', body: '{\n  "companyId": "REPLACE_ID",\n  "entityType": "JournalEntry",\n  "entityId": "REPLACE_ID",\n  "fileName": "factura-001.pdf",\n  "mimeType": "application/pdf",\n  "fileUrl": "/uploads/factura-001.pdf",\n  "fileSize": 245760,\n  "description": "Factura adjunta a póliza"\n}' },
      { id: 'attachments-get', method: 'GET', url: '/api/attachments/REPLACE_ID', description: 'Ver adjunto' },
      { id: 'attachments-delete', method: 'DELETE', url: '/api/attachments/REPLACE_ID', description: 'Eliminar adjunto' },
      { id: 'attachments-by-entity', method: 'GET', url: '/api/attachments/by-entity', description: 'Adjuntos por entidad', queryParams: '{\n  "entityType": "JournalEntry",\n  "entityId": "REPLACE_ID"\n}' },
    ],
  },

  // ──────── IA ───────────────────────────────────────────────────────────
  {
    id: 'ia',
    name: 'IA',
    icon: Sparkles,
    endpoints: [
      { id: 'ai-chat', method: 'POST', url: '/api/ai/chat', description: 'Chat con IA (Ollama)', body: '{\n  "companyId": "REPLACE_ID",\n  "message": "¿Cuál es el balance general del mes actual?"\n}' },
      { id: 'ai-status', method: 'GET', url: '/api/ai/status', description: 'Estado de Ollama' },
      { id: 'ai-models', method: 'GET', url: '/api/ai/models', description: 'Modelos disponibles' },
      { id: 'ai-tools', method: 'GET', url: '/api/ai/tools', description: 'Herramientas de IA' },
    ],
  },

  // ──────── Búsqueda ─────────────────────────────────────────────────────
  {
    id: 'busqueda',
    name: 'Búsqueda',
    icon: Search,
    endpoints: [
      { id: 'search-global', method: 'GET', url: '/api/search/global', description: 'Búsqueda global', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "q": "banco",\n  "limit": 20\n}' },
      { id: 'search-advanced', method: 'POST', url: '/api/search/advanced', description: 'Búsqueda avanzada', body: '{\n  "companyId": "REPLACE_ID",\n  "query": "facturas pendientes",\n  "filters": {\n    "entityTypes": ["Invoice", "ThirdParty"],\n    "dateFrom": "2025-01-01",\n    "dateTo": "2025-06-30"\n  },\n  "limit": 20\n}' },
    ],
  },

  // ──────── Import/Export ────────────────────────────────────────────────
  {
    id: 'import-export',
    name: 'Import/Export',
    icon: ArrowDownToLine,
    endpoints: [
      { id: 'data-export', method: 'POST', url: '/api/data/export', description: 'Exportar datos', body: '{\n  "companyId": "REPLACE_ID",\n  "entityType": "JournalEntry",\n  "format": "json",\n  "filters": {\n    "year": 2025,\n    "month": 1\n  }\n}' },
      { id: 'data-import', method: 'POST', url: '/api/data/import', description: 'Importar datos', body: '{\n  "companyId": "REPLACE_ID",\n  "entityType": "ThirdParty",\n  "data": [\n    {\n      "name": "Nuevo Proveedor",\n      "type": "SUPPLIER",\n      "taxId": "NPV200101ABC",\n      "email": "proveedor@example.com"\n    }\n  ]\n}' },
      { id: 'data-export-csv', method: 'GET', url: '/api/data/export-csv', description: 'Exportar CSV', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "entityType": "Account"\n}' },
    ],
  },

  // ──────── Sistema ──────────────────────────────────────────────────────
  {
    id: 'sistema',
    name: 'Sistema',
    icon: Cog,
    endpoints: [
      { id: 'seed', method: 'POST', url: '/api/seed', description: 'Sembrar datos de prueba', body: '{}' },
      { id: 'system-health', method: 'GET', url: '/api/system/health', description: 'Health check' },
      { id: 'system-stats', method: 'GET', url: '/api/system/stats', description: 'Estadísticas globales' },
      { id: 'system-validate-integrity', method: 'POST', url: '/api/system/validate-integrity', description: 'Validar integridad', body: '{\n  "companyId": "REPLACE_ID"\n}' },
      { id: 'system-cleanup', method: 'POST', url: '/api/system/cleanup', description: 'Limpieza', body: '{\n  "dryRun": true\n}' },
    ],
  },

  // ──────── Fiscal / Impuestos ─────────────────────────────────────────
  {
    id: 'tasas-impuesto',
    name: 'Tasas de Impuesto',
    icon: Calculator,
    endpoints: [
      { id: 'taxrates-list', method: 'GET', url: '/api/tax/rates', description: 'Listar tasas', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'taxrates-create', method: 'POST', url: '/api/tax/rates', description: 'Crear tasa', body: '{\n  "companyId": "REPLACE_ID",\n  "taxType": "IVA",\n  "rate": 0.16,\n  "name": "IVA 16%",\n  "isRetention": false,\n  "effectiveFrom": "2024-01-01"\n}' },
      { id: 'taxrates-get', method: 'GET', url: '/api/tax/rates/REPLACE_ID', description: 'Obtener tasa' },
      { id: 'taxrates-update', method: 'PUT', url: '/api/tax/rates/REPLACE_ID', description: 'Actualizar tasa', body: '{\n  "name": "IVA 16% (Actualizado)",\n  "rate": 0.16\n}' },
      { id: 'taxrates-delete', method: 'DELETE', url: '/api/tax/rates/REPLACE_ID', description: 'Eliminar tasa' },
    ],
  },
  {
    id: 'entradas-impuesto',
    name: 'Entradas de Impuesto',
    icon: ReceiptText,
    endpoints: [
      { id: 'taxentries-list', method: 'GET', url: '/api/tax/entries', description: 'Listar entradas', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'taxentries-create', method: 'POST', url: '/api/tax/entries', description: 'Crear entrada', body: '{\n  "companyId": "REPLACE_ID",\n  "invoiceId": "REPLACE_ID",\n  "taxRateId": "REPLACE_ID",\n  "taxType": "IVA",\n  "taxableBase": 10000.00,\n  "taxAmount": 1600.00,\n  "isRetention": false\n}' },
      { id: 'taxentries-get', method: 'GET', url: '/api/tax/entries/REPLACE_ID', description: 'Obtener entrada' },
      { id: 'taxentries-update', method: 'PUT', url: '/api/tax/entries/REPLACE_ID', description: 'Actualizar entrada', body: '{\n  "taxAmount": 1700.00\n}' },
      { id: 'taxentries-delete', method: 'DELETE', url: '/api/tax/entries/REPLACE_ID', description: 'Eliminar entrada' },
      { id: 'taxentries-by-invoice', method: 'GET', url: '/api/tax/entries/by-invoice/REPLACE_ID', description: 'Impuestos por factura' },
    ],
  },
  {
    id: 'reportes-fiscales',
    name: 'Reportes Fiscales',
    icon: Scale,
    endpoints: [
      { id: 'tax-iva-summary', method: 'GET', url: '/api/tax/reports/iva-summary', description: 'Resumen IVA', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'tax-diot', method: 'GET', url: '/api/tax/reports/diot', description: 'DIOT (DGI)', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'tax-withholding', method: 'GET', url: '/api/tax/reports/withholding', description: 'Retenciones', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
      { id: 'tax-monthly-declaration', method: 'GET', url: '/api/tax/reports/monthly-declaration', description: 'Declaración mensual', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "year": 2025,\n  "month": 1\n}' },
    ],
  },

  // ──────── Facturas Avanzado ──────────────────────────────────────────
  {
    id: 'facturas-detalle',
    name: 'Facturas - Detalle',
    icon: GitBranch,
    endpoints: [
      { id: 'inv-lines-list', method: 'GET', url: '/api/invoices/REPLACE_ID/lines', description: 'Líneas de factura' },
      { id: 'inv-lines-create', method: 'POST', url: '/api/invoices/REPLACE_ID/lines', description: 'Agregar línea', body: '{\n  "description": "Servicio profesional",\n  "quantity": 2,\n  "unitPrice": 5000.00,\n  "unit": "SERVICIO",\n  "discountRate": 0\n}' },
      { id: 'inv-lines-get', method: 'GET', url: '/api/invoices/REPLACE_ID/lines/REPLACE_LINE_ID', description: 'Obtener línea' },
      { id: 'inv-lines-update', method: 'PUT', url: '/api/invoices/REPLACE_ID/lines/REPLACE_LINE_ID', description: 'Actualizar línea', body: '{\n  "quantity": 3,\n  "unitPrice": 4500.00\n}' },
      { id: 'inv-lines-delete', method: 'DELETE', url: '/api/invoices/REPLACE_ID/lines/REPLACE_LINE_ID', description: 'Eliminar línea' },
      { id: 'inv-tax-entries-list', method: 'GET', url: '/api/invoices/REPLACE_ID/tax-entries', description: 'Impuestos de factura' },
      { id: 'inv-tax-entries-create', method: 'POST', url: '/api/invoices/REPLACE_ID/tax-entries', description: 'Agregar impuesto', body: '{\n  "taxRateId": "REPLACE_ID",\n  "taxType": "IVA",\n  "taxableBase": 10000.00,\n  "taxAmount": 1600.00\n}' },
      { id: 'inv-recalculate', method: 'POST', url: '/api/invoices/REPLACE_ID/recalculate', description: 'Recalcular totales', body: '{}' },
    ],
  },
  {
    id: 'programa-pagos',
    name: 'Programa de Pagos',
    icon: Clock,
    endpoints: [
      { id: 'inv-schedule-list', method: 'GET', url: '/api/invoices/REPLACE_ID/payment-schedule', description: 'Programa de pagos' },
      { id: 'inv-schedule-create', method: 'POST', url: '/api/invoices/REPLACE_ID/payment-schedule', description: 'Crear programa', body: '{\n  "paymentTermId": "REPLACE_ID"\n}' },
      { id: 'inv-schedule-get', method: 'GET', url: '/api/invoices/REPLACE_ID/payment-schedule/REPLACE_ID', description: 'Ver parcialidad' },
      { id: 'inv-schedule-update', method: 'PUT', url: '/api/invoices/REPLACE_ID/payment-schedule/REPLACE_ID', description: 'Actualizar parcialidad', body: '{\n  "expectedAmount": 5500.00\n}' },
      { id: 'inv-schedule-pay', method: 'POST', url: '/api/invoices/REPLACE_ID/payment-schedule/REPLACE_ID/pay', description: 'Pagar parcialidad', body: '{\n  "amount": 5000.00\n}' },
    ],
  },

  // ──────── Términos de Pago ───────────────────────────────────────────
  {
    id: 'terminos-pago',
    name: 'Términos de Pago',
    icon: Tags,
    endpoints: [
      { id: 'paymentterms-list', method: 'GET', url: '/api/payment-terms', description: 'Listar términos', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'paymentterms-create', method: 'POST', url: '/api/payment-terms', description: 'Crear término', body: '{\n  "companyId": "REPLACE_ID",\n  "code": "NET-30",\n  "name": "30 Días",\n  "days": 30\n}' },
      { id: 'paymentterms-get', method: 'GET', url: '/api/payment-terms/REPLACE_ID', description: 'Obtener término' },
      { id: 'paymentterms-update', method: 'PUT', url: '/api/payment-terms/REPLACE_ID', description: 'Actualizar término', body: '{\n  "name": "30 Días (Actualizado)",\n  "days": 30\n}' },
      { id: 'paymentterms-delete', method: 'DELETE', url: '/api/payment-terms/REPLACE_ID', description: 'Eliminar término' },
      { id: 'paymentterms-default', method: 'GET', url: '/api/payment-terms/default', description: 'Término por defecto', queryParams: '{\n  "companyId": "REPLACE_ID"\n}' },
    ],
  },

  // ──────── Conceptos Financieros ──────────────────────────────────────
  {
    id: 'conceptos',
    name: 'Conceptos Financieros',
    icon: BookX,
    endpoints: [
      { id: 'concepts-list', method: 'GET', url: '/api/financial-concepts', description: 'Listar conceptos', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'concepts-create', method: 'POST', url: '/api/financial-concepts', description: 'Crear concepto', body: '{\n  "companyId": "REPLACE_ID",\n  "code": "SER-PROF",\n  "name": "Servicios Profesionales",\n  "category": "SERVICIO"\n}' },
      { id: 'concepts-get', method: 'GET', url: '/api/financial-concepts/REPLACE_ID', description: 'Obtener concepto' },
      { id: 'concepts-update', method: 'PUT', url: '/api/financial-concepts/REPLACE_ID', description: 'Actualizar concepto', body: '{\n  "name": "Servicios Profesionales (Actualizado)"\n}' },
      { id: 'concepts-delete', method: 'DELETE', url: '/api/financial-concepts/REPLACE_ID', description: 'Eliminar concepto' },
      { id: 'concepts-by-category', method: 'GET', url: '/api/financial-concepts/by-category/SERVICIO', description: 'Por categoría' },
      { id: 'concepts-search', method: 'GET', url: '/api/financial-concepts/search', description: 'Buscar conceptos', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "query": "servicio"\n}' },
    ],
  },

  // ──────── Asientos de Cierre ─────────────────────────────────────────
  {
    id: 'cierre',
    name: 'Asientos de Cierre',
    icon: GitBranch,
    endpoints: [
      { id: 'closing-list', method: 'GET', url: '/api/closing-entries', description: 'Listar cierres', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "limit": 10\n}' },
      { id: 'closing-get', method: 'GET', url: '/api/closing-entries/REPLACE_ID', description: 'Obtener cierre' },
      { id: 'closing-preview', method: 'GET', url: '/api/closing-entries/preview', description: 'Vista previa cierre', queryParams: '{\n  "companyId": "REPLACE_ID",\n  "periodId": "REPLACE_ID",\n  "closingType": "INCOME_EXPENSE"\n}' },
      { id: 'closing-generate', method: 'POST', url: '/api/closing-entries/generate', description: 'Generar cierre', body: '{\n  "companyId": "REPLACE_ID",\n  "periodId": "REPLACE_ID",\n  "closingType": "INCOME_EXPENSE"\n}' },
      { id: 'closing-history', method: 'GET', url: '/api/closing-entries/history/REPLACE_ID', description: 'Historial cierres' },
    ],
  },

  // ──────── Conciliación Avanzada ──────────────────────────────────────
  {
    id: 'conciliacion',
    name: 'Conciliación Avanzada',
    icon: Scale,
    endpoints: [
      { id: 'recon-advanced', method: 'POST', url: '/api/reconciliation/advanced', description: 'Conciliar avanzado', body: '{\n  "bankAccountId": "REPLACE_ID",\n  "dateFrom": "2025-01-01",\n  "dateTo": "2025-01-31",\n  "tolerance": 0.01,\n  "autoApply": false\n}' },
      { id: 'recon-auto-match', method: 'POST', url: '/api/reconciliation/auto-match', description: 'Auto-conciliar', body: '{\n  "bankAccountId": "REPLACE_ID",\n  "strategy": "STRICT"\n}' },
      { id: 'recon-status', method: 'GET', url: '/api/reconciliation/status/REPLACE_ID', description: 'Estado conciliación' },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_COLORS = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (status >= 400 && status < 500) return 'bg-amber-100 text-amber-800 border-amber-200'
  if (status >= 500) return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function findEndpointById(id: string): { endpoint: EndpointDef; module: ModuleDef } | undefined {
  for (const mod of MODULES) {
    const ep = mod.endpoints.find((e) => e.id === id)
    if (ep) return { endpoint: ep, module: mod }
  }
  return undefined
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
  const [requestUrl, setRequestUrl] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [queryParams, setQueryParams] = useState('')
  const [response, setResponse] = useState<ApiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  const selected = selectedEndpointId ? findEndpointById(selectedEndpointId) : null

  const handleSelectEndpoint = useCallback((id: string) => {
    const found = findEndpointById(id)
    if (!found) return
    setSelectedEndpointId(id)
    setRequestUrl(found.endpoint.url)
    setRequestBody(found.endpoint.body ?? '')
    setQueryParams(found.endpoint.queryParams ?? '')
    setResponse(null)

    setExpandedModules((prev) => new Set([...prev, found.module.id]))
  }, [])

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }, [])

  const sendRequest = useCallback(async () => {
    if (!selected) return
    setLoading(true)
    setResponse(null)

    const startTime = performance.now()
    try {
      let url = requestUrl

      // Handle query params for GET requests
      if (selected.endpoint.method === 'GET' && queryParams.trim()) {
        try {
          const params = JSON.parse(queryParams)
          const qs = new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== null && v !== '')
              .map(([k, v]) => [k, String(v)])
          ).toString()
          if (qs) url += (url.includes('?') ? '&' : '?') + qs
        } catch {
          // invalid JSON — ignore
        }
      }

      const fetchOptions: RequestInit = {
        method: selected.endpoint.method,
        headers: { 'Content-Type': 'application/json' },
      }

      if (selected.endpoint.method !== 'GET' && requestBody.trim()) {
        try {
          fetchOptions.body = JSON.stringify(JSON.parse(requestBody), null, 2)
        } catch {
          fetchOptions.body = requestBody
        }
      }

      const res = await fetch(url, fetchOptions)
      const data = await res.json()
      const elapsed = Math.round(performance.now() - startTime)

      setResponse({ status: res.status, data, time: elapsed })
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime)
      setResponse({
         status: 0,
         data: { error: err instanceof Error ? err.message : 'Network error' },
         time: elapsed,
      })
    } finally {
      setLoading(false)
    }
  }, [selected, requestUrl, requestBody, queryParams])

  const handleSeed = useCallback(async () => {
    setLoading(true)
    setResponse(null)
    const startTime = performance.now()
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const data = await res.json()
      const elapsed = Math.round(performance.now() - startTime)
      setResponse({ status: res.status, data, time: elapsed })
      setSelectedEndpointId('seed')
      setRequestUrl('/api/seed')
      setRequestBody('{}')
      setQueryParams('')
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime)
      setResponse({
        status: 0,
        data: { error: err instanceof Error ? err.message : 'Network error' },
        time: elapsed,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleClear = useCallback(() => {
    setSelectedEndpointId(null)
    setRequestUrl('')
    setRequestBody('')
    setQueryParams('')
    setResponse(null)
  }, [])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  // Total endpoint count
  const totalEndpoints = MODULES.reduce((sum, m) => sum + m.endpoints.length, 0)

  return (
    <div className="min-h-screen flex flex-col bg-[#020202] text-slate-100 selection:bg-blue-500/30 overflow-hidden font-sans">
      {/* ─── Grid Background ────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5" />

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src="/logoBackend.png" className="w-9 h-9 object-contain relative z-10 transition-transform group-hover:scale-110" alt="Logo" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-black tracking-tighter text-white leading-none">
                  GANESHA SAAS
                </h1>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">API Explorer</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-black border-white/10 text-slate-400 uppercase tracking-widest bg-white/5">
              {totalEndpoints} endpoints
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={loading} className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-[10px] font-black uppercase tracking-widest h-8">
              {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Database className="mr-2 h-3 w-3" />}
              Seed Database
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={loading} className="text-slate-500 hover:text-red-400 hover:bg-red-500/5 text-[10px] font-black uppercase tracking-widest h-8">
              <Trash2 className="mr-2 h-3 w-3" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Info Banner ────────────────────────────────────────────── */}
      <div className="border-b border-blue-500/20 bg-blue-500/5 px-4 py-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 shrink-0" />
          <span>
            Paso 1: &quot;Seed Database&quot; para datos reales. Paso 2: Login en el Frontend.
          </span>
        </div>
        <div className="flex items-center gap-4 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          <span className="text-white/50">User: <span className="text-blue-300">admin@alpha.com.ni</span></span>
          <span className="text-white/50">Pass: <span className="text-blue-300">Admin123!</span></span>
        </div>
      </div>

      {/* ─── Main Layout ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar ──────────────────────────────────────────────── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-72 border-r border-white/5 bg-[#080808] text-slate-200
            pt-[105px] transition-transform duration-200 ease-in-out
            lg:relative lg:z-0 lg:translate-x-0 lg:pt-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-white/5 mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/80">Documentación API</h2>
              <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">Enterprise v2.5.0</p>
            </div>
            <nav className="px-3 pb-10 space-y-2">
              {MODULES.map((mod) => {
                const Icon = mod.icon
                const isExpanded = expandedModules.has(mod.id)
                return (
                   <div key={mod.id} className="space-y-1">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className={`
                        flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold
                        transition-all duration-300 group
                        ${isExpanded ? 'bg-white/5 text-white shadow-xl shadow-black/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                      `}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                        isExpanded ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-500 group-hover:bg-white/10"
                      )}>
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="truncate">{mod.name}</span>
                      <ChevronRight className={cn(
                        "ml-auto h-3 w-3 transition-transform duration-300 text-slate-600",
                        isExpanded && "rotate-90 text-blue-400"
                      )} />
                    </button>
                    {isExpanded && (
                      <div className="ml-7 mt-2 space-y-1 border-l border-white/5 pl-4">
                        {mod.endpoints.map((ep) => {
                          const isActive = selectedEndpointId === ep.id
                          return (
                            <button
                              key={ep.id}
                              onClick={() => handleSelectEndpoint(ep.id)}
                              className={`
                                flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[11px] transition-all duration-200
                                ${isActive 
                                  ? 'bg-blue-500/10 text-blue-400 font-bold border-l-2 border-blue-500 pl-4' 
                                  : 'text-slate-500 hover:text-slate-300 hover:pl-4'}
                              `}
                            >
                              <span
                                className={`inline-flex h-4 min-w-[32px] items-center justify-center rounded text-[9px] font-black tracking-tighter ${
                                  ep.method === 'GET'
                                    ? 'text-emerald-500'
                                    : ep.method === 'POST'
                                      ? 'text-blue-500'
                                      : ep.method === 'PUT'
                                        ? 'text-amber-500'
                                        : 'text-red-500'
                                }`}
                              >
                                {ep.method}
                              </span>
                              <span className="truncate">{ep.description}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* ─── Sidebar Overlay (mobile) ────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── Content Area ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <div key={selectedEndpointId || 'welcome'} className="mx-auto max-w-5xl p-6 lg:p-10">
            {!selected ? (
              /* ─── Welcome Screen ──────────────────────────────────── */
              <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="mb-10 relative group">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-colors" />
                  <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10 backdrop-blur-xl animate-float">
                    <Sparkles className="h-10 w-10 text-blue-400" />
                  </div>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Ganesha SaaS <span className="text-blue-500">API Explorer</span></h2>
                <p className="max-w-md text-sm text-slate-400 leading-relaxed">
                  Entorno de desarrollo y pruebas para la arquitectura Ganesha.
                  Control total sobre las entidades contables y financieras.
                </p>
                
                <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 w-full">
                  {MODULES.map((mod) => {
                    const Icon = mod.icon
                    return (
                      <button
                        key={mod.id}
                        onClick={() => {
                          setExpandedModules((prev) => new Set([...prev, mod.id]))
                          if (mod.endpoints.length > 0) {
                            handleSelectEndpoint(mod.endpoints[0].id)
                          }
                        }}
                        className="group flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-slate-400 transition-all hover:bg-white/[0.05] hover:border-white/20 hover:-translate-y-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:text-white transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{mod.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* ─── Endpoint Interface ─────────────────────────────── */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span className="text-blue-400">{selected.module.name}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-white">{selected.endpoint.description}</span>
                </div>

                {/* Endpoint Header Card */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                  <div className="relative rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                      <Badge className={`font-black text-[10px] px-3 py-1 uppercase tracking-widest ${METHOD_COLORS[selected.endpoint.method]}`}>
                        {selected.endpoint.method}
                      </Badge>
                      <code className="flex-1 rounded-xl bg-black/60 px-4 py-3 font-mono text-xs text-blue-300 border border-white/5">
                        {selected.endpoint.url}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Request Builder */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Petición (Request)</h3>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* URL */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <LinkIcon className="w-3 h-3" /> Endpoint URL
                        </label>
                        <Input
                          value={requestUrl}
                          onChange={(e) => setRequestUrl(e.target.value)}
                          className="bg-black border-white/10 text-white font-mono text-xs h-11 focus:ring-blue-500/20"
                          placeholder="/api/..."
                        />
                      </div>

                      {/* Query Params (GET) */}
                      {selected.endpoint.method === 'GET' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <CodeIcon className="w-3 h-3" /> Query Parameters (JSON)
                          </label>
                          <Textarea
                            value={queryParams}
                            onChange={(e) => setQueryParams(e.target.value)}
                            className="bg-black border-white/10 text-white font-mono text-xs min-h-[120px] p-4 resize-none focus:ring-blue-500/20"
                            placeholder='{"key": "value"}'
                          />
                        </div>
                      )}

                      {/* Request Body (POST/PUT) */}
                      {selected.endpoint.method !== 'GET' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <CodeIcon className="w-3 h-3" /> Request Body (JSON)
                          </label>
                          <Textarea
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            className="bg-black border-white/10 text-white font-mono text-xs min-h-[200px] p-4 resize-none focus:ring-blue-500/20"
                            placeholder='{"key": "value"}'
                          />
                        </div>
                      )}

                      <Button 
                        onClick={sendRequest} 
                        disabled={loading} 
                        className="w-full h-11 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-blue-500/20 border-none"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ejecutando...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Ejecutar Petición
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Response */}
                  {response && (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl shadow-black">
                      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Respuesta (Response)</h3>
                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] font-black border-white/10 uppercase tracking-widest ${
                              response.status >= 200 && response.status < 300 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                            }`}
                          >
                            {response.status === 0 ? 'ERR' : `HTTP ${response.status}`}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-[9px] border-white/5 text-slate-500">
                            {response.time}ms
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                          onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                        >
                          {copied ? <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
                          {copied ? 'Copiado' : 'Copiar'}
                        </Button>
                      </div>
                      <div className="p-0">
                        <ScrollArea className="max-h-[600px] bg-black">
                          <pre className="p-6 font-mono text-[11px] leading-relaxed text-blue-200/90 whitespace-pre">
                            {JSON.stringify(response.data, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </AnimatePresence>
        </main>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-white/5 bg-black px-6 py-4 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
          Ganesha Enterprise <span className="text-slate-800 mx-2">|</span> Backend API Explorer v2.5.0
        </p>
      </footer>
    </div>
  )
}
