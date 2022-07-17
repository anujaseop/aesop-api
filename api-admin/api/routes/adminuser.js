const express = require('express');
const router = express.Router();
const AdminCheckAuth = require('../middleware/admin-check-auth');
const AdminUserController = require('../controllers/adminuser');
const MakeRequest = require('../middleware/make-request');
const moment = require('moment');
const multer = require('multer');
const fs = require('fs');

router.post('/', MakeRequest, AdminCheckAuth, AdminUserController.add);
router.get('/', MakeRequest, AdminCheckAuth, AdminUserController.get);
router.put('/:id', MakeRequest, AdminCheckAuth, AdminUserController.edit);
router.delete('/:id', MakeRequest, AdminCheckAuth, AdminUserController.delete);
router.put(
  '/status/:id',
  MakeRequest,
  AdminCheckAuth,
  AdminUserController.status
);

module.exports = router;
