const jwt = require('jsonwebtoken')

const UserModel = require('../models/user')
module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_KEY)

    const { id } = decoded
    const userData = await UserModel.findOne({ _id: id })

    if (userData === null || userData.flag !== 1) {
      return res.status(401).json({
        message: 'Auth fail',
      })
    }
    req.userData = userData

    next()
  } catch (err) {
    return res.status(401).json({
      message: 'Auth fail',
    })
  }
}
