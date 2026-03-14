const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const PLATFORM_COMMISSION_RATE = 0.15;

const router = express.Router();

const bookingValidation = [
  body('trip_id').isUUID(),
  body('booking_date').isISO8601(),
  body('passenger_count').isInt({ min: 1 }),
];

// Tourist: create booking
router.post('/', verifyToken, requireRole('tourist'), bookingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { trip_id, booking_date, passenger_count } = req.body;
    const tripResult = await pool.query(
      'SELECT t.id, t.price, t.boat_id FROM trips t JOIN boats b ON t.boat_id = b.id WHERE t.id = $1 AND t.is_active AND b.is_active',
      [trip_id]
    );
    if (tripResult.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    const trip = tripResult.rows[0];
    const total_price = Number(trip.price) * passenger_count;
    const platform_commission = Math.round(total_price * PLATFORM_COMMISSION_RATE * 100) / 100;

    const result = await pool.query(
      `INSERT INTO bookings (user_id, trip_id, booking_date, passenger_count, status, payment_status, total_price, platform_commission)
       VALUES ($1, $2, $3, $4, 'pending', 'pending', $5, $6)
       RETURNING *`,
      [req.user.id, trip_id, booking_date, passenger_count, total_price, platform_commission]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Tourist: my bookings
router.get('/mine', verifyToken, requireRole('tourist'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bk.*, t.trip_type, t.duration_hours, t.price AS unit_price, b.boat_name, b.location, u.name AS owner_name
       FROM bookings bk
       JOIN trips t ON bk.trip_id = t.id
       JOIN boats b ON t.boat_id = b.id
       JOIN users u ON b.owner_id = u.id
       WHERE bk.user_id = $1
       ORDER BY bk.booking_date DESC, bk.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Boat owner: incoming bookings for their trips
router.get('/incoming', verifyToken, requireRole('boat_owner'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bk.*, t.trip_type, t.duration_hours, t.price AS unit_price, b.boat_name, u_tourist.name AS tourist_name, u_tourist.email AS tourist_email, u_tourist.phone AS tourist_phone
       FROM bookings bk
       JOIN trips t ON bk.trip_id = t.id
       JOIN boats b ON t.boat_id = b.id
       JOIN users u_tourist ON bk.user_id = u_tourist.id
       WHERE b.owner_id = $1
       ORDER BY bk.booking_date DESC, bk.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch incoming bookings' });
  }
});

// Boat owner: update booking status (accept/reject)
router.put('/:id/status', verifyToken, requireRole('boat_owner'), [
  body('status').isIn(['confirmed', 'rejected']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const ownerCheck = await pool.query(
      `SELECT bk.id FROM bookings bk JOIN trips t ON bk.trip_id = t.id JOIN boats b ON t.boat_id = b.id WHERE bk.id = $1 AND b.owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    await pool.query(
      "UPDATE bookings SET status = $1 WHERE id = $2",
      [req.body.status, req.params.id]
    );
    const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Admin: all bookings
router.get('/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bk.*, t.trip_type, b.boat_name, u_tourist.name AS tourist_name, u_tourist.email AS tourist_email
       FROM bookings bk
       JOIN trips t ON bk.trip_id = t.id
       JOIN boats b ON t.boat_id = b.id
       JOIN users u_tourist ON bk.user_id = u_tourist.id
       ORDER BY bk.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;
