const express = require('express');
const router = express.Router();
const makeRequest = require('../middleware/make-request');
const AdminCheckAuth = require('../middleware/admin-check-auth');
const CMSController = require('../controllers/cms');
const moment = require('moment');
const multer = require('multer');

const storageDetails = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/cms/');
  },
  filename: function (req, file, cb) {
    cb(null, moment().format('YYYY-MM-DD-HH-MM-SS') + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storageDetails,
});

router.get('/', makeRequest, AdminCheckAuth, CMSController.get);
router.post(
  '/',
  makeRequest,
  AdminCheckAuth,

  upload.single('banner_image'),
  CMSController.add
);
router.put(
  '/:id',
  makeRequest,
  AdminCheckAuth,

  upload.single('banner_image'),
  CMSController.edit
);
router.patch('/:id', makeRequest, AdminCheckAuth, CMSController.detail);
router.put(
  '/change-status/:id',
  makeRequest,
  AdminCheckAuth,

  CMSController.changeStatus
);
router.get('/website/:slug', makeRequest, CMSController.getWebsite);
router.delete('/:id', makeRequest, AdminCheckAuth, CMSController.delete);

module.exports = router;
