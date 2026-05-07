import { db } from '@/lib/db';
import { success, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const where = companyId ? { companyId } : {};

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
      db.company.count({ where: companyId ? { id: companyId } : {} }),
      db.accountingPeriod.count({ where }),
      db.account.count({ where }),
      db.costCenter.count({ where }),
      db.journalEntry.count({ where }),
      db.invoice.count({ where }),
      db.bankAccount.count({ where }),
      db.bankMovement.count({ where: companyId ? { bankAccount: { companyId } } : {} }),
      db.thirdParty.count({ where }),
      db.user.count({ where: companyId ? { memberships: { some: { companyId } } } : {} }),
      db.auditLog.count({ where }),
      db.fixedAsset.count({ where }),
      db.budget.count({ where }),
      db.notification.count({ where }),
      db.fileAttachment.count({ where }),
      db.exchangeRate.count({ where: companyId ? { companyId } : {} }),
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
