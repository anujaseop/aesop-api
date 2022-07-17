const express = require('express');
const router = express.Router();
//const AdminUserCheckAuth = require('../middleware/adminuser-check-auth')
const payController = require('../controllers/payController');
const MakeRequest = require('../middleware/make-request');
const fs = require('fs');

router.post('/payment/payumoney', payController.payUMoneyPayment);
router.post(
  '/payment/payumoney_hash',
  payController.payUMoney_CheckoutPro_Hash
);
router.post(
  '/payment/payumoney/response',
  payController.payUMoneyPaymentResponse
);

// Razor Pay
router.post('/payment/create-order', payController.createOrder);

module.exports = router;
