import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input, Select } from '../components/FormControls';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { IndianPhoneInput } from '../components/IndianPhoneInput';
import { UserProfileModal } from '../components/UserProfileModal';
import { isValidIndianMobile, formatIndianMobile } from '../utils/phoneFormatter';
import { adminAddUser } from '../services/adminService';
import { FiUsers, FiUserPlus, FiSearch, FiFilter, FiX, FiAlertCircle } from 'react-icons/fi';

export const StudentManagementPage = () => {
  const { students, refreshData } = useAuth();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  // List of unique departments for filter dropdown
  const [departments, setDepartments] = useState([]);

  // Modal Control State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Student Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newRegNum, setNewRegNum] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  useEffect(() => {
    // Extract unique departments from existing students
    if (students && students.length > 0) {
      const depts = students
        .map(s => s.department)
        .filter((d, idx, arr) => d && arr.indexOf(d) === idx);
      setDepartments(depts);
    }
  }, [students]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      setAddError('Name, Email, and Password are required fields.');
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
        role: 'USER',
        department: newDept,
        year: newYear,
        registrationNumber: newRegNum
      };
      await adminAddUser(payload);
      showToast('Student account created successfully!', 'success');
      
      // Reset form fields
      setNewName('');
      setNewEmail('');
      setNewMobile('');
      setNewPassword('');
      setNewDept('');
      setNewYear('');
      setNewRegNum('');
      setIsAddModalOpen(false);
      await refreshData();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to create student account.');
    } finally {
      setAddLoading(false);
    }
  };

  // Filter student lists based on search queries and dropdown selections
  const filteredStudents = (students || []).filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = 
      filterDept === 'All' || 
      student.department === filterDept;
      
    const matchesYear = 
      filterYear === 'All' || 
      student.year === filterYear;

    return matchesSearch && matchesDept && matchesYear;
  });

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Student Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Browse and manage all registered student accounts, inspect raise histories, and configure login permissions.
          </p>
        </div>
        <Button 
          variant="neon" 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 shadow-glow"
        >
          <FiUserPlus /> Add Student
        </Button>
      </div>

      {/* Search and Filters panel */}
      <Card variant="dark" className="border border-slate-800 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <Input
              label="Search Students"
              placeholder="Filter by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              icon={FiSearch}
            />
          </div>

          <div>
            <Select
              label="Department"
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              options={['All', ...departments]}
            />
          </div>

          <div>
            <Select
              label="Year of Study"
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              options={['All', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate']}
            />
          </div>
        </div>
      </Card>

      {/* Students Data Table Card */}
      <Card variant="dark" className="border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <FiUsers className="text-neon text-lg" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Registered Student Base ({filteredStudents.length})
          </h3>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/40 text-xs">
              <thead>
                <tr className="text-slate-400 font-bold text-left bg-slate-950/20">
                  <th className="px-4 py-3 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 uppercase tracking-wider">Contact Info</th>
                  <th className="px-4 py-3 uppercase tracking-wider">Academic Details</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-center">Complaints (T/A/C)</th>
                  <th className="px-4 py-3 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                {filteredStudents.map(student => (
                  <tr 
                    key={student.id} 
                    onClick={() => setSelectedUser({ id: student.id, role: 'STUDENT' })}
                    className="hover:bg-slate-800/20 transition-colors cursor-pointer"
                  >
                    {/* Student Name/Avatar */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img 
                          src={student.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`} 
                          alt={student.name} 
                          className="w-8 h-8 rounded-full border border-slate-700 bg-slate-900 object-cover"
                        />
                        <span className="font-bold text-white block">{student.name}</span>
                      </div>
                    </td>

                    {/* Email/Mobile */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-400">
                      <div>{student.email}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{formatIndianMobile(student.mobile)}</div>
                    </td>

                    {/* Dept/Year */}
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">
                      <div className="text-white">{student.department || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{student.year || 'N/A'}</div>
                    </td>

                    {/* Ticket count aggregates */}
                    <td className="px-4 py-3 whitespace-nowrap text-center font-mono">
                      <span className="text-white font-bold">{student.totalComplaints ?? 0}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-sky-400 font-bold">{student.activeComplaints ?? 0}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-[#B6FF5C] font-bold">{student.closedComplaints ?? 0}</span>
                    </td>

                    {/* Account Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {student.isDisabled ? (
                        <Badge value="Disabled" className="bg-red-500/20 text-red-400 border border-red-500/30" />
                      ) : (
                        <Badge value="Active" className="bg-neon/20 text-neon border border-neon/30" />
                      )}
                    </td>

                    {/* Created date */}
                    <td className="px-4 py-3 whitespace-nowrap text-right text-slate-500 font-mono">
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-slate-500 text-xs text-center py-10">
            No students found matching the selected search query and filter criteria.
          </div>
        )}
      </Card>

      {/* Modal: Admin Add Student */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Student Account"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          {addError && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
              <FiAlertCircle className="text-lg flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Full Name *" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="e.g. Rahul Sharma"
              required 
            />
            <Input 
              label="Email Address *" 
              type="email"
              value={newEmail} 
              onChange={e => setNewEmail(e.target.value)} 
              placeholder="e.g. rahul@university.edu"
              required 
            />
            <div className="sm:col-span-2">
              <IndianPhoneInput 
                label="Mobile Number" 
                value={newMobile} 
                onChange={e => setNewMobile(e.target.value)} 
              />
            </div>
            <div className="sm:col-span-2">
              <Input 
                label="Temporary Password *" 
                type="password"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Minimum 6 characters"
                required 
              />
            </div>

            <Input 
              label="Department" 
              value={newDept} 
              onChange={e => setNewDept(e.target.value)} 
              placeholder="e.g. Information Technology"
            />
            <Select
              label="Year of Study"
              value={newYear}
              onChange={e => setNewYear(e.target.value)}
              options={[
                { value: '', label: 'Select Year' },
                { value: '1st Year', label: '1st Year' },
                { value: '2nd Year', label: '2nd Year' },
                { value: '3rd Year', label: '3rd Year' },
                { value: '4th Year', label: '4th Year' },
                { value: 'Postgraduate', label: 'Postgraduate' }
              ]}
            />
            <div className="sm:col-span-2">
              <Input 
                label="Registration Number" 
                value={newRegNum} 
                onChange={e => setNewRegNum(e.target.value)} 
                placeholder="e.g. REG-2026-0041"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="neon" type="submit" loading={addLoading}>
              Register Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detailed Profile Viewer & Control Panel */}
      <UserProfileModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        userId={selectedUser?.id}
        userRole={selectedUser?.role}
        onUpdate={() => refreshData()}
      />
    </div>
  );
};
