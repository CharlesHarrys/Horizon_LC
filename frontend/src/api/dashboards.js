import apiClient from './client';

export const dashboardsApi = {
  getFinancialDashboard: (companyId, params) => apiClient.get('/dashboards/financial', { params: { company_id: companyId, ...params } }),
  getOperationalDashboard: (companyId, params) => apiClient.get('/dashboards/operational', { params: { company_id: companyId, ...params } }),
  getAuditDashboard: (companyId, params) => apiClient.get('/dashboards/audit', { params: { company_id: companyId, ...params } }),
};
