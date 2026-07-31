import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Select, TextArea } from '../components/FormControls';
import { FiUserCheck, FiExternalLink } from 'react-icons/fi';
import { Table } from '../components/Table';
import { Link } from 'react-router-dom';
import { formatLocalDate } from '../utils/dateFormatter';
import { getAdminComplaints } from '../services/adminService';

export const ComplaintManagementPage = () => {
  const { staffMembers, assignStaff, updateComplaintStatus } = useAuth();
  
  const [complaintsData, setComplaintsData] = useState({ complaints: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [category, setCategory] = useState('All');

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Form states
  const [staffId, setStaffId] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await getAdminComplaints({
        page,
        limit: 6,
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
      console.error('Failed to load admin complaints:', err);
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
    return () => clearTimeout(handler);
  }, [search]);

  const handleOpenManageModal = (ticket) => {
    setSelectedTicket(ticket);
    const matchingStaff = staffMembers.filter(s => s.category === ticket.category);
    setStaffId(ticket.assignedTo || (matchingStaff[0]?.email || ''));
    setTicketStatus(ticket.status);
    setRemarks('');
    setIsManageModalOpen(true);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    // Check if staff assignee changed
    if (staffId && staffId !== selectedTicket.assignedTo) {
      // Find staff name
      const staffObj = staffMembers.find(s => s.email === staffId || s.id === staffId);
      if (staffObj) {
        await assignStaff(selectedTicket.id, staffObj.id);
      }
    }

    // Check if status changed
    if (ticketStatus !== selectedTicket.status) {
      await updateComplaintStatus(selectedTicket.id, ticketStatus, remarks || `Status updated by Admin`);
    } else if (remarks) {
      // Add remarks as timeline entry without status change
      await updateComplaintStatus(selectedTicket.id, selectedTicket.status, remarks);
    }

    setIsManageModalOpen(false);
    setSelectedTicket(null);
    fetchComplaints();
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Complaint Ticket Management
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Perform administrative tasks: assign specialized personnel, update lifecycle status, and input supervisor remarks.
        </p>
      </div>

      <div className="bg-[#111827] border border-slate-800/60 rounded-card p-6 shadow-premium">
        <Table
          data={complaintsData.complaints}
          itemsPerPage={6}
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
          onRowClick={handleOpenManageModal}
          searchPlaceholder="Click row to manage or search complaints..."
        />
      </div>

      {/* Master Action Modal */}
      {selectedTicket && (
        <Modal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          title={`Ticket Control: ${selectedTicket.id}`}
          size="md"
        >
          <form onSubmit={handleSaveChanges} className="space-y-5">
            {/* Ticket Summary */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                <span className="text-neon">{selectedTicket.category}</span>
                <span className="font-mono">{formatLocalDate(selectedTicket.submittedDate)}</span>
              </div>
              <h4 className="text-sm font-bold text-white leading-normal truncate">{selectedTicket.title}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1">{selectedTicket.description}</p>
              <Link
                to={`/complaints/${selectedTicket.id}`}
                className="inline-flex items-center gap-1 text-[11px] text-neon hover:underline font-bold mt-2"
                onClick={() => setIsManageModalOpen(false)}
              >
                Open Details Page <FiExternalLink />
              </Link>
            </div>

            {(() => {
              const filteredStaff = selectedTicket 
                ? staffMembers.filter(s => s.category === selectedTicket.category)
                : [];
              
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Override Staff dropdown */}
                    <Select
                      label={`Override Staff Assignee (Specialization: ${selectedTicket?.category})`}
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      options={[
                        { value: '', label: 'No Change / Unassigned' },
                        ...filteredStaff.map(s => ({ value: s.email, label: `${s.name} (Workload: ${s.currentWorkloadScore || 0})` }))
                      ]}
                    />

                    {/* Status dropdown */}
                    <Select
                      label="Ticket Progress Status"
                      value={ticketStatus}
                      onChange={(e) => setTicketStatus(e.target.value)}
                      options={['Pending', 'Waiting For Staff', 'Assigned', 'In Progress', 'Completed', 'Verified']}
                    />
                  </div>

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
                            onClick={() => setStaffId(s.email)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              staffId === s.email
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
                        No staff members specialized in "{selectedTicket?.category}".
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Remarks Textarea */}
            <TextArea
              label="Administrative Remark Notes"
              placeholder="e.g., Materials ordered, checking valve, technician notified..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
              <Button variant="outline" onClick={() => setIsManageModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="neon" className="flex items-center gap-1">
                <FiUserCheck /> Save & Dispatch
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
