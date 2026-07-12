import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  // 1. Establish Dynamic States
  const [stats, setStats] = useState([
    { title: 'Assets Available', count: 0, key: 'available', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Assets Allocated', count: 0, key: 'allocated', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Bookings', count: 0, key: 'bookings', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Maintenance Today', count: 0, key: 'maintenance', color: 'text-amber-600', bg: 'bg-amber-50' },
  ]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Dynamic Fetch Lifecycle
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // When your backend route is live: fetch('/api/dashboard/summary')
        // For now, this mimics an active API network stream response
        const response = await new Promise((resolve) => 
          setTimeout(() => resolve({
            statsData: { available: 42, allocated: 18, bookings: 7, maintenance: 3 },
            overdueData: [
              { id: 'AF-0114', name: 'Dell XPS 15', holder: 'Priya Sharma', daysOverdue: 4 },
              { id: 'AF-0089', name: 'Delivery Van B', holder: 'Raj Patel', daysOverdue: 2 }
            ]
          }), 800)
        );

        // Update core KPI summary counters dynamically
        setStats(prevStats => prevStats.map(stat => ({
          ...stat,
          count: response.statsData[stat.key] || 0
        })));

        // Update overdue listings dynamically
        setOverdueItems(response.overdueData);
        setError(null);
      } catch (err) {
        setError('Failed to load active system metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Optional: Setup a 30-second polling interval for real-time hackathon updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center shadow-sm">
          <p className="font-bold">System Sync Alert</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AssetFlow Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time operational snapshot of system resources.</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition"
        >
          Refresh Data
        </button>
      </div>

      {/* Grid for core KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stat.count}</h3>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} font-bold text-xl`}>
              ⚡
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid: Overdue Returns vs System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overdue Items Alert Panel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-red-100 ring-1 ring-red-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              Critical Overdue Returns
            </h2>
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
              {overdueItems.length} Flagged
            </span>
          </div>
          
          <div className="space-y-3">
            {overdueItems.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No overdue allocations detected.</p>
            ) : (
              overdueItems.map((item) => (
                <div key={item.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{item.id}</span>
                      <h4 className="font-semibold text-slate-800 text-sm mt-1">{item.name}</h4>
                    </div>
                    <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      {item.daysOverdue} days late
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Currently held by: <span className="font-medium text-slate-700">{item.holder}</span></p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Workspace Container for upcoming charts/logs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center min-h-[300px]">
          <p className="text-slate-400 font-medium">Analytics Heatmaps and Live Operations Logging Module active placeholder.</p>
        </div>
      </div>
    </div>
  );
}