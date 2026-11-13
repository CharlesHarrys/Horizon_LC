import axios from 'axios';

// Base URL points to FastAPI proxy or direct host
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor de Petición: inyecta company_id en params o headers si está presente en localStorage
apiClient.interceptors.request.use(
  (config) => {
    const activeCompanyId = localStorage.getItem('erp_active_company_id');
    if (activeCompanyId) {
      config.headers['X-Company-ID'] = activeCompanyId;
      // Inyectar en query params si la ruta requiere company_id y no se pasó explícitamente
      if (config.params && !config.params.company_id && config.method === 'get') {
        config.params.company_id = activeCompanyId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuesta: normalización de errores de backend FastAPI
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let errorMessage = 'Ocurrió un error inesperado en el servidor.';
    let errorCode = 'SERVER_ERROR';

    if (error.response) {
      const data = error.response.data;
      if (typeof data?.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data?.detail)) {
        errorMessage = data.detail.map((err) => `${err.loc.join('.')}: ${err.msg}`).join(' | ');
      } else if (data?.message) {
        errorMessage = data.message;
      }
      errorCode = data?.error_code || `HTTP_${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No se pudo conectar con el servidor backend ERP (127.0.0.1:8000). Verifique su conexión.';
      errorCode = 'NETWORK_ERROR';
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.code = errorCode;
    enhancedError.status = error.response?.status;
    enhancedError.original = error;

    console.error(`[ERP API Error] [${errorCode}]:`, errorMessage);
    return Promise.reject(enhancedError);
  }
);

export default apiClient;
