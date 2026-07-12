import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  // 1. Unified State Layer
  const [data, setData] = useState({
    overview: { available: 0, allocated: 0, activeBookings: 0, pendingTransfers: 0, upcomingReturns: 0 },
    overdueCount: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // 2. Network Sim Stream Loop
  useEffect(() => {
    const streamMetrics = async () => {
      // Direct proxy data hook structure to swap out for Axios later
      const mockPayload = {
        overview: { available: 128, allocated: 76, activeBookings: 9, pendingTransfers: 3, upcomingReturns: 12 },
        overdueCount: 3,
        recentActivity: [
          { id: 1, text: 'Laptop AF-0114 - allocated to Priya shah - IT dept' },
          { id: 2, text: 'Room B2 - booking confirmed - 2:00 to 3:00 PM' },
          { id: 3, text: 'Projector AF-0062 - maintenance resolved' }
        ]
      };
      
      setData(mockPayload);
      setLoading(false);
    };

    streamMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-slate-400 font-mono text-sm animate-pulse">
        Polling streaming data parameters...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold text-white">Today's Overview</h1>
      </div>

      {/* High Density Metric Matrix Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</p>
          <p className="text-4xl font-bold text-white mt-2">{data.overview.available}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allocated</p>
          <p className="text-4xl font-bold text-white mt-2">{data.overview.allocated}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Bookings</p>
          <p className="text-4xl font-bold text-white mt-2">{data.overview.activeBookings}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Transfers</p>
          <p className="text-4xl font-bold text-white mt-2">{data.overview.pendingTransfers}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Returns</p>
          <p className="text-4xl font-bold text-white mt-2">{data.overview.upcomingReturns}</p>
        </div>
      </div>

      {/* Critical Highlight Alert Ribbon */}
      {data.overdueCount > 0 && (
        <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-4 flex items-center justify-between text-red-400 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span>{data.overdueCount} assets overdue for return - flagged for follow-up</span>
          </div>
        </div>
      )}

      {/* Action Button Strip Row */}
      <div className="flex flex-wrap gap-3">
        <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm">
          + register asset
        </button>
        <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm">
          Book resource
        </button>
        <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm">
          Raise requests
        </button>
      </div>

      {/* Recent Activity Log Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-200">Recent Activity</h3>
        <div className="space-y-3 font-mono text-sm text-slate-400">
          {data.recentActivity.map((log) => (
            <div key={log.id} className="flex items-start gap-2 border-b border-slate-800 pb-2 last:border-none">
              <span className="text-slate-600 font-bold shrink-0">&gt;</span>
              <p className="leading-relaxed">{log.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}