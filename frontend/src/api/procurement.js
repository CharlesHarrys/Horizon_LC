import apiClient from './client';

export const procurementApi = {
  // Proveedores
  getSuppliers: (companyId, params) => apiClient.get(`/procurement/suppliers/company/${companyId}`, { params }),
  createSupplier: (data) => apiClient.post('/procurement/suppliers/', data),
  getSupplierById: (id) => apiClient.get(`/procurement/suppliers/${id}`),

  // Rangos CAI
  getCaiRanges: (companyId) => apiClient.get(`/procurement/cai-ranges/company/${companyId}`),
  createCaiRange: (data) => apiClient.post('/procurement/cai-ranges/', data),

  // Facturas de Compra
  getInvoices: (companyId, params) => apiClient.get(`/procurement/invoices/company/${companyId}`, { params }),
  createInvoice: (data) => apiClient.post('/procurement/invoices/', data),
  getInvoiceById: (id) => apiClient.get(`/procurement/invoices/${id}`),
  updateHeader: (invoiceId, companyId, data) =>
    apiClient.patch(`/procurement/invoices/${invoiceId}/company/${companyId}/header`, data),
  postInvoice: (invoiceId, companyId, data) =>
    apiClient.post(`/procurement/invoices/${invoiceId}/company/${companyId}/post`, data),

  // Paste & OCR
  processFiscalScreenshot: (formData) =>
    apiClient.post('/procurement/invoices/process-fiscal-screenshot', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
