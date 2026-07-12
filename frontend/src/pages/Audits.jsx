import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, AlertTriangle, Play, CheckCircle2, 
  User, Calendar, MapPin, ClipboardList, Info, Lock 
} from 'lucide-react';

const Audits = () => {
  const { apiCall, user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active workspace cycle state
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [cycleDetails, setCycleDetails] = useState(null);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Create Cycle Form state
  const [createModal, setCreateModal] = useState(false);
  const [cycleName, setCycleName] = useState('');
  const [scopeType, setScopeType] = useState('All');
  const [scopeValue, setScopeValue] = useState('');
  const [assignedAuditorIds, setAssignedAuditorIds] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [createError, setCreateError] = useState('');

  // Audit Checklist verification state
  const [verifyAssetId, setVerifyAssetId] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('Verified');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyModal, setVerifyModal] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await apiCall('/audits/cycles');
      setCycles(list);

      const emps = await apiCall('/org/employees');
      setEmployees(emps);

      const depts = await apiCall('/org/departments');
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load audits data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadWorkspace = async (cycleId) => {
    setSelectedCycleId(cycleId);
    setWorkspaceLoading(true);
    try {
      const data = await apiCall(`/audits/cycles/${cycleId}`);
      setCycleDetails(data);

      const discrepancyReport = await apiCall(`/audits/cycles/${cycleId}/discrepancies`);
      setDiscrepancies(discrepancyReport.discrepancies || []);
    } catch (error) {
      console.error('Failed to load audit workspace:', error);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCycleId) {
      loadWorkspace(selectedCycleId);
    } else {
      setCycleDetails(null);
      setDiscrepancies([]);
    }
  }, [selectedCycleId]); // Runs when selectedCycleId changes

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!cycleName || !startDate || !endDate) {
      setCreateError('Please fill in all required fields.');
      return;
    }

    try {
      await apiCall('/audits/cycles', {
        method: 'POST',
        body: JSON.stringify({
          name: cycleName,
          scopeType,
          scopeValue: scopeType !== 'All' ? scopeValue : null,
          auditorIds: assignedAuditorIds,
          startDate,
          endDate
        })
      });
      // Clear Form & Close
      setCycleName('');
      setScopeType('All');
      setScopeValue('');
      setAssignedAuditorIds([]);
      setCreateModal(false);
      await loadData();
    } catch (error) {
      setCreateError(error.message || 'Failed to create audit cycle.');
    }
  };

  const handleAuditorChange = (empId, checked) => {
    if (checked) {
      setAssignedAuditorIds([...assignedAuditorIds, empId]);
    } else {
      setAssignedAuditorIds(assignedAuditorIds.filter(id => id !== empId));
    }
  };

  // Submit Auditor marking check
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerifyError('');

    try {
      await apiCall('/audits/verify', {
        method: 'POST',
        body: JSON.stringify({
          auditCycleId: selectedCycleId,
          assetId: verifyAssetId,
          verifiedStatus: verifyStatus,
          notes: verifyNotes
        })
      });
      setVerifyModal(false);
      setVerifyAssetId('');
      setVerifyNotes('');
      await loadWorkspace(selectedCycleId);
    } catch (error) {
      setVerifyError(error.message || 'Failed to submit status check.');
    }
  };

  // Close audit cycle (Admin only)
  const handleCloseCycle = async () => {
    if (!window.confirm('Are you sure you want to close and lock this audit cycle? This will lock reports and automatically update confirmed-missing assets to Lost.')) return;
    try {
      await apiCall(`/audits/cycles/${selectedCycleId}/close`, { method: 'POST' });
      await loadWorkspace(selectedCycleId);
      // Refresh list
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const getVerifiedRecord = (assetId) => {
    return cycleDetails?.verifiedAssets?.find(rec => rec.assetId === assetId);
  };

  const getStatusBadge = (status) => {
    return status === 'Closed' 
      ? 'bg-slate-800 text-slate-400 border-slate-700/60' 
      : 'bg-success/10 text-success border-success/20 animate-pulse';
  };

  const isAssignedAuditor = cycleDetails?.cycle?.auditorIds?.includes(user.id);
  const isAdmin = user.role === 'Admin';
  const canAudit = (isAssignedAuditor || isAdmin) && cycleDetails?.cycle?.status === 'Active';

  return (
    <div className="space-y-6 animate-fadeIn text-sm">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Asset Audit Verification</h2>
          <p className="text-slate-400 text-sm mt-1">Schedule and run stock audit counts. Discrepancy registers auto-refresh in real time.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-primary-600/15"
          >
            <Play className="w-4 h-4" />
            Initialize Audit Cycle
          </button>
        )}
      </div>

      {/* Select Cycle Grid or Active workspace */}
      {selectedCycleId ? (
        // --- ACTIVE WORKSPACE VIEW ---
        <div className="space-y-6">
          <button
            onClick={() => setSelectedCycleId('')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 font-semibold"
          >
            ← Back to Cycle List
          </button>

          {workspaceLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : cycleDetails ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Asset checklist column */}
              <div className="glass rounded-xl p-6 xl:col-span-2 space-y-4 border border-slate-800">
                <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                  <div>
                    <h3 className="text-md font-bold text-white flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary-400" />
                      Checklist: Assets In-Scope ({cycleDetails.assets?.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Scope: {cycleDetails.cycle.scopeType} {cycleDetails.cycle.scopeValue && `(${cycleDetails.cycle.scopeValue})`}
                    </p>
                  </div>

                  {isAdmin && cycleDetails.cycle.status === 'Active' && (
                    <button
                      onClick={handleCloseCycle}
                      className="px-3 py-1 bg-danger hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" />
                      Close & Lock Cycle
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase">
                        <th className="py-2.5">Tag</th>
                        <th className="py-2.5">Name</th>
                        <th className="py-2.5">Location</th>
                        <th className="py-2.5">Verification Status</th>
                        {canAudit && <th className="py-2.5 text-right font-bold">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {cycleDetails.assets?.map(asset => {
                        const rec = getVerifiedRecord(asset.id);
                        return (
                          <tr key={asset.id} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-3 font-mono font-bold text-primary-300">{asset.assetTag}</td>
                            <td className="py-3 text-slate-200">{asset.name}</td>
                            <td className="py-3 text-slate-400">{asset.location}</td>
                            <td className="py-3">
                              {rec ? (
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                                  rec.verifiedStatus === 'Verified' ? 'bg-success/15 text-success border-success/30' :
                                  rec.verifiedStatus === 'Missing' ? 'bg-danger/15 text-danger border-danger/30' :
                                  'bg-warning/15 text-warning border-warning/30'
                                }`}>
                                  {rec.verifiedStatus}
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold border border-slate-700 bg-slate-850 text-slate-400">
                                  Unchecked
                                </span>
                              )}
                            </td>
                            {canAudit && (
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    setVerifyAssetId(asset.id);
                                    setVerifyStatus(rec ? rec.verifiedStatus : 'Verified');
                                    setVerifyNotes(rec ? rec.notes : '');
                                    setVerifyModal(true);
                                  }}
                                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 rounded border border-slate-750"
                                >
                                  Mark
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auto-generated discrepancy list column */}
              <div className="glass rounded-xl p-6 border border-slate-800">
                <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2 border-b border-slate-850 pb-3">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  Auto-Discrepancies ({discrepancies.length})
                </h3>

                {discrepancies.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
                    <ShieldCheck className="w-10 h-10 text-success mb-2 opacity-65" />
                    No audit discrepancies flagged. All counted stock matches!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {discrepancies.map(d => (
                      <div key={d.id} className="border border-danger/20 rounded-xl p-4 bg-danger/5 text-xs space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-danger">{d.Asset?.assetTag}</span>
                          <span className="px-2 py-0.5 bg-danger/10 text-danger border border-danger/20 rounded font-bold uppercase text-[9px]">
                            {d.verifiedStatus}
                          </span>
                        </div>
                        <div className="text-slate-200">
                          <strong>Asset:</strong> {d.Asset?.name} ({d.Asset?.location})
                        </div>
                        {d.notes && <div className="text-slate-400 italic">"Notes: {d.notes}"</div>}
                        <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-800">
                          Audited: {new Date(d.auditedAt).toLocaleString()} by {d.Auditor?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </div>
      ) : (
        // --- CYCLE SELECTION DASHBOARD ---
        <div className="glass rounded-xl p-6 border border-slate-800">
          <h3 className="text-md font-bold text-white mb-4">Audit Schedules</h3>
          
          {cycles.length === 0 ? (
            <p className="text-slate-500 py-12 text-center">No scheduled audit cycles. Initialize one using the button above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cycles.map(c => (
                <div key={c.id} className="border border-slate-850 rounded-xl p-5 bg-slate-900/30 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Scope: {c.scopeType}</span>
                    </div>

                    <h4 className="font-bold text-slate-200 text-md">{c.name}</h4>
                    
                    <div className="space-y-1 text-slate-400 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Timeline: {c.startDate} to {c.endDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>Auditors: {c.auditorIds?.length || 0} assigned</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => loadWorkspace(c.id)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-xs border border-slate-750 transition-colors"
                  >
                    Open Audit Workspace
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: Create Audit Cycle --- */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              Close
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Initialize Audit Cycle</h3>

            {createError && <p className="mb-4 text-xs text-danger bg-danger/10 border border-danger/20 rounded p-2">{createError}</p>}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cycle Name *</label>
                <input
                  type="text"
                  required
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  placeholder="e.g. Q3 IT Hardware Audit"
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Scope Type *</label>
                  <select
                    value={scopeType}
                    onChange={(e) => {
                      setScopeType(e.target.value);
                      setScopeValue('');
                    }}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none text-slate-350"
                  >
                    <option value="All">All Assets</option>
                    <option value="Department">By Department</option>
                    <option value="Location">By Location</option>
                  </select>
                </div>

                {scopeType !== 'All' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Scope Value *</label>
                    {scopeType === 'Department' ? (
                      <select
                        required
                        value={scopeValue}
                        onChange={(e) => setScopeValue(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none text-slate-300"
                      >
                        <option value="">-- Select Dept --</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={scopeValue}
                        onChange={(e) => setScopeValue(e.target.value)}
                        placeholder="e.g. IT Storage Rm 4"
                        className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none text-slate-100"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none text-slate-100"
                  />
                </div>
              </div>

              {/* Select multiple auditors */}
              <div className="border border-slate-800 rounded-lg p-3 space-y-2 bg-slate-950/20">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Auditors *</span>
                
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignedAuditorIds.includes(emp.id)}
                        onChange={(e) => handleAuditorChange(emp.id, e.target.checked)}
                        className="rounded accent-primary-600 bg-slate-900 border-slate-800"
                      />
                      <span>{emp.name} ({emp.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-xs"
                >
                  Start Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Mark/Verify Asset status --- */}
      {verifyModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => {
                setVerifyModal(false);
                setVerifyAssetId('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              Close
            </button>

            <h3 className="text-lg font-bold text-white mb-4 font-bold">Record Audit Inspection</h3>
            
            {verifyError && <p className="mb-4 text-xs text-danger bg-danger/10 border border-danger/20 rounded p-2">{verifyError}</p>}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Verification Status</label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-350 focus:outline-none focus:border-primary-500 text-xs"
                >
                  <option value="Verified">Verified (Present & Intact)</option>
                  <option value="Missing">Missing (Discrepancy)</option>
                  <option value="Damaged">Damaged (Requires repair)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Auditor Notes</label>
                <textarea
                  rows="3"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Record findings or remarks..."
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-xs"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyModal(false);
                    setVerifyAssetId('');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-750 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded font-bold transition-colors"
                >
                  Submit Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Audits;
