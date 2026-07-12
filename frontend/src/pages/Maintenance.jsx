import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wrench, CheckCircle, Clock, Hammer, Ban, AlertTriangle, ShieldCheck } from 'lucide-react';

const Maintenance = () => {
  const { apiCall, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manage workflow state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await apiCall('/maintenance');
      setRequests(list);
    } catch (error) {
      console.error('Failed to load maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleActionClick = (req, targetStatus) => {
    setSelectedRequest(req);
    setActionStatus(targetStatus);
    setTechnicianName(req.technicianName || '');
    setResolutionNotes(req.resolutionNotes || '');
    setActionError('');
    setActionModal(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setActionError('');

    try {
      await apiCall(`/maintenance/${selectedRequest.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: actionStatus,
          technicianName: actionStatus === 'Technician Assigned' || actionStatus === 'In Progress' ? technicianName : undefined,
          resolutionNotes: actionStatus === 'Resolved' ? resolutionNotes : undefined
        })
      });
      setActionModal(false);
      setSelectedRequest(null);
      setTechnicianName('');
      setResolutionNotes('');
      await loadData();
    } catch (error) {
      setActionError(error.message || 'Workflow transition failed.');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to permanently clear all maintenance & repair ticket history? This cannot be undone.')) {
      return;
    }
    try {
      await apiCall('/maintenance/clear', { method: 'DELETE' });
      await loadData();
    } catch (error) {
      console.error('Failed to clear maintenance history:', error);
      alert(error.message || 'Failed to clear maintenance history.');
    }
  };

  const getPriorityBadge = (prio) => {
    const map = {
      'Low': 'bg-slate-800 text-slate-300 border-slate-700',
      'Medium': 'bg-warning/15 text-warning border-warning/30',
      'High': 'bg-danger/15 text-danger border-danger/30 animate-pulse font-bold',
    };
    return map[prio] || 'bg-slate-800 text-slate-300';
  };

  const getStatusBadge = (status) => {
    const map = {
      'Pending': 'bg-slate-800 text-slate-300 border-slate-700',
      'Approved': 'bg-primary-500/15 text-primary-400 border-primary-500/30',
      'Rejected': 'bg-danger/15 text-danger border-danger/30',
      'Technician Assigned': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      'In Progress': 'bg-warning/15 text-warning border-warning/30 animate-pulse',
      'Resolved': 'bg-success/15 text-success border-success/30',
    };
    return map[status] || 'bg-slate-800';
  };

  const isManager = user.role === 'Admin' || user.role === 'Asset Manager';
  const isAdmin = user.role === 'Admin';

  return (
    <div className="space-y-6 animate-fadeIn text-sm">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Maintenance & Repair Tickets</h2>
          <p className="text-slate-400 text-sm mt-1">Raise and approve repair orders. Asset lifecycles are toggled automatically upon approval/resolution.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 bg-red-600/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold border border-red-500/20 hover:border-red-500/50 transition-all uppercase tracking-wider"
          >
            Clear History
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-slate-500">
          No maintenance requests found.
        </div>
      ) : (
        <div className="glass rounded-xl p-6 border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase">
                  <th className="py-2.5">Asset Tag</th>
                  <th className="py-2.5">Asset Name</th>
                  <th className="py-2.5">Priority</th>
                  <th className="py-2.5">Raised By</th>
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5">Status</th>
                  {isManager && <th className="py-2.5 text-right">Workflow Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 font-mono font-bold text-primary-300">{req.Asset?.assetTag}</td>
                    <td className="py-4 font-medium text-slate-200">{req.Asset?.name}</td>
                    <td className="py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityBadge(req.priority)}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">{req.RaisedBy?.name}</td>
                    <td className="py-4 text-slate-400 max-w-xs truncate" title={req.description}>
                      {req.description}
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    {isManager && (
                      <td className="py-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          {req.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleActionClick(req, 'Rejected')}
                                className="px-2 py-1 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 text-[10px] font-bold rounded"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleActionClick(req, 'Approved')}
                                className="px-2 py-1 bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-bold rounded"
                              >
                                Approve
                              </button>
                            </>
                          )}
                          {req.status === 'Approved' && (
                            <button
                              onClick={() => handleActionClick(req, 'Technician Assigned')}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold rounded"
                            >
                              Assign Technician
                            </button>
                          )}
                          {req.status === 'Technician Assigned' && (
                            <button
                              onClick={() => handleActionClick(req, 'In Progress')}
                              className="px-2.5 py-1 bg-warning hover:bg-amber-600 text-slate-900 text-[10px] font-bold rounded"
                            >
                              Start Repair Work
                            </button>
                          )}
                          {req.status === 'In Progress' && (
                            <button
                              onClick={() => handleActionClick(req, 'Resolved')}
                              className="px-2.5 py-1 bg-success hover:bg-emerald-600 text-white text-[10px] font-bold rounded"
                            >
                              Resolve / Complete
                            </button>
                          )}
                          {req.status === 'Resolved' && (
                            <span className="text-xs text-success flex items-center gap-1 font-semibold justify-end">
                              <ShieldCheck className="w-4 h-4" /> Ready
                            </span>
                          )}
                          {req.status === 'Rejected' && (
                            <span className="text-xs text-slate-500 font-semibold justify-end">
                              Closed
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- WORKFLOW MODAL FOR TECHNICIANS & NOTES --- */}
      {actionModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setActionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              Close
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Process Maintenance Workflow</h3>
            <p className="text-xs text-slate-400 mb-4">
              Transition ticket for <strong>{selectedRequest.Asset?.name} ({selectedRequest.Asset?.assetTag})</strong> to status <strong className="text-primary-400">{actionStatus}</strong>.
            </p>

            {actionError && <p className="mb-4 text-xs text-danger bg-danger/10 border border-danger/20 rounded p-2">{actionError}</p>}

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {(actionStatus === 'Technician Assigned' || actionStatus === 'In Progress') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Technician Name *</label>
                  <input
                    type="text"
                    required
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g. John Mechanic"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                  />
                </div>
              )}

              {actionStatus === 'Resolved' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Resolution Notes *</label>
                  <textarea
                    rows="4"
                    required
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe what repair work was completed..."
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                  ></textarea>
                </div>
              )}

              {actionStatus === 'Rejected' && (
                <div className="text-xs text-slate-300 bg-danger/5 border border-danger/10 rounded-lg p-3">
                  Are you sure you want to reject this request? This will close the repair ticket.
                </div>
              )}

              {actionStatus === 'Approved' && (
                <div className="text-xs text-slate-300 bg-primary-500/5 border border-primary-500/10 rounded-lg p-3">
                  This will approve the ticket and automatically set the asset status to <strong>Under Maintenance</strong>.
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm"
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Maintenance;
