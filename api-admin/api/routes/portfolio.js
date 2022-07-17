const express = require('express')
const router = express.Router()

const portfolioController = require('../controllers/portfolio')
const MakeRequest = require('../middleware/make-request')
const userCheckAuth = require('../middleware/user-check-auth')

router.get('/', userCheckAuth, MakeRequest, portfolioController.getAll)
router.post('/', userCheckAuth, MakeRequest, portfolioController.add)
router.get(
  '/drop-down',
  userCheckAuth,
  MakeRequest,
  portfolioController.drop_down
)
router.patch('/:id', userCheckAuth, MakeRequest, portfolioController.detail)
router.get(
  '/all/price',
  userCheckAuth,
  MakeRequest,
  portfolioController.priceCalc
)

module.exports = router
