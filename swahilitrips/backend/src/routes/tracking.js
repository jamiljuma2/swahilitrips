const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public or authenticated: get latest boat location (for map polling)
router.get('/:boatId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bl.id, bl.boat_id, bl.latitude, bl.longitude, bl.updated_at
       FROM boat_locations bl
       WHERE bl.boat_id = $1
       ORDER BY bl.updated_at DESC
       LIMIT 1`,
      [req.params.boatId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No location data' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Boat owner: update boat location
router.post('/:boatId', verifyToken, requireRole('boat_owner'), [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const ownerCheck = await pool.query('SELECT id FROM boats WHERE id = $1 AND owner_id = $2', [
      req.params.boatId,
      req.user.id,
    ]);
    if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Boat not found' });

    const { latitude, longitude } = req.body;
    await pool.query(
      'INSERT INTO boat_locations (boat_id, latitude, longitude) VALUES ($1, $2, $3)',
      [req.params.boatId, latitude, longitude]
    );
    const result = await pool.query(
      `SELECT id, boat_id, latitude, longitude, updated_at FROM boat_locations
       WHERE boat_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [req.params.boatId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

module.exports = router;
