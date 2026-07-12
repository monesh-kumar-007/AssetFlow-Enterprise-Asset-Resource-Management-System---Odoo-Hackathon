import React, { useState } from 'react';

const AssetDetails = ({ asset, onClose }) => {
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' or 'timeline'

  return (
    <div className="w-96 bg-gray-850 border-l border-gray-700 h-full flex flex-col shadow-2xl relative z-40 animate-slide-in">
      {/* Drawer Header Belt */}
      <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <div>
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">{asset.assetTag}</span>
          <h2 className="text-lg font-bold text-white truncate max-w-[200px]">{asset.name}</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl p-1">&times;</button>
      </div>

      {/* Internal Navigation Controls */}
      <div className="flex border-b border-gray-700 bg-gray-800 text-sm">
        <button 
          onClick={() => setActiveTab('specs')}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${activeTab === 'specs' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
        >
          Specifications
        </button>
        <button 
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
        >
          Lifecycle Log
        </button>
      </div>

      {/* Dynamic Pane Containers */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {activeTab === 'specs' ? (
          <div className="space-y-4">
            <div className="bg-gray-900/60 p-4 border border-gray-800 rounded-xl space-y-3">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Current Status</span><span className="font-semibold text-blue-400">{asset.status}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Serial Number</span><span className="font-mono text-gray-300">{asset.serialNumber}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Category Blueprint</span><span className="text-gray-300">{asset.category?.name || 'General'}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Current Location</span><span className="text-gray-300">{asset.location}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Condition State</span><span className="text-gray-300">{asset.condition}</span></div>
            </div>

            <div className="bg-gray-900/40 p-4 border border-gray-800/80 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Acquisition Metadata</h4>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Purchase Date</span><span className="text-gray-300">{new Date(asset.acquisitionDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Historical Valuation</span><span className="text-gray-300">${asset.acquisitionCost.toLocaleString()}</span></div>
            </div>
          </div>
        ) : (
          /* Timeline History Stream Logs */
          <div className="relative border-l border-gray-700 ml-2 pl-4 space-y-6">
            {asset.history?.map((log, i) => (
              <div key={i} className="relative group">
                <div className="absolute -left-[21px] mt-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-gray-850" />
                <div className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>{log.type}</span>
                  <span className="text-[10px] text-gray-500 font-normal">{new Date(log.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{log.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDetails;