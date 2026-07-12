const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { ResourceBooking, Asset, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { logActivity, createNotification } = require('../utils/logger');

// GET /api/bookings - List bookings (accessible by all authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const { assetId, status } = req.query;
    const where = {};
    if (assetId) where.assetId = assetId;
    if (status) where.status = status;

    const bookings = await ResourceBooking.findAll({
      where,
      include: [
        { model: Asset, attributes: ['id', 'name', 'assetTag', 'location'] },
        { model: User, attributes: ['id', 'name', 'email'] }
      ],
      order: [['startTime', 'ASC']]
    });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bookings.', error: error.message });
  }
});

// POST /api/bookings - Book a shared resource with overlap check (All users)
router.post('/', authenticate, async (req, res) => {
  try {
    const { assetId, startTime, endTime } = req.body;

    if (!assetId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Asset ID, start time, and end time are required.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    if (!asset.sharedBookable) {
      return res.status(400).json({ message: 'This asset is not marked as a shared bookable resource.' });
    }

    // Overlap validation check:
    // Existing: [est, eet]. Request: [rst, ret]
    // Overlap if: rst < eet AND ret > est
    const overlappingBooking = await ResourceBooking.findOne({
      where: {
        assetId,
        status: { [Op.ne]: 'Cancelled' },
        startTime: { [Op.lt]: end },
        endTime: { [Op.gt]: start }
      },
      include: [{ model: User, attributes: ['name'] }]
    });

    if (overlappingBooking) {
      const holder = overlappingBooking.User ? overlappingBooking.User.name : 'Another employee';
      const formatTime = (t) => new Date(t).toLocaleString();
      return res.status(409).json({
        message: `Time-slot conflict. This resource is already booked by ${holder} from ${formatTime(overlappingBooking.startTime)} to ${formatTime(overlappingBooking.endTime)}.`,
        conflict: overlappingBooking
      });
    }

    const booking = await ResourceBooking.create({
      assetId,
      userId: req.user.id,
      startTime: start,
      endTime: end,
      status: 'Upcoming'
    });

    await logActivity({
      userId: req.user.id,
      action: 'BOOK_RESOURCE',
      targetType: 'Asset',
      targetId: assetId,
      details: `Booked ${asset.name} (${asset.assetTag}) for ${start.toISOString()} to ${end.toISOString()}.`,
    });

    await createNotification({
      userId: req.user.id,
      message: `Your booking for ${asset.name} on ${start.toLocaleDateString()} has been confirmed.`,
      type: 'Booking Confirmed'
    });

    return res.status(201).json({ message: 'Resource booked successfully.', booking });
  } catch (error) {
    return res.status(500).json({ message: 'Booking failed.', error: error.message });
  }
});

// PUT /api/bookings/:id/cancel - Cancel a booking
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await ResourceBooking.findByPk(req.params.id, {
      include: [{ model: Asset }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Only creator or Admin/Asset Manager can cancel
    if (booking.userId !== req.user.id && !['Admin', 'Asset Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not authorized to cancel this booking.' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    await logActivity({
      userId: req.user.id,
      action: 'CANCEL_BOOKING',
      targetType: 'Asset',
      targetId: booking.assetId,
      details: `Cancelled booking for ${booking.Asset.name}.`,
    });

    await createNotification({
      userId: booking.userId,
      message: `Booking for ${booking.Asset.name} has been cancelled.`,
      type: 'Booking Cancelled'
    });

    return res.json({ message: 'Booking cancelled successfully.', booking });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel booking.', error: error.message });
  }
});

// PUT /api/bookings/:id/reschedule - Reschedule a booking
router.put('/:id/reschedule', authenticate, async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    const booking = await ResourceBooking.findByPk(req.params.id, {
      include: [{ model: Asset }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId !== req.user.id && !['Admin', 'Asset Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not authorized to reschedule this booking.' });
    }

    // Check overlap excluding this booking itself
    const overlappingBooking = await ResourceBooking.findOne({
      where: {
        id: { [Op.ne]: booking.id },
        assetId: booking.assetId,
        status: { [Op.ne]: 'Cancelled' },
        startTime: { [Op.lt]: end },
        endTime: { [Op.gt]: start }
      },
      include: [{ model: User, attributes: ['name'] }]
    });

    if (overlappingBooking) {
      const holder = overlappingBooking.User ? overlappingBooking.User.name : 'Another employee';
      return res.status(409).json({
        message: `Time-slot conflict. Already booked by ${holder} from ${new Date(overlappingBooking.startTime).toLocaleString()} to ${new Date(overlappingBooking.endTime).toLocaleString()}.`,
        conflict: overlappingBooking
      });
    }

    booking.startTime = start;
    booking.endTime = end;
    booking.status = 'Upcoming';
    await booking.save();

    await logActivity({
      userId: req.user.id,
      action: 'RESCHEDULE_BOOKING',
      targetType: 'Asset',
      targetId: booking.assetId,
      details: `Rescheduled booking for ${booking.Asset.name} to ${start.toISOString()} - ${end.toISOString()}.`,
    });

    await createNotification({
      userId: booking.userId,
      message: `Your booking for ${booking.Asset.name} was rescheduled to ${start.toLocaleDateString()}.`,
      type: 'Booking Confirmed'
    });

    return res.json({ message: 'Booking rescheduled successfully.', booking });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reschedule booking.', error: error.message });
  }
});

module.exports = router;
