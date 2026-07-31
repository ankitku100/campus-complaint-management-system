import React, { useState, useMemo } from 'react';
import { Badge } from './Badge';
import { Link } from 'react-router-dom';
import { FiSearch, FiChevronLeft, FiChevronRight, FiEye, FiSliders } from 'react-icons/fi';
import { formatLocalDate } from '../utils/dateFormatter';
import { useAuth } from '../hooks/useAuth';

export const Table = ({
  data = [],
  columns = [],
  searchPlaceholder = 'Search complaints...',
  onRowClick,
  enableFilters = true,
  itemsPerPage = 5,
  serverSide = false,
  totalItems = 0,
  totalPages: propsTotalPages = 1,
  currentPage: propsCurrentPage = 1,
  onPageChange,
  search: propsSearch = '',
  statusFilter: propsStatusFilter = 'All',
  priorityFilter: propsPriorityFilter = 'All',
  categoryFilter: propsCategoryFilter = 'All',
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  loading = false,
}) => {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();

  const getComplaintPath = (item) => {
    const complaintId = item.dbId || item._id || item.id;
    if (role === 'STUDENT' || role === 'USER') {
      return `/student/complaints/${complaintId}`;
    }
    return `/complaints/${complaintId}`;
  };

  const [localSearch, setLocalSearch] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState('All');
  const [localPriorityFilter, setLocalPriorityFilter] = useState('All');
  const [localCategoryFilter, setLocalCategoryFilter] = useState('All');
  const [localCurrentPage, setLocalCurrentPage] = useState(1);

  const search = serverSide ? propsSearch : localSearch;
  const statusFilter = serverSide ? propsStatusFilter : localStatusFilter;
  const priorityFilter = serverSide ? propsPriorityFilter : localPriorityFilter;
  const categoryFilter = serverSide ? propsCategoryFilter : localCategoryFilter;
  const currentPage = serverSide ? propsCurrentPage : localCurrentPage;

  // Extract unique filter options
  const categories = useMemo(() => {
    if (serverSide) {
      return ["All", "Hostel", "Academic", "Infrastructure", "IT Services", "Security", "Other"];
    }
    const cats = new Set(data.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [data, serverSide]);

  // Filter and Search logic (client-side only)
  const filteredData = useMemo(() => {
    if (serverSide) return data;
    return data.filter(item => {
      const matchesSearch = 
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.submittedByName && item.submittedByName.toLowerCase().includes(search.toLowerCase())) ||
        (item.assignedToName && item.assignedToName.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [data, search, statusFilter, priorityFilter, categoryFilter, serverSide]);

  // Reset page when filter changes (client-side only)
  React.useEffect(() => {
    if (!serverSide) {
      setLocalCurrentPage(1);
    }
  }, [search, statusFilter, priorityFilter, categoryFilter, serverSide]);

  // Pagination calculations
  const totalPages = serverSide ? propsTotalPages : (Math.ceil(filteredData.length / itemsPerPage) || 1);
  const paginatedData = useMemo(() => {
    if (serverSide) return data;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage, serverSide, data]);

  const totalCount = serverSide ? totalItems : filteredData.length;

  return (
    <div className="space-y-4">
      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              if (serverSide) {
                onSearchChange && onSearchChange(e.target.value);
              } else {
                setLocalSearch(e.target.value);
              }
            }}
            className="w-full bg-[#111827] border border-slate-800 focus:border-neon focus:ring-1 focus:ring-neon text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-2.5 text-sm transition-all"
          />
        </div>

        {/* Filters Panel */}
        {enableFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-800 rounded-xl px-2 py-1">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold px-1">Cat:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  if (serverSide) {
                    onCategoryChange && onCategoryChange(e.target.value);
                  } else {
                    setLocalCategoryFilter(e.target.value);
                  }
                }}
                className="bg-transparent text-white border-none text-xs focus:ring-0 cursor-pointer pr-8 py-1 font-medium"
              >
                {categories.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-800 rounded-xl px-2 py-1">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold px-1">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  if (serverSide) {
                    onStatusChange && onStatusChange(e.target.value);
                  } else {
                    setLocalStatusFilter(e.target.value);
                  }
                }}
                className="bg-transparent text-white border-none text-xs focus:ring-0 cursor-pointer pr-8 py-1 font-medium"
              >
                <option value="All" className="bg-slate-900">All</option>
                <option value="Pending" className="bg-slate-900">Pending</option>
                <option value="Waiting For Staff" className="bg-slate-900">Waiting For Staff</option>
                <option value="Assigned" className="bg-slate-900">Assigned</option>
                <option value="In Progress" className="bg-slate-900">In Progress</option>
                <option value="Completed" className="bg-slate-900">Completed</option>
                <option value="Closed" className="bg-slate-900">Closed</option>
                <option value="Escalated" className="bg-slate-900">Escalated</option>
                <option value="Verified" className="bg-slate-900">Verified</option>
                <option value="Resolved" className="bg-slate-900">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-800 rounded-xl px-2 py-1">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold px-1">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  if (serverSide) {
                    onPriorityChange && onPriorityChange(e.target.value);
                  } else {
                    setLocalPriorityFilter(e.target.value);
                  }
                }}
                className="bg-transparent text-white border-none text-xs focus:ring-0 cursor-pointer pr-8 py-1 font-medium"
              >
                <option value="All" className="bg-slate-900">All</option>
                <option value="Low" className="bg-slate-900">Low</option>
                <option value="Medium" className="bg-slate-900">Medium</option>
                <option value="High" className="bg-slate-900">High</option>
                <option value="Critical" className="bg-slate-900">Critical</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grid Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#111827] shadow-premium">
        <table className="min-w-full divide-y divide-slate-800/60">
          <thead className="bg-slate-950/40">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Complaint Details</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-4 scope-col text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              <th scope="col" className="relative px-6 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 bg-[#111827]">
            {loading ? (
              Array.from({ length: itemsPerPage }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-800 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-slate-800 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-5 bg-slate-800 rounded-full w-16"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-5 bg-slate-800 rounded-full w-20"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="h-3 bg-slate-800 rounded w-24 font-mono"></div></td>
                  <td className="px-6 py-4 text-right whitespace-nowrap"><div className="h-8 bg-slate-800 rounded-lg w-16 inline-block"></div></td>
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  onClick={(e) => {
                    if (e.target.closest('a, button, select, input')) return;
                    onRowClick && onRowClick(item);
                  }}
                  onMouseUp={(e) => {
                    if (!onRowClick) return;
                    if (e.target.closest('a, button, select, input')) return;
                    if (e.button === 1 || e.metaKey || e.ctrlKey) {
                      e.preventDefault();
                      window.open(getComplaintPath(item), '_blank');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (!onRowClick) return;
                    if (e.target.closest('a, button, select, input')) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(item);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={`group transition-colors outline-none focus:bg-slate-800/20 ${
                    item.isEscalated 
                      ? 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-red-500' 
                      : 'hover:bg-slate-800/30'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {/* ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neon font-mono">
                    {item.id}
                  </td>
                  {/* Title & Location */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-white group-hover:text-neon transition-colors max-w-xs md:max-w-md truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-xs">
                      {item.location} {item.submittedByName ? `• By ${item.submittedByName}` : ''}
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {item.category}
                  </td>
                  {/* Priority */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge value={item.priority} />
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-1.5">
                    <Badge value={item.status} />
                    {item.isEscalated && <Badge value="Escalated" />}
                  </td>
                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                    {formatLocalDate(item.submittedDate)}
                  </td>
                  {/* Action Link */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={getComplaintPath(item)}
                      className="inline-flex items-center gap-1 text-slate-400 group-hover:text-neon text-xs font-semibold uppercase tracking-wider bg-slate-900 group-hover:bg-neon/10 border border-slate-800 group-hover:border-neon/30 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <FiEye className="text-sm" /> View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FiSliders className="text-3xl text-slate-600" />
                    <p className="font-semibold text-slate-300">No complaints found</p>
                    <p className="text-xs text-slate-500">Try adjusting your filters or search term</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#111827] border border-slate-800/80 px-4 py-3.5 rounded-xl shadow-premium">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => {
                const prev = Math.max(currentPage - 1, 1);
                if (serverSide) {
                  onPageChange && onPageChange(prev);
                } else {
                  setLocalCurrentPage(prev);
                }
              }}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-slate-800 text-sm font-semibold rounded-lg text-slate-300 bg-slate-900 hover:border-neon disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => {
                const next = Math.min(currentPage + 1, totalPages);
                if (serverSide) {
                  onPageChange && onPageChange(next);
                } else {
                  setLocalCurrentPage(next);
                }
              }}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center px-4 py-2 border border-slate-800 text-sm font-semibold rounded-lg text-slate-300 bg-slate-900 hover:border-neon disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span> to{' '}
                <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                <span className="font-bold text-white">{totalCount}</span> complaints
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-lg shadow-sm gap-1.5" aria-label="Pagination">
                <button
                  onClick={() => {
                    const prev = Math.max(currentPage - 1, 1);
                    if (serverSide) {
                      onPageChange && onPageChange(prev);
                    } else {
                      setLocalCurrentPage(prev);
                    }
                  }}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-neon hover:border-neon transition-colors disabled:opacity-50"
                >
                  <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      if (serverSide) {
                        onPageChange && onPageChange(page);
                      } else {
                        setLocalCurrentPage(page);
                      }
                    }}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                      currentPage === page
                        ? 'bg-neon border-neon text-slate-900 shadow-glow'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-neon hover:text-neon'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => {
                    const next = Math.min(currentPage + 1, totalPages);
                    if (serverSide) {
                      onPageChange && onPageChange(next);
                    } else {
                      setLocalCurrentPage(next);
                    }
                  }}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-neon hover:border-neon transition-colors disabled:opacity-50"
                >
                  <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


