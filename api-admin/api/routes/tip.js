const express = require('express')
const UserCheckAuth = require('../middleware/user-check-auth')
const MakeRequest = require('../middleware/make-request')
const TipController = require('../controllers/tip')

const moment = require('moment')
const multer = require('multer')
const router = express.Router()
const fs = require('fs')
const adminCheckAuth = require('../middleware/admin-check-auth')

const storageDetails = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/'
    fs.exists(dir, (exist) => {
      if (!exist) {
        return fs.mkdir(dir, (error) => cb(error, dir))
      }
      return cb(null, dir)
    })
  },
  filename: function (req, file, cb) {
    cb(null, moment().format('YYYY-MM-DD-HH-MM-SS') + '-' + file.originalname)
  },
})

const fileFilter = function (req, file, cb) {
  // Reject file
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/svg' ||
    file.mimetype === 'image/gif'
  ) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'Please upload profile picture with extension jpg,jpeg,png,svg,gif'
      ),
      false
    )
  }
}

const upload = multer({
  storage: storageDetails,
  fileFilter: fileFilter,
})

router.post(
  '/',
  MakeRequest,
  UserCheckAuth,
  upload.single('image'),
  TipController.add
)
router.get('/', MakeRequest, UserCheckAuth, TipController.get)
router.get('/admin/:id', MakeRequest, adminCheckAuth, TipController.adminGet)
router.get('/admin', MakeRequest, adminCheckAuth, TipController.getTipsForAdmin)
router.put('/:id', MakeRequest, UserCheckAuth, TipController.cancelTipStatus)
router.get('/investor', MakeRequest, UserCheckAuth, TipController.getInvestor)
router.get('/:id', MakeRequest, TipController.userTipGet)
router.patch('/list', MakeRequest, TipController.getTipConsultant)
router.put('/status-change/:id', MakeRequest, TipController.tipStatusChange)
module.exports = router
