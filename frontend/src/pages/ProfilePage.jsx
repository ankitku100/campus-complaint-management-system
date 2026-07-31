import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Toast } from '../components/Toast';
import { FiMail, FiPhone, FiInfo, FiUser, FiCamera, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { getAdminProfileStats } from '../services/adminService';
import { getStaffProfileStats } from '../services/staffService';
import { getStudentProfileStats } from '../services/complaintService';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Input, Select } from '../components/FormControls';
import { IndianPhoneInput } from '../components/IndianPhoneInput';
import { isValidIndianMobile, formatIndianMobile } from '../utils/phoneFormatter';

export const ProfilePage = () => {
  const { user, updateProfilePicture, removeProfilePicture, updateProfile } = useAuth();
  
  const fileInputRef = useRef(null);
  
  // Profile edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editRegNum, setEditRegNum] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  // Image upload and preview states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Statistics states
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Toast notifications states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  // Helper to get initials for default avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Fetch statistics from the backend on load
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError('');
      try {
        const role = user?.role?.toUpperCase();
        let data = null;
        if (role === 'STUDENT' || role === 'USER') {
          data = await getStudentProfileStats();
        } else if (role === 'STAFF') {
          data = await getStaffProfileStats();
        } else if (role === 'ADMIN') {
          data = await getAdminProfileStats();
        }
        if (isMounted && data) {
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load profile stats:', err);
        if (isMounted) {
          setStatsError('Failed to load statistics.');
        }
      } finally {
        if (isMounted) {
          setLoadingStats(false);
        }
      }
    };

    if (user) {
      fetchStats();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Sync edit states when user changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditMobile(formatIndianMobile(user.mobile || ''));
      setEditDept(user.department || '');
      setEditYear(user.year || '');
      setEditRegNum(user.registrationNumber || '');
    }
  }, [user]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (editMobile && !isValidIndianMobile(editMobile)) {
      setEditError('Please enter a valid Indian mobile number.');
      return;
    }
    setEditError('');
    setEditLoading(true);

    try {
      const payload = {
        name: editName,
        mobile: editMobile,
        department: editDept,
        year: editYear,
        registrationNumber: editRegNum
      };
      await updateProfile(payload);
      showToast('Profile details updated successfully!', 'success');
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update profile details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarClick = () => {
    // Prevent clicking file selector while uploading
    if (uploading) return;
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid format. Please upload JPG, JPEG, PNG or WEBP.', 'error');
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds the 5MB limit.', 'error');
      return;
    }

    setSelectedFile(file);
    // Create local object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelPreview = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await updateProfilePicture(selectedFile);
      showToast('Profile picture updated successfully!', 'success');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to upload image.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    setUploading(true);
    try {
      await removeProfilePicture();
      showToast('Profile picture removed. Reverted to default avatar.', 'success');
      handleCancelPreview();
    } catch (err) {
      console.error(err);
      showToast('Failed to remove profile picture.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto">
      {/* Toast Notification Alert */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {user?.role?.toUpperCase() === 'STUDENT' ? 'Student Profile' : user?.role?.toUpperCase() === 'STAFF' ? 'Staff Profile' : 'Admin Profile'}
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Manage your personal details, credentials, and customize your profile avatar.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <Card variant="dark" className="border border-slate-800 p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800/60">
          
          {/* Editable Avatar Circle */}
          <div className="relative group flex-shrink-0">
            <div
              onClick={handleAvatarClick}
              className={`
                w-24 h-24 rounded-full border border-slate-700 bg-slate-900 overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 relative select-none
                ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-neon hover:shadow-glow'}
              `}
            >
              {uploading ? (
                // Loading spinner
                <svg className="animate-spin h-8 w-8 text-neon" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : previewUrl ? (
                // Local preview
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : user?.profilePicture ? (
                // Active profile photo
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                // Default initials initials circle
                <span className="text-2xl font-black text-slate-350 tracking-wider">
                  {getInitials(user?.name)}
                </span>
              )}

              {/* Hover camera edit overlay */}
              {!uploading && (
                <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg rounded-full">
                  <FiCamera className="text-neon animate-pulse" />
                </div>
              )}
            </div>

            {/* Hidden native file selector */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg, image/jpg, image/png, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Main Titles and Preview Actions */}
          <div className="text-center sm:text-left space-y-2.5 flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-2 w-full">
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <Badge value={user?.role} />
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="sm:ml-auto text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl text-slate-350 font-bold transition-all"
              >
                Edit Profile
              </button>
            </div>
            
            <p className="text-xs text-slate-400 font-medium">{user?.details}</p>
            {user?.role?.toUpperCase() === 'STAFF' && user?.category && (
              <p className="text-xs text-slate-350 font-semibold mt-1">
                Specialization: <Badge value={user.category} />
              </p>
            )}
            <p className="text-[10px] text-slate-500 font-mono">User ID: {user?.id}</p>

            {/* Avatar Preview Controls */}
            {previewUrl && !uploading && (
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 animate-in fade-in duration-200">
                <button
                  onClick={handleSaveAvatar}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-neon hover:bg-neon-dark text-slate-900 rounded-lg text-xs font-bold transition-all shadow-glow"
                >
                  <FiCheck /> Save Picture
                </button>
                <button
                  onClick={handleCancelPreview}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all"
                >
                  <FiX /> Cancel
                </button>
              </div>
            )}

            {/* Remove picture button */}
            {user?.profilePicture && !previewUrl && !uploading && (
              <div className="flex items-center justify-center sm:justify-start pt-1">
                <button
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  <FiTrash2 /> Remove Profile Picture
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/40 pb-2">
                Contact Information
              </h3>
              
              <div className="flex items-center gap-3">
                <FiMail className="text-neon text-lg" />
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Email Address</span>
                  <span className="text-white font-medium">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FiPhone className="text-neon text-lg" />
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Mobile Number</span>
                  <span className="text-white font-medium font-mono">{formatIndianMobile(user?.mobile)}</span>
                </div>
              </div>
            </div>

            {user?.role?.toUpperCase() === 'STUDENT' && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/40 pb-2">
                  Academic Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Department</span>
                    <span className="text-white font-medium">{user?.department || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Year</span>
                    <span className="text-white font-medium">{user?.year || 'Not Provided'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Registration Number</span>
                    <span className="text-white font-medium font-mono">{user?.registrationNumber || 'Not Provided'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/40 pb-2">
              Account Statistics
            </h3>
            
            {loadingStats ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-slate-800 border-t-neon rounded-full animate-spin"></div>
                <span className="text-slate-400 text-xs ml-3">Loading statistics...</span>
              </div>
            ) : statsError ? (
              <div className="text-red-400 text-xs py-4 text-center">{statsError}</div>
            ) : user?.role?.toUpperCase() === 'STUDENT' || user?.role?.toUpperCase() === 'USER' ? (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] font-bold uppercase block">Total Raised</span>
                  <span className="text-xl font-black text-white font-mono">{stats?.totalRaised ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-sky-400 text-[10px] font-bold uppercase block">In Progress</span>
                  <span className="text-xl font-black text-sky-400 font-mono">{stats?.inProgress ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-[#B6FF5C]/70 text-[10px] font-bold uppercase block">Resolved</span>
                  <span className="text-xl font-black text-[#B6FF5C] font-mono">{stats?.resolved ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-purple-400 text-[10px] font-bold uppercase block">Closed</span>
                  <span className="text-xl font-black text-purple-400 font-mono">{stats?.closed ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 col-span-2">
                  <span className="text-amber-400 text-[10px] font-bold uppercase block">Average Rating Given</span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {stats?.averageRating ? `${stats.averageRating} / 5` : 'N/A'}
                  </span>
                </div>
              </div>
            ) : user?.role?.toUpperCase() === 'STAFF' ? (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] font-bold uppercase block">Jobs Assigned</span>
                  <span className="text-xl font-black text-white font-mono">{stats?.jobsAssigned ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-sky-400 text-[10px] font-bold uppercase block">Jobs In Progress</span>
                  <span className="text-xl font-black text-sky-400 font-mono">{stats?.jobsInProgress ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-[#B6FF5C]/70 text-[10px] font-bold uppercase block">Jobs Completed</span>
                  <span className="text-xl font-black text-[#B6FF5C] font-mono">{stats?.jobsCompleted ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-amber-400 text-[10px] font-bold uppercase block">Current Workload Score</span>
                  <span className="text-xl font-black text-amber-400 font-mono">{stats?.currentWorkloadScore ?? 0}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] font-bold uppercase block">Total Students</span>
                  <span className="text-xl font-black text-white font-mono">{stats?.totalStudents ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] font-bold uppercase block">Total Staff</span>
                  <span className="text-xl font-black text-white font-mono">{stats?.totalStaff ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-350 text-[10px] font-bold uppercase block">Total Complaints</span>
                  <span className="text-xl font-black text-slate-350 font-mono">{stats?.totalComplaints ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-amber-400 text-[10px] font-bold uppercase block">Pending Complaints</span>
                  <span className="text-xl font-black text-amber-400 font-mono">{stats?.pendingComplaints ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-sky-400 text-[10px] font-bold uppercase block">Active Complaints</span>
                  <span className="text-xl font-black text-sky-400 font-mono">{stats?.activeComplaints ?? 0}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-[#B6FF5C]/70 text-[10px] font-bold uppercase block">Closed Complaints</span>
                  <span className="text-xl font-black text-[#B6FF5C] font-mono">{stats?.closedComplaints ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Explanation Panel */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-400">
          <FiInfo className="text-neon text-lg flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">System Role: {user?.role?.toUpperCase()}</span>
            <p className="leading-relaxed">
              {user?.role?.toUpperCase() === 'STUDENT' && 'As a student resident, you can file maintenance tickets, upload image attachments, track repair progress, and communicate with maintenance staff.'}
              {user?.role?.toUpperCase() === 'ADMIN' && 'As a system administrator, you can view global metrics, assign specialized technical personnel to pending tickets, configure ticket priorities, edit lifecycles, and write system remarks.'}
              {user?.role?.toUpperCase() === 'STAFF' && 'As maintenance staff, you can view jobs assigned directly to you, update dispatch states, add resolution comments, and upload resolution proof images.'}
            </p>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile Details"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
          {editError && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
              <FiInfo className="text-lg flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <Input
            label="Full Name *"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <IndianPhoneInput
            label="Mobile Number"
            value={editMobile}
            onChange={(e) => setEditMobile(e.target.value)}
          />

          {(user?.role?.toUpperCase() === 'STUDENT' || user?.role?.toUpperCase() === 'USER') && (
            <>
              <Input
                label="Department"
                value={editDept}
                onChange={(e) => setEditDept(e.target.value)}
                placeholder="e.g. Computer Science, Mechanical"
              />
              <Select
                label="Year of Study"
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                options={[
                  { value: '', label: 'Select Year' },
                  { value: '1st Year', label: '1st Year' },
                  { value: '2nd Year', label: '2nd Year' },
                  { value: '3rd Year', label: '3rd Year' },
                  { value: '4th Year', label: '4th Year' },
                  { value: 'Postgraduate', label: 'Postgraduate' }
                ]}
              />
              <Input
                label="Registration Number"
                value={editRegNum}
                onChange={(e) => setEditRegNum(e.target.value)}
                placeholder="e.g. REG123456"
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="neon"
              loading={editLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
