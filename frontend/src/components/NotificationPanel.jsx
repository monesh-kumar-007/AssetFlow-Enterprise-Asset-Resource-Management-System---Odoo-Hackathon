import React, { useState, useEffect } from 'react';

export default function NotificationPanel() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, ALERT, WORKFLOW

  useEffect(() => {
    // Prototyping dynamic data stream for notifications
    const fetchLogs = async () => {
      const mockLogs = [
        { id: 1, type: 'ALERT', message: 'Asset AF-0114 (Dell XPS 15) is past its expected return date.', time: '10 mins ago', user: 'System' },
        { id: 2, type: 'WORKFLOW', message: 'Transfer request initiated for Laptop AF-0114 from Priya to Raj.', time: '45 mins ago', user: 'Raj Patel' },
        { id: 3, type: 'WORKFLOW', message: 'Maintenance approved for Delivery Van B.', time: '2 hours ago', user: 'Asset Manager' },
      ];
      setLogs(mockLogs);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => filter === 'ALL' || log.type === filter);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-2xl mx-auto mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">System Activity Logs</h2>
          <p className="text-sm text-slate-500">Real-time immutable tracking stream.</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium self-start sm:self-center">
          {['ALL', 'ALERT', 'WORKFLOW'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-md transition ${filter === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Stream Layout */}
      <div className="mt-4 divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">No activity events logged.</p>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3 group">
              <span className={`mt-1.5 flex h-2 w-2 shrink-0 rounded-full ${log.type === 'ALERT' ? 'bg-red-500' : 'bg-blue-500'}`} />
              <div className="flex-1 space-y-1">
                <p className="text-sm text-slate-800 leading-relaxed">{log.message}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-500">{log.user}</span>
                  <span>•</span>
                  <span>{log.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}