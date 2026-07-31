import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Timeline } from '../components/Timeline';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { Select } from '../components/FormControls';
import { FiArrowLeft, FiUser, FiInfo, FiCalendar, FiMapPin, FiUpload, FiX, FiStar, FiAward, FiAlertCircle } from 'react-icons/fi';
import { formatLocalDate } from '../utils/dateFormatter';
import { getComplaint, getStudentComplaint } from '../services/complaintService';
import { updateStaffComplaint } from '../services/staffService';

export const ComplaintDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, completeComplaint, verifyComplaint, reopenComplaint, rateComplaint, staffMembers, assignStaff } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);

  // Override assign states
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Complete Modal states
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Rating states
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userFeedback, setUserFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [satisfactionStatus, setSatisfactionStatus] = useState('Satisfied');

  // Toast states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  const fetchComplaintDetails = async () => {
    setLoading(true);
    setIsForbidden(false);
    try {
      const role = user?.role?.toUpperCase();
      const data = (role === 'STUDENT' || role === 'USER')
        ? await getStudentComplaint(id)
        : await getComplaint(id);
      setComplaint(data);
      setFetchError('');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setIsForbidden(true);
      }
      setFetchError(err.response?.data?.message || err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const refreshComplaint = async () => {
    try {
      const role = user?.role?.toUpperCase();
      const data = (role === 'STUDENT' || role === 'USER')
        ? await getStudentComplaint(id)
        : await getComplaint(id);
      setComplaint(data);
    } catch (err) {
      console.error('Failed to refresh complaint:', err);
    }
  };

  const handleRatingSubmit = async () => {
    if (!userRating) return;
    setSubmittingRating(true);
    setRatingError('');
    try {
      await rateComplaint(complaint.dbId || complaint.id, userRating, userFeedback, satisfactionStatus);
      showToast(
        satisfactionStatus === 'Satisfied'
          ? 'Thank you! Complaint has been resolved and closed.'
          : 'Complaint has been escalated to administration.',
        'success'
      );
      setUserRating(0);
      setUserFeedback('');
      setSatisfactionStatus('Satisfied');
      await refreshComplaint();
    } catch (err) {
      console.error(err);
      setRatingError(err.response?.data?.message || err.message || 'Failed to submit review.');
      showToast('Failed to submit review.', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-neon rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Loading Complaint Details...</p>
      </div>
    );
  }

  if (isForbidden || fetchError || !complaint) {
    const isPermissionError = isForbidden || (fetchError && (fetchError.includes('permission') || fetchError.includes('access')));
    return (
      <div className="text-left space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-neon hover:underline text-sm font-bold">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <Card variant="dark" className="p-8 text-center border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-2">
            {isPermissionError ? 'Access Denied' : 'Complaint Not Found'}
          </h2>
          <p className="text-slate-400 text-xs">
            {isPermissionError 
              ? 'You do not have permission to access this complaint.' 
              : (fetchError || `The ticket ID ${id} does not exist.`)}
          </p>
        </Card>
      </div>
    );
  }

  const isAssignedStaff = user?.role?.toUpperCase() === 'STAFF' && complaint.assignedTo === user?.email;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (selectedImages.length + files.length > 5) {
      setErrorMsg('You can upload a maximum of 5 images.');
      return;
    }

    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Each image must be less than 5MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files are allowed.');
        return;
      }
    }

    setSelectedImages(prev => [...prev, ...files]);
    setErrorMsg('');
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      await updateStaffComplaint(complaint.dbId || complaint.id, { status: 'In Progress', remarks: 'Work started by staff.' });
      showToast('Complaint status updated to In Progress!', 'success');
      await refreshComplaint();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Failed to start work.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completionNotes.trim()) {
      setErrorMsg('Completion notes are required.');
      return;
    }
    setErrorMsg('');
    setActionLoading(true);
    try {
      await completeComplaint(complaint.dbId || complaint.id, completionNotes, selectedImages);
      showToast('Complaint marked as completed successfully!', 'success');
      setIsCompleteModalOpen(false);
      setCompletionNotes('');
      setSelectedImages([]);
      await refreshComplaint();
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || error.message || 'Failed to submit completion.');
      showToast('Failed to mark complaint as completed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      await verifyComplaint(complaint.dbId || complaint.id);
      showToast('Complaint resolution verified and closed.', 'success');
      await refreshComplaint();
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || error.message || 'Failed to verify resolution.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    setActionLoading(true);
    try {
      await reopenComplaint(complaint.dbId || complaint.id);
      showToast('Complaint reopened and set back to In Progress.', 'success');
      await refreshComplaint();
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || error.message || 'Failed to reopen complaint.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    setActionLoading(true);
    try {
      await assignStaff(complaint.dbId || complaint.id, selectedStaffId);
      showToast('Staff allocation overridden successfully!', 'success');
      setIsAssignModalOpen(false);
      setSelectedStaffId('');
      await refreshComplaint();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Failed to override staff allocation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Back Link & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-neon text-sm font-bold transition-colors"
        >
          <FiArrowLeft /> Back to List
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status:</span>
          <Badge value={complaint.status} />
          {complaint.isEscalated && (
            <Badge value="Escalated" />
          )}
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-2">Priority:</span>
          <Badge value={complaint.priority} />
        </div>
      </div>

      {complaint.isEscalated && (
        <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl flex items-start sm:items-center gap-3 text-red-400 text-xs shadow-premium shadow-red-950/10">
          <FiAlertCircle className="text-xl shrink-0 text-red-500 animate-bounce mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mr-2">SLA Breached</span>
            <p className="font-extrabold text-red-400 inline-block">Ticket Auto-Escalated to Administration</p>
            <p className="mt-1 text-slate-400 font-medium">
              This ticket has remained unresolved past the SLA threshold. System administration was notified on {new Date(complaint.escalatedAt).toLocaleString()}.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Complaint Details */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="dark" className="border border-slate-800 space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 font-semibold uppercase tracking-wider">
                <FiInfo className="text-neon" />
                <span>{complaint.category} Category</span>
                <span>•</span>
                <span className="font-mono text-neon font-bold">{complaint.id}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {complaint.title}
              </h2>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Issue Description</span>
              <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-900/60 whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* Metadata tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-y border-slate-800/60 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <FiMapPin className="text-neon text-sm" />
                  <span className="font-semibold">Location:</span>
                </div>
                <p className="text-white pl-6">{complaint.location}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <FiCalendar className="text-neon text-sm" />
                  <span className="font-semibold">Submitted:</span>
                </div>
                <p className="text-white pl-6 font-mono">{formatLocalDate(complaint.submittedDate)}</p>
              </div>
            </div>

            {/* Assigned Staff Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-950/20 p-4 rounded-xl border border-slate-800/40 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-neon">
                  <FiUser />
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase tracking-wider text-[9px]">Assigned Staff</span>
                  <span className="text-white font-semibold">
                    {complaint.assignedToName || 'Awaiting assignment'}
                  </span>
                  {complaint.assignedToCategory && (
                    <span className="text-slate-400 block text-[10px] mt-0.5">
                      Specialization: <span className="text-neon font-semibold">{complaint.assignedToCategory}</span>
                    </span>
                  )}
                  {complaint.assignedTo && (
                    <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                      <span className="text-slate-400 text-[10px]">Assignment Method: <span className="text-white font-bold">{complaint.assignmentMethod || 'AUTO'}</span></span>
                      {complaint.autoAssigned && (
                        <Badge value="Assigned Automatically" className="text-[9px] px-1.5 py-0.5" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {complaint.assignedTo && (
                  <span className="text-slate-400 text-[10px] font-mono">{complaint.assignedTo}</span>
                )}
                {user?.role?.toUpperCase() === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaffId('');
                      setIsAssignModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-neon hover:border-neon hover:bg-slate-850 rounded-lg text-[10px] font-bold transition-all mt-1 sm:mt-0"
                  >
                    {complaint.assignedTo ? 'Override Staff' : 'Assign Staff'}
                  </button>
                )}
              </div>
            </div>

            {/* User Submitted Images */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Attachment Evidence</span>
                <div className="flex flex-wrap gap-3">
                  {complaint.images.map((img, index) => (
                    img && (
                      <a key={index} href={img} target="_blank" rel="noreferrer" className="block max-w-sm rounded-xl overflow-hidden border border-slate-800 group hover:border-neon transition-colors">
                        <img src={img} alt="Evidence" className="max-h-48 object-cover group-hover:opacity-85 transition-opacity" />
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Evidence Details */}
            {(complaint.status === 'Completed' || complaint.status === 'Verified' || complaint.status === 'Resolved') && (
              <div className="bg-[#B6FF5C]/5 border border-[#B6FF5C]/20 rounded-xl p-5 space-y-4 text-left">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800/50 pb-3 gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#B6FF5C] uppercase tracking-wider block font-mono">
                      {complaint.status === 'Verified' ? '✓ Resolution Verified' : '✓ Work Resolution Submitted'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {complaint.completedAt ? `Completed on ${formatLocalDate(complaint.completedAt)}` : 'Completed'}
                    </span>
                  </div>
                  {complaint.completedBy && (
                    <div className="text-xs">
                      <span className="text-slate-400">Staff: </span>
                      <span className="font-bold text-white">{complaint.completedBy}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#B6FF5C]/75 uppercase tracking-widest block">Completion Notes</span>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-850 whitespace-pre-wrap">
                    {complaint.completionNotes || complaint.resolutionRemarks || 'Work completed successfully.'}
                  </p>
                </div>

                {((complaint.completionImages && complaint.completionImages.length > 0) || (complaint.resolutionProofImages && complaint.resolutionProofImages.length > 0) || complaint.resolutionImage) && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#B6FF5C]/75 uppercase tracking-widest block">Proof of Work Photos</span>
                    <div className="flex flex-wrap gap-3">
                      {((complaint.completionImages && complaint.completionImages.length > 0) ? complaint.completionImages : (complaint.resolutionProofImages && complaint.resolutionProofImages.length > 0) ? complaint.resolutionProofImages : [complaint.resolutionImage]).map((img, idx) => (
                        img && (
                          <a key={idx} href={img} target="_blank" rel="noreferrer" className="block max-w-[200px] rounded-lg overflow-hidden border border-slate-800 hover:border-[#B6FF5C] transition-colors bg-slate-950">
                            <img src={img} alt={`Proof ${idx + 1}`} className="max-h-32 object-cover hover:opacity-85 transition-opacity" />
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAssignedStaff && (complaint.status === 'Assigned' || complaint.status === 'In Progress') && (
              <div className="border-t border-slate-800/60 pt-5 flex justify-end gap-3">
                {complaint.status === 'Assigned' && (
                  <button
                    onClick={handleStartWork}
                    disabled={actionLoading}
                    className="px-5 py-2.5 border border-neon hover:bg-neon/10 text-neon font-extrabold text-xs rounded-xl shadow-glow transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Starting...' : 'Start Work (In Progress)'}
                  </button>
                )}
                <button
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="px-5 py-2.5 bg-neon hover:bg-[#A3E635] text-slate-900 font-extrabold text-xs rounded-xl shadow-glow transition-all"
                >
                  Mark as Completed
                </button>
              </div>
            )}

            {user?.role?.toUpperCase() === 'ADMIN' && complaint.status === 'Completed' && (
              <div className="border-t border-slate-800/60 pt-5 flex flex-wrap gap-3 justify-end">
                <button
                  onClick={handleReopen}
                  disabled={actionLoading}
                  className="px-5 py-2.5 border border-red-500 hover:bg-red-500/10 text-red-400 font-extrabold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Reopening...' : 'Reopen Complaint'}
                </button>
                <button
                  onClick={handleVerify}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-neon hover:bg-[#A3E635] text-slate-900 font-extrabold text-xs rounded-xl shadow-glow transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Verifying...' : 'Verify Resolution'}
                </button>
              </div>
            )}

            {/* Student Review / Rating System Card */}
            {((complaint.status === 'Completed' && user?.role?.toUpperCase() === 'STUDENT') || 
              (complaint.rating !== null && ['Closed', 'Escalated', 'Verified', 'Resolved'].includes(complaint.status))) && (
              <div className="border-t border-slate-800/60 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <FiAward className="text-neon text-base" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Student Satisfaction Review
                  </span>
                </div>

                {complaint.rating !== null && ['Closed', 'Escalated', 'Verified', 'Resolved'].includes(complaint.status) ? (
                  <div className="space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-800/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`text-base ${star <= complaint.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                          />
                        ))}
                        <span className="text-xs text-slate-400 font-semibold ml-1">
                          (Rated {complaint.rating} / 5)
                        </span>
                      </div>
                      <Badge 
                        value={complaint.status === 'Closed' || complaint.status === 'Verified' || complaint.status === 'Resolved' ? 'Satisfied' : 'Not Satisfied / Escalated'} 
                        className="text-[9px]" 
                      />
                    </div>
                    {complaint.feedback && (
                      <div className="text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-slate-350 italic">
                        "{complaint.feedback}"
                      </div>
                    )}
                    {complaint.ratedAt && (
                      <span className="text-[10px] text-slate-500 block font-mono">
                        Reviewed on {formatLocalDate(complaint.ratedAt)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 bg-slate-950/20 p-5 rounded-xl border border-slate-850">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Staff has completed the work. Please review the resolution details and rate your satisfaction below.
                    </p>
                    
                    {/* Star Rating Selection */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Rate Resolution Quality *</span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="outline-none transition-transform hover:scale-110"
                          >
                            <FiStar
                              className={`text-xl ${star <= (hoverRating || userRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Comments Textarea */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Feedback Comments</span>
                      <textarea
                        className="w-full bg-slate-900 border border-slate-800 focus:border-neon focus:ring-1 focus:ring-neon text-white text-xs p-3 rounded-lg outline-none resize-none transition-all placeholder:text-slate-600"
                        rows={3}
                        placeholder="Write your resolution review or notes here..."
                        value={userFeedback}
                        onChange={(e) => setUserFeedback(e.target.value)}
                      />
                    </div>

                    {/* Satisfaction Status Selector */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">3. Satisfaction Choice *</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer">
                          <input
                            type="radio"
                            name="satisfactionStatus"
                            value="Satisfied"
                            checked={satisfactionStatus === 'Satisfied'}
                            onChange={() => setSatisfactionStatus('Satisfied')}
                            className="text-neon focus:ring-neon bg-slate-900 border-slate-800"
                          />
                          <span>Satisfied (Close Ticket)</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer">
                          <input
                            type="radio"
                            name="satisfactionStatus"
                            value="Not Satisfied"
                            checked={satisfactionStatus === 'Not Satisfied'}
                            onChange={() => setSatisfactionStatus('Not Satisfied')}
                            className="text-neon focus:ring-neon bg-slate-900 border-slate-800"
                          />
                          <span className="text-red-400">Not Satisfied (Escalate to Admin)</span>
                        </label>
                      </div>
                    </div>

                    {ratingError && (
                      <p className="text-red-500 text-[10px] font-bold">{ratingError}</p>
                    )}

                    <button
                      onClick={handleRatingSubmit}
                      disabled={submittingRating || !userRating}
                      className="px-5 py-2.5 bg-neon hover:bg-[#A3E635] text-slate-900 font-extrabold text-xs rounded-xl shadow-glow transition-all disabled:opacity-50"
                    >
                      {submittingRating ? 'Submitting Review...' : 'Submit Resolution Review'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </Card>
        </div>

        {/* Right Column: Timeline Box */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="dark" className="border border-slate-800 p-6 space-y-6">
            <Timeline timeline={complaint.timeline} currentStatus={complaint.status} complaint={complaint} />
          </Card>

          {complaint.escalationHistory && complaint.escalationHistory.length > 0 && (
            <Card variant="dark" className="border border-red-500/30 p-6 space-y-4 bg-red-950/5">
              <div className="flex items-center gap-2 border-b border-red-500/20 pb-3">
                <FiAlertCircle className="text-red-400 animate-pulse text-lg" />
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">
                  Escalation Logs
                </h3>
              </div>
              <div className="space-y-4">
                {complaint.escalationHistory.map((esc, index) => (
                  <div key={index} className="space-y-2 text-xs border-b border-slate-800/40 last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>{new Date(esc.escalatedAt).toLocaleString()}</span>
                      <Badge value="Escalated" />
                    </div>
                    <p className="text-slate-300 text-xs font-medium">
                      {esc.reason}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Previous Status: <span className="font-semibold text-slate-200">{esc.previousStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

      </div>

      {/* Completion Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Complete Job: ${complaint.id}`}
        size="md"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Completion Notes *
            </label>
            <textarea
              className="w-full bg-slate-900 border border-slate-800 focus:border-neon focus:ring-1 focus:ring-neon text-white text-xs p-3.5 rounded-xl outline-none resize-none transition-all placeholder:text-slate-600"
              rows={4}
              required
              placeholder="Provide details about the resolution (e.g. replaced the light bulb, fixed the pipe)..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Work Completion Photos (1 to 5 images)
            </label>
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer hover:border-neon/50 bg-slate-900/40 hover:bg-slate-900/60 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiUpload className="text-xl text-slate-500 mb-2" />
                  <p className="text-[11px] text-slate-400 font-semibold">Click to select files</p>
                  <p className="text-[9px] text-slate-500 mt-1">PNG, JPG, JPEG, WEBP (Max 5MB each)</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-[10px] font-bold">{errorMsg}</p>
            )}

            {selectedImages.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Selected Images ({selectedImages.length})</span>
                <div className="flex flex-wrap gap-2">
                  {selectedImages.map((file, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(idx)}
                        className="absolute inset-0 bg-slate-950/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-350 hover:text-white font-bold text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 bg-neon hover:bg-[#A3E635] text-slate-900 font-extrabold text-xs rounded-xl shadow-glow transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {actionLoading ? 'Uploading...' : 'Submit Resolution'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Override Staff Assignment Modal */}
      {isAssignModalOpen && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`${complaint.assignedTo ? 'Override Staff' : 'Assign Staff'}: ${complaint.id}`}
          size="sm"
        >
          <form onSubmit={handleAssignSubmit} className="space-y-5 text-left">
            {(() => {
              const filteredStaff = staffMembers.filter(s => s.category === complaint.category);
              return (
                <>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select a maintenance crew member to {complaint.assignedTo ? 'override assignment' : 'manually allocate'} for ticket <span className="text-neon font-mono font-bold">{complaint.id}</span> (Category: <span className="text-white font-bold">{complaint.category}</span>):
                  </p>

                  <Select
                    label="Staff Assignee"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    options={[
                      { value: '', label: 'Select Staff Member...' },
                      ...filteredStaff.map(s => ({
                        value: s.id,
                        label: `${s.name} (${s.specialty})`
                      }))
                    ]}
                  />

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recommended Staff ({complaint.category})
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
                        No active verified staff members in this category.
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-350 hover:text-white font-bold text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !selectedStaffId}
                className="px-5 py-2.5 bg-neon hover:bg-[#A3E635] text-slate-900 font-extrabold text-xs rounded-xl shadow-glow transition-all disabled:opacity-50"
              >
                Confirm Override
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Toast notifications */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
};
