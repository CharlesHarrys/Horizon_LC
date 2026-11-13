import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { ExecutiveDashboards } from './views/ExecutiveDashboards';
import { PurchaseInvoiceForm } from './views/PurchaseInvoiceForm';
import { FastPosRegister } from './views/FastPosRegister';
import { GeneralLedgerViewer } from './views/GeneralLedgerViewer';
import { InventoryKardexView } from './views/InventoryKardexView';
import { AuditDashboardView } from './views/AuditDashboardView';

const MainContent = () => {
  const { currentView } = useApp();

  switch (currentView) {
    case 'dashboards':
      return <ExecutiveDashboards />;
    case 'accounting':
    case 'ledger':
      return <GeneralLedgerViewer />;
    case 'procurement':
      return <PurchaseInvoiceForm />;
    case 'inventory':
      return <InventoryKardexView />;
    case 'pos':
      return <FastPosRegister />;
    case 'audit':
      return <AuditDashboardView />;
    default:
      return <ExecutiveDashboards />;
  }
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout>
        <MainContent />
      </AppLayout>
    </AppProvider>
  );
}
