const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public: list all active boats
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.owner_id, b.boat_name, b.capacity, b.description, b.photos, b.location, b.price_per_person, b.is_active, b.created_at,
              u.name AS owner_name
       FROM boats b
       JOIN users u ON b.owner_id = u.id
       WHERE b.is_active AND (u.role != 'boat_owner' OR u.approved = true)
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list boats' });
  }
});

// Protected: owner's boats
router.get('/mine', verifyToken, requireRole('boat_owner'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM boats WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list your boats' });
  }
});

const boatValidation = [
  body('boat_name').trim().notEmpty(),
  body('capacity').isInt({ min: 1 }),
  body('description').optional().trim(),
  body('photos').optional().isArray(),
  body('location').optional().trim(),
  body('price_per_person').optional().isFloat({ min: 0 }),
  body('is_active').optional().isBoolean(),
];

router.post('/', verifyToken, requireRole('boat_owner'), boatValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { boat_name, capacity, description, photos, location, price_per_person, is_active } = req.body;
    const result = await pool.query(
      `INSERT INTO boats (owner_id, boat_name, capacity, description, photos, location, price_per_person, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, boat_name, capacity, description || null, photos || [], location || null, price_per_person ?? null, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create boat' });
  }
});

router.put('/:id', verifyToken, requireRole('boat_owner'), boatValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const ownerCheck = await pool.query('SELECT owner_id FROM boats WHERE id = $1', [req.params.id]);
    if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Boat not found' });
    if (ownerCheck.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not your boat' });

    const { boat_name, capacity, description, photos, location, price_per_person, is_active } = req.body;
    const result = await pool.query(
      `UPDATE boats SET boat_name = $1, capacity = $2, description = $3, photos = COALESCE($4, photos), location = $5, price_per_person = $6, is_active = COALESCE($7, is_active)
       WHERE id = $8 RETURNING *`,
      [boat_name, capacity, description || null, photos, location || null, price_per_person ?? null, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update boat' });
  }
});

router.delete('/:id', verifyToken, requireRole('boat_owner'), async (req, res) => {
  try {
    const ownerCheck = await pool.query('SELECT owner_id FROM boats WHERE id = $1', [req.params.id]);
    if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Boat not found' });
    if (ownerCheck.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not your boat' });
    await pool.query('DELETE FROM boats WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete boat' });
  }
});

module.exports = router;
