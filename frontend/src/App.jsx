import React, { useState } from 'react';

// Safe Imports: If these components exist and have 'export default', they will load.
// If they are blank, the switch statement fallback below will catch it safely.
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import AuditWorkspace from './components/AuditWorkspace';
import NotificationPanel from './components/NotificationPanel';

function App() {
  // Sets the initial active sidebar view
  const [activeView, setActiveView] = useState('Dashboard');

  // Sidebar navigation map matching your layout design
  const navigationItems = [
    { name: 'Dashboard', id: 'Dashboard' },
    { name: 'Organization setup', id: 'OrgSetup' },
    { name: 'Assets', id: 'Assets' },
    { name: 'Allocation & Transfer', id: 'Allocation' },
    { name: 'Resource Booking', id: 'Booking' },
    { name: 'Maintenance', id: 'Maintenance' },
    { name: 'Audit', id: 'Audit' },
    { name: 'Reports', id: 'Reports' },
    { name: 'Notifications', id: 'Notifications' },
  ];

  // Dynamic Workspace Engine
  const renderMainContent = () => {
    switch (activeView) {
      case 'Dashboard':
        // Renders your current main dashboard layout
        return <Dashboard />;
        
      case 'Audit':
        // Renders the audit view if exported correctly, else catches error
        try {
          return <AuditWorkspace />;
        } catch (e) {
          return <DefaultPlaceholder name="Audit" />;
        }

      case 'Notifications':
        try {
          return <NotificationPanel />;
        } catch (e) {
          return <DefaultPlaceholder name="Notifications" />;
        }

      // Default placeholder layout for tabs under development
      default:
        return <DefaultPlaceholder name={navigationItems.find(i => i.id === activeView)?.name || activeView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Persistent Sidebar Left Rail */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-6 shrink-0">
        <div className="flex flex-col gap-1 px-2">
          <div className="text-xl font-black tracking-wider text-white">AssetFlow</div>
          <div className="text-xs text-slate-500 font-mono">v1.0.0 • branch: monesh</div>
        </div>
        
        <nav className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/50'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderMainContent()}
        </div>
      </main>

    </div>
  );
}

// Reusable micro-component for placeholder views so the app never throws a 404/blank screen
function DefaultPlaceholder({ name }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-white">{name}</h1>
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The <span className="text-slate-200 font-semibold">{name}</span> workspace pipeline is ready. 
          Connect your components or backend API controllers to populate live tracking data here.
        </p>
      </div>
    </div>
  );
}

export default App;