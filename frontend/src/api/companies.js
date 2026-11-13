import apiClient from './client';

export const companiesApi = {
  list: (params) => apiClient.get('/companies/', { params }),
  create: (data) => apiClient.post('/companies/', data),
  getById: (id) => apiClient.get(`/companies/${id}`),
  update: (id, data) => apiClient.patch(`/companies/${id}`, data),
};
