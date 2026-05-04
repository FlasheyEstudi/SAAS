'use client';

import { useAppStore } from '@/lib/stores/useAppStore';
import { useEffect } from 'react';
import { LoginPage } from '@/modules/auth/components/LoginPage';
import { RegisterPage } from '@/modules/auth/components/RegisterPage';
import LandingPage from './landing/page';
import { DashboardView } from '@/modules/dashboard/components/DashboardView';
import { JournalListView } from '@/modules/journal/components/JournalListView';
import { JournalEntryForm } from '@/modules/journal/components/JournalEntryForm';
import { JournalEntryDetail } from '@/modules/journal/components/JournalEntryDetail';
import { InvoiceListView } from '@/modules/invoices/components/InvoiceListView';
import { InvoiceForm } from '@/modules/invoices/components/InvoiceForm';
import { InvoiceDetail } from '@/modules/invoices/components/InvoiceDetail';
import { BanksView } from '@/modules/banks/components/BanksView';
import { ReportsView } from '@/modules/reports/components/ReportsView';
import { CompaniesView } from '@/modules/companies/components/CompaniesView';
import { PeriodsView } from '@/modules/periods/components/PeriodsView';
import { AccountsView } from '@/modules/accounts/components/AccountsView';
import { CostCentersView } from '@/modules/cost-centers/components/CostCentersView';
import { ThirdPartiesView } from '@/modules/third-parties/components/ThirdPartiesView';
import { AssetsView } from '@/modules/assets/components/AssetsView';
import { BudgetsView } from '@/modules/budgets/components/BudgetsView';
import { ExchangeView } from '@/modules/exchange/components/ExchangeView';
import { UsersView } from '@/modules/users-mgmt/components/UsersView';
import { AuditView } from '@/modules/audit/components/AuditView';
import { NotificationsView } from '@/modules/notifications/components/NotificationsView';
import { SearchView } from '@/modules/search/components/SearchView';
import { DataMgmtView } from '@/modules/data-mgmt/components/DataMgmtView';
import { SystemView } from '@/modules/system/components/SystemView';
import { AIChatView } from '@/modules/ai/components/AIChatView';
import { TaxView } from '@/modules/tax/components/TaxView';
import { ClosingEntriesView } from '@/modules/periods/components/ClosingEntriesView';
import { FinancialConceptsView } from '@/modules/financial-concepts/components/FinancialConceptsView';
import { PaymentTermsView } from '@/modules/payment-terms/components/PaymentTermsView';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      <Header />
      <main className={cn(
        'transition-all duration-300 pt-[65px]',
        'lg:ml-[260px]',
        sidebarCollapsed && 'lg:ml-[70px]'
      )}>
        {children}
      </main>
    </div>
  );
}

function ViewRouter() {
  const currentView = useAppStore((s) => s.currentView);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const navigate = useAppStore((s) => s.navigate);

  // Redirección centralizada y manejo de sesión
  useEffect(() => {
    const isAuthView = currentView === 'login' || currentView === 'register' || currentView === 'landing';
    
    // Escuchar eventos globales de logout (ej: desde apiClient)
    const handleGlobalLogout = () => {
      useAppStore.getState().logout();
      navigate('login');
      toast.error('Tu sesión ha expirado por seguridad.');
    };

    window.addEventListener('auth:logout', handleGlobalLogout);

    if (isAuthenticated && isAuthView) {
      const timer = setTimeout(() => navigate('dashboard'), 0);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('auth:logout', handleGlobalLogout);
      };
    }
    
    if (!isAuthenticated && !isAuthView) {
      navigate('landing');
    }

    return () => window.removeEventListener('auth:logout', handleGlobalLogout);
  }, [isAuthenticated, currentView, navigate]);

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <LandingPage />;
      case 'login': return <LoginPage />;
      case 'register': return <RegisterPage />;
      case 'dashboard': return <DashboardView />;
      case 'companies': return <CompaniesView />;
      case 'periods': return <PeriodsView />;
      case 'accounts': return <AccountsView />;
      case 'cost-centers': return <CostCentersView />;
      case 'journal': return <JournalListView />;
      case 'journal-create': return <JournalEntryForm />;
      case 'journal-detail': return <JournalEntryDetail />;
      case 'third-parties': return <ThirdPartiesView />;
      case 'invoices': return <InvoiceListView />;
      case 'invoice-create': return <InvoiceForm />;
      case 'invoice-detail': return <InvoiceDetail />;
      case 'banks': return <BanksView />;
      case 'reports': return <ReportsView />;
      case 'assets': return <AssetsView />;
      case 'budgets': return <BudgetsView />;
      case 'exchange': return <ExchangeView />;
      case 'users': return <UsersView />;
      case 'audit': return <AuditView />;
      case 'notifications': return <NotificationsView />;
      case 'search': return <SearchView />;
      case 'data-mgmt':
      case 'data-management': return <DataMgmtView />;
      case 'system': return <SystemView />;
      case 'ai-chat': return <AIChatView />;
      case 'taxes': return <TaxView />;
      case 'closing-entries': return <ClosingEntriesView />;
      case 'financial-concepts': return <FinancialConceptsView />;
      case 'payment-terms': return <PaymentTermsView />;
      case 'company-settings': return <CompaniesView />; // Reutilizamos Companies para ajustes de momento
      default: return <DashboardView />;
    }
  };

  if (currentView === 'login' || currentView === 'register' || currentView === 'landing') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={currentView} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {currentView === 'landing' ? <LandingPage /> : currentView === 'login' ? <LoginPage /> : <RegisterPage />}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AuthenticatedLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </AuthenticatedLayout>
  );
}

export default function Home() {
  return <ViewRouter />;
}
