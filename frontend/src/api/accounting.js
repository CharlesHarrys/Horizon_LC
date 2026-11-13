import apiClient from './client';

export const accountingApi = {
  // Catálogo de Cuentas
  getAccountsByCompany: (companyId, params) => apiClient.get(`/accounts/company/${companyId}`, { params }),
  getAccountsTree: (companyId) => apiClient.get(`/accounts/company/${companyId}/tree`),
  createAccount: (data) => apiClient.post('/accounts/', data),
  getAccountById: (id) => apiClient.get(`/accounts/${id}`),

  // Períodos Fiscales
  getFiscalPeriods: (companyId) => apiClient.get(`/fiscal-periods/company/${companyId}`),
  generateYear: (data) => apiClient.post('/fiscal-periods/generate-year', data),
  lockPeriod: (periodId, companyId, data) => apiClient.post(`/fiscal-periods/${periodId}/company/${companyId}/lock`, data),
  unlockPeriod: (periodId, companyId, data) => apiClient.post(`/fiscal-periods/${periodId}/company/${companyId}/unlock`, data),

  // Partidas de Diario
  getJournalEntries: (companyId, params) => apiClient.get(`/journal-entries/company/${companyId}`, { params }),
  createJournalEntry: (data) => apiClient.post('/journal-entries/', data),
  getJournalEntryById: (id) => apiClient.get(`/journal-entries/${id}`),
  reverseJournalEntry: (entryId, companyId, data) => apiClient.post(`/journal-entries/${entryId}/company/${companyId}/reverse`, data),
};
