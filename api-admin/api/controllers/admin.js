const niv = require('node-input-validator')
const AdminDB = require('../models/admin')
const UserDB = require('../models/user')
const Helper = require('../helper/index')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const moment = require('moment')
const fs = require('fs')

exports.signup = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    name: 'required|maxLength:50',
    email: 'required|email',
    password: 'required|minLength:6',
  })
  const matched = await objValidation.check()

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors })
  }

  const { email, name, password } = req.body

  try {
    const adminData = await AdminDB.find({ email: email })
    if (adminData.length > 0) {
      return res.status(409).json({
        message: 'Email exists',
      })
    }

    const hash = await bcrypt.hash(password, 10)
    const admin = new AdminDB({
      _id: new mongoose.Types.ObjectId(),
      email: email,
      name: name,
      password: hash,
      flag: 1,
    })

    const result = await admin.save()
    res.status(201).json({
      message: 'Admin register successfully',
    })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    })
  }
}

exports.login = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    email: 'required|email|maxLength:50',
    password: 'required|minLength:6',
  })
  const matched = await objValidation.check()

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors })
  }

  try {
    const admin = await AdminDB.findOne({ email: req.body.email })

    if (admin === null) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }
    const passwordResult = await bcrypt.compare(
      req.body.password,
      admin.password
    )
    if (passwordResult === false) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    const token = jwt.sign(
      {
        email: admin.email,
        id: admin._id,
      },
      process.env.JWT_KEY,
      {
        expiresIn: '10d',
      }
    )
    return res.status(200).json({
      message: 'Auth Successfull',
      token: token,
      admin: admin,
    })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    })
  }
}

exports.detail = async (req, res, next) => {
  try {
    const admin = req.userData
    admin.image = await Helper.getValidImageUrl(admin.image, admin.name)
    return res.status(200).json({
      message: 'Profile returned successfully',
      admin: admin,
    })
  } catch (err) {
    return res.status(500).json({
      message: 'Auth Fail',
      error: err,
    })
  }
}

exports.edit = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    name: 'required|maxLength:50',
    email: 'required|email|maxLength:50',
  })
  const matched = await objValidation.check()

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors })
  }

  const { email, name, password } = req.body
  const id = req.params.id
  try {
    const updateObj = {}
    updateObj.name = name
    updateObj.email = email
    if (password) updateObj.password = await bcrypt.hash(password, 10)
    if (req.file) updateObj.image = req.file.path
    const admin = await AdminDB.updateOne({ _id: id }, { $set: updateObj })
    return res
      .status(202)
      .json({ message: 'Profile has been updated successfully', result: admin })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
    })
  }
}

exports.change_password = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    old_password: 'required|minLength:6',
    new_password: 'required|minLength:6',
  })
  const matched = await objValidation.check()

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors })
  }
  let old_password = req.body.old_password
  let new_password = req.body.new_password
  const id = req.params.id
  const admin = req.userData

  try {
    const passwordResult = await bcrypt.compare(old_password, admin.password)
    if (passwordResult === false) {
      return res.status(409).json({
        message: 'Your old password is incorrect',
      })
    }
    const hash = await bcrypt.hash(new_password, 10)

    const result = await AdminDB.updateOne(
      { _id: id },
      { $set: { password: hash } }
    )
    return res.status(200).json({
      message: 'Password changed successfully',
      admin: result,
    })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
    })
  }
}

// get-consultant-users

exports.Consultant = async (req, res, next) => {
  try {
    let result
    if (Number(req.query.type) === 1) {
      result = await UserDB.aggregate([
        {
          $match: {
            role: 2,
            flag: 1,
          },
        },
        {
          $project: {
            first_name: 1,
            last_name: 1,
          },
        },
      ])
    } else {
      result = await UserDB.aggregate([
        {
          $match: {
            role: 1,
          },
        },
        {
          $project: {
            first_name: 1,
            last_name: 1,
            group_name: 1,
          },
        },
      ])
    }

    return res.status(200).json({
      message: 'consultant-users has been retrived',
      result: result,
    })
  } catch (err) {
    console.error(err)
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    })
  }
}
