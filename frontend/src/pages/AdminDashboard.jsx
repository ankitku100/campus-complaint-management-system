import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { Select } from '../components/FormControls';
import {
  FiSliders, FiClock, FiAlertCircle, FiUserPlus,
  FiTrendingUp, FiBriefcase, FiUsers
} from 'react-icons/fi';
import { Toast } from '../components/Toast';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { getAdminComplaints, getAdminStats } from '../services/adminService';
import { UserProfileModal } from '../components/UserProfileModal';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { staffMembers, pendingStaff, approveStaff, rejectStaff, assignStaff, checkEscalations, reopenComplaint, verifyComplaint, students = [], refreshData } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Modal control state
  const [selectedUser, setSelectedUser] = useState(null);

  // Selected ticket for modal assignment
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // SLA Check state
  const [checkingSla, setCheckingSla] = useState(false);
  const [slaResult, setSlaResult] = useState(null);

  // Escalated complaints list states
  const [escalatedComplaints, setEscalatedComplaints] = useState([]);
  const [loadingEscalated, setLoadingEscalated] = useState(true);

  // Toast states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  // Loaded states
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStaff: 0,
    pendingStaff: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    verifiedComplaints: 0,
    completedComplaints: 0,
    escalatedComplaints: 0,
    categories: {},
    autoAssignmentAnalytics: {
      staffWorkloadScores: [],
      categoryDistribution: {},
      assignmentBalance: 'Optimal',
      mostLoadedStaff: null,
      leastLoadedStaff: null
    }
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const [complaintsData, setComplaintsData] = useState({ complaints: [], total: 0, pages: 1 });
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [category, setCategory] = useState('All');

  const [unassignedComplaints, setUnassignedComplaints] = useState([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(true);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await getAdminStats();
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchEscalated = async () => {
    setLoadingEscalated(true);
    try {
      const res = await getAdminComplaints({
        status: 'Escalated',
        limit: 15
      });
      if (res && res.complaints) {
        setEscalatedComplaints(res.complaints);
      } else if (Array.isArray(res)) {
        setEscalatedComplaints(res);
      }
    } catch (err) {
      console.error('Failed to load escalated complaints:', err);
    } finally {
      setLoadingEscalated(false);
    }
  };

  const fetchGridComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await getAdminComplaints({
        page,
        limit: 4,
        search,
        status,
        priority,
        category
      });
      if (res && res.complaints) {
        setComplaintsData(res);
      } else if (Array.isArray(res)) {
        setComplaintsData({ complaints: res, total: res.length, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch grid complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchUnassigned = async () => {
    setLoadingUnassigned(true);
    try {
      const res = await getAdminComplaints({
        status: 'Waiting For Staff',
        limit: 15
      });
      if (res && res.complaints) {
        setUnassignedComplaints(res.complaints);
      } else if (Array.isArray(res)) {
        setUnassignedComplaints(res);
      }
    } catch (err) {
      console.error('Failed to load unassigned:', err);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUnassigned();
    fetchEscalated();
  }, []);

  useEffect(() => {
    fetchGridComplaints();
  }, [page, status, priority, category]);

  // Debounced search logic for grid
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchGridComplaints();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // SLA Resolution Rate
  const totalCount = stats.totalComplaints;
  const pendingCount = unassignedComplaints.length; // From pending list
  const resolutionRate = totalCount > 0 ? Math.round(((stats.verifiedComplaints + stats.completedComplaints) / totalCount) * 100) : 100;

  const handleSlaCheck = async () => {
    setCheckingSla(true);
    setSlaResult(null);
    try {
      const res = await checkEscalations();
      setSlaResult({ success: true, message: `SLA Check complete. ${res.count} tickets escalated.` });
      fetchStats();
      fetchGridComplaints();
      setTimeout(() => setSlaResult(null), 4000);
    } catch (err) {
      setSlaResult({ success: false, message: err.message || 'SLA Check failed.' });
      setTimeout(() => setSlaResult(null), 4000);
    } finally {
      setCheckingSla(false);
    }
  };

  // Chart 1: Categories distribution data
  const categoryData = React.useMemo(() => {
    if (!stats || !stats.categories) return [];
    return Object.keys(stats.categories).map(name => ({
      name,
      complaints: stats.categories[name]
    }));
  }, [stats]);

  // Chart 2: Trend
  const monthlyData = [
    { month: 'Jan', tickets: 12 },
    { month: 'Feb', tickets: 19 },
    { month: 'Mar', tickets: 15 },
    { month: 'Apr', tickets: 22 },
    { month: 'May', tickets: 28 },
    { month: 'Jun', tickets: totalCount }
  ];

  const handleOpenAssignModal = (ticketId) => {
    setSelectedTicketId(ticketId);
    setSelectedStaffId('');
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicketId || !selectedStaffId) return;

    await assignStaff(selectedTicketId, selectedStaffId);
    setIsAssignModalOpen(false);
    setSelectedTicketId(null);
    fetchGridComplaints();
    fetchUnassigned();
    fetchEscalated();
    fetchStats();
  };

  const handleApproveStaff = async (id) => {
    await approveStaff(id);
    fetchStats();
  };

  const handleRejectStaff = async (id) => {
    await rejectStaff(id);
    fetchStats();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Grid */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight animate-in fade-in duration-350">
            System Administrator Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Global ticket metrics, SLAs, staff workload allocations, and resolution trends.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSlaCheck} 
            loading={checkingSla}
            className="flex items-center gap-2 text-xs py-2 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <FiAlertCircle className="text-red-400" /> Trigger SLA Check
          </Button>
          <Link to="/manage-complaints">
            <Button variant="neon" className="flex items-center gap-2">
              <FiSliders /> Manage Tickets
            </Button>
          </Link>
        </div>
      </div>

      {slaResult && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold border ${
          slaResult.success 
            ? 'bg-[#B6FF5C]/10 border-[#B6FF5C]/20 text-[#B6FF5C]' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        } animate-in slide-in-from-top duration-300`}>
          {slaResult.message}
        </div>
      )}

      {pendingStaff.length > 0 && (
        <Card variant="dark" className="border border-amber-500/25 p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Staff Awaiting Approval ({pendingStaff.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingStaff.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{staff.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{staff.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="neon" onClick={() => handleApproveStaff(staff.id)}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectStaff(staff.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Escalated Complaints Action Hub */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <FiAlertCircle className="animate-pulse" /> Escalated Complaints Action Hub ({escalatedComplaints.length})
          </h2>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Requires Administration Review</span>
        </div>
        
        {loadingEscalated ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-32 bg-[#111827] border border-slate-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : escalatedComplaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {escalatedComplaints.map((item) => (
              <Card key={item.id} variant="dark" className="border border-red-500/20 bg-red-950/5 p-5 space-y-4 relative flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <Link to={`/complaints/${item.id}`} className="font-extrabold text-white hover:text-neon transition-colors truncate text-sm text-left">
                      {item.title}
                    </Link>
                    <Badge value={item.priority} />
                  </div>
                  
                  <p className="text-[11px] text-slate-350 leading-normal line-clamp-2 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/65 text-left">
                    "{item.escalationReason || 'Dissatisfied with staff resolution.'}"
                  </p>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/60 pt-2 font-semibold">
                    <span>Staff: <span className="text-slate-300">{item.assignedToName || 'Unassigned'}</span></span>
                    <span>Student: <span className="text-slate-300 truncate max-w-[100px] block">{item.submittedByName}</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAssignModal(item.id)}
                    className="text-[10px] py-2 border-slate-800 hover:border-neon text-slate-350 hover:text-neon font-bold"
                  >
                    Reassign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await reopenComplaint(item.dbId || item.id);
                        showToast('Complaint returned to staff successfully!', 'success');
                        fetchEscalated();
                        fetchGridComplaints();
                        fetchStats();
                      } catch (err) {
                        console.error(err);
                        showToast('Failed to return complaint to staff.', 'error');
                      }
                    }}
                    className="text-[10px] py-2 border-slate-800 hover:border-amber-500 text-slate-350 hover:text-amber-500 font-bold"
                  >
                    Return to Staff
                  </Button>
                  <Button
                    variant="neon"
                    size="sm"
                    onClick={async () => {
                      try {
                        await verifyComplaint(item.dbId || item.id);
                        showToast('Complaint marked resolved successfully!', 'success');
                        fetchEscalated();
                        fetchGridComplaints();
                        fetchStats();
                      } catch (err) {
                        console.error(err);
                        showToast('Failed to resolve complaint.', 'error');
                      }
                    }}
                    className="text-[10px] py-2 font-extrabold text-slate-900 col-span-2"
                  >
                    Mark Resolved
                  </Button>
                  <Link to={`/complaints/${item.id}#chat`} className="col-span-2 text-center py-1.5 text-[10px] text-slate-400 hover:text-neon hover:underline font-bold transition-all">
                    💬 Contact Student (Open Chat)
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="dark" className="border border-slate-800/60 p-6 text-center text-xs text-slate-500 font-medium">
            🎉 Great job! There are currently no student-escalated complaints.
          </Card>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tickets', count: stats.totalComplaints, icon: FiBriefcase, color: 'text-slate-400' },
          { label: 'Unassigned Pending', count: stats.totalComplaints - stats.resolvedComplaints - stats.completedComplaints, icon: FiClock, color: 'text-amber-400' },
          { label: 'Escalated Tickets', count: stats.escalatedComplaints, icon: FiAlertCircle, color: 'text-red-500 animate-pulse font-bold' },
          { label: 'SLA Resolution Rate', count: `${resolutionRate}%`, icon: FiTrendingUp, color: 'text-neon' },
          { label: 'Active Crew Count', count: staffMembers.length, icon: FiUsers, color: 'text-sky-400' }
        ].map((stat, idx) => (
          <Card key={idx} variant="dark" className={`border p-5 flex flex-col justify-between h-28 ${
            stat.label === 'Escalated Tickets' && stats.escalatedComplaints > 0 
              ? 'border-red-500/40 bg-red-950/5 shadow-premium shadow-red-950/10' 
              : 'border-slate-800/60'
          }`}>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[10px]">{stat.label}</span>
              <stat.icon className={`text-lg ${stat.color}`} />
            </div>
            <span className="text-3xl font-black text-white">{loadingStats ? '...' : stat.count}</span>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Monthly Inflow */}
        <Card variant="dark" className="border border-slate-800/60 p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/60 pb-3 mb-4">
            Ticket Inflow (Monthly Trend)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1F2937" : "#E2E8F0"} />
                <XAxis dataKey="month" stroke={isDark ? "#9CA3AF" : "#64748B"} fontSize={11} />
                <YAxis stroke={isDark ? "#9CA3AF" : "#64748B"} fontSize={11} />
                <Tooltip contentStyle={{
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  color: isDark ? '#FFFFFF' : '#0F172A'
                }} />
                <Line type="monotone" dataKey="tickets" stroke="#B6FF5C" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart: Categories distribution */}
        <Card variant="dark" className="border border-slate-800/60 p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/60 pb-3 mb-4">
            Complaints By Categories
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1F2937" : "#E2E8F0"} />
                <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#64748B"} fontSize={11} />
                <YAxis stroke={isDark ? "#9CA3AF" : "#64748B"} fontSize={11} />
                <Tooltip contentStyle={{
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  color: isDark ? '#FFFFFF' : '#0F172A'
                }} />
                <Bar dataKey="complaints" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Auto-Assignment Analytics & Workload */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Auto-Assignment & Crew Workload Analytics
        </h3>
        
        {/* Workload Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="dark" className="border border-slate-800/60 p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assignment Balance</span>
              <span className={`text-xl font-black ${
                stats.autoAssignmentAnalytics?.assignmentBalance === 'Perfect' || stats.autoAssignmentAnalytics?.assignmentBalance === 'Optimal'
                  ? 'text-neon'
                  : stats.autoAssignmentAnalytics?.assignmentBalance === 'Balanced'
                  ? 'text-sky-400'
                  : 'text-amber-400'
              }`}>
                {stats.autoAssignmentAnalytics?.assignmentBalance || 'Optimal'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-neon font-bold text-base">
              Δ
            </div>
          </Card>

          <Card variant="dark" className="border border-slate-800/60 p-5 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Most Loaded Staff</span>
              {stats.autoAssignmentAnalytics?.mostLoadedStaff ? (
                <div className="truncate">
                  <span className="text-sm font-bold text-white block truncate">{stats.autoAssignmentAnalytics.mostLoadedStaff.name}</span>
                  <span className="text-[10px] text-slate-400 block">Category: {stats.autoAssignmentAnalytics.mostLoadedStaff.category}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic block">No staff available</span>
              )}
            </div>
            <span className="text-2xl font-black text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl flex-shrink-0">
              {stats.autoAssignmentAnalytics?.mostLoadedStaff?.workloadScore || 0}
            </span>
          </Card>

          <Card variant="dark" className="border border-slate-800/60 p-5 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Least Loaded Staff</span>
              {stats.autoAssignmentAnalytics?.leastLoadedStaff ? (
                <div className="truncate">
                  <span className="text-sm font-bold text-white block truncate">{stats.autoAssignmentAnalytics.leastLoadedStaff.name}</span>
                  <span className="text-[10px] text-slate-400 block">Category: {stats.autoAssignmentAnalytics.leastLoadedStaff.category}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic block">No staff available</span>
              )}
            </div>
            <span className="text-2xl font-black text-neon bg-neon/10 border border-neon/20 px-3 py-1.5 rounded-xl flex-shrink-0">
              {stats.autoAssignmentAnalytics?.leastLoadedStaff?.workloadScore || 0}
            </span>
          </Card>
        </div>

        {/* Workload Scores Bar Chart & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workload scoreboard Chart */}
          <Card variant="dark" className="lg:col-span-7 border border-slate-800/60 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/60 pb-3">
              Staff Workload Scoreboard
            </h4>
            <div className="h-64">
              {stats.autoAssignmentAnalytics?.staffWorkloadScores?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.autoAssignmentAnalytics.staffWorkloadScores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1F2937" : "#E2E8F0"} />
                    <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#64748B"} fontSize={10} tickFormatter={(v) => v.split(' ')[0]} />
                    <YAxis stroke={isDark ? "#9CA3AF" : "#64748B"} fontSize={10} />
                    <Tooltip contentStyle={{
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
                      borderRadius: '12px',
                      color: isDark ? '#FFFFFF' : '#0F172A'
                    }} />
                    <Bar dataKey="workloadScore" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                  No workload statistics available.
                </div>
              )}
            </div>
          </Card>

          {/* Detailed Workload score list */}
          <Card variant="dark" className="lg:col-span-5 border border-slate-800/60 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/60 pb-3">
              Verified Crew Workloads
            </h4>
            <div className="max-h-64 overflow-y-auto pr-1 space-y-2.5">
              {stats.autoAssignmentAnalytics?.staffWorkloadScores?.length > 0 ? (
                stats.autoAssignmentAnalytics.staffWorkloadScores.map((staff, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => staff.id && setSelectedUser({ id: staff.id, role: 'STAFF' })}
                    className={`flex items-center justify-between p-3 bg-slate-900 border border-slate-850 rounded-xl text-xs transition-all ${staff.id ? 'cursor-pointer hover:border-slate-750 hover:bg-slate-800/10' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{staff.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{staff.email} • {staff.category}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-black ${
                      staff.workloadScore >= 8
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'
                        : staff.workloadScore >= 5
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      Score: {staff.workloadScore}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 italic text-xs">
                  No verified staff members seeded yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Main Admin Section: Recent Tickets Grid - FULL WIDTH */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          All Complaints Monitoring Grid
        </h3>
        <Card variant="dark" className="border border-slate-800/60 p-5">
          <Table
            data={complaintsData.complaints}
            itemsPerPage={4}
            enableFilters={true}
            serverSide={true}
            totalItems={complaintsData.total}
            totalPages={complaintsData.pages}
            currentPage={page}
            search={search}
            statusFilter={status}
            priorityFilter={priority}
            categoryFilter={category}
            onPageChange={setPage}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onCategoryChange={setCategory}
            loading={loadingComplaints}
            searchPlaceholder="Search system complaints..."
            onRowClick={(item) => navigate('/complaints/' + (item.dbId || item._id || item.id))}
          />
        </Card>
      </div>

      {/* Bottom widgets: Awaiting Staff & Student Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Quick Action Pending assignment panel */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Awaiting Staff ({pendingCount})
          </h3>
          <Card variant="dark" className="border border-slate-800/60 p-5 space-y-4">
            {loadingUnassigned ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-16 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : unassignedComplaints.length > 0 ? (
              <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                {unassignedComplaints.map((item) => (
                  <div
                     key={item.id}
                     className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 hover:border-slate-700 transition-colors text-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <Link to={`/complaints/${item.id}`} className="font-bold text-white hover:text-neon transition-colors truncate">
                        {item.title}
                      </Link>
                      <Badge value={item.priority} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Cat: {item.category}</span>
                      <span className="font-mono text-neon">{item.id}</span>
                    </div>
                    <Button
                      variant="neon"
                      size="sm"
                      onClick={() => handleOpenAssignModal(item.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2"
                    >
                      <FiUserPlus className="text-xs" /> Allocate Staff
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                All tickets have been successfully routed to staff!
              </div>
            )}
          </Card>
        </div>

        {/* Student Directory Section */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Student Directory ({students.length})
          </h3>
          <Card variant="dark" className="border border-slate-800/60 p-5">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/80">
                <thead>
                  <tr className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3 font-mono">Student ID / DB ID</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs text-slate-350">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr 
                        key={student.id} 
                        onClick={() => setSelectedUser({ id: student.id, role: 'STUDENT' })}
                        className="hover:bg-slate-800/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{student.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono">{student.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-neon">{student.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge value={student.isVerified ? 'VERIFIED' : 'PENDING'} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                        No students found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Reusable Modal: Assign Staff */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={(() => {
          const selectedComplaint = complaintsData.complaints.find(c => c.id === selectedTicketId) ||
                                   unassignedComplaints.find(c => c.id === selectedTicketId);
          return `${selectedComplaint?.assignedTo || selectedComplaint?.assignedStaff ? 'Override Staff' : 'Assign Staff'} Assignee`;
        })()}
        size="sm"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-5">
          {(() => {
            const selectedComplaint = complaintsData.complaints.find(c => c.id === selectedTicketId) ||
                                     unassignedComplaints.find(c => c.id === selectedTicketId);
            const filteredStaff = selectedComplaint 
              ? staffMembers.filter(s => s.category === selectedComplaint.category)
              : [];
            const isAlreadyAssigned = selectedComplaint?.assignedTo || selectedComplaint?.assignedStaff || false;
            
            return (
              <>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a maintenance crew member to {isAlreadyAssigned ? 'override assignment' : 'manually allocate'} for ticket <span className="text-neon font-mono font-bold">{selectedTicketId}</span> (Category: <span className="text-white font-bold">{selectedComplaint?.category}</span>):
                </p>

                <Select
                  label="Override Staff Assignee"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Staff Member...' },
                    ...filteredStaff.map(s => ({
                      value: s.id,
                      label: `${s.name} (Workload: ${s.currentWorkloadScore || 0})`
                    }))
                  ]}
                />

                {/* Smart Suggestions Section */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Specialized Staff Workloads (Click to Override)
                  </label>
                  {filteredStaff.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filteredStaff.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedStaffId(s.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            selectedStaffId === s.id
                              ? 'bg-neon/15 border-neon text-neon shadow-glow'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {s.name} (Score: {s.currentWorkloadScore || 0})
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-400 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
                      No active verified staff specialized in "{selectedComplaint?.category}".
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/60">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="neon">
              Confirm Override
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast notifications */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />

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
