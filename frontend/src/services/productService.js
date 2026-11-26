import api, { cleanParams } from './api';

export async function getProducts(params = {}) {
  const { data } = await api.get('/products', {
    params: cleanParams(params),
  });
  return data;
}

export async function getProductById(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function createProduct(payload) {
  const { data } = await api.post('/products', payload);
  return data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
}

export async function updateProductStatus(id, active) {
  const { data } = await api.patch(`/products/${id}/status`, { active });
  return data;
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`);
}
