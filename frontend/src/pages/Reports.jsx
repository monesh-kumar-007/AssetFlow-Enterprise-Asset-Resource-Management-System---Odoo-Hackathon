import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart4, PieChart, Activity, Wrench, AlertOctagon, 
  Download, CheckCircle, TrendingUp, Clock, HelpCircle 
} from 'lucide-react';

const Reports = () => {
  const { apiCall } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/dashboard/analytics');
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportCSV = (type) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'utilization') {
      csvContent += "Category Name,Total Assets,Allocated,Available,Under Maintenance,Utilization Rate (%)\n";
      analytics.categoryBreakdown.forEach(row => {
        csvContent += `"${row.categoryName}",${row.total},${row.allocated},${row.available},${row.maintenance},${row.utilizationRate}%\n`;
      });
    } else if (type === 'departments') {
      csvContent += "Department Name,Active Allocations Count\n";
      analytics.departmentAllocations.forEach(row => {
        csvContent += `"${row.departmentName}",${row.allocationCount}\n`;
      });
    } else if (type === 'maintenance') {
      csvContent += "Category Name,Total Maintenance Tickets\n";
      analytics.maintenanceFrequency.forEach(row => {
        csvContent += `"${row.categoryName}",${row.ticketCount}\n`;
      });
    } else {
      csvContent += "Asset Tag,Asset Name,Category,Acquisition Date,Condition,Status\n";
      analytics.actionRequiredAssets.forEach(row => {
        csvContent += `"${row.assetTag}","${row.name}","${row.AssetCategory?.name || ''}",${row.acquisitionDate},"${row.condition}","${row.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-sm text-slate-350">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reports & Operational Insights</h2>
          <p className="text-slate-400 text-sm mt-1">Review asset utilization trends, booking density heatmaps, and download system registers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 1. Category Utilization Rates (CSS Horizontal bars) */}
        <div className="glass rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-855 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-400" />
              Asset Utilization by Category
            </h3>
            <button 
              onClick={() => exportCSV('utilization')}
              title="Download CSV"
              className="p-1 hover:text-white transition-colors"
            >
              <Download className="w-4.5 h-4.5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {analytics?.categoryBreakdown.map((row, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-200">{row.categoryName}</span>
                  <span className="text-primary-300">{row.utilizationRate}% Utilized ({row.allocated} / {row.total} active)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden flex border border-slate-850">
                  <div 
                    style={{ width: `${row.utilizationRate}%` }} 
                    className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                  ></div>
                </div>
                <div className="flex gap-4 text-[10px] text-slate-500 font-medium pl-1">
                  <span>Available: {row.available}</span>
                  <span>Maintenance: {row.maintenance}</span>
                  <span>Disposed/Retired: {row.other}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Department Allocation Totals (CSS Horizontal bars) */}
        <div className="glass rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-855 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <BarChart4 className="w-5 h-5 text-indigo-400" />
              Active Allocations by Department
            </h3>
            <button 
              onClick={() => exportCSV('departments')}
              title="Download CSV"
              className="p-1 hover:text-white transition-colors"
            >
              <Download className="w-4.5 h-4.5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {analytics?.departmentAllocations.map((row, idx) => {
              const maxAlloc = Math.max(...analytics.departmentAllocations.map(d => d.allocationCount), 1);
              const percentage = Math.round((row.allocationCount / maxAlloc) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">{row.departmentName}</span>
                    <span className="text-indigo-400">{row.allocationCount} assets</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden flex border border-slate-850">
                    <div 
                      style={{ width: `${percentage}%` }} 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Resource Bookings Heatmap density (Hour of day) */}
        <div className="glass rounded-xl p-6 border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-855 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-success" />
              Peak Resource Booking Heatmap
            </h3>
          </div>
          
          <div className="pt-2 space-y-2">
            <p className="text-xs text-slate-400">Heat breakdown representing booking density grouped by hour slots (9:00 AM - 6:00 PM standard office window):</p>
            
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2.5 pt-2">
              {analytics?.bookingHeatmap
                .filter(item => item.hour >= 9 && item.hour <= 18) // Filter focus window
                .map((item, idx) => {
                  const maxVal = Math.max(...analytics.bookingHeatmap.map(h => h.bookingsCount), 1);
                  const intensity = item.bookingsCount / maxVal;
                  
                  // Heatmap colors based on intensity
                  let bgClass = 'bg-slate-900 border-slate-800 text-slate-400';
                  if (intensity > 0 && intensity <= 0.3) bgClass = 'bg-success/15 border-success/30 text-success';
                  else if (intensity > 0.3 && intensity <= 0.6) bgClass = 'bg-warning/20 border-warning/40 text-warning';
                  else if (intensity > 0.6) bgClass = 'bg-danger/25 border-danger/45 text-danger font-bold';

                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-lg p-3 text-center flex flex-col justify-between h-20 transition-all hover:scale-105 ${bgClass}`}
                    >
                      <span className="text-[10px] uppercase font-semibold">{item.label}</span>
                      <span className="text-xl font-bold tracking-tight mt-1">{item.bookingsCount}</span>
                      <span className="text-[8px] text-slate-500">Bookings</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 4. Maintenance frequency breakdown & Action Required items */}
        <div className="glass rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-855 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-warning" />
              Maintenance Ticket Density by Category
            </h3>
            <button 
              onClick={() => exportCSV('maintenance')}
              title="Download CSV"
              className="p-1 hover:text-white transition-colors"
            >
              <Download className="w-4.5 h-4.5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {analytics?.maintenanceFrequency.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">No logged repair events.</div>
            ) : (
              analytics?.maintenanceFrequency.map((row, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-800/40 text-xs">
                  <span className="text-slate-200 font-semibold">{row.categoryName}</span>
                  <span className="px-2 py-0.5 bg-warning/10 text-warning border border-warning/20 rounded font-bold">
                    {row.ticketCount} requests
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. Assets Due for maintenance or nearing retirement */}
        <div className="glass rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-855 pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-danger" />
              Aging Assets & Inspection Required
            </h3>
            <button 
              onClick={() => exportCSV('retirement')}
              title="Download CSV"
              className="p-1 hover:text-white transition-colors"
            >
              <Download className="w-4.5 h-4.5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-2 pt-1 max-h-60 overflow-y-auto">
            {analytics?.actionRequiredAssets.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No assets flag warning conditions. Good!</div>
            ) : (
              analytics?.actionRequiredAssets.map((row) => (
                <div key={row.id} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-850 hover:bg-slate-900/10 transition-colors text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <span className="font-mono text-primary-300 font-bold">{row.assetTag}</span>
                      <span>— {row.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Condition: {row.condition} | Acquired: {row.acquisitionDate}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                    row.condition === 'Poor' ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {row.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Reports;
