import { db } from '@/lib/db';
import { success, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const where = companyId ? { companyId } : {};
    const whereUser = companyId ? { memberships: { some: { companyId } } } : {};

    const [
      companyCount,
      periodCount,
      accountCount,
      costCenterCount,
      journalEntryCount,
      invoiceCount,
      bankAccountCount,
      bankMovementCount,
      thirdPartyCount,
      userCount,
      auditLogCount,
      fixedAssetCount,
      budgetCount,
      notificationCount,
      attachmentCount,
      exchangeRateCount,
      draftEntries,
      postedEntries,
      openPeriods,
      activeUsers,
      unreadNotifications,
    ] = await Promise.all([
      db.company.count({ where: companyId ? { id: companyId } : {} }),
      db.accountingPeriod.count({ where }),
      db.account.count({ where }),
      db.costCenter.count({ where }),
      db.journalEntry.count({ where }),
      db.invoice.count({ where }),
      db.bankAccount.count({ where }),
      db.bankMovement.count({ where: companyId ? { bankAccount: { companyId } } : {} }),
      db.thirdParty.count({ where }),
      db.user.count({ where: whereUser }),
      db.auditLog.count({ where }),
      db.fixedAsset.count({ where }),
      db.budget.count({ where }),
      db.notification.count({ where }),
      db.fileAttachment.count({ where }),
      db.exchangeRate.count({ where: companyId ? { companyId } : {} }),
      db.journalEntry.count({ where: { ...where, status: 'DRAFT' } }),
      db.journalEntry.count({ where: { ...where, status: 'POSTED' } }),
      db.accountingPeriod.count({ where: { ...where, status: 'OPEN' } }),
      db.user.count({ where: { ...whereUser, isActive: true } }),
      db.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return success({
      entities: {
        companies: companyCount,
        periods: periodCount,
        accounts: accountCount,
        costCenters: costCenterCount,
        journalEntries: journalEntryCount,
        invoices: invoiceCount,
        bankAccounts: bankAccountCount,
        bankMovements: bankMovementCount,
        thirdParties: thirdPartyCount,
        users: userCount,
        auditLogs: auditLogCount,
        fixedAssets: fixedAssetCount,
        budgets: budgetCount,
        notifications: notificationCount,
        attachments: attachmentCount,
        exchangeRates: exchangeRateCount,
      },
      accounting: {
        draftEntries,
        postedEntries,
        openPeriods,
        draftRatio: journalEntryCount > 0 ? Math.round((draftEntries / journalEntryCount) * 10000) / 100 : 0,
      },
      users: {
        total: userCount,
        active: activeUsers,
        inactive: userCount - activeUsers,
      },
      notifications: {
        total: notificationCount,
        unread: unreadNotifications,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching system stats:', err);
    return serverError('Error al obtener estadísticas del sistema');
  }
}
