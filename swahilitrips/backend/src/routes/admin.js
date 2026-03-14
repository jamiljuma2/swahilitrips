const express = require('express');
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, approved, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id/approve', async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET approved = true WHERE id = $1 AND role = $2',
      [req.params.id, 'boat_owner']
    );
    const result = await pool.query(
      'SELECT id, name, email, role, approved FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bk.*, t.trip_type, b.boat_name, u.name AS tourist_name, u.email AS tourist_email
       FROM bookings bk
       JOIN trips t ON bk.trip_id = t.id
       JOIN boats b ON t.boat_id = b.id
       JOIN users u ON bk.user_id = u.id
       ORDER BY bk.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const [bookings, revenue, commission, users] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM bookings'),
      pool.query("SELECT COALESCE(SUM(total_price), 0) AS total FROM bookings WHERE payment_status = 'paid'"),
      pool.query("SELECT COALESCE(SUM(platform_commission), 0) AS total FROM bookings WHERE payment_status = 'paid'"),
      pool.query('SELECT COUNT(*) AS total FROM users'),
    ]);
    res.json({
      total_bookings: parseInt(bookings.rows[0].total, 10),
      total_revenue: parseFloat(revenue.rows[0].total),
      total_commission: parseFloat(commission.rows[0].total),
      total_users: parseInt(users.rows[0].total, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
