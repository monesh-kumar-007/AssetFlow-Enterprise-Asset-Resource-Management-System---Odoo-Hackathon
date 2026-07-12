const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { 
  sequelize, User, Department, Asset, AssetAllocation, 
  ResourceBooking, Notification, TransferRequest, ActivityLog, 
  MaintenanceRequest, AuditAsset 
} = require('../models');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

// POST /api/auth/signup - Signup as Employee only
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role: 'Employee', // Hardcoded to Employee. No role self-selection.
      status: 'Active',
    });

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    await logActivity({
      userId: newUser.id,
      action: 'SIGNUP',
      targetType: 'User',
      targetId: newUser.id,
      details: `New account created for email ${email}`,
    });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Signup failed.', error: error.message });
  }
});

// POST /api/auth/login - User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Department, attributes: ['id', 'name'] }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact an admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      targetType: 'User',
      targetId: user.id,
      details: `${user.name} logged in successfully.`,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.Department ? { id: user.Department.id, name: user.Department.name } : null
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// GET /api/auth/me - Validate token and return current session user
router.get('/me', authenticate, async (req, res) => {
  try {
    return res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        department: req.user.Department ? { id: req.user.Department.id, name: req.user.Department.name } : null
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user context.', error: error.message });
  }
});

// DELETE /api/auth/delete-account - Permanently delete user account
router.delete('/delete-account', authenticate, async (req, res) => {
  if (req.user.role === 'Admin') {
    return res.status(403).json({ message: 'Administrator accounts cannot be permanently deleted. Contact a super admin if needed.' });
  }
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;

    // 1. Handle Active Allocations: Free the assets
    const activeAllocations = await AssetAllocation.findAll({
      where: { employeeId: userId, status: 'Active' },
      transaction
    });

    for (const alloc of activeAllocations) {
      alloc.status = 'Returned';
      alloc.actualReturnDate = new Date().toISOString().split('T')[0];
      alloc.returnNotes = 'Account deleted by user.';
      await alloc.save({ transaction });

      const asset = await Asset.findByPk(alloc.assetId, { transaction });
      if (asset) {
        asset.status = 'Available';
        await asset.save({ transaction });
      }
    }

    // 2. Delete or dissociate bookings
    await ResourceBooking.destroy({
      where: { userId },
      transaction
    });

    // 3. Delete notifications
    await Notification.destroy({
      where: { userId },
      transaction
    });

    // 4. Dissociate transfer requests
    await TransferRequest.destroy({
      where: {
        [Op.or]: [
          { currentHolderId: userId },
          { targetHolderId: userId },
          { requestedById: userId }
        ]
      },
      transaction
    });

    // 5. Dissociate activity logs
    await ActivityLog.update(
      { userId: null },
      { where: { userId }, transaction }
    );

    // 6. Dissociate maintenance requests
    await MaintenanceRequest.update(
      { raisedById: null },
      { where: { raisedById: userId }, transaction }
    );
    await MaintenanceRequest.update(
      { approvedById: null },
      { where: { approvedById: userId }, transaction }
    );

    // 7. Dissociate audits
    await AuditAsset.update(
      { auditorId: null },
      { where: { auditorId: userId }, transaction }
    );

    // 8. Dissociate department head
    await Department.update(
      { departmentHeadId: null },
      { where: { departmentHeadId: userId }, transaction }
    );

    // 9. Delete the User record
    await User.destroy({
      where: { id: userId },
      transaction
    });

    await transaction.commit();

    return res.json({ message: 'Account permanently deleted successfully.' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: 'Failed to delete account.', error: error.message });
  }
});

module.exports = router;
