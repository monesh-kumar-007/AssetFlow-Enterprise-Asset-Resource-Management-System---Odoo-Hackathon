import React from 'react';
import Dashboard from './components/Dashboard';

export default function AppLayout() {
  const navItems = [
    { name: 'Dashboard', active: true },
    { name: 'Organization setup' },
    { name: 'Assets' },
    { name: 'Allocation & Transfer' },
    { name: 'Resource Booking' },
    { name: 'Maintenance' },
    { name: 'Audit' },
    { name: 'Reports' },
    { name: 'Notifications' }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* PERSISTENT LEFT SIDEBAR PANEL */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <h2 className="text-xl font-black tracking-wider text-white">AssetFlow</h2>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.active 
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="px-3 py-2 border-t border-slate-800 text-xs text-slate-500 font-mono">
          v1.0.0 • branch: monesh
        </div>
      </aside>

      {/* DYNAMIC SCROLLABLE RIGHT VIEWPORT CONTAINER */}
      <main className="flex-1 bg-slate-950 overflow-y-auto">
        <Dashboard />
      </main>
    </div>
  );
}   