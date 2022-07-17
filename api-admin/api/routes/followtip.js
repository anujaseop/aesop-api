const express = require('express')
const router = express.Router()
const CheckAuth = require('../middleware/user-check-auth')
const FollowTipController = require('../controllers/followtip')
const MakeRequest = require('../middleware/make-request')

router.post('/', MakeRequest, CheckAuth, FollowTipController.add)
router.get('/:id', MakeRequest, CheckAuth, FollowTipController.get)

module.exports = router
