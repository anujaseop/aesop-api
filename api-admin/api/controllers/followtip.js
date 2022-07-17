const niv = require('node-input-validator')
const FollowTipDB = require('../models/followtip')
const Helper = require('../helper/index')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const moment = require('moment')
const fs = require('fs')

// add default following data
exports.add = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {
    user_id: 'required',
    tip_id: 'required',
  })

  const matched = await objValidation.check()
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors })
  }

  const { user_id, tip_id } = req.body
  try {
    const followtipObject = {}
    followtipObject.user_id = user_id
    followtipObject.tip_id = tip_id

    const newfollowtipData = new FollowTipDB(followtipObject)
    const result = await newfollowtipData.save()
    return res.status(201).send({
      message: 'Follow Tip has been added successfully',
      result: result,
    })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).send({
      message: 'Error occurred, Please try again later',
      error: err,
    })
  }
}

// get Follow Tip
exports.get = async (req, res, next) => {
  const search = req.query.search
  try {
    const matchObject = {}

    if (search) {
      matchObject.$or = [
        { user_id: { $regex: search, $options: 'i' } },
        { tip_id: { $regex: search, $options: 'i' } },
      ]
    }
    const result = await FollowTipDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          tip_id: 1,
        },
      },
    ])
    return res.status(200).json({
      message: 'Follow Tip has been retrived',
      result: result,
    })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    })
  }
}
