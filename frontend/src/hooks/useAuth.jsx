import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getCurrentUser, loginRequest, registerRequest, updateProfilePictureRequest, deleteProfilePictureRequest, updateProfileRequest } from '../services/authService';
import { addComplaintMessage, createComplaintRequest, getMyComplaints, rateComplaintRequest } from '../services/complaintService';
import {
  approveStaffRequest,
  assignStaffRequest,
  getAdminComplaints,
  getPendingStaff,
  getStaff,
  rejectStaffRequest,
  updateAdminComplaint,
  verifyComplaintRequest,
  reopenComplaintRequest,
  checkEscalationsRequest,
  getStudents
} from '../services/adminService';
import { getAssignedComplaints, updateStaffComplaint, completeComplaintRequest } from '../services/staffService';
import { getErrorMessage } from '../services/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('campuscare_user')) || null;
  } catch {
    sessionStorage.removeItem('campuscare_user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [complaints, setComplaints] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingData, setLoadingData] = useState(Boolean(sessionStorage.getItem('campuscare_token')));
  const [dataError, setDataError] = useState('');

  const clearSession = useCallback(() => {
    sessionStorage.removeItem('campuscare_token');
    sessionStorage.removeItem('campuscare_user');
    setUser(null);
    setComplaints([]);
    setStaffMembers([]);
    setPendingStaff([]);
    setStudents([]);
  }, []);

  const storeUser = (nextUser) => {
    sessionStorage.setItem('campuscare_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const refreshData = useCallback(async (activeUser = user) => {
    if (!activeUser || !sessionStorage.getItem('campuscare_token')) return;
    setLoadingData(true);
    setDataError('');
    try {
      if (activeUser.role === 'ADMIN' || activeUser.role === 'admin') {
        const [staff, awaiting, studentsList] = await Promise.all([
          getStaff(),
          getPendingStaff(),
          getStudents()
        ]);
        setStaffMembers(staff);
        setPendingStaff(awaiting);
        setStudents(studentsList);
      }
    } catch (error) {
      setDataError(getErrorMessage(error));
      if (error.response?.status === 401) clearSession();
    } finally {
      setLoadingData(false);
    }
  }, [clearSession, user]);

  useEffect(() => {
    const token = sessionStorage.getItem('campuscare_token');
    if (!token) {
      setLoadingData(false);
      return;
    }

    getCurrentUser()
      .then(({ user: currentUser }) => {
        storeUser({ ...currentUser, profilePicture: currentUser.profilePicture || user?.profilePicture || '' });
        return refreshData(currentUser);
      })
      .catch(clearSession)
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', clearSession);
    return () => window.removeEventListener('auth:unauthorized', clearSession);
  }, [clearSession]);

  const login = async (email, password) => {
    try {
      const data = await loginRequest(email, password);
      sessionStorage.setItem('campuscare_token', data.token);
      storeUser(data.user);
      await refreshData(data.user);
      return { success: true, role: data.user.role };
    } catch (error) {
      const isVerificationRequired = error.response?.data?.emailVerificationRequired;
      const verifiedEmail = error.response?.data?.email || email;
      return { 
        success: false, 
        error: getErrorMessage(error), 
        emailVerificationRequired: isVerificationRequired, 
        email: verifiedEmail 
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await registerRequest({ ...userData, role: userData.role || 'USER' });
      if (data.emailVerificationRequired) {
        return { success: true, emailVerificationRequired: true, email: data.email, message: data.message };
      }
      if (!data.token) return { success: true, awaitingApproval: true, message: data.message };
      sessionStorage.setItem('campuscare_token', data.token);
      storeUser(data.user);
      await refreshData(data.user);
      return { success: true, role: data.user.role };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const logout = () => clearSession();

  const replaceComplaint = (updated) => {
    setComplaints((items) => items.map((item) => item.id === updated.id ? updated : item));
    return updated;
  };

  const addComplaint = async (data) => {
    const created = await createComplaintRequest(data);
    setComplaints((items) => [created, ...items]);
    return created;
  };

  const assignStaff = async (complaintId, staffId) => {
    return replaceComplaint(await assignStaffRequest(complaintId, staffId));
  };

  const updateComplaintStatus = async (complaintId, status, remarks = '', resolutionImage = '') => {
    const updated = user.role?.toUpperCase() === 'ADMIN'
      ? await updateAdminComplaint(complaintId, { status, remarks })
      : await updateStaffComplaint(complaintId, { status, remarks, resolutionImage });
    return replaceComplaint(updated);
  };

  const completeComplaint = async (complaintId, notes, files = []) => {
    const formData = new FormData();
    formData.append('notes', notes);
    files.forEach((file) => {
      formData.append('images', file);
    });
    const updated = await completeComplaintRequest(complaintId, formData);
    return replaceComplaint(updated);
  };

  const verifyComplaint = async (complaintId) => {
    const updated = await verifyComplaintRequest(complaintId);
    return replaceComplaint(updated);
  };

  const reopenComplaint = async (complaintId) => {
    const updated = await reopenComplaintRequest(complaintId);
    return replaceComplaint(updated);
  };

  const addChatMessage = async (complaintId, message) => {
    return replaceComplaint(await addComplaintMessage(complaintId, message));
  };

  const rateComplaint = async (complaintId, rating, feedback, satisfactionStatus) => {
    const result = await rateComplaintRequest(complaintId, rating, feedback, satisfactionStatus);
    await refreshData();
    return result;
  };

  const approveStaff = async (id) => {
    await approveStaffRequest(id);
    await refreshData();
  };

  const rejectStaff = async (id) => {
    await rejectStaffRequest(id);
    await refreshData();
  };

  const checkEscalations = async () => {
    const result = await checkEscalationsRequest();
    await refreshData();
    return result;
  };

  const updateProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const result = await updateProfilePictureRequest(formData);
    storeUser(result.user);
    return result.user.profilePicture;
  };

  const removeProfilePicture = async () => {
    const result = await deleteProfilePictureRequest();
    storeUser(result.user);
  };

  const updateProfile = async (userData) => {
    const result = await updateProfileRequest(userData);
    storeUser(result.user);
    return result.user;
  };

  const markNotificationRead = (id) => {
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      complaints,
      staffMembers,
      pendingStaff,
      students,
      notifications,
      loadingData,
      dataError,
      login,
      register,
      logout,
      refreshData,
      addComplaint,
      assignStaff,
      updateComplaintStatus,
      completeComplaint,
      verifyComplaint,
      reopenComplaint,
      addChatMessage,
      rateComplaint,
      approveStaff,
      rejectStaff,
      checkEscalations,
      updateProfilePicture,
      removeProfilePicture,
      updateProfile,
      markNotificationRead,
      clearNotifications: () => setNotifications([])
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
