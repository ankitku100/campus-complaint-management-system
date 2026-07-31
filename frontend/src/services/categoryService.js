import api from './api';

export const getCategoriesRequest = async () => (await api.get('/categories')).data;
export const addCategoryRequest = async (name) => (await api.post('/categories', { name })).data;
export const deleteCategoryRequest = async (id) => (await api.delete(`/categories/${id}`)).data;
