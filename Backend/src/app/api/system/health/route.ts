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
    ]);

    const totalRecords = companyCount + periodCount + accountCount + costCenterCount +
      journalEntryCount + invoiceCount + bankAccountCount + bankMovementCount +
      thirdPartyCount + userCount + auditLogCount + fixedAssetCount +
      budgetCount + notificationCount + attachmentCount + exchangeRateCount;

    return success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      entityCounts: {
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
      totalRecords,
    });
  } catch (err) {
    console.error('Health check failed:', err);
    return serverError('Error en verificación de salud del sistema');
  }
}
