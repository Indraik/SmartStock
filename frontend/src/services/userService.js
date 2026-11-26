import api, { cleanParams } from './api';

export async function getCurrentUser() {
  const { data } = await api.get('/users/me');
  return data;
}

export async function getUsers(params = {}) {
  const { data } = await api.get('/users', {
    params: cleanParams(params),
  });
  return data;
}

export async function getUserById(id) {
  const { data } = await api.get(`/users/${id}`);
  return data;
}

export async function updateUserStatus(id, enabled) {
  const { data } = await api.patch(`/users/${id}/status`, { enabled });
  return data;
}

export async function updateUserRole(id, role) {
  const { data } = await api.patch(`/users/${id}/role`, { role });
  return data;
}
