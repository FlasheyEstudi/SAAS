// API Types for ERP Contable Enterprise
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'MANAGER' | 'VIEWER';
  avatar?: string;
  companyId?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  currency: string;
  fiscalYearStart: string;
  isActive: boolean;
  createdAt: string;
}

export interface Period {
  id: string;
  companyId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
  year: number;
  month: number;
  createdAt: string;
}

export interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  nature: 'DEBIT' | 'CREDIT';
  parentId?: string;
  isGroup: boolean;
  isActive: boolean;
  currentBalance: number;
  children?: Account[];
  level: number;
}

export interface CostCenter {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  journalEntryCount?: number;
  createdAt: string;
}

export interface ThirdParty {
  id: string;
  companyId: string;
  name: string;
  taxId: string;
  type: 'CLIENT' | 'SUPPLIER' | 'BOTH';
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  companyId: string;
  periodId: string;
  entryNumber: string;
  description: string;
  entryDate: string;
  entryType: 'DIARIO' | 'EGRESO' | 'INGRESO' | 'TRASPASO';
  status: 'DRAFT' | 'POSTED';
  totalDebit: number;
  totalCredit: number;
  difference: number;
  lines: JournalEntryLine[];
  createdBy?: string;
  postedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id?: string;
  journalEntryId?: string;
  accountId: string;
  account?: Account;
  costCenterId?: string;
  costCenter?: CostCenter;
  description: string;
  debit: number;
  credit: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  thirdPartyId: string;
  thirdParty?: ThirdParty;
  invoiceNumber: string;
  invoiceType: 'SALE' | 'PURCHASE';
  description?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'DRAFT' | 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  balanceDue: number;
  lines: InvoiceLine[];
  taxEntries: TaxEntry[];
  paymentSchedule: PaymentScheduleItem[];
  createdAt: string;
}

export interface InvoiceLine {
  id?: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface TaxEntry {
  id?: string;
  invoiceId?: string;
  taxName: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface PaymentScheduleItem {
  id?: string;
  invoiceId?: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidDate?: string;
  paymentMethod?: string;
}

export interface BankAccount {
  id: string;
  companyId: string;
  bankName: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT';
  currency: string;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
}

export interface BankMovement {
  id: string;
  bankAccountId: string;
  bankAccount?: BankAccount;
  description: string;
  amount: number;
  movementType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  reference?: string;
  movementDate: string;
  reconciled: boolean;
  journalEntryId?: string;
  createdAt: string;
}

export interface FixedAsset {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  residualValue: number;
  usefulLifeMonths: number;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  currentBookValue: number;
  accumulatedDepreciation: number;
  status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED';
  createdAt: string;
}

export interface Budget {
  id: string;
  companyId: string;
  periodId: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED';
  totalBudgeted: number;
  totalActual: number;
  variance: number;
  lines: BudgetLine[];
  createdAt: string;
}

export interface BudgetLine {
  id?: string;
  budgetId?: string;
  accountId: string;
  account?: Account;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  isError?: boolean;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
}

export interface AIChatResponse {
  response: string;
  toolCalls?: ToolCall[];
}

// Report types
export interface TrialBalanceEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
}

export interface BalanceSheetResponse {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  assets: BalanceSheetSection[];
  liabilities: BalanceSheetSection[];
  equity: BalanceSheetSection[];
}

export interface BalanceSheetSection {
  name: string;
  amount: number;
  subItems?: { name: string; amount: number }[];
}

export interface IncomeStatementResponse {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  grossProfit: number;
  operatingExpenses: number;
  incomeDetails: { name: string; amount: number }[];
  expenseDetails: { name: string; amount: number }[];
}

export interface DashboardKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  overdueInvoices: number;
  pendingJournalEntries: number;
  revenueChange?: number;
  expenseChange?: number;
}

export interface AgingBucket {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
}

export interface ValidationResponse {
  valid: boolean;
  difference: number;
  errors?: string[];
}

// Pagination
export interface PaginatedResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Generic API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
