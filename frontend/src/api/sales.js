import apiClient from './client';

export const salesApi = {
  // Clientes
  getCustomers: (companyId, params) => apiClient.get(`/sales/customers/company/${companyId}`, { params }),
  createCustomer: (data) => apiClient.post('/sales/customers/', data),
  getCustomerById: (id) => apiClient.get(`/sales/customers/${id}`),

  // Rangos CAI
  getCaiRanges: (companyId) => apiClient.get(`/sales/cai-ranges/company/${companyId}`),
  createCaiRange: (data) => apiClient.post('/sales/cai-ranges/', data),

  // POS Sessions
  openPosSession: (data) => apiClient.post('/sales/pos/sessions/open', data),
  closePosSession: (sessionId, data) => apiClient.post(`/sales/pos/sessions/${sessionId}/close`, data),
  getPosSession: (sessionId) => apiClient.get(`/sales/pos/sessions/${sessionId}`),

  // Facturación
  createAndIssueInvoice: (data) => apiClient.post('/sales/invoices', data),
  getInvoiceById: (invoiceId) => apiClient.get(`/sales/invoices/${invoiceId}`),
  registerPayment: (invoiceId, data) => apiClient.post(`/sales/invoices/${invoiceId}/payments`, data),
};
