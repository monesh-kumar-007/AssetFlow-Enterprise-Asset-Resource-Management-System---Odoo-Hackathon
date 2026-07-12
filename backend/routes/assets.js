const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Asset, AssetCategory, Department, User, AssetAllocation, MaintenanceRequest, AuditAsset, AuditCycle, ActivityLog } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// GET /api/assets - Search & Filter assets (all authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, categoryId, status, departmentId, location, sharedBookable } = req.query;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { assetTag: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

    if (categoryId) whereClause.categoryId = categoryId;
    if (status) whereClause.status = status;
    if (departmentId) whereClause.departmentId = departmentId;
    if (location) whereClause.location = { [Op.like]: `%${location}%` };
    if (sharedBookable !== undefined) whereClause.sharedBookable = sharedBookable === 'true';

    const assets = await Asset.findAll({
      where: whereClause,
      include: [
        { model: AssetCategory, attributes: ['id', 'name', 'customFields'] },
        { model: Department, attributes: ['id', 'name'] }
      ],
      order: [['assetTag', 'ASC']]
    });

    return res.json(assets);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch assets.', error: error.message });
  }
});

// POST /api/assets - Register a new asset (Asset Manager & Admin)
router.post('/', authenticate, requireRole(['Admin', 'Asset Manager']), async (req, res) => {
  try {
    const { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, sharedBookable, customFieldValues, imageUrl, documentUrl, departmentId } = req.body;

    if (!name || !categoryId || !serialNumber || !acquisitionDate || !location) {
      return res.status(400).json({ message: 'Name, Category, Serial Number, Acquisition Date, and Location are required.' });
    }

    // Verify category exists
    const category = await AssetCategory.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category selected.' });
    }

    // Check serial number uniqueness
    const existing = await Asset.findOne({ where: { serialNumber } });
    if (existing) {
      return res.status(400).json({ message: `Asset with Serial Number ${serialNumber} is already registered.` });
    }

    // Auto-generate Asset Tag: AF-XXXX
    let nextNum = 1;
    const lastAsset = await Asset.findOne({
      order: [['createdAt', 'DESC']]
    });
    if (lastAsset && lastAsset.assetTag) {
      const match = lastAsset.assetTag.match(/AF-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const assetTag = `AF-${String(nextNum).padStart(4, '0')}`;

    const asset = await Asset.create({
      name,
      assetTag,
      serialNumber,
      acquisitionDate,
      acquisitionCost: acquisitionCost || 0.00,
      condition: condition || 'New',
      location,
      sharedBookable: !!sharedBookable,
      status: 'Available', // Starts as Available
      categoryId,
      departmentId: departmentId || null,
      customFieldValues: customFieldValues || {},
      imageUrl: imageUrl || null,
      documentUrl: documentUrl || null
    });

    await logActivity({
      userId: req.user.id,
      action: 'REGISTER_ASSET',
      targetType: 'Asset',
      targetId: asset.id,
      details: `Registered asset ${name} with tag ${assetTag}.`,
    });

    return res.status(201).json(asset);
  } catch (error) {
    return res.status(500).json({ message: 'Asset registration failed.', error: error.message });
  }
});

// PUT /api/assets/:id - Edit asset details (Asset Manager & Admin)
router.put('/:id', authenticate, requireRole(['Admin', 'Asset Manager']), async (req, res) => {
  try {
    const { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, sharedBookable, customFieldValues, imageUrl, documentUrl, departmentId, status } = req.body;
    
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    if (serialNumber && serialNumber !== asset.serialNumber) {
      const dup = await Asset.findOne({ where: { serialNumber } });
      if (dup) {
        return res.status(400).json({ message: `Serial Number ${serialNumber} is already in use by another asset.` });
      }
    }

    asset.name = name !== undefined ? name : asset.name;
    asset.categoryId = categoryId !== undefined ? categoryId : asset.categoryId;
    asset.serialNumber = serialNumber !== undefined ? serialNumber : asset.serialNumber;
    asset.acquisitionDate = acquisitionDate !== undefined ? acquisitionDate : asset.acquisitionDate;
    asset.acquisitionCost = acquisitionCost !== undefined ? acquisitionCost : asset.acquisitionCost;
    asset.condition = condition !== undefined ? condition : asset.condition;
    asset.location = location !== undefined ? location : asset.location;
    asset.sharedBookable = sharedBookable !== undefined ? !!sharedBookable : asset.sharedBookable;
    asset.customFieldValues = customFieldValues !== undefined ? customFieldValues : asset.customFieldValues;
    asset.imageUrl = imageUrl !== undefined ? imageUrl : asset.imageUrl;
    asset.documentUrl = documentUrl !== undefined ? documentUrl : asset.documentUrl;
    asset.departmentId = departmentId !== undefined ? (departmentId || null) : asset.departmentId;
    
    if (status !== undefined) {
      asset.status = status;
    }

    await asset.save();

    await logActivity({
      userId: req.user.id,
      action: 'UPDATE_ASSET',
      targetType: 'Asset',
      targetId: asset.id,
      details: `Updated asset details for ${asset.assetTag}.`,
    });

    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ message: 'Asset update failed.', error: error.message });
  }
});

// GET /api/assets/:id/history - Full lifecycle, allocation, maintenance, audit timelines (all authenticated users)
router.get('/:id/history', authenticate, async (req, res) => {
  try {
    const assetId = req.params.id;
    
    const asset = await Asset.findByPk(assetId, {
      include: [
        { model: AssetCategory, attributes: ['name'] },
        { model: Department, attributes: ['name'] }
      ]
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    // 1. Allocation history
    const allocations = await AssetAllocation.findAll({
      where: { assetId },
      include: [
        { model: User, as: 'Employee', attributes: ['name', 'email'] },
        { model: Department, attributes: ['name'] },
        { model: User, as: 'AllocatedBy', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 2. Maintenance History
    const maintenance = await MaintenanceRequest.findAll({
      where: { assetId },
      include: [
        { model: User, as: 'RaisedBy', attributes: ['name'] },
        { model: User, as: 'ApprovedBy', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 3. Audit History
    const audits = await AuditAsset.findAll({
      where: { assetId },
      include: [
        { model: AuditCycle, attributes: ['name', 'startDate', 'endDate'] },
        { model: User, as: 'Auditor', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 4. General Action logs
    const logs = await ActivityLog.findAll({
      where: {
        targetType: 'Asset',
        targetId: String(assetId)
      },
      include: [{ model: User, attributes: ['name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      asset,
      allocations,
      maintenance,
      audits,
      logs
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch asset history.', error: error.message });
  }
});

module.exports = router;
