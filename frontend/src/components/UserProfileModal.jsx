import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { Input, Select } from './FormControls';
import { IndianPhoneInput } from './IndianPhoneInput';
import { formatIndianMobile, isValidIndianMobile } from '../utils/phoneFormatter';
import { 
  getUserDetails, 
  updateUser, 
  toggleUserVerify, 
  toggleUserStatus, 
  resetUserPassword, 
  deleteUser 
} from '../services/adminService';
import { 
  FiUser, FiMail, FiPhone, FiCalendar, FiClock, FiSettings, 
  FiSliders, FiTrash2, FiKey, FiCheck, FiX, FiActivity, 
  FiBriefcase, FiAlertTriangle, FiBookOpen, FiShield, FiStar
} from 'react-icons/fi';
import { formatTimeAgo } from '../utils/dateFormatter';

export const UserProfileModal = ({ isOpen, onClose, userId, userRole, onUpdate }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  
  // Edit Form States
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [regNum, setRegNum] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // General Action Loading
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchDetails();
    } else {
      // Reset states
      setUserData(null);
      setActiveTab('overview');
      setIsEditing(false);
      setNewPassword('');
      setPwdSuccess('');
      setPwdError('');
    }
  }, [isOpen, userId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUserDetails(userId);
      setUserData(data);
      // Sync edit states
      if (data && data.user) {
        setName(data.user.name || '');
        setMobile(formatIndianMobile(data.user.mobile || ''));
        setCategory(data.user.category || '');
        setDepartment(data.user.department || '');
        setYear(data.user.year || '');
        setRegNum(data.user.registrationNumber || '');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load user profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (mobile && !isValidIndianMobile(mobile)) {
      setEditError('Please enter a valid Indian mobile number.');
      return;
    }
    setEditError('');
    setEditLoading(true);
    try {
      const payload = {
        name,
        mobile,
        category: userRole === 'STAFF' ? category : undefined,
        department: userRole === 'STUDENT' ? department : undefined,
        year: userRole === 'STUDENT' ? year : undefined,
        registrationNumber: userRole === 'STUDENT' ? regNum : undefined
      };
      await updateUser(userId, payload);
      setIsEditing(false);
      await fetchDetails();
      if (onUpdate) onUpdate();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleVerify = async () => {
    setActionLoading(true);
    try {
      await toggleUserVerify(userId);
      await fetchDetails();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Failed to toggle verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      await toggleUserStatus(userId);
      await fetchDetails();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Failed to toggle user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setPwdError('Password must contain at least one letter, one number, and one special character.');
      return;
    }
    setPwdError('');
    setPwdSuccess('');
    setPwdLoading(true);
    try {
      await resetUserPassword(userId, newPassword);
      setPwdSuccess('Password reset successfully!');
      setNewPassword('');
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete the account of ${userData?.user?.name}? This action CANNOT be undone.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await deleteUser(userId);
      alert('User account deleted successfully.');
      onClose();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user account.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${userRole === 'STAFF' ? 'Staff' : 'Student'} Profile Details`}
      size="full"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-neon rounded-full animate-spin"></div>
          <span className="text-slate-400 text-xs font-semibold">Fetching complete profile details...</span>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-semibold p-4 rounded-xl flex items-center gap-2">
          <FiAlertTriangle className="text-xl flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Cover / Profile Banner Header */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row items-center gap-6">
            {/* Background glowing gradient decorator */}
            <div className="absolute inset-0 bg-gradient-to-r from-neon/5 via-transparent to-transparent opacity-60 pointer-events-none" />
            
            {/* Large avatar circle */}
            <div className="relative w-24 h-24 rounded-full border border-slate-700 bg-slate-950 overflow-hidden flex-shrink-0">
              <img 
                src={userData?.user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData?.user?.name)}`} 
                alt={userData?.user?.name} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Basic Info titles */}
            <div className="text-center md:text-left flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h3 className="text-xl font-bold text-white">{userData?.user?.name}</h3>
                <Badge value={userData?.user?.role} />
                {userData?.user?.isDisabled && <Badge value="Disabled" className="bg-red-500/20 text-red-400 border border-red-500/30" />}
                {userData?.user?.isVerified ? (
                  <Badge value="Verified" className="bg-[#B6FF5C]/20 text-[#B6FF5C] border border-[#B6FF5C]/35" />
                ) : (
                  <Badge value="Unverified" className="bg-amber-500/20 text-amber-400 border border-amber-500/30" />
                )}
              </div>
              
              <p className="text-xs text-slate-400 font-mono truncate">{userData?.user?.email}</p>
              <p className="text-xs text-slate-400 font-mono">{formatIndianMobile(userData?.user?.mobile)}</p>
              
              {userData?.user?.role === 'STUDENT' ? (
                <p className="text-xs text-slate-300 font-semibold pt-1">
                  Department: <span className="text-white">{userData?.user?.department || 'N/A'}</span> • Year: <span className="text-white">{userData?.user?.year || 'N/A'}</span>
                </p>
              ) : (
                <p className="text-xs text-[#B6FF5C] font-semibold pt-1">
                  Specialization: <span className="underline">{userData?.user?.category || 'General'}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button 
                variant={isEditing ? "secondary" : "neon"} 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <><FiX className="inline mr-1"/> Cancel Edit</> : <><FiSliders className="inline mr-1"/> Edit Details</>}
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          {!isEditing && (
            <div className="flex border-b border-slate-800/80 gap-6 text-sm">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 font-semibold transition-all relative ${activeTab === 'overview' ? 'text-[#B6FF5C]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Overview
                {activeTab === 'overview' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B6FF5C]" />}
              </button>
              <button
                onClick={() => setActiveTab('complaints')}
                className={`pb-3 font-semibold transition-all relative ${activeTab === 'complaints' ? 'text-[#B6FF5C]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Complaints History ({userData?.complaints?.length || 0})
                {activeTab === 'complaints' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B6FF5C]" />}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-3 font-semibold transition-all relative ${activeTab === 'settings' ? 'text-[#B6FF5C]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Admin Control
                {activeTab === 'settings' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B6FF5C]" />}
              </button>
            </div>
          )}

          {/* Inline Edit Form */}
          {isEditing && (
            <Card variant="dark" className="border border-slate-800 p-6">
              <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Update Account Details</h4>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {editError && (
                  <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                    <FiAlertTriangle className="text-lg flex-shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Full Name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                  <IndianPhoneInput 
                    label="Mobile Number" 
                    value={mobile} 
                    onChange={e => setMobile(e.target.value)} 
                  />
                  
                  {userRole === 'STAFF' ? (
                    <Input 
                      label="Specialization Category" 
                      value={category} 
                      onChange={e => setCategory(e.target.value)} 
                      placeholder="e.g. Plumbing, IT Services"
                    />
                  ) : (
                    <>
                      <Input 
                        label="Department" 
                        value={department} 
                        onChange={e => setDepartment(e.target.value)} 
                        placeholder="e.g. Computer Science"
                      />
                      <Select
                        label="Year of Study"
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        options={[
                          { value: '', label: 'Select Year' },
                          { value: '1st Year', label: '1st Year' },
                          { value: '2nd Year', label: '2nd Year' },
                          { value: '3rd Year', label: '3rd Year' },
                          { value: '4th Year', label: '4th Year' },
                          { value: 'Postgraduate', label: 'Postgraduate' }
                        ]}
                      />
                      <div className="md:col-span-2">
                        <Input 
                          label="Registration Number" 
                          value={regNum} 
                          onChange={e => setRegNum(e.target.value)} 
                          placeholder="e.g. REG8927"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                  <Button variant="secondary" type="button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="neon" type="submit" loading={editLoading}>
                    Save Updates
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB: OVERVIEW */}
          {!isEditing && activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userRole === 'STAFF' ? (
                  <>
                    <Card variant="dark" className="p-4 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest">Jobs Assigned</span>
                      <span className="text-2xl font-black text-white font-mono mt-1 block">{userData?.stats?.jobsAssigned ?? 0}</span>
                    </Card>
                    <Card variant="dark" className="p-4 border border-slate-800 text-center">
                      <span className="text-[10px] text-sky-400 font-bold block uppercase tracking-widest">In Progress</span>
                      <span className="text-2xl font-black text-sky-400 font-mono mt-1 block">{userData?.stats?.jobsInProgress ?? 0}</span>
                    </Card>
                    <Card variant="dark" className="p-4 border border-slate-800 text-center">
                      <span className="text-[10px] text-[#B6FF5C] font-bold block uppercase tracking-widest">Completed</span>
                      <span className="text-2xl font-black text-[#B6FF5C] font-mono mt-1 block">{userData?.stats?.jobsCompleted ?? 0}</span>
                    </Card>
                    <Card variant="dark" className="p-4 border border-slate-800 text-center">
                      <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-widest">Workload Score</span>
                      <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{userData?.user?.currentWorkloadScore ?? 0}</span>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card variant="dark" className="p-4 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest">Total Raised</span>
                      <span className="text-2xl font-black text-white font-mono mt-1 block">{userData?.stats?.totalRaised ?? 0}</span>
                    </Card>
                    <Card variant="dark" className="p-4 border border-slate-800 text-center">
                      <span className="text-[10px] text-sky-400 font-bold block uppercase tracking-widest">Active Tasks</span>
                      <span className="text-2xl font-black text-sky-400 font-mono mt-1 block">{userData?.stats?.activeComplaints ?? 0}</span>
                    </Card>
                    <Card variant="dark" className="p-4 border border-slate-800 text-center">
                      <span className="text-[10px] text-[#B6FF5C] font-bold block uppercase tracking-widest">Resolved Tasks</span>
                      <span className="text-2xl font-black text-[#B6FF5C] font-mono mt-1 block">{userData?.stats?.resolvedComplaints ?? 0}</span>
                    </Card>
                    <Card variant="dark" className="p-4 border border-slate-800 text-center">
                      <span className="text-[10px] text-purple-400 font-bold block uppercase tracking-widest">Closed Tasks</span>
                      <span className="text-2xl font-black text-purple-400 font-mono mt-1 block">{userData?.stats?.closedComplaints ?? 0}</span>
                    </Card>
                  </>
                )}
              </div>

              {/* Detail Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* User Info Metadata List */}
                <Card variant="dark" className="p-5 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800/80 pb-2">Profile Meta Data</h4>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5"><FiCalendar/> Account Created</span>
                      <span className="font-semibold text-white font-mono">
                        {userData?.user?.createdAt ? new Date(userData.user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5"><FiClock/> Last Login Activity</span>
                      <span className="font-semibold text-white font-mono">
                        {userData?.user?.lastLogin ? formatTimeAgo(userData.user.lastLogin) : 'Never'}
                      </span>
                    </div>

                    {userRole === 'STAFF' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5"><FiStar/> Average Rating</span>
                          <span className="font-semibold text-amber-400 font-mono font-black">
                            {userData?.stats?.averageRating ? `${userData.stats.averageRating} / 5.0` : 'No reviews yet'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5"><FiActivity/> Avg Resolution Time</span>
                          <span className="font-semibold text-white font-mono">
                            {userData?.stats?.averageResolutionTime ? `${userData.stats.averageResolutionTime} Hours` : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}

                    {userRole === 'STUDENT' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5"><FiStar/> Avg Rating Given</span>
                          <span className="font-semibold text-amber-400 font-mono">
                            {userData?.stats?.averageRatingGiven ? `${userData.stats.averageRatingGiven} / 5.0` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5"><FiAlertTriangle/> Escalated Complaints</span>
                          <span className="font-semibold text-red-400 font-mono font-black">
                            {userData?.stats?.escalatedComplaints ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5"><FiBookOpen/> Registration No.</span>
                          <span className="font-semibold text-white font-mono font-bold">
                            {userData?.user?.registrationNumber || 'Not Provided'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* Additional contextual help card */}
                <Card variant="dark" className="p-5 border border-slate-800 flex flex-col justify-center text-center space-y-2">
                  <FiShield className="text-neon text-4xl mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">System Security & Access</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Manage this account status through the Admin Control panel. Toggle activation status, override password parameters, or verify registrations.
                  </p>
                </Card>
              </div>

            </div>
          )}

          {/* TAB: COMPLAINT HISTORY */}
          {!isEditing && activeTab === 'complaints' && (
            <Card variant="dark" className="border border-slate-800 p-5 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Associated Complaints History</h4>
              
              {userData?.complaints?.length > 0 ? (
                <div className="overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
                  <table className="min-w-full divide-y divide-slate-800 text-xs">
                    <thead>
                      <tr className="text-slate-400 font-semibold text-left border-b border-slate-800 pb-2">
                        <th className="px-3 py-2 uppercase tracking-wider">Ticket ID</th>
                        <th className="px-3 py-2 uppercase tracking-wider">Title</th>
                        <th className="px-3 py-2 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-2 uppercase tracking-wider">Priority</th>
                        <th className="px-3 py-2 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 uppercase tracking-wider text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                      {userData.complaints.map(c => (
                        <tr 
                          key={c.dbId} 
                          onClick={() => {
                            onClose();
                            navigate(`/student/complaints/${c.dbId}`);
                          }}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="px-3 py-3 font-bold text-white font-mono">{c.id}</td>
                          <td className="px-3 py-3 text-slate-300 font-medium truncate max-w-[120px]">{c.title}</td>
                          <td className="px-3 py-3 text-slate-400">{c.category}</td>
                          <td className="px-3 py-3">
                            <Badge 
                              value={c.priority} 
                              className={
                                c.priority === 'High' || c.priority === 'Critical' 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                  : c.priority === 'Medium' 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : 'bg-slate-800 text-slate-400'
                              }
                            />
                          </td>
                          <td className="px-3 py-3">
                            <Badge 
                              value={c.status} 
                              className={
                                c.status === 'Completed' || c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Verified'
                                  ? 'bg-[#B6FF5C]/10 text-[#B6FF5C] border border-[#B6FF5C]/20'
                                  : c.status === 'In Progress' 
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                    : 'bg-slate-800 text-slate-400'
                              }
                            />
                          </td>
                          <td className="px-3 py-3 text-right text-slate-500 font-mono">
                            {c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-slate-500 text-center py-10">
                  No complaints currently associated with this account.
                </div>
              )}
            </Card>
          )}

          {/* TAB: ADMIN CONTROL / SETTINGS */}
          {!isEditing && activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Account State Toggles */}
              <Card variant="dark" className="border border-slate-800 p-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">Status overrides</h4>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <span className="font-semibold text-xs text-white block">Account Activation Status</span>
                    <span className="text-[10px] text-slate-400">Suspend or restore account login permissions immediately.</span>
                  </div>
                  <Button 
                    variant={userData?.user?.isDisabled ? "neon" : "secondary"}
                    size="sm"
                    disabled={actionLoading}
                    onClick={handleToggleStatus}
                  >
                    {userData?.user?.isDisabled ? 'Activate Account' : 'Deactivate Account'}
                  </Button>
                </div>

                {userRole === 'STAFF' && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pt-3 border-t border-slate-850">
                    <div>
                      <span className="font-semibold text-xs text-white block">Specialist Verification Credentials</span>
                      <span className="text-[10px] text-slate-400">Flag specialist certifications as validated or pending review.</span>
                    </div>
                    <Button 
                      variant={userData?.user?.isVerified ? "secondary" : "neon"}
                      size="sm"
                      disabled={actionLoading}
                      onClick={handleToggleVerify}
                    >
                      {userData?.user?.isVerified ? 'Revoke Verification' : 'Verify Credentials'}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Overwrite Password form */}
              <Card variant="dark" className="border border-slate-800 p-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">Override Credentials</h4>
                
                <form onSubmit={handleResetPassword} className="space-y-3 max-w-md">
                  {pwdError && <div className="text-red-400 text-xs font-semibold">{pwdError}</div>}
                  {pwdSuccess && <div className="text-neon text-xs font-semibold">{pwdSuccess}</div>}
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <Input
                        label="Override New Password"
                        type="password"
                        placeholder="Enter 6+ characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        icon={FiKey}
                        required
                      />
                    </div>
                    <Button 
                      type="submit"
                      variant="neon"
                      size="sm"
                      className="py-3 px-6 h-[46px]"
                      loading={pwdLoading}
                    >
                      Reset Password
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Danger Zone */}
              <Card variant="dark" className="border border-red-500/10 p-5 space-y-4 bg-red-950/5">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider border-b border-red-500/15 pb-2 flex items-center gap-1.5">
                  <FiAlertTriangle/> Danger Zone
                </h4>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <span className="font-semibold text-xs text-white block">Permanently Delete User Account</span>
                    <span className="text-[10px] text-slate-400">Remove all credentials, files, and links associated with this member.</span>
                  </div>
                  <button 
                    disabled={actionLoading}
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/25 px-4 py-2 rounded-xl transition-all text-xs font-bold disabled:opacity-50"
                  >
                    <FiTrash2 /> Delete Account
                  </button>
                </div>
              </Card>

            </div>
          )}

        </div>
      )}
    </Modal>
  );
};
