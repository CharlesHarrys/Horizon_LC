import React, { createContext, useContext, useState, useEffect } from 'react';
import { companiesApi } from '../api/companies';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboards');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.id === toast?.id ? null : prev));
    }, 4500);
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await companiesApi.list({ limit: 100 });
      const list = res.items || [];
      setCompanies(list);

      const savedId = localStorage.getItem('erp_active_company_id');
      const found = list.find((c) => c.id === savedId) || list[0] || null;
      if (found) {
        setActiveCompany(found);
        localStorage.setItem('erp_active_company_id', found.id);
      }
    } catch (err) {
      showToast('Error cargando empresas: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const switchCompany = (company) => {
    setActiveCompany(company);
    localStorage.setItem('erp_active_company_id', company.id);
    showToast(`Empresa activa: ${company.legal_name}`, 'success');
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <AppContext.Provider
      value={{
        companies,
        activeCompany,
        switchCompany,
        loading,
        currentView,
        setCurrentView,
        toast,
        setToast,
        showToast,
        reloadCompanies: loadCompanies,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  }
  return context;
};
