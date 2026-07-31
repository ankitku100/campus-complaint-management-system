import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input, Select } from '../components/FormControls';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { IndianPhoneInput } from '../components/IndianPhoneInput';
import { 
  FiUsers, FiUserCheck, FiUserX, FiTrash2, 
  FiFolderPlus, FiBriefcase, FiAlertCircle, FiUserPlus
} from 'react-icons/fi';
import { 
  getCategoriesRequest, 
  addCategoryRequest, 
  deleteCategoryRequest 
} from '../services/categoryService';
import { adminAddUser } from '../services/adminService';
import { UserProfileModal } from '../components/UserProfileModal';

export const StaffManagementPage = () => {
  const { 
    staffMembers, 
    pendingStaff, 
    approveStaff, 
    rejectStaff, 
    refreshData 
  } = useAuth();

  // Modal control state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Staff Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Categories management state
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  const loadCategories = async () => {
    try {
      const data = await getCategoriesRequest();
      setCategories(data);
      if (data.length > 0) {
        setNewCategory(data[0].name);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
      showToast('Failed to load categories from database.', 'error');
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      setAddError('Name, Email, and Password are required.');
      return;
    }
    if (newMobile && !isValidIndianMobile(newMobile)) {
      setAddError('Please enter a valid Indian mobile number.');
      return;
    }
    if (newPassword.length < 6) {
      setAddError('Password must be at least 6 characters.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setAddError('Password must contain at least one letter, one number, and one special character.');
      return;
    }
    setAddError('');
    setAddLoading(true);

    try {
      const payload = {
        name: newName,
        email: newEmail,
        mobile: newMobile,
        password: newPassword,
        role: 'STAFF',
        category: newCategory
      };
      await adminAddUser(payload);
      showToast('Staff account created successfully!', 'success');
      
      setNewName('');
      setNewEmail('');
      setNewMobile('');
      setNewPassword('');
      setIsAddModalOpen(false);
      await refreshData();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to create staff account.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatLoading(true);
    try {
      await addCategoryRequest(newCatName);
      showToast('Category added successfully!', 'success');
      setNewCatName('');
      await loadCategories();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to add category.', 'error');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteCategoryRequest(id);
      showToast('Category deleted successfully!', 'success');
      await loadCategories();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to delete category.', 'error');
    }
  };

  const handleApproveStaff = async (id) => {
    setActionLoading(true);
    try {
      await approveStaff(id);
      showToast('Staff account approved successfully!', 'success');
    } catch (err) {
      showToast('Failed to approve staff.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectStaff = async (id) => {
    if (!window.confirm('Are you sure you want to reject and delete this registration?')) return;
    setActionLoading(true);
    try {
      await rejectStaff(id);
      showToast('Staff registration rejected.', 'success');
    } catch (err) {
      showToast('Failed to reject staff.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Staff & Category Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Verify and manage maintenance crew members, audit active task counts, and customize specialization categories.
          </p>
        </div>
        <Button 
          variant="neon" 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 shadow-glow"
        >
          <FiUserPlus /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Staff Management Lists */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Pending Staff registrations */}
          <Card variant="dark" className="border border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <FiUsers className="text-amber-400 text-lg" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Pending Approval ({pendingStaff.length})
              </h3>
            </div>

            {pendingStaff.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/40 text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold text-left bg-slate-950/20">
                      <th className="px-4 py-3 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Specialization</th>
                      <th className="px-4 py-3 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                    {pendingStaff.map(s => (
                      <tr 
                        key={s.id} 
                        className="hover:bg-slate-800/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser({ id: s.id, role: 'STAFF' })}
                      >
                        <td className="px-4 py-3 font-semibold text-white">{s.name}</td>
                        <td className="px-4 py-3 text-slate-400">{s.email}</td>
                        <td className="px-4 py-3">
                          <Badge value={s.category || 'Other'} />
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApproveStaff(s.id); }}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 bg-neon/10 hover:bg-neon text-neon hover:text-slate-900 border border-neon/20 px-2.5 py-1.5 rounded-lg transition-all font-bold disabled:opacity-50"
                          >
                            <FiUserCheck /> Approve
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRejectStaff(s.id); }}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/25 px-2.5 py-1.5 rounded-lg transition-all font-bold disabled:opacity-50"
                          >
                            <FiUserX /> Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-slate-500 text-xs text-center py-6">
                No staff members currently awaiting approval.
              </div>
            )}
          </Card>

          {/* Active / Verified Crew Members */}
          <Card variant="dark" className="border border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <FiUserCheck className="text-neon text-lg" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Active Staff Crew ({staffMembers.length})
              </h3>
            </div>

            {staffMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/40 text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold text-left bg-slate-950/20">
                      <th className="px-4 py-3 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 uppercase tracking-wider text-center">Active Jobs</th>
                      <th className="px-4 py-3 uppercase tracking-wider text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                    {staffMembers.map(s => (
                      <tr 
                        key={s.id} 
                        className="hover:bg-slate-800/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser({ id: s.id, role: 'STAFF' })}
                      >
                        <td className="px-4 py-3 font-bold text-white">{s.name}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{s.email}</td>
                        <td className="px-4 py-3">
                          <Badge value={s.category || 'Other'} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge value="Verified" />
                        </td>
                        <td className="px-4 py-3 text-center text-white font-black font-mono">
                          {s.assignedComplaintsCount || 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRejectStaff(s.id); }}
                            disabled={actionLoading}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-800/60 transition-all disabled:opacity-50"
                            title="Delete staff account"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-slate-500 text-xs text-center py-6">
                No verified staff members registered.
              </div>
            )}
          </Card>

        </div>

        {/* Right Column: Dynamic Category Management Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="dark" className="border border-slate-800 p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <FiBriefcase className="text-neon text-lg" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Specialization Categories
              </h3>
            </div>

            {/* Create Category form */}
            <form onSubmit={handleAddCategory} className="space-y-3">
              <Input
                label="Add Specialization Category"
                placeholder="e.g. Plumbing, Security..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="neon"
                size="sm"
                className="w-full flex items-center justify-center gap-1.5"
                loading={catLoading}
              >
                <FiFolderPlus /> Save Category
              </Button>
            </form>

            {/* List current categories */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Active Category List ({categories.length})
              </span>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {categories.map(cat => (
                  <div 
                    key={cat._id} 
                    className="flex justify-between items-center bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-xs hover:border-slate-800 transition-colors"
                  >
                    <span className="font-semibold text-white">{cat.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat._id, cat.name)}
                      className="text-red-400 hover:text-red-350 p-1 rounded transition-colors"
                      title="Delete category"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <UserProfileModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        userId={selectedUser?.id}
        userRole={selectedUser?.role}
        onUpdate={() => refreshData()}
      />

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Staff Crew Member"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          {addError && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
              <FiAlertCircle className="text-lg flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div className="space-y-4 text-left">
            <Input 
              label="Full Name *" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="e.g. Amit Kumar"
              required 
            />
            <Input 
              label="Email Address *" 
              type="email"
              value={newEmail} 
              onChange={e => setNewEmail(e.target.value)} 
              placeholder="e.g. amit@campuscare.org"
              required 
            />
            <IndianPhoneInput 
              label="Mobile Number" 
              value={newMobile} 
              onChange={e => setNewMobile(e.target.value)} 
            />
            <Input 
              label="Temporary Password *" 
              type="password"
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Minimum 6 characters"
              required 
            />
            <Select
              label="Specialization Category *"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              options={categories.map(c => ({ value: c.name, label: c.name }))}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="neon" type="submit" loading={addLoading}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
