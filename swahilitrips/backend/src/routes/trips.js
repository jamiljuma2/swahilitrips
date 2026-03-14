const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const TRIP_TYPES = ['boat_ride', 'island_tour', 'fishing_trip', 'dhow_sunset_cruise', 'snorkeling', 'inter_island_transport'];

// Public: list trips with filters
router.get('/', [
  query('category').optional().isIn(TRIP_TYPES),
  query('location').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('minRating').optional().isFloat({ min: 0, max: 5 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    let sql = `
      SELECT t.id, t.boat_id, t.trip_type, t.duration_hours, t.schedule, t.price, t.is_active, t.created_at,
             b.boat_name, b.capacity, b.description, b.photos, b.location AS boat_location,
             u.name AS owner_name,
             COALESCE(AVG(r.rating), 0) AS avg_rating,
             COUNT(r.id)::int AS review_count
      FROM trips t
      JOIN boats b ON t.boat_id = b.id
      JOIN users u ON b.owner_id = u.id
      LEFT JOIN reviews r ON r.trip_id = t.id
      WHERE t.is_active AND b.is_active AND (u.role != 'boat_owner' OR u.approved = true)
    `;
    const params = [];
    let i = 1;
    if (req.query.category) { sql += ` AND t.trip_type = $${i++}`; params.push(req.query.category); }
    if (req.query.location) { sql += ` AND b.location ILIKE $${i++}`; params.push(`%${req.query.location}%`); }
    if (req.query.minPrice) { sql += ` AND t.price >= $${i++}`; params.push(parseFloat(req.query.minPrice)); }
    if (req.query.maxPrice) { sql += ` AND t.price <= $${i++}`; params.push(parseFloat(req.query.maxPrice)); }
    sql += ' GROUP BY t.id, b.id, u.id';
    if (req.query.minRating) {
      sql += ` HAVING AVG(r.rating) >= $${i++}`;
      params.push(parseFloat(req.query.minRating));
    }
    sql += ' ORDER BY t.created_at DESC';

    const result = await pool.query(sql, params);
    const rows = result.rows.map(r => ({
      ...r,
      avg_rating: parseFloat(r.avg_rating),
    }));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list trips' });
  }
});

// Public: trip details
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.boat_id, t.trip_type, t.duration_hours, t.schedule, t.price, t.is_active, t.created_at,
              b.boat_name, b.capacity, b.description, b.photos, b.location AS boat_location, b.owner_id,
              u.name AS owner_name, u.phone AS owner_phone
       FROM trips t
       JOIN boats b ON t.boat_id = b.id
       JOIN users u ON b.owner_id = u.id
       WHERE t.id = $1 AND t.is_active AND b.is_active`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    const trip = result.rows[0];
    const reviewsResult = await pool.query(
      `SELECT r.id, r.user_id, r.rating, r.comment, r.created_at, u.name AS user_name
       FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.trip_id = $1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    trip.reviews = reviewsResult.rows;
    const avgRating = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) AS avg FROM reviews WHERE trip_id = $1',
      [req.params.id]
    );
    trip.avg_rating = parseFloat(avgRating.rows[0].avg);
    trip.review_count = reviewsResult.rows.length;
    res.json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

const tripValidation = [
  body('boat_id').isUUID(),
  body('trip_type').isIn(TRIP_TYPES),
  body('duration_hours').isFloat({ min: 0.1 }),
  body('schedule').optional().isObject(),
  body('price').isFloat({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

router.post('/', verifyToken, requireRole('boat_owner'), tripValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const boatCheck = await pool.query('SELECT owner_id FROM boats WHERE id = $1', [req.body.boat_id]);
    if (boatCheck.rows.length === 0) return res.status(404).json({ error: 'Boat not found' });
    if (boatCheck.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not your boat' });

    const { boat_id, trip_type, duration_hours, schedule, price, is_active } = req.body;
    const result = await pool.query(
      `INSERT INTO trips (boat_id, trip_type, duration_hours, schedule, price, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [boat_id, trip_type, duration_hours, schedule || {}, price, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

router.put('/:id', verifyToken, requireRole('boat_owner'), tripValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const tripCheck = await pool.query(
      'SELECT t.id, b.owner_id FROM trips t JOIN boats b ON t.boat_id = b.id WHERE t.id = $1',
      [req.params.id]
    );
    if (tripCheck.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    if (tripCheck.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not your trip' });

    const { boat_id, trip_type, duration_hours, schedule, price, is_active } = req.body;
    const result = await pool.query(
      `UPDATE trips SET boat_id = $1, trip_type = $2, duration_hours = $3, schedule = COALESCE($4, schedule), price = $5, is_active = COALESCE($6, is_active)
       WHERE id = $7 RETURNING *`,
      [boat_id, trip_type, duration_hours, schedule || {}, price, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

router.delete('/:id', verifyToken, requireRole('boat_owner'), async (req, res) => {
  try {
    const tripCheck = await pool.query(
      'SELECT b.owner_id FROM trips t JOIN boats b ON t.boat_id = b.id WHERE t.id = $1',
      [req.params.id]
    );
    if (tripCheck.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    if (tripCheck.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not your trip' });
    await pool.query('DELETE FROM trips WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

module.exports = router;
