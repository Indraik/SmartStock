import api, { cleanParams } from './api';

export async function getInventory(params = {}) {
  const { data } = await api.get('/inventory', {
    params: cleanParams(params),
  });
  return data;
}

export async function getLowStockProducts(params = {}) {
  const { data } = await api.get('/inventory/low-stock', {
    params: cleanParams(params),
  });
  return data;
}

export async function adjustStock(productId, payload) {
  const { data } = await api.patch(`/inventory/${productId}`, payload);
  return data;
}

export async function getAdjustmentHistory(productId, params = {}) {
  const { data } = await api.get(`/inventory/${productId}/history`, {
    params: cleanParams(params),
  });
  return data;
}
