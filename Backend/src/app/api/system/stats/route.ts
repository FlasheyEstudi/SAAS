import { db } from '@/lib/db';
import { success, serverError } from '@/lib/api-helpers';

export async function GET() {
  try {
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
      db.company.count(),
      db.accountingPeriod.count(),
      db.account.count(),
      db.costCenter.count(),
      db.journalEntry.count(),
      db.invoice.count(),
      db.bankAccount.count(),
      db.bankMovement.count(),
      db.thirdParty.count(),
      db.user.count(),
      db.auditLog.count(),
      db.fixedAsset.count(),
      db.budget.count(),
      db.notification.count(),
      db.fileAttachment.count(),
      db.exchangeRate.count(),
      db.journalEntry.count({ where: { status: 'DRAFT' } }),
      db.journalEntry.count({ where: { status: 'POSTED' } }),
      db.accountingPeriod.count({ where: { status: 'OPEN' } }),
      db.user.count({ where: { isActive: true } }),
      db.notification.count({ where: { isRead: false } }),
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
