const express = require('express');
const axios = require('axios');
const { query, validationResult } = require('express-validator');

const router = express.Router();

const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

router.get('/', [
  query('lat').isFloat({ min: -90, max: 90 }),
  query('lon').isFloat({ min: -180, max: 180 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) return res.status(503).json({ error: 'Weather API not configured' });

    const { data } = await axios.get(OPENWEATHER_URL, {
      params: {
        lat: req.query.lat,
        lon: req.query.lon,
        appid: key,
        units: 'metric',
      },
    });
    res.json({
      temp: data.main?.temp,
      description: data.weather?.[0]?.description,
      wind_speed: data.wind?.speed,
      humidity: data.main?.humidity,
      icon: data.weather?.[0]?.icon,
    });
  } catch (err) {
    console.error('Weather error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

module.exports = router;
