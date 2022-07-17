const express = require('express')
const router = express.Router()
const usercheckAuth = require('../middleware/user-check-auth')
const Controller = require('../controllers/contact')
const MakeRequest = require('../middleware/make-request')

router.post('/', MakeRequest, Controller.addContact)

module.exports = router
