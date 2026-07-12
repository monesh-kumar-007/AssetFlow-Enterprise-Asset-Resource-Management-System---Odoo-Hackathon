const express = require('express');
const router = express.Router();
const { registerAsset, getAssetDirectory } = require('../controllers/assetController');
const { protect, isAssetManagerOrAdmin } = require('../middleware/auth');

// Anyone logged in can view the asset directory
router.get('/directory', protect, getAssetDirectory);

// Only Asset Managers or Admins can register new assets
router.post('/register', protect, isAssetManagerOrAdmin, registerAsset);

module.exports = router;