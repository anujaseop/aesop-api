const express = require('express')
const router = express.Router()
const AdminCheckAuth = require('../middleware/admin-check-auth')
const AdminController = require('../controllers/admin')
const MakeRequest = require('../middleware/make-request')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')

const storageDetails = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/admin'
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

router.post('/signup', MakeRequest, AdminController.signup)
router.post('/login', MakeRequest, AdminController.login)
router.patch('/', MakeRequest, AdminCheckAuth, AdminController.detail)
router.put(
  '/:id',
  MakeRequest,
  AdminCheckAuth,
  upload.single('image'),
  AdminController.edit
)
router.get('/consultant', MakeRequest, AdminController.Consultant)

router.put(
  '/change-password/:id',
  MakeRequest,
  AdminCheckAuth,
  AdminController.change_password
)
module.exports = router
