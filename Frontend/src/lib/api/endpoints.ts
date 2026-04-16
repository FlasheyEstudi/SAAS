// Centralized API Endpoints Catalog
export const AUTH = {
  login: '/users/login',
  register: '/users',
  me: '/users/me',
  logout: '/users/logout',
  refreshToken: '/users/refresh',
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
  current: '/periods/current',
} as const;

export const ACCOUNTS = {
  list: '/accounts',
  create: '/accounts',
  get: (id: string) => `/accounts/${id}`,
  update: (id: string) => `/accounts/${id}`,
  delete: (id: string) => `/accounts/${id}`,
  tree: '/accounts/tree',
  search: '/accounts/search',
  balances: '/accounts/balances',
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
  unpost: (id: string) => `/journal-entries/${id}/unpost`,
  validate: '/journal-entries/validate',
  lines: {
    list: (entryId: string) => `/journal-entries/${entryId}/lines`,
    create: (entryId: string) => `/journal-entries/${entryId}/lines`,
    update: (entryId: string, lineId: string) => `/journal-entries/${entryId}/lines/${lineId}`,
    delete: (entryId: string, lineId: string) => `/journal-entries/${entryId}/lines/${lineId}`,
  },
  number: '/journal-entries/next-number',
} as const;

export const THIRD_PARTIES = {
  list: '/third-parties',
  create: '/third-parties',
  get: (id: string) => `/third-parties/${id}`,
  update: (id: string) => `/third-parties/${id}`,
  delete: (id: string) => `/third-parties/${id}`,
} as const;

export const INVOICES = {
  list: '/invoices',
  create: '/invoices',
  get: (id: string) => `/invoices/${id}`,
  update: (id: string) => `/invoices/${id}`,
  delete: (id: string) => `/invoices/${id}`,
  pay: (id: string) => `/invoices/${id}/pay`,
  cancel: (id: string) => `/invoices/${id}/cancel`,
  aging: '/invoices/aging',
  summary: '/invoices/summary',
  recalculate: (id: string) => `/invoices/${id}/recalculate`,
  lines: {
    list: (id: string) => `/invoices/${id}/lines`,
    create: (id: string) => `/invoices/${id}/lines`,
    update: (id: string, lineId: string) => `/invoices/${id}/lines/${lineId}`,
    delete: (id: string, lineId: string) => `/invoices/${id}/lines/${lineId}`,
  },
  taxEntries: {
    list: (id: string) => `/invoices/${id}/tax-entries`,
    create: (id: string) => `/invoices/${id}/tax-entries`,
  },
  paymentSchedule: {
    list: (id: string) => `/invoices/${id}/payment-schedule`,
    create: (id: string) => `/invoices/${id}/payment-schedule`,
    pay: (id: string, scheduleId: string) => `/invoices/${id}/payment-schedule/${scheduleId}/pay`,
  },
  number: '/invoices/next-number',
} as const;

export const BANKS = {
  list: '/bank-accounts',
  create: '/bank-accounts',
  get: (id: string) => `/bank-accounts/${id}`,
  update: (id: string) => `/bank-accounts/${id}`,
  delete: (id: string) => `/bank-accounts/${id}`,
  movements: {
    list: (accountId: string) => `/bank-accounts/${accountId}/movements`,
    create: (accountId: string) => `/bank-accounts/${accountId}/movements`,
    reconcile: (accountId: string, movementId: string) => `/bank-accounts/${accountId}/movements/${movementId}/reconcile`,
  },
  balance: (id: string) => `/bank-accounts/${id}/balance`,
} as const;

export const REPORTS = {
  trialBalance: '/reports/trial-balance',
  balanceSheet: '/reports/balance-sheet',
  incomeStatement: '/reports/income-statement',
  cashFlow: '/reports/cash-flow',
  generalLedger: '/reports/general-ledger',
  agingReceivable: '/reports/aging-receivable',
  agingPayable: '/reports/aging-payable',
  export: (type: string) => `/reports/${type}/export`,
} as const;

export const ASSETS = {
  list: '/fixed-assets',
  create: '/fixed-assets',
  get: (id: string) => `/fixed-assets/${id}`,
  update: (id: string) => `/fixed-assets/${id}`,
  delete: (id: string) => `/fixed-assets/${id}`,
  depreciate: (id: string) => `/fixed-assets/${id}/depreciate`,
  history: (id: string) => `/fixed-assets/${id}/history`,
} as const;

export const BUDGETS = {
  list: '/budgets',
  create: '/budgets',
  get: (id: string) => `/budgets/${id}`,
  update: (id: string) => `/budgets/${id}`,
  delete: (id: string) => `/budgets/${id}`,
  compare: (id: string) => `/budgets/${id}/compare`,
  approve: (id: string) => `/budgets/${id}/approve`,
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

export const USERS_MGMT = {
  list: '/users',
  create: '/users',
  get: (id: string) => `/users/${id}`,
  update: (id: string) => `/users/${id}`,
  delete: (id: string) => `/users/${id}`,
} as const;

export const AUDIT = {
  list: '/audit-logs',
  get: (id: string) => `/audit-logs/${id}`,
  export: '/audit-logs/export',
} as const;

export const NOTIFICATIONS = {
  list: '/notifications',
  get: (id: string) => `/notifications/${id}`,
  markRead: (id: string) => `/notifications/${id}/read`,
  markAllRead: '/notifications/read-all',
  unreadCount: '/notifications/unread-count',
} as const;

export const ATTACHMENTS = {
  list: (entity: string, entityId: string) => `/attachments/${entity}/${entityId}`,
  upload: (entity: string, entityId: string) => `/attachments/${entity}/${entityId}`,
  delete: (entity: string, entityId: string, attachmentId: string) => `/attachments/${entity}/${entityId}/${attachmentId}`,
} as const;

export const SEARCH = {
  global: '/search',
} as const;

export const DATA_MGMT = {
  importAccounts: '/data/import/accounts',
  importThirdParties: '/data/import/third-parties',
  importJournalEntries: '/data/import/journal-entries',
  exportAccounts: '/data/export/accounts',
  exportThirdParties: '/data/export/third-parties',
  exportJournalEntries: '/data/export/journal-entries',
  sampleTemplate: (type: string) => `/data/templates/${type}`,
} as const;

export const SYSTEM = {
  healthCheck: '/system/health',
  integrity: '/system/integrity',
  stats: '/system/stats',
} as const;

export const AI = {
  chat: '/ai/chat',
  suggest: '/ai/suggest',
  categorize: '/ai/categorize',
} as const;
