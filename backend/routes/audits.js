const express = require('express');
const router = express.Router();
const { AuditCycle, AuditAsset, Asset, User, Department } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { logActivity, createNotification } = require('../utils/logger');

// GET /api/audits/cycles - Get list of audit cycles (All authenticated users)
router.get('/cycles', authenticate, async (req, res) => {
  try {
    const cycles = await AuditCycle.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json(cycles);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch audit cycles.', error: error.message });
  }
});

// GET /api/audits/cycles/:id - Get specific audit cycle details + checklist assets (All authenticated users)
router.get('/cycles/:id', authenticate, async (req, res) => {
  try {
    const cycle = await AuditCycle.findByPk(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Audit cycle not found.' });
    }

    // Determine assets in scope
    const assetWhere = {};
    if (cycle.scopeType === 'Department') {
      assetWhere.departmentId = cycle.scopeValue;
    } else if (cycle.scopeType === 'Location') {
      assetWhere.location = cycle.scopeValue;
    }
    // Exclude disposed / retired assets from active audits
    assetWhere.status = {
      [require('sequelize').Op.notIn]: ['Retired', 'Disposed']
    };

    const assets = await Asset.findAll({
      where: assetWhere,
      include: [{ model: Department, attributes: ['name'] }]
    });

    // Get verified records for this cycle
    const verifiedAssets = await AuditAsset.findAll({
      where: { auditCycleId: cycle.id },
      include: [{ model: User, as: 'Auditor', attributes: ['name'] }]
    });

    return res.json({
      cycle,
      assets,
      verifiedAssets
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch audit cycle details.', error: error.message });
  }
});

// POST /api/audits/cycles - Create an audit cycle (Admin only)
router.post('/cycles', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const { name, scopeType, scopeValue, auditorIds, startDate, endDate } = req.body;

    if (!name || !scopeType || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, Scope Type, Start Date, and End Date are required.' });
    }

    const cycle = await AuditCycle.create({
      name,
      scopeType,
      scopeValue: scopeValue || null,
      auditorIds: auditorIds || [],
      startDate,
      endDate,
      status: 'Active' // Start as Active
    });

    // Notify assigned auditors
    if (auditorIds && auditorIds.length > 0) {
      for (const auditorId of auditorIds) {
        await createNotification({
          userId: auditorId,
          message: `You have been assigned to audit cycle: ${name}.`,
          type: 'Audit Discrepancy Flagged'
        });
      }
    }

    await logActivity({
      userId: req.user.id,
      action: 'CREATE_AUDIT_CYCLE',
      targetType: 'AuditCycle',
      targetId: cycle.id,
      details: `Created audit cycle: ${name} (Scope: ${scopeType}).`,
    });

    return res.status(201).json(cycle);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create audit cycle.', error: error.message });
  }
});

// POST /api/audits/verify - Auditor marks/checks an asset (Assigned Auditor only or Admin)
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { auditCycleId, assetId, verifiedStatus, notes } = req.body;

    if (!auditCycleId || !assetId || !verifiedStatus) {
      return res.status(400).json({ message: 'Audit Cycle ID, Asset ID, and Verified Status are required.' });
    }

    const cycle = await AuditCycle.findByPk(auditCycleId);
    if (!cycle) {
      return res.status(404).json({ message: 'Audit cycle not found.' });
    }

    if (cycle.status !== 'Active') {
      return res.status(400).json({ message: 'This audit cycle is not active or has been closed.' });
    }

    // Check if user is an assigned auditor or Admin
    const isAssigned = cycle.auditorIds && cycle.auditorIds.includes(req.user.id);
    const isAdmin = req.user.role === 'Admin';

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ message: 'You are not assigned as an auditor for this cycle.' });
    }

    // Upsert verification record
    let record = await AuditAsset.findOne({
      where: { auditCycleId, assetId }
    });

    if (record) {
      record.verifiedStatus = verifiedStatus;
      record.notes = notes || '';
      record.auditorId = req.user.id;
      record.auditedAt = new Date();
      await record.save();
    } else {
      record = await AuditAsset.create({
        auditCycleId,
        assetId,
        verifiedStatus,
        notes: notes || '',
        auditorId: req.user.id,
        auditedAt: new Date()
      });
    }

    // Notify Asset Manager if discrepancy is flagged
    if (verifiedStatus === 'Missing' || verifiedStatus === 'Damaged') {
      const asset = await Asset.findByPk(assetId);
      const managers = await User.findAll({ where: { role: 'Asset Manager' } });
      for (const mgr of managers) {
        await createNotification({
          userId: mgr.id,
          message: `Discrepancy: Asset ${asset.name} (${asset.assetTag}) marked as ${verifiedStatus} during ${cycle.name}.`,
          type: 'Audit Discrepancy Flagged'
        });
      }
    }

    return res.json({ message: 'Asset status recorded successfully.', record });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record asset status.', error: error.message });
  }
});

// GET /api/audits/cycles/:id/discrepancies - Auto-generate discrepancy report (All authenticated users)
router.get('/cycles/:id/discrepancies', authenticate, async (req, res) => {
  try {
    const cycle = await AuditCycle.findByPk(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Audit cycle not found.' });
    }

    // Query for verification items where status is Missing or Damaged
    const discrepancies = await AuditAsset.findAll({
      where: {
        auditCycleId: cycle.id,
        verifiedStatus: {
          [require('sequelize').Op.in]: ['Missing', 'Damaged']
        }
      },
      include: [
        { model: Asset, include: [{ model: Department, attributes: ['name'] }] },
        { model: User, as: 'Auditor', attributes: ['name'] }
      ]
    });

    return res.json({
      cycle,
      discrepancies
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch discrepancies.', error: error.message });
  }
});

// POST /api/audits/cycles/:id/close - Close audit cycle and lock updates (Admin only)
router.post('/cycles/:id/close', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const cycle = await AuditCycle.findByPk(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Audit cycle not found.' });
    }

    if (cycle.status === 'Closed') {
      return res.status(400).json({ message: 'This cycle is already closed.' });
    }

    cycle.status = 'Closed';
    await cycle.save();

    // Lock and update affected asset statuses
    const verifiedAssets = await AuditAsset.findAll({
      where: { auditCycleId: cycle.id }
    });

    for (const auditItem of verifiedAssets) {
      const asset = await Asset.findByPk(auditItem.assetId);
      if (asset) {
        if (auditItem.verifiedStatus === 'Missing') {
          asset.status = 'Lost';
          await asset.save();
          await logActivity({
            userId: req.user.id,
            action: 'AUDIT_ASSET_LOST',
            targetType: 'Asset',
            targetId: asset.id,
            details: `Asset marked as Lost due to audit cycle closure of: ${cycle.name}`,
          });
        } else if (auditItem.verifiedStatus === 'Damaged') {
          asset.condition = 'Poor'; // Mark it as poor condition
          await asset.save();
        }
      }
    }

    await logActivity({
      userId: req.user.id,
      action: 'CLOSE_AUDIT_CYCLE',
      targetType: 'AuditCycle',
      targetId: cycle.id,
      details: `Closed audit cycle: ${cycle.name}. Updated asset statuses.`,
    });

    return res.json({ message: 'Audit cycle closed and asset database updated.', cycle });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to close audit cycle.', error: error.message });
  }
});

module.exports = router;
