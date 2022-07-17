const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const AdminModel = require('../models/admin')
const UserModel = require('../models/user')
const admin = require('../models/admin')
module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_KEY)

    req.userData = decoded

    const { id } = decoded
    const adminData = await AdminModel.findOne({ _id: id })
    let userFlag = 0
    let adminFlag = 0
    const userData = await UserModel.findOne({ _id: id })
    if (userData === null && adminData === null) {
      return res.status(401).json({
        message: 'Auth fail',
      })
    }

    if (userData) userFlag = userData.flag
    if (adminData) adminFlag = adminData.flag

    if (userFlag === 1 || adminFlag === 1) {
      if (userData) req.userData = userData
      if (adminData) req.userData = adminData
    } else {
      return res.status(401).json({
        message: 'Auth fail',
      })
    }

    next()
  } catch (err) {
    return res.status(401).json({
      message: 'Auth fail',
    })
  }
}
