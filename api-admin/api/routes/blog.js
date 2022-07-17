const express = require('express')
const UserCheckAuth = require('../middleware/user-check-auth')
const MakeRequest = require('../middleware/make-request')
const BlogController = require('../controllers/blog')
const moment = require('moment')
const multer = require('multer')
const router = express.Router()
const fs = require('fs')

const storageDetails = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/blog'
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
  BlogController.add
)
router.get('/', MakeRequest, UserCheckAuth, BlogController.get)
router.get('/investor', MakeRequest, UserCheckAuth, BlogController.getInvestor)
router.get('/investor/:id', MakeRequest, BlogController.getInvestorById)
router.get(
  '/blog-consultant/:id',
  MakeRequest,
  BlogController.getBlogConsultant
)
router.get('/:id', BlogController.getBlogById)
router.delete('/:id', BlogController.deleteBlog)

module.exports = router
