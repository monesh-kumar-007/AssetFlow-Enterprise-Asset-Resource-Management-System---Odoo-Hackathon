const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory', required: true },
  assetTag: { type: String, required: true, unique: true }, // Auto-generated: AF-0001
  serialNumber: { type: String, required: true, unique: true, trim: true },
  acquisitionDate: { type: Date, required: true },
  acquisitionCost: { type: Number, required: true },
  condition: { 
    type: String, 
    enum: ['New', 'Good', 'Fair', 'Poor'], 
    default: 'New' 
  },
  location: { type: String, required: true, trim: true },
  isBookable: { type: Boolean, default: false }, // "shared/bookable" flag
  
  // Asset lifecycle states
  status: { 
    type: String, 
    enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'], 
    default: 'Available' 
  },
  
  // Dynamic category-specific key-value storage (e.g., {"warrantyPeriod": "24 months"})
  categoryFields: { 
    type: Map, 
    of: String, 
    default: {} 
  },

  // Per-asset timeline log history
  history: [{
    type: { type: String, enum: ['Allocation', 'Maintenance', 'StatusChange', 'Audit', 'Registration'] },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);