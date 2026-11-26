import api from './api';

export async function getSuppliers() {
  const { data } = await api.get('/suppliers');
  return data;
}

export async function createSupplier(payload) {
  const { data } = await api.post('/suppliers', payload);
  return data;
}

export async function updateSupplier(id, payload) {
  const { data } = await api.put(`/suppliers/${id}`, payload);
  return data;
}

export async function updateSupplierStatus(id, active) {
  const { data } = await api.patch(`/suppliers/${id}/status`, { active });
  return data;
}
