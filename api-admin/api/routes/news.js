const express = require('express');
const router = express.Router();
const AdminCheckAuth = require('../middleware/admin-check-auth');
const NewsController = require('../controllers/news');
const MakeRequest = require('../middleware/make-request');
const moment = require('moment');
const multer = require('multer');
const fs = require('fs');
const userCheckAuth = require('../middleware/user-check-auth');
const adminCheckAuth = require('../middleware/admin-check-auth');

const storageDetails = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/news/');
  },
  filename: function (req, file, cb) {
    cb(null, moment().format('YYYY-MM-DD-HH-MM-SS') + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storageDetails,
});

router.post(
  '/',
  MakeRequest,
  adminCheckAuth,
  upload.single('news_image'),
  NewsController.add
);
router.get('/', MakeRequest, adminCheckAuth, NewsController.get);
router.put(
  '/:id',
  MakeRequest,
  adminCheckAuth,
  upload.single('news_image'),
  NewsController.edit
);
router.get('/news-list/:id', NewsController.getNewsById);
router.get('/news-list', MakeRequest, NewsController.getNewsForInvestor);
router.put('/status/:id', MakeRequest, adminCheckAuth, NewsController.status);
router.delete('/:id', MakeRequest, adminCheckAuth, NewsController.delete);

module.exports = router;
