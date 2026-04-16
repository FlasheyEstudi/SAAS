// Permission utilities for role-based access control
import type { User } from '@/lib/api/types';

export const PERMISSIONS = {
  JOURNAL: {
    CREATE: 'journal:create',
    EDIT: 'journal:edit',
    POST: 'journal:post',
    UNPOST: 'journal:unpost',
    DELETE: 'journal:delete',
    VIEW: 'journal:view',
  },
  PERIOD: {
    CREATE: 'period:create',
    CLOSE: 'period:close',
    REOPEN: 'period:reopen',
  },
  INVOICE: {
    CREATE: 'invoice:create',
    EDIT: 'invoice:edit',
    PAY: 'invoice:pay',
    CANCEL: 'invoice:cancel',
    DELETE: 'invoice:delete',
    VIEW: 'invoice:view',
  },
  REPORTS: {
    VIEW: 'reports:view',
    EXPORT: 'reports:export',
    VIEW_SENSITIVE: 'reports:view-sensitive',
  },
  COMPANIES: {
    CREATE: 'companies:create',
    EDIT: 'companies:edit',
    DELETE: 'companies:delete',
  },
  USERS: {
    CREATE: 'users:create',
    EDIT: 'users:edit',
    DELETE: 'users:delete',
    VIEW: 'users:view',
  },
  ASSETS: {
    CREATE: 'assets:create',
    EDIT: 'assets:edit',
    DELETE: 'assets:delete',
    DEPRECIATE: 'assets:depreciate',
  },
  BUDGETS: {
    CREATE: 'budgets:create',
    APPROVE: 'budgets:approve',
    EDIT: 'budgets:edit',
  },
  BANKS: {
    CREATE: 'banks:create',
    EDIT: 'banks:edit',
    RECONCILE: 'banks:reconcile',
    DELETE: 'banks:delete',
  },
} as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: Object.values(PERMISSIONS).flat(),
  ACCOUNTANT: [
    PERMISSIONS.JOURNAL.CREATE,
    PERMISSIONS.JOURNAL.EDIT,
    PERMISSIONS.JOURNAL.POST,
    PERMISSIONS.JOURNAL.DELETE,
    PERMISSIONS.JOURNAL.VIEW,
    PERMISSIONS.INVOICE.CREATE,
    PERMISSIONS.INVOICE.EDIT,
    PERMISSIONS.INVOICE.PAY,
    PERMISSIONS.INVOICE.VIEW,
    PERMISSIONS.REPORTS.VIEW,
    PERMISSIONS.REPORTS.EXPORT,
    PERMISSIONS.ACCOUNTS_CREATE,
    PERMISSIONS.BANKS.CREATE,
    PERMISSIONS.BANKS.EDIT,
    PERMISSIONS.BANKS.RECONCILE,
  ],
  MANAGER: [
    PERMISSIONS.JOURNAL.VIEW,
    PERMISSIONS.INVOICE.VIEW,
    PERMISSIONS.REPORTS.VIEW,
    PERMISSIONS.BUDGETS.CREATE,
    PERMISSIONS.BUDGETS.EDIT,
    PERMISSIONS.ASSETS.VIEW,
  ],
  VIEWER: [
    PERMISSIONS.JOURNAL.VIEW,
    PERMISSIONS.INVOICE.VIEW,
    PERMISSIONS.REPORTS.VIEW,
  ],
};

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.some(
    (p) => p === permission || (p.endsWith(':*') && permission.startsWith(p.slice(0, -1)))
  );
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    ADMIN: 'bg-error/20 text-error',
    ACCOUNTANT: 'bg-success/20 text-success',
    MANAGER: 'bg-warning/20 text-warning',
    VIEWER: 'bg-vintage-200 text-vintage-700',
  };
  return colors[role] || 'bg-vintage-200 text-vintage-700';
}
