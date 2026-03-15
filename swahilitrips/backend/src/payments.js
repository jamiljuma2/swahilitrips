// payments.js
const axios = require('axios');
require('dotenv').config();

const LIPANA_API_URL = 'https://api.lipana.dev/v1';
const LIPANA_SECRET_KEY = process.env.LIPANA_API_KEY;

/**
 * Create a payment link using Lipana
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.description
 * @param {number} options.amount
 * @param {string} options.currency
 * @param {boolean} options.allowCustomAmount
 * @param {string} options.successRedirectUrl
 */
async function createPaymentLink({ title, description, amount, currency = 'KES', allowCustomAmount = false, successRedirectUrl }) {
  try {
    const response = await axios.post(
      `${LIPANA_API_URL}/payment-links`,
      {
        title,
        description,
        amount,
        currency,
        allowCustomAmount,
        successRedirectUrl,
      },
      {
        headers: {
          'x-api-key': LIPANA_SECRET_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating payment link:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Initiate STK push payment
 * @param {string} phone
 * @param {number} amount
 */
async function initiateStkPush(phone, amount) {
  try {
    const response = await axios.post(
      `${LIPANA_API_URL}/transactions/push-stk`,
      {
        phone,
        amount,
      },
      {
        headers: {
          'x-api-key': LIPANA_SECRET_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error initiating STK push:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createPaymentLink,
  initiateStkPush,
};
