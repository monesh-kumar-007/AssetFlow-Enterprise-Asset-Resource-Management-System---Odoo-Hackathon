const express = require('express');
const router = express.Router();
const { Asset, AssetAllocation, TransferRequest, User, Department } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { logActivity, createNotification } = require('../utils/logger');

// POST /api/allocations/allocate - Allocate asset (Asset Manager & Admin)
router.post('/allocate', authenticate, requireRole(['Admin', 'Asset Manager']), async (req, res) => {
  try {
    const { assetId, employeeId, departmentId, expectedReturnDate } = req.body;

    if (!assetId || (!employeeId && !departmentId)) {
      return res.status(400).json({ message: 'Asset ID and either Employee ID or Department ID are required.' });
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    // Check if asset is already allocated/taken
    if (asset.status !== 'Available') {
      // Find the active allocation
      const activeAlloc = await AssetAllocation.findOne({
        where: { assetId, status: 'Active' },
        include: [
          { model: User, as: 'Employee', attributes: ['id', 'name', 'email'] },
          { model: Department, attributes: ['id', 'name'] }
        ]
      });

      let holderName = 'Unknown';
      let holderId = null;
      let holderType = 'Employee';

      if (activeAlloc) {
        if (activeAlloc.Employee) {
          holderName = activeAlloc.Employee.name;
          holderId = activeAlloc.Employee.id;
          holderType = 'Employee';
        } else if (activeAlloc.Department) {
          holderName = activeAlloc.Department.name;
          holderId = activeAlloc.Department.id;
          holderType = 'Department';
        }
      }

      return res.status(409).json({
        message: `Asset is already taken. Currently held by ${holderName}.`,
        currentlyHeldBy: holderName,
        holderId,
        holderType,
        canRequestTransfer: true,
      });
    }

    // Proceed with allocation
    const allocation = await AssetAllocation.create({
      assetId,
      employeeId: employeeId || null,
      departmentId: departmentId || null,
      allocatedById: req.user.id,
      expectedReturnDate: expectedReturnDate || null,
      status: 'Active'
    });

    // Update Asset status
    asset.status = 'Allocated';
    if (departmentId) {
      asset.departmentId = departmentId;
    } else if (employeeId) {
      // Look up employee's department and assign
      const employee = await User.findByPk(employeeId);
      if (employee && employee.departmentId) {
        asset.departmentId = employee.departmentId;
      }
    }
    await asset.save();

    // Create Notification and Log Activity
    const details = employeeId ? `Employee ID: ${employeeId}` : `Department ID: ${departmentId}`;
    await logActivity({
      userId: req.user.id,
      action: 'ALLOCATE_ASSET',
      targetType: 'Asset',
      targetId: asset.id,
      details: `Allocated ${asset.assetTag} to ${employeeId ? 'employee' : 'department'}. Expected return: ${expectedReturnDate || 'N/A'}.`,
    });

    if (employeeId) {
      await createNotification({
        userId: employeeId,
        message: `Asset ${asset.name} (${asset.assetTag}) has been allocated to you.`,
        type: 'Asset Assigned'
      });
    }

    return res.status(201).json({ message: 'Asset allocated successfully.', allocation });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to allocate asset.', error: error.message });
  }
});

// POST /api/allocations/transfer-request - Create a transfer request (All users)
router.post('/transfer-request', authenticate, async (req, res) => {
  try {
    const { assetId, targetHolderId } = req.body;

    if (!assetId || !targetHolderId) {
      return res.status(400).json({ message: 'Asset ID and Target Holder ID are required.' });
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    // Find current active allocation
    const activeAlloc = await AssetAllocation.findOne({
      where: { assetId, status: 'Active' }
    });

    if (!activeAlloc) {
      return res.status(400).json({ message: 'Asset is not currently allocated. You can allocate it directly.' });
    }

    // Identify current holder
    const currentHolderId = activeAlloc.employeeId;
    if (!currentHolderId) {
      return res.status(400).json({ message: 'Asset is allocated to a department. Transfers are only supported for employee allocations.' });
    }

    // Check if target is same as current
    if (currentHolderId === targetHolderId) {
      return res.status(400).json({ message: 'Cannot transfer to the same employee who currently holds the asset.' });
    }

    // Create transfer request
    const transfer = await TransferRequest.create({
      assetId,
      currentHolderId,
      targetHolderId,
      requestedById: req.user.id,
      status: 'Pending'
    });

    // Notify current holder and asset managers
    await createNotification({
      userId: currentHolderId,
      message: `A transfer request has been initiated to transfer your asset ${asset.name} (${asset.assetTag}).`,
      type: 'Transfer Requested'
    });

    await logActivity({
      userId: req.user.id,
      action: 'TRANSFER_REQUEST',
      targetType: 'Asset',
      targetId: asset.id,
      details: `Requested transfer of ${asset.assetTag} from user ${currentHolderId} to user ${targetHolderId}.`,
    });

    return res.status(201).json({ message: 'Transfer request raised.', transfer });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to request transfer.', error: error.message });
  }
});

// GET /api/allocations/transfers - List all transfer requests (Filtered by user permissions)
router.get('/transfers', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    // Employees only see transfers they are involved in
    if (req.user.role === 'Employee') {
      where[Op.or] = [
        { currentHolderId: req.user.id },
        { targetHolderId: req.user.id },
        { requestedById: req.user.id }
      ];
    }

    const transfers = await TransferRequest.findAll({
      where,
      include: [
        { model: Asset, attributes: ['id', 'name', 'assetTag', 'serialNumber'] },
        { model: User, as: 'CurrentHolder', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'TargetHolder', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'RequestedBy', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(transfers);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch transfer requests.', error: error.message });
  }
});

// PUT /api/allocations/transfers/:id/action - Approve / Reject a transfer request (Asset Manager / Department Head)
router.put('/transfers/:id/action', authenticate, requireRole(['Admin', 'Asset Manager', 'Department Head']), async (req, res) => {
  try {
    const { action } = req.body; // 'Approved' or 'Rejected'
    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ message: 'Action must be Approved or Rejected.' });
    }

    const transfer = await TransferRequest.findByPk(req.params.id, {
      include: [{ model: Asset }]
    });

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer request not found.' });
    }

    if (transfer.status !== 'Pending') {
      return res.status(400).json({ message: 'This transfer request has already been processed.' });
    }

    transfer.status = action;
    transfer.actionedById = req.user.id;
    transfer.actionedAt = new Date();
    await transfer.save();

    if (action === 'Approved') {
      const assetId = transfer.assetId;
      
      // Find current active allocation
      const activeAlloc = await AssetAllocation.findOne({
        where: { assetId, status: 'Active' }
      });

      if (activeAlloc) {
        // End active allocation
        activeAlloc.status = 'Transferred';
        activeAlloc.actualReturnDate = new Date().toISOString().split('T')[0];
        await activeAlloc.save();
      }

      // Create new allocation for target employee
      const targetUser = await User.findByPk(transfer.targetHolderId);
      const newAlloc = await AssetAllocation.create({
        assetId,
        employeeId: transfer.targetHolderId,
        allocatedById: req.user.id,
        status: 'Active',
        allocationDate: new Date().toISOString().split('T')[0]
      });

      // Update Asset's department to matches the target user's department
      if (targetUser && targetUser.departmentId) {
        transfer.Asset.departmentId = targetUser.departmentId;
        await transfer.Asset.save();
      }

      // Send notifications
      await createNotification({
        userId: transfer.currentHolderId,
        message: `Your asset ${transfer.Asset.name} has been transferred to ${targetUser ? targetUser.name : 'another employee'}.`,
        type: 'Transfer Approved'
      });

      await createNotification({
        userId: transfer.targetHolderId,
        message: `Asset ${transfer.Asset.name} has been successfully transferred to you.`,
        type: 'Asset Assigned'
      });

      await logActivity({
        userId: req.user.id,
        action: 'APPROVE_TRANSFER',
        targetType: 'Asset',
        targetId: assetId,
        details: `Approved transfer of ${transfer.Asset.assetTag} from ${transfer.currentHolderId} to ${transfer.targetHolderId}.`,
      });

    } else {
      // Action is Rejected
      await createNotification({
        userId: transfer.requestedById,
        message: `Transfer request for ${transfer.Asset.name} was rejected.`,
        type: 'Transfer Rejected'
      });

      await logActivity({
        userId: req.user.id,
        action: 'REJECT_TRANSFER',
        targetType: 'Asset',
        targetId: transfer.assetId,
        details: `Rejected transfer of ${transfer.Asset.assetTag}.`,
      });
    }

    return res.json({ message: `Transfer request ${action.toLowerCase()}.`, transfer });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process transfer request.', error: error.message });
  }
});

// POST /api/allocations/return - Return an asset (Asset Manager & Admin)
router.post('/return', authenticate, requireRole(['Admin', 'Asset Manager']), async (req, res) => {
  try {
    const { assetId, returnNotes, condition } = req.body;

    if (!assetId || !condition) {
      return res.status(400).json({ message: 'Asset ID and check-in condition are required.' });
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    const activeAlloc = await AssetAllocation.findOne({
      where: { assetId, status: 'Active' }
    });

    if (!activeAlloc) {
      return res.status(400).json({ message: 'Asset does not have an active allocation.' });
    }

    // Close allocation
    activeAlloc.status = 'Returned';
    activeAlloc.actualReturnDate = new Date().toISOString().split('T')[0];
    activeAlloc.returnNotes = returnNotes || '';
    await activeAlloc.save();

    // Update Asset status and condition
    asset.status = 'Available';
    asset.condition = condition;
    await asset.save();

    // Notify employee if it was assigned to one
    if (activeAlloc.employeeId) {
      await createNotification({
        userId: activeAlloc.employeeId,
        message: `Your returned asset ${asset.name} (${asset.assetTag}) has been check-in processed.`,
        type: 'Asset Returned'
      });
    }

    await logActivity({
      userId: req.user.id,
      action: 'RETURN_ASSET',
      targetType: 'Asset',
      targetId: asset.id,
      details: `Processed return for ${asset.assetTag}. Condition on return: ${condition}.`,
    });

    return res.json({ message: 'Asset returned and marked as Available.', asset });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process asset return.', error: error.message });
  }
});

module.exports = router;
