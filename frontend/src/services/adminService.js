import api from './api';

export const getAdminComplaints = async (params) => (await api.get('/admin/complaints', { params })).data;
export const getAdminStats = async () => (await api.get('/admin/stats')).data;
export const getStaff = async () => (await api.get('/admin/staff')).data;
export const getPendingStaff = async () => (await api.get('/admin/pending-staff')).data;
export const approveStaffRequest = async (id) => (await api.patch(`/admin/approve-staff/${id}`)).data;
export const rejectStaffRequest = async (id) => (await api.delete(`/admin/staff/${id}`)).data;
export const assignStaffRequest = async (complaintId, staffId) => (await api.patch(`/admin/complaints/${complaintId}/assign`, { staffId })).data;
export const updateAdminComplaint = async (complaintId, data) => (await api.patch(`/admin/complaints/${complaintId}`, data)).data;
export const verifyComplaintRequest = async (id) => (await api.put(`/admin/complaints/${id}/verify`)).data;
export const reopenComplaintRequest = async (id) => (await api.put(`/admin/complaints/${id}/reopen`)).data;
export const getStaffPerformance = async () => (await api.get('/admin/staff-performance')).data;
export const checkEscalationsRequest = async () => (await api.post('/admin/escalations/check')).data;
export const getStudents = async () => (await api.get('/admin/students')).data;
export const getAdminProfileStats = async () => (await api.get('/admin/profile/stats')).data;

// Admin User Management Services
export const adminAddUser = async (data) => (await api.post('/admin/users', data)).data;
export const updateUser = async (id, data) => (await api.patch(`/admin/users/${id}`, data)).data;
export const toggleUserVerify = async (id) => (await api.patch(`/admin/users/${id}/toggle-verify`)).data;
export const toggleUserStatus = async (id) => (await api.patch(`/admin/users/${id}/toggle-status`)).data;
export const resetUserPassword = async (id, newPassword) => (await api.patch(`/admin/users/${id}/reset-password`, { newPassword })).data;
export const deleteUser = async (id) => (await api.delete(`/admin/users/${id}`)).data;
export const getUserDetails = async (id) => (await api.get(`/admin/users/${id}/details`)).data;
