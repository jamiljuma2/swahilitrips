const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public: reviews for a trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.user_id, r.trip_id, r.rating, r.comment, r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.trip_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.tripId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Tourist: create review (after completed booking)
router.post('/', verifyToken, requireRole('tourist'), [
  body('trip_id').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { trip_id, rating, comment } = req.body;
    const completed = await pool.query(
      "SELECT id FROM bookings WHERE user_id = $1 AND trip_id = $2 AND status = 'completed'",
      [req.user.id, trip_id]
    );
    if (completed.rows.length === 0) {
      return res.status(400).json({ error: 'You can only review trips you have completed' });
    }
    const existing = await pool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND trip_id = $2',
      [req.user.id, trip_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already reviewed this trip' });
    }
    const result = await pool.query(
      `INSERT INTO reviews (user_id, trip_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, trip_id, rating, comment || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = router;
