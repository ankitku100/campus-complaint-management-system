import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyComplaints } from '../services/complaintService';
import { Table } from '../components/Table';

export const MyComplaintsPage = () => {
  const navigate = useNavigate();
  const [complaintsData, setComplaintsData] = useState({ complaints: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [category, setCategory] = useState('All');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await getMyComplaints({
        page,
        limit: 5,
        search,
        status,
        priority,
        category
      });
      if (res && res.complaints) {
        setComplaintsData(res);
      } else if (Array.isArray(res)) {
        // Backwards compatibility fallback if API returns raw array
        setComplaintsData({ complaints: res, total: res.length, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, status, priority, category]);

  // Debounced search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchComplaints();
    }, 450);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          My Complaints
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Search, filter, and track the status of all complaints you have submitted.
        </p>
      </div>

      <div className="bg-[#111827] border border-slate-800/60 rounded-card p-6 shadow-premium">
        <Table
          data={complaintsData.complaints}
          itemsPerPage={5}
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
          loading={loading}
          searchPlaceholder="Search your complaints by ID, title, or keywords..."
          onRowClick={(item) => navigate(`/student/complaints/${item.dbId || item._id || item.id}`)}
        />
      </div>
    </div>
  );
};
