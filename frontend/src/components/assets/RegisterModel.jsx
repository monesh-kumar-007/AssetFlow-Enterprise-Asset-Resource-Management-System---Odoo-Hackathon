import React, { useState } from 'react';
import { registerNewAsset } from '../../services/assetApi';

const RegisterModal = ({ isOpen, onClose, categories, refreshDirectory }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    serialNumber: '',
    acquisitionDate: '',
    acquisitionCost: '',
    condition: 'New',
    location: '',
    isBookable: false,
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await registerNewAsset(formData);
      if (res.success) {
        refreshDirectory();
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Register Structural Organization Asset</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-gray-400">Asset Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Category *</label>
              <select required name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Serial Number *</label>
              <input required type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Acquisition Date *</label>
              <input required type="date" name="acquisitionDate" value={formData.acquisitionDate} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Acquisition Cost ($) *</label>
              <input required type="number" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Condition *</label>
              <select name="condition" value={formData.condition} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                {['New', 'Good', 'Fair', 'Poor'].map(cond => <option key={cond} value={cond}>{cond}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Location Area *</label>
              <input required type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Room, Lab, Desk Info" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input type="checkbox" id="isBookable" name="isBookable" checked={formData.isBookable} onChange={handleChange} className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0" />
            <label htmlFor="isBookable" className="text-sm font-medium text-gray-300 cursor-pointer">
              Mark as Shared / Bookable Resource (Rooms, Pool Vehicles, etc.)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {submitting ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;