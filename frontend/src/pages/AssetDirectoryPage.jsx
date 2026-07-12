import React, { useState, useEffect } from 'react';
import { fetchAssetDirectory, fetchCategories } from '../services/assetApi';
import AssetTable from '../components/assets/AssetTable';
import FilterSidebar from '../components/assets/FilterSidebar';
import RegisterModal from '../components/assets/RegisterModal';
import AssetDetails from '../components/assets/AssetDetails';

const AssetDirectoryPage = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Unified state for global search and category/status/location drops
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    location: ''
  });

  // Fetch running instance of directory based on filtering changes
  const loadAssets = async () => {
    setLoading(true);
    try {
      const result = await fetchAssetDirectory(filters);
      if (result.success) setAssets(result.data);
    } catch (err) {
      console.error("Error loading operational directory assets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial master data required for filtering dropdown layouts
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const catResult = await fetchCategories();
        if (catResult.success) setCategories(catResult.data);
      } catch (err) {
        console.error("Error fetching operational dependencies:", err);
      }
    };
    loadMasterData();
  }, []);

  // Reload assets anytime search text strings or checkbox arrays change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadAssets();
    }, 300); // 300ms debounce window to prevent database spamming on keystrokes

    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* 1. Sticky Left Filtration Sidebar Control Area */}
      <FilterSidebar 
        filters={filters} 
        setFilters={setFilters} 
        categories={categories} 
      />

      {/* 2. Main Center Stream Content Pane Layout */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Asset Repository Directory</h1>
            <p className="text-sm text-gray-400">Track structural operational states and specifications organization-wide.</p>
          </div>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Register Asset
          </button>
        </div>

        {/* Dense Spreadsheet Grid Content Pane */}
        {loading ? (
          <div className="flex justify-center items-center flex-1 text-gray-400">Loading master files...</div>
        ) : (
          <AssetTable assets={assets} onRowClick={setSelectedAsset} />
        )}
      </div>

      {/* 3. Sliding Detail Drawer Right Overlay Container */}
      {selectedAsset && (
        <AssetDetails 
          asset={selectedAsset} 
          onClose={() => setSelectedAsset(null)} 
        />
      )}

      {/* 4. Overlay Form Layout Popup Window */}
      {isRegisterOpen && (
        <RegisterModal 
          isOpen={isRegisterOpen} 
          onClose={() => setIsRegisterOpen(false)} 
          categories={categories}
          refreshDirectory={loadAssets}
        />
      )}
    </div>
  );
};

export default AssetDirectoryPage;