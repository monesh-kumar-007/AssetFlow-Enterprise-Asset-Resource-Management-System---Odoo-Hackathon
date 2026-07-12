import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Tags, Users, Plus, ShieldCheck, 
  Trash2, ToggleLeft, ToggleRight, Edit3, Save 
} from 'lucide-react';

const OrgSetup = () => {
  const { apiCall, user: currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('departments');
  const [loading, setLoading] = useState(true);

  // Departments State
  const [departments, setDepartments] = useState([]);
  const [deptName, setDeptName] = useState('');
  const [deptParentId, setDeptParentId] = useState('');
  const [deptHeadId, setDeptHeadId] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [catName, setCatName] = useState('');
  const [catFields, setCatFields] = useState([]); // Array of { name, type, label, required }
  const [editingCatId, setEditingCatId] = useState(null);
  
  // Custom Field Form state
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);

  // Employee State
  const [employees, setEmployees] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const depts = await apiCall('/org/departments');
      setDepartments(depts);

      const cats = await apiCall('/org/categories');
      setCategories(cats);

      const emps = await apiCall('/org/employees');
      setEmployees(emps);
    } catch (error) {
      console.error('Error loading setup data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Department Actions ---
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!deptName) return;

    try {
      if (editingDeptId) {
        await apiCall(`/org/departments/${editingDeptId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: deptName,
            parentDepartmentId: deptParentId || null,
            departmentHeadId: deptHeadId || null
          })
        });
      } else {
        await apiCall('/org/departments', {
          method: 'POST',
          body: JSON.stringify({
            name: deptName,
            parentDepartmentId: deptParentId || null,
            departmentHeadId: deptHeadId || null
          })
        });
      }
      setDeptName('');
      setDeptParentId('');
      setDeptHeadId('');
      setEditingDeptId(null);
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditDept = (dept) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptParentId(dept.parentDepartmentId || '');
    setDeptHeadId(dept.departmentHeadId || '');
  };

  const toggleDeptStatus = async (dept) => {
    const nextStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await apiCall(`/org/departments/${dept.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  // --- Category Actions ---
  const addCustomField = () => {
    if (!fieldName || !fieldLabel) return;
    setCatFields([...catFields, { 
      name: fieldName.toLowerCase().replace(/\s+/g, '_'), 
      type: fieldType, 
      label: fieldLabel, 
      required: fieldRequired 
    }]);
    setFieldName('');
    setFieldLabel('');
    setFieldRequired(false);
  };

  const removeCustomField = (index) => {
    setCatFields(catFields.filter((_, i) => i !== index));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;

    try {
      if (editingCatId) {
        await apiCall(`/org/categories/${editingCatId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: catName, customFields: catFields })
        });
      } else {
        await apiCall('/org/categories', {
          method: 'POST',
          body: JSON.stringify({ name: catName, customFields: catFields })
        });
      }
      setCatName('');
      setCatFields([]);
      setEditingCatId(null);
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditCat = (cat) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatFields(cat.customFields || []);
  };

  // --- Employee / Promotion Actions ---
  const handleUpdateRole = async (employeeId, role) => {
    try {
      await apiCall(`/org/employees/${employeeId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleEmployeeStatus = async (emp) => {
    const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await apiCall(`/org/employees/${emp.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAssignUserDept = async (empId, departmentId) => {
    try {
      await apiCall(`/org/employees/${empId}/department`, {
        method: 'PUT',
        body: JSON.stringify({ departmentId })
      });
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Organization Setup</h2>
        <p className="text-slate-400 text-sm mt-1">Configure hierarchical departments, custom asset fields schemas, and promote employees.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('departments')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeSubTab === 'departments' 
              ? 'border-primary-500 text-primary-400 bg-primary-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Departments Management
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeSubTab === 'categories' 
              ? 'border-primary-500 text-primary-400 bg-primary-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tags className="w-4 h-4" />
          Asset Categories Custom Fields
        </button>
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeSubTab === 'employees' 
              ? 'border-primary-500 text-primary-400 bg-primary-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Directory & Roles
        </button>
      </div>

      {/* --- TAB CONTENT AREA --- */}

      {activeSubTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Department Creation Form */}
          <div className="glass rounded-xl p-6 h-fit">
            <h3 className="text-md font-bold text-white mb-4">
              {editingDeptId ? 'Edit Department' : 'Create Department'}
            </h3>
            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Human Resources"
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Parent Department (Hierarchy)</label>
                <select
                  value={deptParentId}
                  onChange={(e) => setDeptParentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                >
                  <option value="">None (Top Level)</option>
                  {departments
                    .filter(d => d.id !== editingDeptId) // Prevent self-referencing parent
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department Head</label>
                <select
                  value={deptHeadId}
                  onChange={(e) => setDeptHeadId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                >
                  <option value="">Assign Later</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 text-sm">
                {editingDeptId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDeptId(null);
                      setDeptName('');
                      setDeptParentId('');
                      setDeptHeadId('');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium"
                >
                  {editingDeptId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>

          {/* Department List Table */}
          <div className="glass rounded-xl p-6 lg:col-span-2">
            <h3 className="text-md font-bold text-white mb-4">Hierarchical Structure</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Parent Department</th>
                    <th className="py-2.5">Department Head</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3 font-medium text-slate-200">{dept.name}</td>
                      <td className="py-3 text-slate-400">{dept.ParentDepartment ? dept.ParentDepartment.name : '—'}</td>
                      <td className="py-3 text-slate-300">{dept.DepartmentHead ? dept.DepartmentHead.name : 'Unassigned'}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                          dept.status === 'Active' 
                            ? 'bg-success/10 text-success border-success/20' 
                            : 'bg-danger/10 text-danger border-danger/20'
                        }`}>
                          {dept.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => toggleDeptStatus(dept)}
                            title="Toggle Status"
                            className="p-1 hover:text-primary-300 text-slate-500 transition-colors"
                          >
                            {dept.status === 'Active' ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                          </button>
                          <button
                            onClick={() => handleEditDept(dept)}
                            title="Edit"
                            className="p-1 hover:text-primary-300 text-slate-400 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Category Configuration Form */}
          <div className="glass rounded-xl p-6 h-fit lg:col-span-1">
            <h3 className="text-md font-bold text-white mb-4">
              {editingCatId ? 'Edit Category Schema' : 'Create Category Schema'}
            </h3>
            
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Electronics, Furniture, etc."
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              {/* Dynamic Field Builder */}
              <div className="border border-slate-800 rounded-lg p-3 space-y-3 bg-slate-950/20">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Category Custom Fields Builder</span>
                
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    placeholder="Field Display Label (e.g. Warranty)"
                    className="w-full bg-slate-900 border border-slate-800 rounded py-1.5 px-2 text-xs focus:outline-none focus:border-primary-500 text-slate-100"
                  />
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="Field Identifier Key (e.g. warranty_months)"
                    className="w-full bg-slate-900 border border-slate-800 rounded py-1.5 px-2 text-xs focus:outline-none focus:border-primary-500 text-slate-100"
                  />
                  <div className="flex gap-2">
                    <select
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded py-1.5 px-2 text-xs focus:outline-none text-slate-300"
                    >
                      <option value="text">Text Input</option>
                      <option value="number">Number</option>
                      <option value="date">Date picker</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={fieldRequired}
                        onChange={(e) => setFieldRequired(e.target.checked)}
                        className="rounded accent-primary-600 bg-slate-900 border-slate-800" 
                      />
                      Required
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Schema Field
                  </button>
                </div>

                {/* Render added custom fields list */}
                {catFields.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-400 mb-1">Defined Fields:</span>
                    {catFields.map((field, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/60 py-1 px-2.5 rounded border border-slate-800 text-slate-300">
                        <span>{field.label} ({field.type}) {field.required && <strong className="text-danger">*</strong>}</span>
                        <button 
                          type="button" 
                          onClick={() => removeCustomField(idx)}
                          className="text-danger hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 text-sm">
                {editingCatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(null);
                      setCatName('');
                      setCatFields([]);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  {editingCatId ? 'Save Schema' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>

          {/* Categories list */}
          <div className="glass rounded-xl p-6 lg:col-span-2">
            <h3 className="text-md font-bold text-white mb-4">Asset Categories & Custom Fields Schemas</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5">Category Name</th>
                    <th className="py-2.5">Custom Field Schema Parameters</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3 font-semibold text-slate-200">{cat.name}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {cat.customFields && cat.customFields.length > 0 ? (
                            cat.customFields.map((f, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700/60 rounded text-slate-300">
                                {f.label || f.name} ({f.type})
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">None (standard fields only)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleEditCat(cat)}
                          className="p-1 hover:text-primary-300 text-slate-400 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'employees' && (
        <div className="glass rounded-xl p-6 border border-slate-800">
          <h3 className="text-md font-bold text-white mb-4">Employee Directory</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Department</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Admin Control Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-3 font-medium text-slate-200">{emp.name}</td>
                    <td className="py-3 text-slate-400">{emp.email}</td>
                    <td className="py-3">
                      <select
                        value={emp.Department?.id || ''}
                        onChange={(e) => handleAssignUserDept(emp.id, e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-xs rounded py-1 px-2 text-slate-300 focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      {emp.id === currentUser?.id ? (
                        <span className="text-xs px-2 py-0.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded font-semibold" title="You cannot change your own role">
                          {emp.role} (You)
                        </span>
                      ) : (
                        <select
                          value={emp.role}
                          onChange={(e) => handleUpdateRole(emp.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-xs font-semibold rounded py-1 px-2 text-primary-300 focus:outline-none"
                        >
                          <option value="Employee">Employee</option>
                          <option value="Department Head">Department Head</option>
                          <option value="Asset Manager">Asset Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                        emp.status === 'Active' 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-danger/10 text-danger border-danger/20'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {emp.id === currentUser?.id ? (
                        <span className="text-[10px] text-slate-600 italic">Protected</span>
                      ) : (
                        <button
                          onClick={() => toggleEmployeeStatus(emp)}
                          className={`text-xs py-1 px-2.5 rounded font-medium transition-colors ${
                            emp.status === 'Active' 
                              ? 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20' 
                              : 'bg-success/10 hover:bg-success/20 text-success border border-success/20'
                          }`}
                        >
                          {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrgSetup;
