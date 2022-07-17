const express = require('express')
const router = express.Router()
//const AdminUserCheckAuth = require('../middleware/adminuser-check-auth')
const ConsultantPaymentController = require('../controllers/consultant_payment')
const MakeRequest = require('../middleware/make-request')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')

router.post('/', MakeRequest, ConsultantPaymentController.add)
router.get('/:id', MakeRequest, ConsultantPaymentController.all)
router.patch('/admin', MakeRequest, ConsultantPaymentController.adminAll)

module.exports = router
