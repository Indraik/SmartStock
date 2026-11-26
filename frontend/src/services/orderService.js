import api, { cleanParams } from './api';

export async function createOrder(payload) {
  const { data } = await api.post('/orders', payload);
  return data;
}

export async function getOrders(params = {}) {
  const { data } = await api.get('/orders', {
    params: cleanParams(params),
  });
  return data;
}

export async function getOrderById(id) {
  const { data } = await api.get(`/orders/${id}`);
  return data;
}

export async function updateOrderStatus(id, status) {
  const { data } = await api.patch(`/orders/${id}/status`, { status });
  return data;
}

export async function cancelOrder(id) {
  const { data } = await api.patch(`/orders/${id}/cancel`);
  return data;
}
