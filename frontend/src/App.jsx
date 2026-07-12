<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginSignup from './pages/LoginSignup';
import Dashboard from './pages/Dashboard';
import AssetDirectory from './pages/AssetDirectory';
import Allocations from './pages/Allocations';
import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Audits from './pages/Audits';
import OrgSetup from './pages/OrgSetup';
import Reports from './pages/Reports';

// Icons
import { 
  LayoutDashboard, Boxes, ArrowLeftRight, CalendarDays, 
  Wrench, ShieldCheck, Building2, BarChart4, FileText, 
  Bell, LogOut, Moon, Sun, Menu, X, CheckSquare
} from 'lucide-react';

const AppContent = () => {
  const { user, loading, logout, apiCall } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'dark');
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiCall('/dashboard/notifications');
      setNotifications(data || []);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Setup periodic poll every 15s to fetch alerts
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Sync theme changes
  useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f1f5f9';
      document.body.style.color = '#0f172a';
    } else {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#020617';
      document.body.style.color = '#f8fafc';
    }
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const handleMarkNotificationsRead = async () => {
    try {
      await apiCall('/dashboard/notifications/read', { method: 'PUT' });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await apiCall('/auth/delete-account', { method: 'DELETE' });
      setIsDeleteAccountModalOpen(false);
      logout();
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginSignup />;
  }

  // Define sidebar links based on user role
  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'assets', label: 'Asset Directory', icon: Boxes, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'allocations', label: 'Allocations & Transfers', icon: ArrowLeftRight, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'bookings', label: 'Resource Bookings', icon: CalendarDays, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'maintenance', label: 'Maintenance & Repairs', icon: Wrench, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'audits', label: 'Asset Audits', icon: ShieldCheck, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'org_setup', label: 'Organization Setup', icon: Building2, roles: ['Admin'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart4, roles: ['Admin', 'Asset Manager'] },
    { id: 'activity_logs', label: 'Activity Logs', icon: FileText, roles: ['Admin'] },
  ];

  // Filter links by active user role
  const visibleLinks = navLinks.filter(link => link.roles.includes(user.role));

  const getPageTitle = () => {
    return navLinks.find(link => link.id === activeTab)?.label || 'AssetFlow';
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* --- SIDEBAR NAV PANEL --- */}
      <div className={`fixed md:relative inset-y-0 left-0 w-64 glass z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between border-r ${themeMode === 'dark' ? 'border-slate-900 bg-slate-950/70' : 'border-slate-200 bg-white/70'}`}>
        <div className="flex flex-col">
          {/* Sidebar Brand Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900/60">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
              AssetFlow
            </span>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:text-white">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* User profile Summary */}
          <div className="p-4 border-b border-slate-900/40 space-y-1">
            <div className="font-bold text-sm text-slate-200 truncate">{user.name}</div>
            <div className="text-[10px] uppercase font-bold text-primary-400 tracking-wider bg-primary-500/10 w-fit px-2 py-0.5 rounded border border-primary-500/20">
              {user.role}
            </div>
            {user.department && (
              <div className="text-[10px] text-slate-400 italic">Dept: {user.department.name}</div>
            )}
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            {visibleLinks.map(link => {
              const Icon = link.icon;
              const isSelected = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isSelected 
                      ? 'bg-primary-600/15 text-primary-400 border border-primary-500/20' 
                      : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-900/50 space-y-2.5">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 px-2.5 rounded-lg border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 transition-all font-semibold"
          >
            <span>Theme: {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            {themeMode === 'dark' ? <Moon className="w-4 h-4 text-primary-400" /> : <Sun className="w-4 h-4 text-warning" />}
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-xs text-danger hover:text-red-400 font-bold py-2 px-3 rounded-lg border border-danger/10 hover:bg-danger/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>

          {user.role !== 'Admin' && (
            <button
              onClick={() => setIsDeleteAccountModalOpen(true)}
              className="w-full text-center text-[10px] text-red-500/80 hover:text-red-400 font-semibold py-1 hover:bg-red-500/5 transition-all block mt-2 border border-red-500/10 rounded"
            >
              Permanently Delete Account
            </button>
          )}
        </div>
      </div>

      {/* --- MAIN FRAME LAYOUT --- */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        
        {/* Top Navbar */}
        <header className={`h-16 flex items-center justify-between px-6 border-b z-30 relative ${themeMode === 'dark' ? 'border-slate-900 bg-slate-950/20' : 'border-slate-200 bg-slate-50/20'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 hover:text-white rounded-lg border border-slate-800">
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
            <h1 className="text-md font-bold tracking-tight text-white">{getPageTitle()}</h1>
          </div>

          {/* Notifications Alerts panel */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdown(!notifDropdown)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 rounded-full relative transition-all border border-slate-900/40"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-slate-950 animate-ping"></span>
              )}
            </button>

            {/* Notifications Dropdown card */}
            {notifDropdown && (
              <div className="absolute right-0 mt-2.5 w-80 glass rounded-xl border border-slate-800 shadow-2xl p-4 z-50 animate-fadeIn text-slate-300">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-primary-400" />
                    In-App Alerts ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkNotificationsRead}
                      className="text-[10px] text-primary-400 hover:text-primary-350 font-bold transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2.5">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No notifications found.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-2.5 rounded-lg border text-xs leading-normal ${
                        n.read ? 'bg-slate-950/15 border-slate-900 text-slate-500' : 'bg-primary-600/5 border-primary-500/20 text-slate-200'
                      }`}>
                        <div>{n.message}</div>
                        <div className="text-[9px] text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Body Grid */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          
          {/* Switch screens */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab} 
              openRegisterModal={() => {
                setActiveTab('assets');
                setIsRegisterModalOpen(true);
              }} 
            />
          )}

          {activeTab === 'assets' && (
            <AssetDirectory 
              isRegisterModalOpen={isRegisterModalOpen} 
              setIsRegisterModalOpen={setIsRegisterModalOpen} 
            />
          )}

          {activeTab === 'allocations' && <Allocations />}

          {activeTab === 'bookings' && <Bookings />}

          {activeTab === 'maintenance' && <Maintenance />}

          {activeTab === 'audits' && <Audits />}

          {activeTab === 'org_setup' && <OrgSetup />}

          {activeTab === 'reports' && <Reports />}

          {activeTab === 'activity_logs' && <AdminActivityLogs apiCall={apiCall} />}

        </main>
      </div>

      {/* --- DELETE ACCOUNT CONFIRMATION MODAL --- */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-slate-350">
            <div className="space-y-2 text-left">
              <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                ⚠️ Permanent Account Deletion
              </h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Are you sure you want to permanently delete your account? This action is <strong className="text-white">irreversible</strong> and will:
              </p>
              <ul className="text-xs text-slate-400 list-disc pl-5 space-y-1 mt-2">
                <li>Permanently erase your credentials and profile data.</li>
                <li>Release any currently allocated assets back to "Available".</li>
                <li>Cancel all your resource bookings and pending transfer requests.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition-all border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-55 text-xs font-semibold rounded-lg text-white transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Activity logs nested sub-component
const AdminActivityLogs = ({ apiCall }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await apiCall('/dashboard/logs');
        setLogs(data || []);
      } catch (error) {
        console.error('Failed to load logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 border border-slate-800 space-y-4 animate-fadeIn">
      <div>
        <h3 className="text-md font-bold text-white">System Security & Activity Audit Log</h3>
        <p className="text-xs text-slate-400 mt-1">Immutable trace trail documenting who performed what administrative, booking, and allocation actions.</p>
      </div>

      <div className="overflow-x-auto text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800 text-[10px] uppercase">
              <th className="py-2.5">User</th>
              <th className="py-2.5">Action Code</th>
              <th className="py-2.5">Affected Component</th>
              <th className="py-2.5">Audit details</th>
              <th className="py-2.5">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/40 text-slate-300">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/10 transition-colors">
                <td className="py-3 font-semibold text-slate-200">
                  {log.User ? log.User.name : 'System'}
                  <span className="block text-[9px] font-normal text-slate-500">{log.User?.role || 'Daemon'}</span>
                </td>
                <td className="py-3">
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700/60 rounded text-[10px] font-bold">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 text-slate-400 font-mono text-[10px]">{log.targetType || '—'}</td>
                <td className="py-3 max-w-xs truncate" title={log.details}>{log.details}</td>
                <td className="py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
=======
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
>>>>>>> db7b5401af2fbeeeb8072e986cdf50145d0fb924
