import React, { useState, useEffect } from 'react';

export default function AuditWorkspace() {
  const [auditCycle, setAuditCycle] = useState(null);
  const [assetsToVerify, setAssetsToVerify] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Prototyping an active scoped audit cycle pipeline data map
    const fetchActiveAudit = async () => {
      setAuditCycle({
        id: 'AUD-2026-Q3',
        scope: 'Electronics - Chennai HQ Office Layout',
        status: 'Open',
        assignedAuditor: 'Monesh'
      });

      setAssetsToVerify([
        { id: 'AF-0001', name: 'MacBook Pro 16"', serial: 'C02FX555Q05D', status: 'Pending' },
        { id: 'AF-0002', name: 'Logitech MX Master 3S', serial: 'LZ234199X', status: 'Pending' },
        { id: 'AF-0003', name: 'Dell UltraSharp 27"', serial: 'CN088231M', status: 'Pending' },
      ]);
    };
    fetchActiveAudit();
  }, []);

  const handleVerifyAsset = (assetId, verificationState) => {
    setAssetsToVerify(prev =>
      prev.map(asset =>
        asset.id === assetId ? { ...asset, status: verificationState } : asset
      )
    );
  };

  const handleCloseCycle = async () => {
    setIsSubmitting(true);
    // Mimic API post execution delay for report auto-generation
    setTimeout(() => {
      setAuditCycle(prev => ({ ...prev, status: 'Closed' }));
      setIsSubmitting(false);
      alert('Audit Cycle Closed Successfully! Discrepancy report auto-generated.');
    }, 1000);
  };

  if (!auditCycle) return <div className="p-6 text-center text-slate-500">Loading pipeline workspace...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-4xl mx-auto mt-6 space-y-6">
      {/* Scope Block Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {auditCycle.id}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${auditCycle.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
              Cycle {auditCycle.status}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">{auditCycle.scope}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Assigned Auditor: <span className="font-medium text-slate-700">{auditCycle.assignedAuditor}</span></p>
        </div>

        {auditCycle.status === 'Open' && (
          <button
            onClick={handleCloseCycle}
            disabled={isSubmitting || assetsToVerify.some(a => a.status === 'Pending')}
            className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm"
          >
            {isSubmitting ? 'Processing...' : 'Lock & Close Audit Cycle'}
          </button>
        )}
      </div>

      {/* Verification Matrix Pipeline */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-2">Asset Details</th>
              <th className="py-3 px-2">Serial Number</th>
              <th className="py-3 px-2 text-right">Verification Action States</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {assetsToVerify.map((asset) => (
              <tr key={asset.id} className="group hover:bg-slate-50/50 transition">
                <td className="py-4 px-2">
                  <div className="font-semibold text-slate-800">{asset.name}</div>
                  <div className="text-xs font-mono text-slate-400">{asset.id}</div>
                </td>
                <td className="py-4 px-2 font-mono text-slate-600 text-xs">{asset.serial}</td>
                <td className="py-4 px-2 text-right">
                  {auditCycle.status === 'Closed' ? (
                    <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md ${asset.status === 'Verified' ? 'bg-green-50 text-green-700 border border-green-100' : asset.status === 'Missing' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                      {asset.status}
                    </span>
                  ) : (
                    <div className="inline-flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                      {[
                        { label: 'Verified', color: 'bg-green-600 text-white shadow-sm' },
                        { label: 'Missing', color: 'bg-red-600 text-white shadow-sm' },
                        { label: 'Damaged', color: 'bg-amber-600 text-white shadow-sm' }
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          onClick={() => handleVerifyAsset(asset.id, btn.label)}
                          className={`px-2.5 py-1 rounded-md transition-all duration-150 ${asset.status === btn.label ? btn.color : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}   