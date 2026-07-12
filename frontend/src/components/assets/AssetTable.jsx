import React from 'react';

// Color map helper for lifecycle tags
const STATUS_BADGES = {
  Available: 'bg-green-900/50 text-green-400 border-green-700',
  Allocated: 'bg-blue-900/50 text-blue-400 border-blue-700',
  Reserved: 'bg-purple-900/50 text-purple-400 border-purple-700',
  'Under Maintenance': 'bg-amber-900/50 text-amber-400 border-amber-700',
  Lost: 'bg-red-900/50 text-red-400 border-red-700',
  Retired: 'bg-gray-800 text-gray-400 border-gray-700',
  Disposed: 'bg-gray-900 text-gray-500 border-gray-800 line-through',
};

const AssetTable = ({ assets, onRowClick }) => {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
        <p className="text-lg">No assets matched your current search filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-850 border-b border-gray-700 text-xs tracking-wider uppercase text-gray-400">
              <th className="p-4 font-semibold">Asset Tag</th>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Location</th>
              <th className="p-4 font-semibold">Shared / Bookable</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 text-sm">
            {assets.map((asset) => (
              <tr 
                key={asset._id} 
                onClick={() => onRowClick(asset)}
                className="hover:bg-gray-750/70 cursor-pointer transition-colors group"
              >
                <td className="p-4 font-mono font-medium text-blue-400 group-hover:text-blue-300">
                  {asset.assetTag}
                </td>
                <td className="p-4 font-medium text-gray-200">{asset.name}</td>
                <td className="p-4 text-gray-300">{asset.category?.name || 'Unassigned'}</td>
                <td className="p-4 text-gray-300">{asset.location}</td>
                <td className="p-4">
                  {asset.isBookable ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-950 text-teal-400 border border-teal-800">
                      Yes
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">No</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGES[asset.status] || 'bg-gray-700 text-gray-300'}`}>
                    {asset.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetTable;