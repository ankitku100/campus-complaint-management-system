import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { FiPlusCircle, FiList, FiCheckCircle, FiClock, FiAlertCircle, FiHelpCircle } from 'react-icons/fi';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { getMyComplaints, getStudentDashboardStats } from '../services/complaintService';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    progressCount: 0,
    completedCount: 0,
    resolvedCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, complaintsData] = await Promise.all([
          getStudentDashboardStats(),
          getMyComplaints({ limit: 3 })
        ]);
        if (statsData) setStats(statsData);
        if (complaintsData) {
          setRecentComplaints(complaintsData.complaints || complaintsData);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoadingStats(false);
        setLoadingComplaints(false);
      }
    };
    loadData();
  }, []);

  // Pie chart data
  const chartData = [
    { name: 'Pending', value: stats.pendingCount, color: '#94A3B8' },
    { name: 'In Progress', value: stats.progressCount, color: '#0EA5E9' },
    { name: 'Completed', value: stats.completedCount, color: '#06B6D4' },
    { name: 'Verified', value: stats.resolvedCount, color: '#B6FF5C' }
  ].filter(item => item.value > 0);

  const hasChartData = chartData.length > 0;

  const quickActions = [
    {
      title: 'Raise New Complaint',
      desc: 'Submit a new ticket with photos and details.',
      icon: FiPlusCircle,
      action: () => navigate('/raise-complaint'),
      variant: 'neon'
    },
    {
      title: 'View My Complaints',
      desc: 'Track and update raised complaints history.',
      icon: FiList,
      action: () => navigate('/my-complaints'),
      variant: 'dark'
    },
    {
      title: 'FAQs & Support',
      desc: 'Browse guides or learn how smart routing works.',
      icon: FiHelpCircle,
      action: () => {
        navigate('/');
        setTimeout(() => {
          document.querySelector('#faq')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      },
      variant: 'dark'
    }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Student Dashboard
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Welcome back, <span className="text-neon font-bold">{user?.name}</span>. Check the progress of your complaints below.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Complaints', count: stats.totalCount, icon: FiList, color: 'text-slate-300' },
          { label: 'Pending', count: stats.pendingCount, icon: FiClock, color: 'text-amber-400' },
          { label: 'In Progress', count: stats.progressCount, icon: FiAlertCircle, color: 'text-sky-400' },
          { label: 'Verified', count: stats.resolvedCount, icon: FiCheckCircle, color: 'text-neon' }
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

      {/* Main Grid: Charts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Graph */}
        <Card variant="dark" className="lg:col-span-8 border border-slate-800/60 flex flex-col justify-between">
          <div className="border-b border-slate-800/60 pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Complaint Status Overview</h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-Time Distribution</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {loadingStats ? (
              <div className="w-40 h-40 border-4 border-slate-800 border-t-neon rounded-full animate-spin"></div>
            ) : hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
                      borderRadius: '12px',
                      color: isDark ? '#FFFFFF' : '#0F172A'
                    }}
                    labelStyle={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
                    itemStyle={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} font-medium`}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                <FiList className="text-3xl text-slate-700" />
                <p>No active complaints to graph.</p>
                <p className="text-[10px] text-slate-650">Raise your first complaint to populate dashboard metrics!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card variant="dark" className="flex-1 border border-slate-800/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800/60 pb-3">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {quickActions.map((qa, index) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={index}
                    onClick={qa.action}
                    className={`
                      w-full flex items-start gap-3.5 p-4 rounded-xl border transition-all text-left group
                      ${qa.variant === 'neon'
                        ? 'bg-neon/10 border-neon/30 hover:border-neon hover:shadow-glow'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg text-lg
                      ${qa.variant === 'neon' ? 'bg-neon text-slate-900 shadow-glow' : 'bg-slate-800 text-neon'}
                    `}>
                      <Icon />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold transition-colors ${qa.variant === 'neon' ? 'text-neon' : 'text-white'}`}>
                        {qa.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        {qa.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Your Recent Complaints
          </h2>
          <Link to="/my-complaints" className="text-xs text-neon hover:underline font-bold">
            View all
          </Link>
        </div>
        <Table
          data={recentComplaints}
          itemsPerPage={3}
          enableFilters={false}
          loading={loadingComplaints}
          searchPlaceholder="Search your complaints..."
          onRowClick={(item) => navigate(`/student/complaints/${item.dbId || item._id || item.id}`)}
        />
      </div>
    </div>
  );
};
