import apiClient from './client';

export const inventoryApi = {
  // Bodegas
  getWarehouses: (companyId) => apiClient.get(`/inventory/warehouses/company/${companyId}`),
  createWarehouse: (data) => apiClient.post('/inventory/warehouses/', data),

  // Artículos
  getItems: (companyId, params) => apiClient.get(`/inventory/items/company/${companyId}`, { params }),
  createItem: (data) => apiClient.post('/inventory/items/', data),
  getItemById: (id) => apiClient.get(`/inventory/items/${id}`),

  // Existencias y Kardex
  getStockLevels: (companyId, params) => apiClient.get(`/inventory/stock/company/${companyId}`, { params }),
  recordMovement: (data) => apiClient.post('/inventory/movements', data),
  transferBetweenWarehouses: (data) => apiClient.post('/inventory/transfers', data),
  getKardexByItem: (itemId, params) => apiClient.get(`/inventory/kardex/${itemId}`, { params }),

  // Landed Cost
  allocateLandedCost: (data) => apiClient.post('/inventory/landed-cost/allocate', data),
};
