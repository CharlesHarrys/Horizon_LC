import apiClient from './client';

export const reportingApi = {
  // Mayores y Auxiliares
  getAccountLedger: (accountId, params) => apiClient.get(`/reporting/ledger/account/${accountId}`, { params }),
  getSupplierSubledger: (supplierId, params) => apiClient.get(`/reporting/subledger/supplier/${supplierId}`, { params }),
  getCustomerSubledger: (customerId, params) => apiClient.get(`/reporting/subledger/customer/${customerId}`, { params }),

  // Estados Financieros
  getTrialBalance: (companyId, params) => apiClient.get(`/reporting/trial-balance/company/${companyId}`, { params }),
  getBalanceSheet: (companyId, params) => apiClient.get(`/reporting/balance-sheet/company/${companyId}`, { params }),
  getIncomeStatement: (companyId, params) => apiClient.get(`/reporting/income-statement/company/${companyId}`, { params }),

  // Libros SAR
  getSarPurchaseBook: (companyId, params) => apiClient.get(`/reporting/sar/purchase-book/company/${companyId}`, { params }),
  getSarSalesBook: (companyId, params) => apiClient.get(`/reporting/sar/sales-book/company/${companyId}`, { params }),
};
