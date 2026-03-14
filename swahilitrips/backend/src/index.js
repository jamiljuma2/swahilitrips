require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { WebSocketServer } = require('ws');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const boatsRoutes = require('./routes/boats');
const tripsRoutes = require('./routes/trips');
const bookingsRoutes = require('./routes/bookings');
const paymentsRoutes = require('./routes/payments');
const reviewsRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const trackingRoutes = require('./routes/tracking');
const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: allow frontend origin(s). Comma-separated in env or single value.
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin
  ? corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
  : true;
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (allowedOrigins === true) return cb(null, true);
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests' },
  })
);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/boats', boatsRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/weather', weatherRoutes);

const server = app.listen(PORT, () => {
  console.log(`SwahiliTrips API running on port ${PORT}`);
});

// WebSocket server for boat tracking (optional real-time updates)
const wss = new WebSocketServer({ server, path: '/ws/tracking' });
const trackingClients = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const boatId = url.searchParams.get('boatId');
  if (boatId) {
    if (!trackingClients.has(boatId)) trackingClients.set(boatId, new Set());
    trackingClients.get(boatId).add(ws);
  }
  ws.on('close', () => {
    if (boatId && trackingClients.has(boatId)) {
      trackingClients.get(boatId).delete(ws);
      if (trackingClients.get(boatId).size === 0) trackingClients.delete(boatId);
    }
  });
});

function broadcastBoatLocation(boatId, data) {
  const clients = trackingClients.get(boatId);
  if (clients)
    clients.forEach((ws) => {
      if (ws.readyState === 1) ws.send(JSON.stringify(data));
    });
}

module.exports = { app, server, broadcastBoatLocation };
