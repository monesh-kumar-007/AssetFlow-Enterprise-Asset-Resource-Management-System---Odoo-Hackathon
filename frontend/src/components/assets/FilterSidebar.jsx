import React from 'react';

const FilterSidebar = ({ filters, setFilters, categories }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.value !== undefined ? e : e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', status: '', location: '' });
  };

  return (
    <div className="w-64 bg-gray-850 border-r border-gray-700 p-6 flex flex-col justify-between h-full shadow-lg">
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Search & Filters</h2>
          
          {/* Text Input Search */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Global Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleInputChange}
              placeholder="Tag, Name, or Serial..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Filter Selection Elements */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleInputChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Lifecycle Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleInputChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Location</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleInputChange}
              placeholder="e.g. Floor 3, Lab A"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default FilterSidebar;