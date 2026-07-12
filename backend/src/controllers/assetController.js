const Asset = require('../models/Asset');

// 1. Register a new asset
const registerAsset = async (req, res) => {
  try {
    // Find the latest asset to increment the serial tag safely
    const lastAsset = await Asset.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    
    if (lastAsset && lastAsset.assetTag) {
      // Split "AF-0004" into ["AF", "0004"], parse 4 as integer
      const currentNum = parseInt(lastAsset.assetTag.split('-')[1], 10);
      if (!isNaN(currentNum)) {
        nextNum = currentNum + 1;
      }
    }
    
    // Format tag to always have 4 digits (e.g., AF-0001)
    const assetTag = `AF-${String(nextNum).padStart(4, '0')}`;
    
    // Inject the default history entry for the registration event
    const initialHistory = [{
      type: 'Registration',
      description: 'Asset initially registered in system repository.',
      performedBy: req.user ? req.user._id : null
    }];

    const assetData = {
      ...req.body,
      assetTag,
      history: initialHistory
    };

    const newAsset = new Asset(assetData);
    await newAsset.save();
    
    res.status(201).json({ success: true, data: newAsset });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// 2. Get all assets with advanced search & dynamic query matching
const getAssetDirectory = async (req, res) => {
  try {
    const { search, category, status, location } = req.query;
    let queryFilter = {};

    // Global Text Search (Asset Tag, Serial Number, or Name)
    if (search) {
      queryFilter.$or = [
        { assetTag: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Dropdown filters
    if (category) queryFilter.category = category;
    if (status) queryFilter.status = status;
    if (location) queryFilter.location = location;

    // Fetch matching records and populate category references
    const assets = await Asset.find(queryFilter)
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  registerAsset,
  getAssetDirectory
};