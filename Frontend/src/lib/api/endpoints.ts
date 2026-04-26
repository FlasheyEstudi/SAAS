// Centralized API Endpoints Catalog - Matched with Backend APIs
export const AUTH = {
  login: '/users/login',
  register: '/users/register',
  users: '/users',
  getUser: (id: string) => `/users/${id}`,
  updateUser: (id: string) => `/users/${id}`,
  deleteUser: (id: string) => `/users/${id}`,
  changePassword: (id: string) => `/users/${id}/change-password`,
  resetPassword: (id: string) => `/users/${id}/reset-password`,
  activity: (id: string) => `/users/${id}/activity`,
  stats: '/users/stats',
} as const;

export const COMPANIES = {
  list: '/companies',
  create: '/companies',
  get: (id: string) => `/companies/${id}`,
  update: (id: string) => `/companies/${id}`,
  delete: (id: string) => `/companies/${id}`,
} as const;

export const PERIODS = {
  list: '/periods',
  create: '/periods',
  get: (id: string) => `/periods/${id}`,
  update: (id: string) => `/periods/${id}`,
  delete: (id: string) => `/periods/${id}`,
  close: (id: string) => `/periods/${id}/close`,
  reopen: (id: string) => `/periods/${id}/reopen`,
  batch: '/periods/batch',
} as const;

export const ACCOUNTS = {
  list: '/accounts',
  create: '/accounts',
  get: (id: string) => `/accounts/${id}`,
  update: (id: string) => `/accounts/${id}`,
  delete: (id: string) => `/accounts/${id}`,
  tree: '/accounts/tree',
  search: '/accounts/search',
} as const;

export const COST_CENTERS = {
  list: '/cost-centers',
  create: '/cost-centers',
  get: (id: string) => `/cost-centers/${id}`,
  update: (id: string) => `/cost-centers/${id}`,
  delete: (id: string) => `/cost-centers/${id}`,
  tree: '/cost-centers/tree',
} as const;

export const JOURNAL = {
  list: '/journal-entries',
  create: '/journal-entries',
  get: (id: string) => `/journal-entries/${id}`,
  update: (id: string) => `/journal-entries/${id}`,
  delete: (id: string) => `/journal-entries/${id}`,
  post: (id: string) => `/journal-entries/${id}/post`,
  validate: '/journal-entries/validate',
  lines: {
    list: (entryId: string) => `/journal-entries/${entryId}/lines`,
    create: (entryId: string) => `/journal-entries/${entryId}/lines`,
    get: (entryId: string, lineId: string) => `/journal-entries/${entryId}/lines/${lineId}`,
    update: (entryId: string, lineId: string) => `/journal-entries/${entryId}/lines/${lineId}`,
    delete: (entryId: string, lineId: string) => `/journal-entries/${entryId}/lines/${lineId}`,
  },
} as const;

export const THIRD_PARTIES = {
  list: '/third-parties',
  create: '/third-parties',
  get: (id: string) => `/third-parties/${id}`,
  update: (id: string) => `/third-parties/${id}`,
  delete: (id: string) => `/third-parties/${id}`,
  search: '/third-parties/search',
} as const;

export const INVOICES = {
  list: '/invoices',
  create: '/invoices',
  get: (id: string) => `/invoices/${id}`,
  update: (id: string) => `/invoices/${id}`,
  delete: (id: string) => `/invoices/${id}`,
  pay: (id: string) => `/invoices/${id}/pay`,
  recalculate: (id: string) => `/invoices/${id}/recalculate`,
  summary: '/invoices/summary',
  aging: '/invoices/aging',
  lines: {
    list: (id: string) => `/invoices/${id}/lines`,
    create: (id: string) => `/invoices/${id}/lines`,
    get: (id: string, lineId: string) => `/invoices/${id}/lines/${lineId}`,
    update: (id: string, lineId: string) => `/invoices/${id}/lines/${lineId}`,
    delete: (id: string, lineId: string) => `/invoices/${id}/lines/${lineId}`,
  },
  taxEntries: {
    list: (id: string) => `/invoices/${id}/tax-entries`,
  },
  paymentSchedule: {
    list: (id: string) => `/invoices/${id}/payment-schedule`,
    create: (id: string) => `/invoices/${id}/payment-schedule`,
    get: (id: string, scheduleId: string) => `/invoices/${id}/payment-schedule/${scheduleId}`,
    pay: (id: string, scheduleId: string) => `/invoices/${id}/payment-schedule/${scheduleId}/pay`,
  },
} as const;

export const BANKS = {
  list: '/bank-accounts',
  create: '/bank-accounts',
  get: (id: string) => `/bank-accounts/${id}`,
  update: (id: string) => `/bank-accounts/${id}`,
  delete: (id: string) => `/bank-accounts/${id}`,
  movements: {
    list: '/bank-movements',
    create: '/bank-movements',
    get: (id: string) => `/bank-movements/${id}`,
    update: (id: string) => `/bank-movements/${id}`,
    delete: (id: string) => `/bank-movements/${id}`,
    reconcile: '/bank-movements/reconcile',
  },
} as const;

export const RECONCILIATION = {
  autoMatch: '/reconciliation/auto-match',
  advanced: '/reconciliation/advanced',
  status: (bankAccountId: string) => `/reconciliation/status/${bankAccountId}`,
} as const;

export const REPORTS = {
  trialBalance: '/reports/trial-balance',
  balanceSheet: '/reports/balance-sheet',
  incomeStatement: '/reports/income-statement',
  cashFlow: '/reports/cash-flow',
  generalLedger: '/reports/general-ledger',
  subsidiaryLedger: '/reports/subsidiary-ledger',
  accountMovements: '/reports/account-movements',
  changesEquity: '/reports/changes-equity',
  comparative: '/reports/comparative',
} as const;

export const ASSETS = {
  list: '/fixed-assets',
  create: '/fixed-assets',
  get: (id: string) => `/fixed-assets/${id}`,
  update: (id: string) => `/fixed-assets/${id}`,
  delete: (id: string) => `/fixed-assets/${id}`,
  depreciate: (id: string) => `/fixed-assets/${id}/depreciate`,
  history: (id: string) => `/fixed-assets/${id}/history`,
  summary: '/fixed-assets/summary',
  bulkDepreciate: '/fixed-assets/bulk-depreciate',
} as const;

export const BUDGETS = {
  list: '/budgets',
  create: '/budgets',
  get: (id: string) => `/budgets/${id}`,
  update: (id: string) => `/budgets/${id}`,
  delete: (id: string) => `/budgets/${id}`,
  bulk: '/budgets/bulk',
  variance: '/budgets/variance',
  report: '/budgets/report',
} as const;

export const EXCHANGE_RATES = {
  list: '/exchange-rates',
  create: '/exchange-rates',
  get: (id: string) => `/exchange-rates/${id}`,
  update: (id: string) => `/exchange-rates/${id}`,
  delete: (id: string) => `/exchange-rates/${id}`,
  latest: '/exchange-rates/latest',
  convert: '/exchange-rates/convert',
} as const;

export const FINANCIAL_CONCEPTS = {
  list: '/financial-concepts',
  create: '/financial-concepts',
  get: (id: string) => `/financial-concepts/${id}`,
  update: (id: string) => `/financial-concepts/${id}`,
  delete: (id: string) => `/financial-concepts/${id}`,
  search: '/financial-concepts/search',
  byCategory: (category: string) => `/financial-concepts/by-category/${category}`,
} as const;

export const PAYMENT_TERMS = {
  list: '/payment-terms',
  create: '/payment-terms',
  get: (id: string) => `/payment-terms/${id}`,
  update: (id: string) => `/payment-terms/${id}`,
  delete: (id: string) => `/payment-terms/${id}`,
  default: '/payment-terms/default',
} as const;

export const TAX = {
  rates: {
    list: '/tax/rates',
    create: '/tax/rates',
    get: (id: string) => `/tax/rates/${id}`,
    update: (id: string) => `/tax/rates/${id}`,
    delete: (id: string) => `/tax/rates/${id}`,
  },
  entries: {
    list: '/tax/entries',
    create: '/tax/entries',
    get: (id: string) => `/tax/entries/${id}`,
    update: (id: string) => `/tax/entries/${id}`,
    delete: (id: string) => `/tax/entries/${id}`,
    byInvoice: (invoiceId: string) => `/tax/entries/by-invoice/${invoiceId}`,
  },
  reports: {
    ivaSummary: '/tax/reports/iva-summary',
    monthlyDeclaration: '/tax/reports/monthly-declaration',
    withholding: '/tax/reports/withholding',
    diot: '/tax/reports/diot',
  },
} as const;

export const CLOSING_ENTRIES = {
  list: '/closing-entries',
  create: '/closing-entries',
  get: (id: string) => `/closing-entries/${id}`,
  update: (id: string) => `/closing-entries/${id}`,
  delete: (id: string) => `/closing-entries/${id}`,
  preview: '/closing-entries/preview',
  generate: '/closing-entries/generate',
  history: (companyId: string) => `/closing-entries/history/${companyId}`,
} as const;

export const DASHBOARD = {
  kpis: '/dashboard/kpis',
  periodOverview: '/dashboard/period-overview',
  recentMovements: '/dashboard/recent-movements',
  expenseTrends: '/dashboard/expense-trends',
  cashPositions: '/dashboard/cash-positions',
  receivablesSummary: '/dashboard/receivables-summary',
  payablesSummary: '/dashboard/payables-summary',
  taxSummary: '/dashboard/tax-summary',
  topCustomers: '/dashboard/top-customers',
  topSuppliers: '/dashboard/top-suppliers',
} as const;

export const AUDIT = {
  list: '/audit',
  get: (id: string) => `/audit/${id}`,
  export: '/audit/export',
  stats: '/audit/stats',
} as const;

export const NOTIFICATIONS = {
  list: '/notifications',
  get: (id: string) => `/notifications/${id}`,
  markRead: (id: string) => `/notifications/${id}/read`,
  markAllRead: '/notifications/mark-all-read',
  unreadCount: '/notifications/unread-count',
} as const;

export const ATTACHMENTS = {
  list: '/attachments',
  create: '/attachments',
  get: (id: string) => `/attachments/${id}`,
  update: (id: string) => `/attachments/${id}`,
  delete: (id: string) => `/attachments/${id}`,
  byEntity: '/attachments/by-entity',
} as const;

export const SEARCH = {
  global: '/search/global',
  advanced: '/search/advanced',
} as const;

export const DATA_MGMT = {
  import: '/data/import',
  export: '/data/export',
  exportCsv: '/data/export-csv',
} as const;

export const SYSTEM = {
  health: '/system/health',
  stats: '/system/stats',
  cleanup: '/system/cleanup',
  validateIntegrity: '/system/validate-integrity',
} as const;

export const AI = {
  chat: '/ai/chat',
  models: '/ai/models',
  status: '/ai/status',
  tools: '/ai/tools',
} as const;

export const SEED = {
  run: '/seed',
} as const;
