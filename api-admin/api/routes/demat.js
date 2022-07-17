const express = require('express')
const router = express.Router()
//const AdminUserCheckAuth = require('../middleware/adminuser-check-auth')
const DematController = require('../controllers/demat')
const MakeRequest = require('../middleware/make-request')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')

router.post('/', MakeRequest, DematController.add)
router.get('/',MakeRequest, DematController.get)

module.exports = router