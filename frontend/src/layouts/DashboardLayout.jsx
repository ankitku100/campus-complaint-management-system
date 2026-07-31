import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import {
  FiGrid, FiPlusCircle, FiList, FiBell, FiUser, FiLogOut,
  FiMenu, FiX, FiSliders, FiCheckSquare, FiAlertCircle,
  FiSun, FiMoon, FiUsers, FiStar
} from 'react-icons/fi';
import { formatTimeAgo } from '../utils/dateFormatter';
import { BrandMark } from '../components/BrandMark';
import { BRAND_NAME } from '../config/brand';

export const DashboardLayout = ({ children }) => {
  const { user, logout, notifications, markNotificationRead, clearNotifications, loadingData, dataError, refreshData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = {
    student: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
      { path: '/raise-complaint', label: 'Raise Complaint', icon: FiPlusCircle },
      { path: '/my-complaints', label: 'My Complaints', icon: FiList },
    ],
    admin: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
      { path: '/manage-complaints', label: 'Manage Complaints', icon: FiSliders },
      { path: '/staff-management', label: 'Staff Management', icon: FiUsers },
      { path: '/student-management', label: 'Students', icon: FiUsers },
      { path: '/staff-performance', label: 'Staff Performance', icon: FiStar }
    ],
    staff: [
      { path: '/dashboard', label: 'Assigned Tasks', icon: FiCheckSquare },
    ]
  };

  const currentRole = (user?.role || 'student').toLowerCase();
  const roleMenuItems = menuItems[currentRole] || [];

  const handleNotificationClick = (n) => {
    markNotificationRead(n.id);
    setNotifDropdownOpen(false);
    if (n.complaintId) {
      navigate(`/complaints/${n.complaintId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#111827] border-r border-slate-800/80">
        {/* Brand Logo */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800/60">
          <BrandMark compact showName />
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
            Navigation ({currentRole})
          </div>
          {roleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150
                  ${isActive 
                    ? 'bg-neon/10 text-neon border border-neon/20 shadow-glow' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }
                `}
              >
                <Icon className="text-lg" />
                {item.label}
              </NavLink>
            );
          })}

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 pt-6 mb-2">
            Account
          </div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `
              flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150
              ${isActive 
                ? 'bg-neon/10 text-neon border border-neon/20 shadow-glow' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }
            `}
          >
            <FiUser className="text-lg" />
            My Profile
          </NavLink>
        </nav>

        {/* User Footer Summary */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/20">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg text-xs font-semibold transition-all"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          
          <aside className="relative flex flex-col w-72 max-w-xs bg-[#111827] h-full shadow-2xl z-10 border-r border-slate-800">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <BrandMark compact showName />
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <FiX className="text-xl" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                Navigation ({currentRole})
              </div>
              {roleMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all
                      ${location.pathname === item.path
                        ? 'bg-neon/10 text-neon border border-neon/20 shadow-glow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }
                    `}
                  >
                    <Icon className="text-lg" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 pt-6 mb-2">
                Account
              </div>
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all
                  ${location.pathname === '/profile'
                    ? 'bg-neon/10 text-neon border border-neon/20 shadow-glow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                <FiUser className="text-lg" />
                My Profile
              </Link>
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950/20">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg text-xs font-semibold transition-all"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Layout Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#111827] border-b border-slate-800/60 flex items-center justify-between px-4 sm:px-6 relative z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <FiMenu className="text-xl" />
            </button>
            
            {/* Logo shown on mobile only */}
            <div className="flex lg:hidden items-center">
              <BrandMark compact showName />
            </div>

            <span className="hidden sm:inline text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {currentRole} portal
            </span>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-slate-800"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all relative border border-transparent hover:border-slate-800"
              >
                <FiBell className="text-lg" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-neon text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-glow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay List */}
              {notifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-80 bg-[#111827] border border-slate-800 rounded-card shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-3 duration-150">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 pb-2.5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-[10px] text-neon hover:underline font-bold"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-800/40">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 text-xs cursor-pointer hover:bg-slate-800/50 transition-colors flex items-start gap-2.5 rounded-lg ${!n.read ? 'bg-slate-800/25 border-l-2 border-neon' : ''}`}
                          >
                            <div className="mt-0.5 text-neon">
                              <FiAlertCircle className="text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{n.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                              <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                                {formatTimeAgo(n.date)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-500 font-medium">
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Header Profile Icon */}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full border border-slate-800 hover:border-neon bg-slate-900 overflow-hidden flex items-center justify-center cursor-pointer transition-all relative flex-shrink-0"
              title="View Profile"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-slate-350">
                  {user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2) : '??'}
                </span>
              )}
            </Link>

            {/* Quick Link back to Landing page */}
            <Link
              to="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-800 hover:border-neon text-slate-400 hover:text-neon rounded-lg text-xs font-bold transition-all"
            >
              Public Site
            </Link>
          </div>
        </header>

        {/* Dashboard Pages Mount Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0B0F19]">
          <div className="max-w-6xl mx-auto space-y-8">
            {dataError && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                <span>
                  {dataError.toLowerCase().includes('timeout') || dataError.toLowerCase().includes('exceeded')
                    ? "Server is taking longer than expected. Please try again."
                    : `Unable to load API data: ${dataError}`}
                </span>
                <button onClick={() => refreshData()} className="font-bold text-white hover:text-neon">Retry</button>
              </div>
            )}
            {loadingData && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
                Loading data from MongoDB Atlas...
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
