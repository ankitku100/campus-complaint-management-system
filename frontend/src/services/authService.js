import api from './api';

export const loginRequest = async (email, password) => (await api.post('/auth/login', { email, password })).data;
export const registerRequest = async (userData) => (await api.post('/auth/register', userData)).data;
export const getCurrentUser = async () => (await api.get('/auth/me')).data;
export const updateProfilePictureRequest = async (formData) => (await api.put('/auth/profile-picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
export const deleteProfilePictureRequest = async () => (await api.delete('/auth/profile-picture')).data;
export const updateProfileRequest = async (userData) => (await api.put('/auth/profile', userData)).data;

export const sendOtpRequest = async (email) => (await api.post('/auth/send-otp', { email })).data;
export const verifyOtpRequest = async (email, otp) => (await api.post('/auth/verify-otp', { email, otp })).data;
export const resetPasswordRequest = async (email, otp, password) => (await api.post('/auth/reset-password', { email, otp, password })).data;
