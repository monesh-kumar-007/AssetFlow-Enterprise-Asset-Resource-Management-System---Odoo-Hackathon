import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Boxes, UserCheck, ShieldAlert, Calendar, ArrowLeftRight, Clock, 
  PlusCircle, CalendarDays, Wrench, AlertTriangle, ShieldCheck 
} from 'lucide-react';

const Dashboard = ({ setActiveTab, openRegisterModal }) => {
  const { apiCall, user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [overdueList, setOverdueList] = useState([]);
  const [upcomingList, setUpcomingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceModal, setMaintenanceModal] = useState(false);
  const [assetsList, setAssetsList] = useState([]);
  const [maintAssetId, setMaintAssetId] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintPriority, setMaintPriority] = useState('Medium');
  const [maintError, setMaintError] = useState('');
  const [maintSuccess, setMaintSuccess] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const kpiData = await apiCall('/dashboard/kpis');
      setKpis(kpiData);

      const overdueData = await apiCall('/dashboard/overdue');
      setOverdueList(overdueData.overdue || []);
      setUpcomingList(overdueData.upcoming || []);

      // Pre-fetch assets list for the maintenance request drop-down
      const assetsData = await apiCall('/assets');
      // If employee, they should only raise maintenance on assets currently assigned to them
      if (user.role === 'Employee') {
        // Query active allocations to see what assets they hold
        const activeAllocations = overdueData.overdue
          .concat(overdueData.upcoming)
          .filter(alloc => alloc.employeeId === user.id)
          .map(alloc => alloc.Asset);
        // Or we can just allow them to raise on any asset if they select it, but let's filter if appropriate or allow all.
        // Allowing selection of any asset is standard in case they notice a damaged shared room or generic asset. Let's list all.
        setAssetsList(assetsData);
      } else {
        setAssetsList(assetsData);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRaiseMaintenance = async (e) => {
    e.preventDefault();
    setMaintError('');
    setMaintSuccess('');

    if (!maintAssetId || !maintDesc) {
      setMaintError('Please select an asset and describe the issue.');
      return;
    }

    try {
      await apiCall('/maintenance/request', {
        method: 'POST',
        body: JSON.stringify({
          assetId: maintAssetId,
          description: maintDesc,
          priority: maintPriority
        })
      });
      setMaintSuccess('Maintenance request submitted successfully!');
      setMaintDesc('');
      setMaintAssetId('');
      // Refresh KPIs
      const kpiData = await apiCall('/dashboard/kpis');
      setKpis(kpiData);
      setTimeout(() => {
        setMaintenanceModal(false);
        setMaintSuccess('');
      }, 1500);
    } catch (error) {
      setMaintError(error.message || 'Failed to submit maintenance request.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const cards = [
    { title: 'Assets Available', value: kpis?.assetsAvailable || 0, icon: Boxes, color: 'text-success bg-success/10 border-success/20' },
    { title: 'Assets Allocated', value: kpis?.assetsAllocated || 0, icon: UserCheck, color: 'text-primary-400 bg-primary-500/10 border-primary-500/20' },
    { title: 'Active Maintenance', value: kpis?.maintenanceActive || 0, icon: Wrench, color: 'text-warning bg-warning/10 border-warning/20' },
    { title: 'Active Bookings', value: kpis?.activeBookings || 0, icon: CalendarDays, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { title: 'Pending Transfers', value: kpis?.pendingTransfers || 0, icon: ArrowLeftRight, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
    { title: 'Upcoming Returns', value: kpis?.upcomingReturns || 0, icon: Clock, color: 'text-primary-300 bg-primary-300/10 border-primary-300/20' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Hello, {user.name} 👋</h2>
        <p className="text-slate-400 text-sm mt-1">Here is your real-time operational snapshot as <strong className="text-primary-400">{user.role}</strong>.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="glass rounded-xl p-4 border flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.title}</span>
                <div className={`p-1.5 rounded-lg border ${c.color.split(' ')[1]} ${c.color.split(' ')[2]}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold tracking-tight text-white">{c.value}</span>
              </div>
            </div>
          );
        })}

        {/* OVERDUE KPI CARD - highlighted separately */}
        <div className={`glass rounded-xl p-4 border border-danger/30 bg-danger/5 flex flex-col justify-between hover:scale-[1.02] transition-transform`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-danger uppercase tracking-wider">Overdue Returns</span>
            <div className="p-1.5 rounded-lg border border-danger/20 bg-danger/10 text-danger animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold tracking-tight text-danger">{kpis?.overdueReturns || 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(user.role === 'Admin' || user.role === 'Asset Manager') && (
            <button 
              onClick={openRegisterModal}
              className="flex items-center justify-center gap-3 p-4 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/30 hover:border-primary-500/50 rounded-xl text-primary-300 font-medium text-sm transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Register New Asset
            </button>
          )}
          <button 
            onClick={() => setActiveTab('bookings')}
            className="flex items-center justify-center gap-3 p-4 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-indigo-300 font-medium text-sm transition-all"
          >
            <Calendar className="w-5 h-5" />
            Book Shared Resource
          </button>
          <button 
            onClick={() => setMaintenanceModal(true)}
            className="flex items-center justify-center gap-3 p-4 bg-warning/10 hover:bg-warning/20 border border-warning/20 hover:border-warning/40 rounded-xl text-warning font-medium text-sm transition-all"
          >
            <Wrench className="w-5 h-5" />
            Raise Maintenance Request
          </button>
        </div>
      </div>

      {/* Overdue vs Upcoming Returns split lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Overdue Returns Panel */}
        <div className="glass rounded-xl p-6 border border-danger/10">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <AlertTriangle className="text-danger w-5 h-5" />
            <h3 className="font-semibold text-lg text-white">Overdue Allocations</h3>
            <span className="ml-auto text-xs px-2 py-0.5 bg-danger/10 text-danger border border-danger/20 rounded-full font-bold">
              Action Required
            </span>
          </div>
          
          {overdueList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-sm">
              <ShieldCheck className="w-10 h-10 text-success mb-2 opacity-60" />
              No overdue returns in the system. Great job!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5">Asset Tag</th>
                    <th className="py-2.5">Asset Name</th>
                    <th className="py-2.5">Holder</th>
                    <th className="py-2.5 text-danger">Expected Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {overdueList.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 font-mono font-semibold text-primary-300">{alloc.Asset.assetTag}</td>
                      <td className="py-3 text-slate-200">{alloc.Asset.name}</td>
                      <td className="py-3 text-slate-300">{alloc.Employee ? alloc.Employee.name : alloc.Department?.name}</td>
                      <td className="py-3 text-danger font-medium">{alloc.expectedReturnDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Returns Panel */}
        <div className="glass rounded-xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <Clock className="text-primary-300 w-5 h-5" />
            <h3 className="font-semibold text-lg text-white">Upcoming Returns (Next 7 Days)</h3>
          </div>

          {upcomingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-sm">
              No returns expected in the next 7 days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5">Asset Tag</th>
                    <th className="py-2.5">Asset Name</th>
                    <th className="py-2.5">Holder</th>
                    <th className="py-2.5">Expected Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {upcomingList.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 font-mono font-semibold text-primary-300">{alloc.Asset.assetTag}</td>
                      <td className="py-3 text-slate-200">{alloc.Asset.name}</td>
                      <td className="py-3 text-slate-300">{alloc.Employee ? alloc.Employee.name : alloc.Department?.name}</td>
                      <td className="py-3 text-slate-300">{alloc.expectedReturnDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Raise Maintenance request modal */}
      {maintenanceModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Raise Maintenance Request</h3>
            
            {maintError && <p className="mb-4 text-xs text-danger bg-danger/10 border border-danger/20 rounded p-2">{maintError}</p>}
            {maintSuccess && <p className="mb-4 text-xs text-success bg-success/10 border border-success/20 rounded p-2">{maintSuccess}</p>}

            <form onSubmit={handleRaiseMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Asset</label>
                <select
                  value={maintAssetId}
                  onChange={(e) => setMaintAssetId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                >
                  <option value="">-- Choose Asset --</option>
                  {assetsList
                    .filter(a => a.status !== 'Retired' && a.status !== 'Disposed')
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.assetTag} - {a.name} ({a.status})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                <select
                  value={maintPriority}
                  onChange={(e) => setMaintPriority(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description of Issue</label>
                <textarea
                  rows="4"
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  placeholder="Describe what is wrong with the asset..."
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-2 text-sm">
                <button
                  type="button"
                  onClick={() => setMaintenanceModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
