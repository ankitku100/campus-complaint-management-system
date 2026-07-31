import api from './api';

export const createComplaintRequest = async (complaint) => (
  await api.post('/complaints', {
    ...complaint,
    imageUrl: complaint.images?.[0] || ''
  })
).data;
export const getMyComplaints = async (params) => (await api.get('/complaints/my', { params })).data;
export const getStudentDashboardStats = async () => (await api.get('/complaints/stats')).data;
export const getComplaint = async (id) => (await api.get(`/complaints/${id}`)).data;
export const addComplaintMessage = async (id, message) => (await api.post(`/complaints/${id}/messages`, { message })).data;
export const rateComplaintRequest = async (id, rating, feedback, satisfactionStatus) => (await api.post(`/complaints/${id}/rate`, { rating, feedback, satisfactionStatus })).data;
export const getStudentProfileStats = async () => (await api.get('/student/profile/stats')).data;
export const getStudentComplaint = async (id) => (await api.get(`/student/complaints/${id}`)).data;
export const deleteComplaintRequest = async (id) => (await api.delete(`/complaints/${id}`)).data;
