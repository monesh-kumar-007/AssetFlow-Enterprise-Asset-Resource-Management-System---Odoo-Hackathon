import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Plus, Eye, Edit, Calendar, MapPin, 
  Tag, Info, User, CheckCircle2, History, X 
} from 'lucide-react';

const AssetDirectory = ({ isRegisterModalOpen, setIsRegisterModalOpen }) => {
  const { apiCall, user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Asset Details state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetHistory, setAssetHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Registration Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [condition, setCondition] = useState('New');
  const [location, setLocation] = useState('');
  const [sharedBookable, setSharedBookable] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [registerError, setRegisterError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiCall(`/assets?search=${search}&status=${statusFilter}&categoryId=${categoryFilter}&departmentId=${departmentFilter}`);
      setAssets(data);

      const cats = await apiCall('/org/categories');
      setCategories(cats);

      const depts = await apiCall('/org/departments');
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load asset directory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, categoryFilter, departmentFilter]);

  // Read Category fields schema dynamically
  const selectedCategorySchema = categories.find(c => c.id === categoryId)?.customFields || [];

  const handleCustomFieldChange = (key, val) => {
    setCustomFieldValues({
      ...customFieldValues,
      [key]: val
    });
  };

  const handleRegisterAsset = async (e) => {
    e.preventDefault();
    setRegisterError('');

    if (!name || !categoryId || !serialNumber || !location) {
      setRegisterError('Please fill in all required fields.');
      return;
    }

    try {
      await apiCall('/assets', {
        method: 'POST',
        body: JSON.stringify({
          name,
          categoryId,
          serialNumber,
          acquisitionDate,
          acquisitionCost: parseFloat(acquisitionCost) || 0.00,
          condition,
          location,
          sharedBookable,
          departmentId: departmentId || null,
          customFieldValues
        })
      });

      // Clear Form
      setName('');
      setCategoryId('');
      setSerialNumber('');
      setAcquisitionCost('');
      setCondition('New');
      setLocation('');
      setSharedBookable(false);
      setDepartmentId('');
      setCustomFieldValues({});
      setIsRegisterModalOpen(false);
      
      // Reload lists
      await loadData();
    } catch (error) {
      setRegisterError(error.message || 'Asset registration failed.');
    }
  };

  const handleViewAssetDetails = async (asset) => {
    setSelectedAsset(asset);
    setHistoryLoading(true);
    try {
      const data = await apiCall(`/assets/${asset.id}/history`);
      setAssetHistory(data);
    } catch (error) {
      console.error('Failed to load asset history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const maps = {
      'Available': 'bg-success/15 text-success border-success/30',
      'Allocated': 'bg-primary-500/15 text-primary-400 border-primary-500/30',
      'Reserved': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      'Under Maintenance': 'bg-warning/15 text-warning border-warning/30',
      'Lost': 'bg-danger/15 text-danger border-danger/30 animate-pulse',
      'Retired': 'bg-slate-700/30 text-slate-400 border-slate-700/50',
      'Disposed': 'bg-red-950/20 text-red-500 border-red-950/40',
    };
    return maps[status] || 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Asset Registry</h2>
          <p className="text-slate-400 text-sm mt-1">Search, track, and manage physical assets and bookable resources.</p>
        </div>
        {(user.role === 'Admin' || user.role === 'Asset Manager') && (
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-primary-600/15"
          >
            <Plus className="w-4 h-4" />
            Register Asset
          </button>
        )}
      </div>

      {/* Search and Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-800 rounded-xl p-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tag, serial, name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Allocated">Allocated</option>
          <option value="Reserved">Reserved</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Lost">Lost</option>
          <option value="Retired">Retired</option>
          <option value="Disposed">Disposed</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Assets Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-slate-500 text-sm">
          No registered assets found matching filters.
        </div>
      ) : (
        <div className="glass rounded-xl p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase">
                  <th className="py-3">Asset Tag</th>
                  <th className="py-3">Name</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Condition</th>
                  <th className="py-3">Location</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">View Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-primary-300">{asset.assetTag}</td>
                    <td className="py-3.5 font-medium text-slate-200">
                      {asset.name}
                      {asset.sharedBookable && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded font-semibold">
                          Bookable
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-400">{asset.AssetCategory ? asset.AssetCategory.name : '—'}</td>
                    <td className="py-3.5 text-slate-300">{asset.condition}</td>
                    <td className="py-3.5 text-slate-400">{asset.location}</td>
                    <td className="py-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleViewAssetDetails(asset)}
                        className="p-1.5 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg transition-all inline-flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL: Register Asset --- */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-4">Register New Physical Asset</h3>
            
            {registerError && <p className="mb-4 text-xs text-danger bg-danger/10 border border-danger/20 rounded p-2">{registerError}</p>}

            <form onSubmit={handleRegisterAsset} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dell UltraSharp 27"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Serial Number *</label>
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-994827-X"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Asset Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setCustomFieldValues({}); // Reset fields when category changes
                    }}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-300"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Acquisition Date *</label>
                  <input
                    type="date"
                    required
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Acquisition Cost (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    placeholder="e.g. 299.99"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Asset Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-300"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Current Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Floor 2 Office Cabin 4"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Assign to Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-300"
                  >
                    <option value="">None (Generic Pool)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="sharedCheckbox"
                  checked={sharedBookable}
                  onChange={(e) => setSharedBookable(e.target.checked)}
                  className="rounded accent-primary-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="sharedCheckbox" className="text-slate-300 cursor-pointer font-medium select-none">
                  Mark as Shared Bookable Resource (e.g. projector, meeting room, car)
                </label>
              </div>

              {/* RENDER DYNAMIC FIELDS BASED ON SELECTED CATEGORY */}
              {selectedCategorySchema.length > 0 && (
                <div className="border border-slate-800 rounded-xl p-4 space-y-3.5 bg-slate-950/20">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Category Specific Fields ({categories.find(c => c.id === categoryId)?.name})</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedCategorySchema.map((field) => (
                      <div key={field.name}>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {field.label} {field.required && <strong className="text-danger">*</strong>}
                        </label>
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          required={field.required}
                          value={customFieldValues[field.name] || ''}
                          onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 focus:outline-none focus:border-primary-500 text-xs text-slate-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAILS MODAL WITH HISTORY TIMELINE --- */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => {
                setSelectedAsset(null);
                setAssetHistory(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <span className={`text-xs px-2.5 py-0.5 rounded border ${getStatusBadge(selectedAsset.status)}`}>
                {selectedAsset.status}
              </span>
              <h3 className="text-lg font-bold text-white">{selectedAsset.name}</h3>
              <span className="font-mono text-sm text-slate-400">({selectedAsset.assetTag})</span>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : assetHistory ? (
              <div className="space-y-6 text-sm">
                
                {/* Master Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/30 border border-slate-800/80 rounded-xl p-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Serial Number</span>
                    <span className="text-slate-200 font-mono text-xs">{selectedAsset.serialNumber}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Location</span>
                    <span className="text-slate-200 text-xs">{selectedAsset.location}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Condition</span>
                    <span className="text-slate-200 text-xs">{selectedAsset.condition}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Acquisition Cost</span>
                    <span className="text-slate-200 text-xs">${selectedAsset.acquisitionCost}</span>
                  </div>
                </div>

                {/* Render category fields */}
                {Object.keys(selectedAsset.customFieldValues || {}).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Metadata Parameters</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {Object.keys(selectedAsset.customFieldValues).map(key => (
                        <div key={key} className="bg-slate-900/20 border border-slate-800 rounded px-2.5 py-1.5">
                          <span className="block text-[10px] text-slate-400 uppercase font-medium">{key.replace('_', ' ')}</span>
                          <span className="text-slate-200 font-semibold text-xs">{selectedAsset.customFieldValues[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History Timeline tabs */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                    <History className="w-4 h-4 text-primary-400" />
                    Asset Allocation & Lifecycle Trail
                  </div>

                  <div className="space-y-3.5 relative pl-4 border-l border-slate-800 ml-2">
                    {/* Log registered action first */}
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-success border-2 border-slate-950"></div>
                      <div className="text-xs text-slate-400">Registered: {selectedAsset.acquisitionDate}</div>
                      <div className="font-semibold text-slate-200 text-xs">Asset set as Available</div>
                    </div>

                    {/* Loop Allocations */}
                    {assetHistory.allocations.map((alloc) => (
                      <div key={alloc.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-slate-950"></div>
                        <div className="text-xs text-slate-400">Allocation: {alloc.allocationDate} {alloc.expectedReturnDate && `(Expected Return: ${alloc.expectedReturnDate})`}</div>
                        <div className="font-semibold text-slate-200 text-xs">
                          Checked out to {alloc.Employee ? `Employee: ${alloc.Employee.name}` : `Department: ${alloc.Department?.name}`} by {alloc.AllocatedBy?.name}
                        </div>
                        {alloc.status !== 'Active' ? (
                          <div className="text-xs text-slate-400 mt-1 pl-2 border-l border-slate-800">
                            Check-in return: {alloc.actualReturnDate} {alloc.returnNotes && `— Notes: "${alloc.returnNotes}"`} ({alloc.status})
                          </div>
                        ) : (
                          <span className="text-[10px] inline-block mt-1 font-bold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20">
                            Currently Held
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Loop Maintenance requests */}
                    {assetHistory.maintenance.map((req) => (
                      <div key={req.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-warning border-2 border-slate-950"></div>
                        <div className="text-xs text-slate-400">Repair Ticket: {new Date(req.createdAt).toLocaleDateString()}</div>
                        <div className="font-semibold text-slate-200 text-xs">
                          Maintenance Status: <span className="text-warning">{req.status}</span> (Priority: {req.priority})
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">"{req.description}"</div>
                        {req.technicianName && (
                          <div className="text-xs text-slate-400 pl-2 border-l border-slate-800 mt-1">
                            Technician: {req.technicianName} {req.resolutionNotes && `| Resolution Notes: "${req.resolutionNotes}"`}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loop Audits */}
                    {assetHistory.audits.map((aud) => (
                      <div key={aud.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-slate-950"></div>
                        <div className="text-xs text-slate-400">Audit Check-in: {new Date(aud.auditedAt).toLocaleDateString()}</div>
                        <div className="font-semibold text-slate-200 text-xs">
                          Verified as <span className={aud.verifiedStatus === 'Verified' ? 'text-success' : 'text-danger'}>{aud.verifiedStatus}</span> during {aud.AuditCycle?.name}
                        </div>
                        {aud.notes && <div className="text-xs text-slate-400 font-normal mt-0.5 italic">"{aud.notes}"</div>}
                        <div className="text-[10px] text-slate-500">Auditor: {aud.Auditor?.name}</div>
                      </div>
                    ))}

                  </div>
                </div>

              </div>
            ) : (
              <p className="text-slate-400 text-center py-6 text-sm">Failed to retrieve lifecycle details.</p>
            )}

            <div className="flex justify-end mt-6 text-sm">
              <button
                type="button"
                onClick={() => {
                  setSelectedAsset(null);
                  setAssetHistory(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssetDirectory;
