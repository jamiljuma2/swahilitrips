const { createPaymentLink, initiateStkPush } = require('../payments');
// Lipana: Create payment link
router.post('/create-payment-link', async (req, res) => {
  try {
    const { title = 'SwahiliTrips Payment', description = 'Booking payment', amount, currency = 'KES', allowCustomAmount = false, successRedirectUrl } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required' });
    const paymentLink = await createPaymentLink({ title, description, amount, currency, allowCustomAmount, successRedirectUrl });
    res.json(paymentLink);
  } catch (err) {
    console.error('Lipana create-payment-link error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to create payment link' });
  }
});

// Lipana: Initiate STK push
router.post('/initiate-stk-push', async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;
    if (!phoneNumber || !amount) return res.status(400).json({ error: 'phoneNumber and amount required' });
    const result = await initiateStkPush(phoneNumber, amount);
    res.json(result);
  } catch (err) {
    console.error('Lipana initiate-stk-push error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to initiate STK push' });
  }
});
const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const MPESA_OAUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const MPESA_STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

async function getMpesaToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error('M-Pesa credentials not configured');
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const { data } = await axios.get(MPESA_OAUTH_URL, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return data.access_token;
}

// Initiate STK Push (tourist after creating booking)
router.post('/mpesa/initiate', verifyToken, requireRole('tourist'), [
  body('booking_id').isUUID(),
  body('phone').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { booking_id, phone } = req.body;
    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND payment_status = $3',
      [booking_id, req.user.id, 'pending']
    );
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or already paid' });
    }
    const booking = bookingResult.rows[0];
    const amount = Number(booking.total_price) + Number(booking.platform_commission);
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    if (!shortcode || !passkey || !callbackUrl) {
      return res.status(503).json({ error: 'M-Pesa not configured' });
    }

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const token = await getMpesaToken();
    const phoneFormatted = phone.startsWith('+') ? phone.replace(/\D/g, '') : `254${phone.replace(/^0/, '')}`;

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneFormatted,
      PartyB: shortcode,
      PhoneNumber: phoneFormatted,
      CallBackURL: callbackUrl,
      AccountReference: booking_id.slice(0, 12),
      TransactionDesc: `SwahiliTrips booking ${booking_id.slice(0, 8)}`,
    };

    const { data } = await axios.post(MPESA_STK_URL, stkPayload, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    await pool.query(
      `INSERT INTO payments (booking_id, phone_number, amount, status, callback_data)
       VALUES ($1, $2, $3, 'pending', $4)`,
      [booking_id, phoneFormatted, amount, JSON.stringify({ CheckoutRequestID: data.CheckoutRequestID, response: data })]
    );

    res.json({
      message: 'STK Push sent. Complete payment on your phone.',
      CheckoutRequestID: data.CheckoutRequestID,
    });
  } catch (err) {
    console.error('M-Pesa initiate error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.errorMessage || 'Payment initiation failed' });
  }
});

// Webhook from Safaricom
router.post('/mpesa/callback', express.json(), async (req, res) => {
  res.status(200).send(); // acknowledge immediately
  const body = req.body;
  if (!body.Body?.stkCallback) return;
  const cb = body.Body.stkCallback;
  const resultCode = cb.ResultCode;
  const success = resultCode === 0;
  const metadata = cb.CallbackMetadata?.Item || [];
  const getItem = (id) => metadata.find((i) => i.Name === id)?.Value;
  const mpesaReceipt = getItem('MpesaReceiptNumber');
  const amount = getItem('Amount');
  const phone = getItem('PhoneNumber');

  try {
    const checkoutRequestId = cb.CheckoutRequestID;
    const paymentResult = await pool.query(
      "SELECT id, booking_id FROM payments WHERE callback_data->>'CheckoutRequestID' = $1 ORDER BY created_at DESC LIMIT 1",
      [checkoutRequestId]
    );
    if (paymentResult.rows.length === 0) return;
    const payment = paymentResult.rows[0];
    await pool.query(
      'UPDATE payments SET status = $1, mpesa_transaction_id = $2, callback_data = $3 WHERE id = $4',
      [success ? 'paid' : 'failed', mpesaReceipt || null, JSON.stringify(body), payment.id]
    );
    if (success) {
      await pool.query(
        "UPDATE bookings SET payment_status = 'paid', status = 'confirmed' WHERE id = $1",
        [payment.booking_id]
      );
    }
  } catch (e) {
    console.error('Callback update error:', e);
  }
});

// Get payment status for a booking
router.get('/:bookingId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.params.bookingId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No payment found' });
    const payment = result.rows[0];
    const bookingResult = await pool.query('SELECT user_id FROM bookings WHERE id = $1', [req.params.bookingId]);
    if (bookingResult.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    if (bookingResult.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

module.exports = router;
