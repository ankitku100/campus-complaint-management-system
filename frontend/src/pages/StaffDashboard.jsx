import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Select, TextArea } from '../components/FormControls';
import { FiCheckCircle, FiTool, FiFileText, FiEdit3, FiStar, FiAward, FiMessageSquare, FiActivity } from 'react-icons/fi';
import { Table } from '../components/Table';
import { Link } from 'react-router-dom';
import { getStaffPerformanceStats, getAssignedComplaints, getStaffDashboardStats } from '../services/staffService';

export const StaffDashboard = () => {
  const { user, updateComplaintStatus } = useAuth();
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Performance rating stats state
  const [perfStats, setPerfStats] = useState({ averageRating: 0, totalReviews: 0, performanceScore: 0, recentFeedback: [] });
  const [loadingPerf, setLoadingPerf] = useState(true);

  // Staff stats state
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    activeTasks: 0,
    completedTasks: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Tasks (complaints) state
  const [tasksData, setTasksData] = useState({ complaints: [], total: 0, pages: 1 });
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Form states
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [resolutionImg, setResolutionImg] = useState('');

  const fetchStatsAndPerf = async () => {
    setLoadingStats(true);
    setLoadingPerf(true);
    try {
      const [statsData, perfData] = await Promise.all([
        getStaffDashboardStats(),
        getStaffPerformanceStats()
      ]);
      if (statsData) setStats(statsData);
      if (perfData) setPerfStats(perfData);
    } catch (err) {
      console.error('Failed to load stats/perf:', err);
    } finally {
      setLoadingStats(false);
      setLoadingPerf(false);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await getAssignedComplaints({
        page,
        limit: 5,
        search,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter
      });
      if (res && res.complaints) {
        setTasksData(res);
      } else if (Array.isArray(res)) {
        setTasksData({ complaints: res, total: res.length, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchStatsAndPerf();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [page, statusFilter, priorityFilter, categoryFilter]);

  // Debounced search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchTasks();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  const handleOpenUpdateModal = (task) => {
    setSelectedTask(task);
    setStatus(task.status);
    setRemarks(task.resolutionRemarks || '');
    setResolutionImg(task.resolutionImage || '');
    setIsUpdateModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    await updateComplaintStatus(selectedTask.id, status, remarks, resolutionImg);
    setIsUpdateModalOpen(false);
    setSelectedTask(null);
    fetchTasks();
    fetchStatsAndPerf();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight animate-in fade-in duration-350">
          Staff Job Dispatch Dashboard
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Hello, <span className="text-neon font-bold">{user?.name}</span>. Perform repair updates and upload resolution logs for assigned issues.
        </p>
        {user?.category && (
          <p className="text-slate-350 text-xs mt-2 flex items-center gap-1.5">
            <span className="font-semibold text-slate-400">My Category:</span>
            <Badge value={user.category} />
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Workload Score', count: stats.currentWorkloadScore || 0, icon: FiActivity, color: 'text-[#B6FF5C]' },
          { label: 'Assigned Complaints', count: stats.pendingTasks, icon: FiFileText, color: 'text-slate-400' },
          { label: 'In Progress', count: stats.activeTasks, icon: FiTool, color: 'text-sky-400' },
          { label: 'Completed', count: stats.completedTasks, icon: FiCheckCircle, color: 'text-neon' }
        ].map((stat, idx) => (
          <Card key={idx} variant="dark" className="border border-slate-800/60 p-5 flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[10px]">{stat.label}</span>
              <stat.icon className={`text-lg ${stat.color}`} />
            </div>
            <span className="text-3xl font-black text-white">{loadingStats ? '...' : stat.count}</span>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Main Task List Table */}
        <div className="lg:col-span-8 space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Your Dispatched Tickets
          </h3>
          <Card variant="dark" className="border border-slate-800/60 p-6">
            <Table
              data={tasksData.complaints}
              itemsPerPage={5}
              enableFilters={true}
              serverSide={true}
              totalItems={tasksData.total}
              totalPages={tasksData.pages}
              currentPage={page}
              search={search}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              categoryFilter={categoryFilter}
              onPageChange={setPage}
              onSearchChange={setSearch}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onCategoryChange={setCategoryFilter}
              loading={loadingTasks}
              onRowClick={handleOpenUpdateModal}
              searchPlaceholder="Search assigned tickets (click row to update status)..."
            />
          </Card>
        </div>

        {/* Right Column: Rating & Performance Stats */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            My Rating & Performance
          </h3>
          
          <Card variant="dark" className="border border-slate-800/60 p-5 space-y-5">
            {/* Rating Scores Grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Rating</span>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xl font-black text-white">{loadingPerf ? '...' : (perfStats.averageRating || '0.0')}</span>
                  <FiStar className="text-amber-400 fill-amber-400 text-sm" />
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Reviews</span>
                <span className="text-xl font-black text-white">{loadingPerf ? '...' : perfStats.totalReviews}</span>
              </div>
            </div>

            {/* Performance score card */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-center space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Performance Score</span>
              <div className="flex items-center justify-center gap-2">
                <FiAward className="text-neon text-xl animate-bounce" />
                <span className="text-2xl font-black text-neon">{loadingPerf ? '...' : `${perfStats.performanceScore}%`}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {!loadingPerf && (perfStats.performanceScore >= 90 ? '🏆 Outstanding Performance' : perfStats.performanceScore >= 75 ? '👍 Good Performance' : perfStats.totalReviews > 0 ? '⚠️ Needs Improvement' : 'No ratings yet')}
              </p>
            </div>

            {/* Recent Feedback reviews list */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <FiMessageSquare className="text-neon text-sm" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Feedback</span>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {loadingPerf ? (
                  <div className="py-8 text-center text-slate-500 text-xs">Loading feedback...</div>
                ) : perfStats.recentFeedback && perfStats.recentFeedback.length > 0 ? (
                  perfStats.recentFeedback.map((fb, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-850 p-3 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-white text-[11px] truncate max-w-[120px]">{fb.complaintTitle}</span>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map(star => (
                            <FiStar key={star} className={`text-[10px] ${star <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                          ))}
                        </div>
                      </div>
                      {fb.feedback && (
                        <p className="text-slate-300 italic bg-slate-950/30 p-2 rounded-lg border border-slate-900/60 leading-relaxed text-[11px]">
                          "{fb.feedback}"
                        </p>
                      )}
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                        <span>Student: {fb.studentName}</span>
                        <span>{new Date(fb.ratedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 text-center py-4 italic font-semibold">No reviews received yet.</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Update Status Modal */}
      {selectedTask && (
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          title={`Update Ticket: ${selectedTask.id}`}
          size="md"
        >
          <form onSubmit={handleStatusSubmit} className="space-y-5">
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-1">
              <h4 className="text-sm font-bold text-white leading-normal truncate">{selectedTask.title}</h4>
              <p className="text-xs text-slate-400 line-clamp-2">{selectedTask.description}</p>
              <Link
                to={`/complaints/${selectedTask.id}`}
                className="inline-block text-[11px] text-neon hover:underline font-bold mt-2.5"
                onClick={() => setIsUpdateModalOpen(false)}
              >
                Go to Ticket Details Page (Mark Completed / View Details) ➔
              </Link>
            </div>

            <Select
              label="Update Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'Assigned', label: 'Assigned (Awaiting Start)' },
                { value: 'In Progress', label: 'In Progress (Repair Ongoing)' }
              ]}
            />

            <TextArea
              label="Work Progress Remarks"
              placeholder="Explain the work ongoing or update remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
              <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="neon" className="flex items-center gap-1">
                <FiEdit3 /> Save Update
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
