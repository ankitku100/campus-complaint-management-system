import api from './api';

export const getAssignedComplaints = async (params) => (await api.get('/staff/complaints', { params })).data;
export const getStaffDashboardStats = async () => (await api.get('/staff/stats')).data;
export const updateStaffComplaint = async (id, data) => (await api.patch(`/staff/complaints/${id}`, data)).data;
export const addStaffRemark = async (id, message) => (await api.patch(`/staff/remarks/${id}`, { message })).data;
export const completeComplaintRequest = async (id, formData) => (await api.put(`/staff/complaints/${id}/complete`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
export const getStaffPerformanceStats = async () => (await api.get('/staff/performance')).data;
export const getStaffProfileStats = async () => (await api.get('/staff/profile/stats')).data;
