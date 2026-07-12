const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Asset, AssetAllocation, ResourceBooking, TransferRequest, MaintenanceRequest, Notification, ActivityLog, User, Department, AssetCategory } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/dashboard/kpis - KPI card details (all roles see overview)
router.get('/kpis', authenticate, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const availableCount = await Asset.count({ where: { status: 'Available' } });
    const allocatedCount = await Asset.count({ where: { status: 'Allocated' } });
    
    const activeMaintenance = await MaintenanceRequest.count({
      where: {
        status: { [Op.in]: ['Pending', 'Approved', 'Technician Assigned', 'In Progress'] }
      }
    });

    const activeBookings = await ResourceBooking.count({
      where: {
        status: { [Op.in]: ['Upcoming', 'Ongoing'] }
      }
    });

    const pendingTransfers = await TransferRequest.count({
      where: { status: 'Pending' }
    });

    // Upcoming returns: expected return is today or in future, allocation is Active
    const upcomingReturns = await AssetAllocation.count({
      where: {
        status: 'Active',
        expectedReturnDate: { [Op.gte]: todayStr }
      }
    });

    // Overdue returns: expected return is before today, allocation is Active
    const overdueReturns = await AssetAllocation.count({
      where: {
        status: 'Active',
        expectedReturnDate: { [Op.lt]: todayStr }
      }
    });

    return res.json({
      assetsAvailable: availableCount,
      assetsAllocated: allocatedCount,
      maintenanceActive: activeMaintenance,
      activeBookings: activeBookings,
      pendingTransfers: pendingTransfers,
      upcomingReturns: upcomingReturns,
      overdueReturns: overdueReturns
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compute dashboard KPIs.', error: error.message });
  }
});

// GET /api/dashboard/overdue - Overdue returns & upcoming return list
router.get('/overdue', authenticate, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Overdue items
    const overdue = await AssetAllocation.findAll({
      where: {
        status: 'Active',
        expectedReturnDate: { [Op.lt]: todayStr }
      },
      include: [
        { model: Asset, attributes: ['id', 'name', 'assetTag', 'serialNumber'] },
        { model: User, as: 'Employee', attributes: ['id', 'name', 'email'] },
        { model: Department, attributes: ['id', 'name'] }
      ],
      order: [['expectedReturnDate', 'ASC']]
    });

    // Upcoming return items (within next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const upcoming = await AssetAllocation.findAll({
      where: {
        status: 'Active',
        expectedReturnDate: {
          [Op.between]: [todayStr, nextWeekStr]
        }
      },
      include: [
        { model: Asset, attributes: ['id', 'name', 'assetTag', 'serialNumber'] },
        { model: User, as: 'Employee', attributes: ['id', 'name', 'email'] },
        { model: Department, attributes: ['id', 'name'] }
      ],
      order: [['expectedReturnDate', 'ASC']]
    });

    return res.json({ overdue, upcoming });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch overdue lists.', error: error.message });
  }
});

// GET /api/dashboard/analytics - Actionable operational insights (Admin / Manager only)
router.get('/analytics', authenticate, requireRole(['Admin', 'Asset Manager']), async (req, res) => {
  try {
    // 1. Asset utilization trends (allocated vs available vs maintenance by category)
    const categories = await AssetCategory.findAll({
      include: [{ model: Asset, attributes: ['status'] }]
    });

    const categoryBreakdown = categories.map(cat => {
      const statuses = cat.Assets.map(a => a.status);
      const total = statuses.length;
      const allocated = statuses.filter(s => s === 'Allocated').length;
      const available = statuses.filter(s => s === 'Available').length;
      const maintenance = statuses.filter(s => s === 'Under Maintenance').length;
      const other = total - (allocated + available + maintenance);

      return {
        categoryName: cat.name,
        total,
        allocated,
        available,
        maintenance,
        other,
        utilizationRate: total > 0 ? Math.round((allocated / total) * 100) : 0
      };
    });

    // 2. Department-wise allocations
    const departments = await Department.findAll({
      include: [{ model: AssetAllocation, where: { status: 'Active' }, required: false }]
    });
    
    const departmentAllocations = departments.map(d => ({
      departmentName: d.name,
      allocationCount: d.AssetAllocations.length
    }));

    // 3. Resource Booking Heatmap (booking density by hour of day: 00-23)
    const bookings = await ResourceBooking.findAll({
      where: { status: { [Op.ne]: 'Cancelled' } },
      attributes: ['startTime', 'endTime']
    });

    const hourDensity = Array(24).fill(0);
    bookings.forEach(b => {
      const startHour = new Date(b.startTime).getHours();
      const endHour = new Date(b.endTime).getHours();
      // Increment density index for each hour spanned
      for (let h = startHour; h <= endHour && h < 24; h++) {
        hourDensity[h]++;
      }
    });

    const bookingHeatmap = hourDensity.map((count, hour) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      return {
        label: `${displayHour}:00 ${ampm}`,
        hour,
        bookingsCount: count
      };
    });

    // 4. Maintenance frequency by category
    const maintenanceCounts = await MaintenanceRequest.findAll({
      include: [
        {
          model: Asset,
          attributes: ['id'],
          include: [{ model: AssetCategory, attributes: ['name'] }]
        }
      ]
    });

    const categoryMaintenance = {};
    maintenanceCounts.forEach(r => {
      if (r.Asset && r.Asset.AssetCategory) {
        const catName = r.Asset.AssetCategory.name;
        categoryMaintenance[catName] = (categoryMaintenance[catName] || 0) + 1;
      }
    });

    const maintenanceFrequency = Object.keys(categoryMaintenance).map(key => ({
      categoryName: key,
      ticketCount: categoryMaintenance[key]
    }));

    // 5. Assets due for maintenance or nearing retirement (Condition Poor or older assets)
    const actionRequiredAssets = await Asset.findAll({
      where: {
        [Op.or]: [
          { condition: 'Poor' },
          { status: 'Under Maintenance' },
          { acquisitionDate: { [Op.lt]: new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().split('T')[0] } } // 3+ years old
        ]
      },
      include: [{ model: AssetCategory, attributes: ['name'] }],
      limit: 10
    });

    return res.json({
      categoryBreakdown,
      departmentAllocations,
      bookingHeatmap,
      maintenanceFrequency,
      actionRequiredAssets
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch analytics.', error: error.message });
  }
});


// --- NOTIFICATIONS ---

// GET /api/dashboard/notifications - Retrieve current user's notifications (all users)
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 30
    });
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications.', error: error.message });
  }
});

// PUT /api/dashboard/notifications/read - Mark all notifications as read (all users)
router.put('/notifications/read', authenticate, async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id } }
    );
    return res.json({ message: 'Notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to clear notifications.', error: error.message });
  }
});


// --- GENERAL ACTIVITY LOGS ---

// GET /api/dashboard/logs - Activity audit log (Admin only)
router.get('/logs', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      include: [{ model: User, attributes: ['name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve activity log.', error: error.message });
  }
});

module.exports = router;
