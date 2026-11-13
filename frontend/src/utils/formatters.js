/**
 * Formatters and mask utilities for Honduran currency (HNL), SAR dates and CAI correlatives.
 */

export const formatCurrency = (amount, currency = 'HNL') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'L 0.00';
  }
  const num = Number(amount);
  return `L ${num.toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0.00';
  }
  return Number(num).toLocaleString('es-HN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const parts = String(dateString).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return new Date(dateString).toLocaleDateString('es-HN');
};

export const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toLocaleString('es-HN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
};

export const formatSarInvoiceNumber = (val) => {
  if (!val) return '';
  const clean = val.replace(/[^0-9]/g, '');
  let formatted = '';
  if (clean.length > 0) formatted += clean.substring(0, 3);
  if (clean.length > 3) formatted += '-' + clean.substring(3, 6);
  if (clean.length > 6) formatted += '-' + clean.substring(6, 8);
  if (clean.length > 8) formatted += '-' + clean.substring(8, 16);
  return formatted;
};
