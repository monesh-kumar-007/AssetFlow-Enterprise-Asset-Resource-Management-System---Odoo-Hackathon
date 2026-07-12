const express = require('express');
const router = express.Router();
const { MaintenanceRequest, Asset, User } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { logActivity, createNotification } = require('../utils/logger');

// GET /api/maintenance - List all maintenance requests (Filtered by user permissions)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, assetId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (assetId) where.assetId = assetId;

    // Employees can only view tickets they raised
    if (req.user.role === 'Employee') {
      where.raisedById = req.user.id;
    }

    const requests = await MaintenanceRequest.findAll({
      where,
      include: [
        { model: Asset, attributes: ['id', 'name', 'assetTag', 'serialNumber', 'location'] },
        { model: User, as: 'RaisedBy', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'ApprovedBy', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch maintenance requests.', error: error.message });
  }
});

// POST /api/maintenance/request - Raise a new maintenance request (All users)
router.post('/request', authenticate, async (req, res) => {
  try {
    const { assetId, description, priority, photoUrl } = req.body;

    if (!assetId || !description) {
      return res.status(400).json({ message: 'Asset ID and description are required.' });
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    // Create the ticket
    const maintenance = await MaintenanceRequest.create({
      assetId,
      raisedById: req.user.id,
      description,
      priority: priority || 'Medium',
      photoUrl: photoUrl || null,
      status: 'Pending'
    });

    await logActivity({
      userId: req.user.id,
      action: 'RAISE_MAINTENANCE',
      targetType: 'Asset',
      targetId: assetId,
      details: `Raised maintenance ticket for ${asset.assetTag} (${priority || 'Medium'} priority).`,
    });

    return res.status(201).json({ message: 'Maintenance request submitted.', maintenance });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to raise maintenance request.', error: error.message });
  }
});

// DELETE /api/maintenance/clear - Clear all maintenance/repair history (Admin only)
router.delete('/clear', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const count = await MaintenanceRequest.destroy({ where: {} });
    await logActivity({
      userId: req.user.id,
      action: 'CLEAR_MAINTENANCE_HISTORY',
      targetType: 'MaintenanceRequest',
      targetId: null,
      details: `Admin cleared maintenance & repair history. Deleted ${count} records.`,
    });
    return res.json({ message: `Successfully cleared ${count} maintenance records from history.` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to clear maintenance history.', error: error.message });
  }
});

// PUT /api/maintenance/:id/status - Update maintenance request status (Asset Managers & Admins)
router.put('/:id/status', authenticate, requireRole(['Admin', 'Asset Manager']), async (req, res) => {
  try {
    const { status, technicianName, resolutionNotes } = req.body;
    const validStatuses = ['Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const request = await MaintenanceRequest.findByPk(req.params.id, {
      include: [{ model: Asset }]
    });

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found.' });
    }

    const oldStatus = request.status;
    request.status = status;

    if (status === 'Approved' || status === 'Rejected') {
      request.approvedById = req.user.id;
    }
    if (technicianName) {
      request.technicianName = technicianName;
    }
    if (resolutionNotes) {
      request.resolutionNotes = resolutionNotes;
    }

    await request.save();

    // Trigger Asset state transitions based on maintenance lifecycle
    const asset = request.Asset;
    
    if (status === 'Approved') {
      // Auto-update asset status to Under Maintenance
      asset.status = 'Under Maintenance';
      await asset.save();

      await createNotification({
        userId: request.raisedById,
        message: `Maintenance request for ${asset.name} was Approved. Asset is now Under Maintenance.`,
        type: 'Maintenance Approved'
      });
    } else if (status === 'Rejected') {
      await createNotification({
        userId: request.raisedById,
        message: `Maintenance request for ${asset.name} was Rejected.`,
        type: 'Maintenance Rejected'
      });
    } else if (status === 'Resolved') {
      // Auto-update asset status back to Available
      asset.status = 'Available';
      await asset.save();

      await createNotification({
        userId: request.raisedById,
        message: `Maintenance request for ${asset.name} has been Resolved. Asset is now Available.`,
        type: 'Maintenance Resolved'
      });
    }

    await logActivity({
      userId: req.user.id,
      action: 'UPDATE_MAINTENANCE_STATUS',
      targetType: 'Asset',
      targetId: asset.id,
      details: `Updated maintenance ticket status from ${oldStatus} to ${status}.`,
    });

    return res.json({ message: `Maintenance request status set to ${status}.`, request });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update maintenance request status.', error: error.message });
  }
});

module.exports = router;
