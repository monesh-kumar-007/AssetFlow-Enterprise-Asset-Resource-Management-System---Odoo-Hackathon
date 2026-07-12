import React from 'react';

function Analytics() {
  // Mock performance data for your asset management tracking
  const performanceMetrics = [
    { name: 'Asset Utilization Rate', value: '84.2%', change: '+3.1%', status: 'optimal' },
    { name: 'Mean Time to Repair (MTTR)', value: '4.2 hrs', change: '-12%', status: 'improving' },
    { name: 'Depreciation Accuracy', value: '99.8%', change: '0.0%', status: 'stable' },
    { name: 'System API Uptime', value: '99.94%', change: '+0.02%', status: 'optimal' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Analytics Workspace</h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time enterprise resource utilization, depreciation tracking, and system performance models.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{metric.name}</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-white tracking-tight">{metric.value}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                metric.status === 'optimal' || metric.status === 'improving' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Main Interactive Board Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Optimization Panel */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/30 p-6 h-80 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Asset Lifecycle & Cost Projections</h3>
            <p className="text-xs text-slate-400 mt-1">Linear depreciation metrics synced with active hardware allocations.</p>
          </div>
          <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-lg mt-4 bg-slate-950/40">
            <span className="text-xs text-slate-500 font-mono">[ Interactive Chart Matrix Engine Ready ]</span>
          </div>
        </div>

        {/* Category Breakdown Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 h-80 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Resource Load Distribution</h3>
            <p className="text-xs text-slate-400 mt-1">Breakdown by hardware nodes, rooms, and facility categories.</p>
          </div>
          <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-lg mt-4 bg-slate-950/40">
            <span className="text-xs text-slate-500 font-mono">[ Pie Chart Vector Pipeline Ready ]</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;