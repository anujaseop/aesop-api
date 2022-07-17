const express = require('express')
const router = express.Router()
const UserCheckAuth = require('../middleware/user-check-auth')
const AdminUserCheckAuth = require('../middleware/admin-or-user-check-auth')
const notificationController = require('../controllers/notification')
const MakeRequest = require('../middleware/make-request')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')

router.post('/', MakeRequest, AdminUserCheckAuth, notificationController.add)
router.get('/', MakeRequest, UserCheckAuth, notificationController.get)

module.exports = router
