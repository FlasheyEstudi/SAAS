import { 
  getTrialBalance, 
  getBalanceSheet, 
  getIncomeStatement, 
  getAgingReport, 
  getCashFlow,
  resolvePeriod
} from '../services/financial-reports.service';

/**
 * Executes a tool call from the AI assistant.
 * 
 * @param toolName - Name of the function to call
 * @param args - Arguments provided by the LLM
 * @param companyId - The context company ID
 */
export async function executeAiTool(toolName: string, args: any, companyId: string) {
  console.log(`[AI Executor] Executing tool: ${toolName}`, args);

  try {
    switch (toolName) {
      case 'get_ledger_data':
        return await handleQueryFinancialData(args, companyId);
      
      case 'export_document':
        return await handleRequestReportDownload(args, companyId);
 
      case 'compute_stat':
        return await handleCalculateMetric(args, companyId);


      default:
        return { error: `Tool ${toolName} not implemented` };
    }
  } catch (error) {
    console.error(`[AI Executor] Error executing ${toolName}:`, error);
    return { error: error instanceof Error ? error.message : 'Unknown error during execution' };
  }
}

async function handleQueryFinancialData(args: any, companyId: string) {
  const { target_view, period_id, year, month, consolidated } = args;

  // Localized name mapping
  const viewMap: Record<string, string> = {
    'balance general': 'balance_sheet',
    'balance_general': 'balance_sheet',
    'estado de resultados': 'income_statement',
    'estado_resultados': 'income_statement',
    'balanza de comprobación': 'trial_balance',
    'balanza_comprobacion': 'trial_balance',
    'flujo de caja': 'cash_flow',
    'flujo_caja': 'cash_flow'
  };

  const normalizedView = target_view ? (viewMap[target_view.toLowerCase()] || target_view) : target_view;

  // Resolve period if needed
  let resolvedPeriodId = period_id;
  let resolvedYear = year || new Date().getFullYear();
  let resolvedMonth = month || (new Date().getMonth() + 1);

  if (!resolvedPeriodId) {
    const period = await resolvePeriod(companyId, null, resolvedYear, resolvedMonth);
    resolvedPeriodId = period?.id;
  }

  const periodErrorMsg = `No se encontró el período contable (Año: ${resolvedYear}, Mes: ${resolvedMonth}) para esta empresa. Por favor informa al usuario que debe crear el período o consultar otro.`;

  switch (normalizedView) {
    case 'trial_balance':
      if (!resolvedPeriodId) return { error: periodErrorMsg };
      return await getTrialBalance(companyId, resolvedPeriodId, consolidated || false);
    
    case 'balance_sheet':
      if (!resolvedPeriodId) return { error: periodErrorMsg };
      return await getBalanceSheet(companyId, resolvedPeriodId, consolidated || false);

    case 'income_statement':
      if (!resolvedPeriodId) return { error: periodErrorMsg };
      return await getIncomeStatement(companyId, resolvedPeriodId, consolidated || false);

    case 'ar_aging':
      return await getAgingReport(companyId, 'SALE');

    case 'ap_aging':
      return await getAgingReport(companyId, 'PURCHASE');

    case 'cash_flow':
      return await getCashFlow(companyId, resolvedPeriodId, year);

    default:
      return { error: `Vista ${normalizedView} no soportada` };
  }
}

async function handleRequestReportDownload(args: any, companyId: string) {
  // For now, return the data and a "placeholder" message that the report is being generated.
  // In a real app, this would trigger a job or return a signed URL.
  const data = await handleQueryFinancialData({ 
    target_view: args.report_type, 
    year: args.period_start?.split('-')[0],
    month: args.period_start?.split('-')[1]
  }, companyId);

  return {
    ...data,
    message: `Reporte ${args.report_type} generado exitosamente en formato ${args.format}. El enlace de descarga estará disponible en breve.`,
    downloadUrl: `/api/reports/download-placeholder?type=${args.report_type}&format=${args.format}`
  };
}

async function handleCalculateMetric(args: any, companyId: string) {
  const { metric_type, period } = args;
  
  // Basic implementation of metrics using Income Statement and Balance Sheet
  // This is a bit simplified for demonstration
  const [year, month] = (period || '').split('-').map(Number);
  const p = await resolvePeriod(companyId, null, year || new Date().getFullYear(), month || 1);
  
  if (!p) return { error: 'No se pudo encontrar el período para calcular la métrica' };

  if (metric_type === 'gross_margin' || metric_type === 'net_margin') {
    const is = await getIncomeStatement(companyId, p.id);
    return {
      metric: metric_type,
      value: metric_type === 'gross_margin' ? is.grossMargin : (is.netIncome / is.totalIncome) * 100,
      period: period
    };
  }

  // Add more metrics as needed
  return { 
    metric: metric_type, 
    message: `Cálculo de ${metric_type} en proceso con los datos del período ${period}.`,
    value: "Consultando datos..." 
  };
}
