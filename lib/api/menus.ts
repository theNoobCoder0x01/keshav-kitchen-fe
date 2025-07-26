import api from './axios';

export async function fetchMenus(params = {}) {
  const response = await api.get('/menus', { params });
  return response.data;
}

export async function updateMenu(id: string, data: any) {
  const response = await api.put(`/menus?id=${id}`, data);
  return response.data;
}

export async function deleteMenu(id: string) {
  const response = await api.delete(`/menus?id=${id}`);
  return response.data;
}
