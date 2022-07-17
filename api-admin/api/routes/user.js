const express = require('express')
const router = express.Router()
const UserCheckAuth = require('../middleware/user-check-auth')
const AdminAuth = require('../middleware/admin-check-auth')
const UserController = require('../controllers/user')
const MakeRequest = require('../middleware/make-request')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')
const adminCheckAuth = require('../middleware/admin-check-auth')

const storageDetails = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'pancard_photo' || file.fieldname === 'image') {
      const dir = './uploads/user'
      fs.exists(dir, (exist) => {
        if (!exist) {
          return fs.mkdir(dir, (error) => cb(error, dir))
        }
        return cb(null, dir)
      })
    } else if (file.fieldname === 'statement') {
      const dir = './uploads/statement'
      fs.exists(dir, (exist) => {
        if (!exist) {
          return fs.mkdir(dir, (error) => cb(error, dir))
        }
        return cb(null, dir)
      })
    } else {
      const dir = './uploads/group'
      fs.exists(dir, (exist) => {
        if (!exist) {
          return fs.mkdir(dir, (error) => cb(error, dir))
        }
        return cb(null, dir)
      })
    }
  },
  filename: function (req, file, cb) {
    cb(null, moment().format('YYYY-MM-DD-HH-MM-SS') + '-' + file.originalname)
  },
})

const fileFilter = function (req, file, cb) {
  if (file.fieldname === 'statement') {
    if (
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true)
    } else {
      cb(new Error('Please upload statement with extension excel'), false)
    }
  } else {
    if (
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/gif' ||
      file.mimetype === 'image/svg'
    ) {
      cb(null, true)
    } else {
      cb(
        new Error('Please upload files with extension jpg,jpeg,png,svg,gif'),
        false
      )
    }
  }
}

const upload = multer({
  storage: storageDetails,
  fileFilter: fileFilter,
})

router.post(
  '/signup',
  MakeRequest,
  upload.fields([
    { name: 'pancard_photo', maxCount: 1 },
    { name: 'statement', maxCount: 1 },
    { name: 'group_pic', maxCount: 1 },
  ]),
  UserController.signup
)
// router.post('/signupAsInvestor', MakeRequest, UserController.signupAsInvestor)
router.post('/login', MakeRequest, UserController.login)
router.patch('/', MakeRequest, UserCheckAuth, UserController.detail)
router.put(
  '/:id',
  MakeRequest,
  UserCheckAuth,
  upload.fields([
    { name: 'pancard_photo', maxCount: 1 },
    { name: 'statement', maxCount: 1 },
    { name: 'group_pic', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  UserController.edit
)
router.post(
  '/verify/mobile/number',
  MakeRequest,
  UserCheckAuth,
  UserController.verifyMobile
)
router.post('/token', MakeRequest, UserController.addToken)
router.put('/phone/:id', MakeRequest, UserCheckAuth, UserController.editPhone)
router.post(
  '/change/password',
  MakeRequest,
  UserCheckAuth,
  UserController.changePassword
)
router.post('/forget/password', MakeRequest, UserController.forgetPassword)
router.post(
  '/verify/reset/password/code',
  MakeRequest,
  UserController.verifyResetPasswordCode
)
router.post('/reset/password', MakeRequest, UserController.resetPassword)

router.get('/', MakeRequest, UserController.get)
router.get('/members', MakeRequest, UserController.get)
router.get('/get-member', MakeRequest, UserCheckAuth, UserController.getMembers)
router.get(
  '/get-member/admin/:id',
  MakeRequest,
  adminCheckAuth,
  UserController.adminMember
)

router.put(
  '/change-status/:id',
  MakeRequest,
  AdminAuth,
  UserController.changeStatus
)

router.patch('/:id', MakeRequest, AdminAuth, UserController.userDetail)
router.post('/addToken', MakeRequest, UserCheckAuth, UserController.fbToken)

module.exports = router
