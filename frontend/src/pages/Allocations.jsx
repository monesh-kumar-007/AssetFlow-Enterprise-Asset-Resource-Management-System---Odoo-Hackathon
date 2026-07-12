import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeftRight, CheckSquare, Plus, AlertTriangle, 
  RotateCcw, Send, FileText, Check, X, ShieldAlert 
} from 'lucide-react';

const Allocations = () => {
  const { apiCall, user } = useAuth();
  const [activeAllocations, setActiveAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Allocation Form State
  const [allocateModal, setAllocateModal] = useState(false);
  const [searchTag, setSearchTag] = useState('');
  const [allocEmployeeId, setAllocEmployeeId] = useState('');
  const [allocDeptId, setAllocDeptId] = useState('');
  const [allocExpectedReturn, setAllocExpectedReturn] = useState('');
  const [allocError, setAllocError] = useState('');
  const [allocConflict, setAllocConflict] = useState(null); // Tracks double allocation conflict details

  // Return Form State
  const [returnModal, setReturnModal] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnNotes, setReturnNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch active allocations (all active allocations)
      const assets = await apiCall('/assets');
      const active = [];
      
      // For each asset, if status is Allocated, fetch its details. Or we can query active allocations in list
      // To simplify, let's query all assets and filter for 'Allocated' or list via dashboard lists.
      // Wait, we can fetch active allocations if we query /assets?status=Allocated.
      // Let's filter allocated assets.
      const allocatedAssets = assets.filter(a => a.status === 'Allocated');
      
      // Load their active allocation details
      const detailedAllocations = [];
      for (const asset of allocatedAssets) {
        const history = await apiCall(`/assets/${asset.id}/history`);
        const activeItem = history.allocations?.find(a => a.status === 'Active');
        if (activeItem) {
          detailedAllocations.push({
            ...activeItem,
            Asset: asset
          });
        }
      }
      setActiveAllocations(detailedAllocations);

      // Load transfer requests
      const transferList = await apiCall('/allocations/transfers');
      setTransfers(transferList);

      const emps = await apiCall('/org/employees');
      setEmployees(emps);

      const depts = await apiCall('/org/departments');
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    setAllocError('');
    setAllocConflict(null);

    if (!searchTag) {
      setAllocError('Please enter an Asset Tag.');
      return;
    }

    if (!allocEmployeeId && !allocDeptId) {
      setAllocError('Please assign to either an employee or a department.');
      return;
    }

    // Find asset ID by tag
    try {
      const assets = await apiCall('/assets');
      const asset = assets.find(a => a.assetTag.toUpperCase() === searchTag.trim().toUpperCase());
      
      if (!asset) {
        setAllocError(`Asset with tag ${searchTag} not found in database.`);
        return;
      }

      // Try allocating
      await apiCall('/allocations/allocate', {
        method: 'POST',
        body: JSON.stringify({
          assetId: asset.id,
          employeeId: allocEmployeeId || null,
          departmentId: allocDeptId || null,
          expectedReturnDate: allocExpectedReturn || null
        })
      });

      // Reset & Reload
      setSearchTag('');
      setAllocEmployeeId('');
      setAllocDeptId('');
      setAllocExpectedReturn('');
      setAllocateModal(false);
      await loadData();

    } catch (error) {
      // Check if it's a double-allocation conflict
      if (error.message.includes('taken') || error.message.includes('allocated')) {
        // Find asset to get its ID for transfer option
        const assets = await apiCall('/assets');
        const asset = assets.find(a => a.assetTag.toUpperCase() === searchTag.trim().toUpperCase());
        
        setAllocConflict({
          assetId: asset.id,
          assetTag: asset.assetTag,
          assetName: asset.name,
          holderName: error.message.split('held by ')[1] || 'another employee',
        });
      } else {
        setAllocError(error.message || 'Allocation failed.');
      }
    }
  };

  const handleInitiateTransfer = async () => {
    if (!allocConflict) return;
    try {
      await apiCall('/allocations/transfer-request', {
        method: 'POST',
        body: JSON.stringify({
          assetId: allocConflict.assetId,
          targetHolderId: allocEmployeeId // Transfer to the selected employee in the form
        })
      });
      alert(`Transfer request raised! Current holder has been notified.`);
      setAllocateModal(false);
      setAllocConflict(null);
      setSearchTag('');
      setAllocEmployeeId('');
      setAllocDeptId('');
      await loadData();
    } catch (error) {
      alert(error.message || 'Failed to request transfer.');
    }
  };

  // Return Check-in actions
  const handleReturnClick = (alloc) => {
    setSelectedAlloc(alloc);
    setReturnCondition(alloc.Asset.condition);
    setReturnNotes('');
    setReturnModal(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlloc) return;

    try {
      await apiCall('/allocations/return', {
        method: 'POST',
        body: JSON.stringify({
          assetId: selectedAlloc.Asset.id,
          condition: returnCondition,
          returnNotes
        })
      });
      setReturnModal(false);
      setSelectedAlloc(null);
      await loadData();
    } catch (error) {
      alert(error.message || 'Return check-in failed.');
    }
  };

  const handleClearTransferHistory = async () => {
    if (!window.confirm('Are you sure you want to permanently clear all transfer requests from history?')) {
      return;
    }
    try {
      await apiCall('/allocations/transfers/clear', { method: 'DELETE' });
      await loadData();
    } catch (error) {
      console.error('Failed to clear transfer history:', error);
      alert(error.message || 'Failed to clear transfer history.');
    }
  };

  // Transfer Approvals
  const handleActionTransfer = async (transferId, action) => {
    try {
      await apiCall(`/allocations/transfers/${transferId}/action`, {
        method: 'PUT',
        body: JSON.stringify({ action })
      });
      await loadData();
    } catch (error) {
      alert(error.message || 'Failed to action transfer request.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Permissions guards
  const isManager = user.role === 'Admin' || user.role === 'Asset Manager';
  const isDeptHead = user.role === 'Department Head';

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Asset Allocation & Transfers</h2>
          <p className="text-slate-400 text-sm mt-1">Manage check-out controls, check-in returns, and employee-to-employee transfer workflows.</p>
        </div>
        {isManager && (
          <button
            onClick={() => {
              setAllocConflict(null);
              setAllocError('');
              setAllocateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-primary-600/15"
          >
            <Plus className="w-4 h-4" />
            Check-out Asset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Active Allocations Column */}
        <div className="glass rounded-xl p-6 xl:col-span-2 border border-slate-800">
          <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-success" />
            Active Handouts / Holdings
          </h3>
          
          {activeAllocations.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No assets are currently checked out.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5">Asset Tag</th>
                    <th className="py-2.5">Asset Name</th>
                    <th className="py-2.5">Current Holder</th>
                    <th className="py-2.5">Checkout Date</th>
                    <th className="py-2.5">Expected Return</th>
                    {isManager && <th className="py-2.5 text-right">Check-in</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {activeAllocations.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-primary-300">{alloc.Asset?.assetTag}</td>
                      <td className="py-3.5 text-slate-200">{alloc.Asset?.name}</td>
                      <td className="py-3.5 text-slate-300">
                        {alloc.Employee ? alloc.Employee.name : alloc.Department?.name}
                      </td>
                      <td className="py-3.5 text-slate-400">{alloc.allocationDate}</td>
                      <td className="py-3.5 text-slate-400">{alloc.expectedReturnDate || 'N/A'}</td>
                      {isManager && (
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleReturnClick(alloc)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
                          >
                            Return
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transfers Approval Queue Column */}
        <div className="glass rounded-xl p-6 border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
              Transfers Request Queue
            </h3>
            {user?.role === 'Admin' && (
              <button
                onClick={handleClearTransferHistory}
                className="px-2 py-1 bg-red-600/10 hover:bg-red-500 text-red-500 hover:text-white rounded text-[10px] font-bold border border-red-500/20 hover:border-red-500/50 transition-colors uppercase tracking-wider"
              >
                Clear History
              </button>
            )}
          </div>

          {transfers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No pending transfer requests.
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((t) => (
                <div key={t.id} className="border border-slate-850 rounded-xl p-4 bg-slate-900/30 text-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-primary-300">{t.Asset?.assetTag}</span>
                    <span className={`px-2 py-0.5 rounded font-semibold border ${
                      t.status === 'Pending' ? 'bg-warning/15 text-warning border-warning/30 animate-pulse' :
                      t.status === 'Approved' ? 'bg-success/15 text-success border-success/30' :
                      'bg-danger/15 text-danger border-danger/30'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  
                  <div className="text-slate-300">
                    <strong>Asset:</strong> {t.Asset?.name}
                  </div>
                  <div className="space-y-1 text-slate-400">
                    <div><strong>From Holder:</strong> {t.CurrentHolder?.name}</div>
                    <div><strong>To Target Holder:</strong> {t.TargetHolder?.name}</div>
                    <div><strong>Requested By:</strong> {t.RequestedBy?.name}</div>
                  </div>

                  {t.status === 'Pending' && (isManager || isDeptHead) && (
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => handleActionTransfer(t.id, 'Rejected')}
                        className="px-2.5 py-1 bg-slate-850 hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-slate-400 border border-slate-800 rounded font-bold transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleActionTransfer(t.id, 'Approved')}
                        className="px-3 py-1 bg-success hover:bg-emerald-600 text-white rounded font-bold transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* --- MODAL: Check-out Allocation --- */}
      {allocateModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setAllocateModal(false);
                setAllocConflict(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Check-out / Allocate Asset</h3>

            {allocError && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{allocError}</span>
              </div>
            )}

            {allocConflict ? (
              <div className="mb-5 p-4 border border-danger/30 bg-danger/5 rounded-xl space-y-4 text-sm">
                <div className="flex gap-2 text-danger">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Double-Allocation Blocked</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Asset <strong>{allocConflict.assetName} ({allocConflict.assetTag})</strong> is already taken. Currently held by <strong>{allocConflict.holderName}</strong>.
                    </p>
                  </div>
                </div>
                {allocEmployeeId && (
                  <div className="pt-2 border-t border-slate-800 flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAllocConflict(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition-colors"
                    >
                      Search Another
                    </button>
                    <button
                      type="button"
                      onClick={handleInitiateTransfer}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Request Transfer
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAllocateSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Asset Tag *</label>
                  <input
                    type="text"
                    required
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                    placeholder="e.g. AF-0001"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100 uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assign to Employee</label>
                    <select
                      value={allocEmployeeId}
                      disabled={!!allocDeptId}
                      onChange={(e) => setAllocEmployeeId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-300 text-xs"
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Or Assign to Department</label>
                    <select
                      value={allocDeptId}
                      disabled={!!allocEmployeeId}
                      onChange={(e) => setAllocDeptId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-300 text-xs"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Expected Return Date</label>
                  <input
                    type="date"
                    value={allocExpectedReturn}
                    onChange={(e) => setAllocExpectedReturn(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setAllocateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold"
                  >
                    Check Out
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* --- MODAL: Check-in Return --- */}
      {returnModal && selectedAlloc && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setReturnModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Check-in Asset Return</h3>
            <p className="text-xs text-slate-400 mb-4">
              Return processing for <strong>{selectedAlloc.Asset.name} ({selectedAlloc.Asset.assetTag})</strong>.
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Asset Condition on Return</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-300"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor (Flags Repair required)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Condition / Check-in Notes</label>
                <textarea
                  rows="4"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Record any wear and tear or notes here..."
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-success hover:bg-emerald-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Process Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Allocations;
