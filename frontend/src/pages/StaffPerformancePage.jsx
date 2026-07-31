import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/FormControls';
import { FiStar, FiAward, FiMessageSquare, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { getStaffPerformance } from '../services/adminService';
import { formatLocalDate } from '../utils/dateFormatter';

export const StaffPerformancePage = () => {
  const [data, setData] = useState({ rankings: [], reviews: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const stats = await getStaffPerformance();
      setData(stats);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to load staff performance stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRankings = data.rankings.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // System-wide calculations
  const systemTotalReviews = data.reviews.length;
  const systemAverageRating = systemTotalReviews > 0
    ? parseFloat((data.reviews.reduce((acc, r) => acc + r.rating, 0) / systemTotalReviews).toFixed(2))
    : 0.0;
  
  const topPerformer = data.rankings.length > 0 && data.rankings[0].totalRatings > 0
    ? data.rankings[0]
    : null;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Staff Crew Performance Rankings
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Audit crew satisfaction metrics, star ratings, service feedback logs, and active performance rankings.
          </p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-800 hover:border-neon text-slate-400 hover:text-neon rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Reports'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
          <FiAlertCircle className="text-lg flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <Card variant="dark" className="border border-slate-800/60 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon text-xl">
            <FiTrendingUp />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">System Avg Rating</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-2xl font-black text-white">{systemAverageRating || '0.0'}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <FiStar key={star} className={`text-[10px] ${star <= Math.round(systemAverageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Metric 2 */}
        <Card variant="dark" className="border border-slate-800/60 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xl">
            <FiMessageSquare />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Reviews Received</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{systemTotalReviews}</span>
          </div>
        </Card>

        {/* Metric 3 */}
        <Card variant="dark" className="border border-slate-800/60 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl">
            <FiAward />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Top Rated Performer</span>
            <span className="text-sm font-bold text-white mt-0.5 block truncate max-w-[180px]">
              {topPerformer ? `${topPerformer.name} (${topPerformer.averageRating} ★)` : 'No ratings yet'}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Leaderboard rankings */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Crew Leaderboard & Ranking
            </h3>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search staff or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-1.5 px-3 text-xs"
              />
            </div>
          </div>

          <Card variant="dark" className="border border-slate-800/60 p-6 space-y-4">
            {filteredRankings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/40 text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold text-left bg-slate-950/20">
                      <th className="px-4 py-3 uppercase tracking-wider w-12 text-center">Rank</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Crew Member</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 uppercase tracking-wider text-center">Reviews</th>
                      <th className="px-4 py-3 uppercase tracking-wider text-center">Avg Rating</th>
                      <th className="px-4 py-3 uppercase tracking-wider text-right">Performance Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                    {filteredRankings.map((staff, idx) => (
                      <tr key={staff.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black font-mono text-[11px] 
                            ${idx === 0 && staff.totalRatings > 0 ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 
                              idx === 1 && staff.totalRatings > 0 ? 'bg-slate-350/10 text-slate-350 border border-slate-350/20' : 
                              idx === 2 && staff.totalRatings > 0 ? 'bg-amber-700/10 text-amber-700 border border-amber-700/20' : 
                              'bg-slate-800/40 text-slate-400'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <img 
                              src={staff.avatar} 
                              alt={staff.name} 
                              className="w-7 h-7 rounded-full border border-slate-850 object-cover"
                            />
                            <div>
                              <span className="font-bold text-white block text-[11px]">{staff.name}</span>
                              <span className="text-slate-500 block text-[9px] font-mono mt-0.5">{staff.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge value={staff.category} />
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-300">
                          {staff.totalRatings}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-extrabold text-white">{staff.averageRating || '0.0'}</span>
                            <FiStar className="text-amber-400 fill-amber-400 text-[10px]" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-20 bg-slate-850 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-neon h-full rounded-full" 
                                style={{ width: `${staff.performanceScore}%` }}
                              />
                            </div>
                            <span className="font-black text-neon text-[11px] w-9 text-right font-mono">
                              {staff.performanceScore}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-slate-500 text-xs text-center py-8">
                No staff members found matching search query.
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Customer Feedback Feed (Trends) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Review Feedback Feed
          </h3>

          <Card variant="dark" className="border border-slate-800/60 p-5 space-y-4">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {data.reviews && data.reviews.length > 0 ? (
                data.reviews.map((r, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold text-white block truncate max-w-[130px]">{r.complaintTitle}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Ticket ID: {r.complaintId}</span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {[1, 2, 3, 4, 5].map(star => (
                          <FiStar key={star} className={`text-[10px] ${star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>

                    {r.feedback && (
                      <p className="text-slate-300 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 leading-relaxed text-[11px]">
                        "{r.feedback}"
                      </p>
                    )}

                    <div className="flex flex-col gap-1 border-t border-slate-800/50 pt-2 text-[10px] text-slate-400">
                      <div>
                        <span className="text-slate-500 font-semibold">Technician:</span>{' '}
                        <span className="font-bold text-white">{r.staffName}</span>
                        {r.staffCategory && <span className="text-[9px] text-slate-500"> ({r.staffCategory})</span>}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                        <span>By: {r.studentName}</span>
                        <span>{formatLocalDate(r.ratedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs text-center py-8 italic font-semibold">
                  No review feedback comments received yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
