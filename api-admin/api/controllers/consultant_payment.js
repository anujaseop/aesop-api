const niv = require('node-input-validator')
const ConsultantPaymenDB = require('../models/consultant_payment')
const UserDB = require('../models/user')
const Helper = require('../helper/index')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const moment = require('moment')
const fs = require('fs')

// add consultant_payment data
exports.add = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {})

  const matched = await objValidation.check()
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors })
  }

  const { user_id, from_date, to_date, amount } = req.body
  try {
    const consultantpaymentObject = {}

    consultantpaymentObject.user_id = user_id
    consultantpaymentObject.from_date = from_date
    consultantpaymentObject.to_date = to_date
    consultantpaymentObject.amount = amount
    //console.log(consultantpaymentObject)
    const newconsultantpaymentData = new ConsultantPaymenDB(
      consultantpaymentObject
    )
    const result = await newconsultantpaymentData.save()
    return res.status(201).send({
      message: 'consultantpayment has been added successfully',
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

// // add consultant_payment data
// exports.add = async (req, res) => {
//   const objValidation = new niv.Validator(req.body, {

//   })

//   const matched = await objValidation.check()
//   if (!matched) {
//     return res
//       .status(422)
//       .send({ message: 'Validation Error', errors: objValidation.errors })
//   }

//   const { user_id, from_date, to_date, amount } = req.body
//   try {

//     const consultantpaymentObject = {}

//     consultantpaymentObject.user_id = user_id
//     consultantpaymentObject.from_date = from_date
//     consultantpaymentObject.to_date = to_date
//     consultantpaymentObject.amount = amount
//     //console.log(consultantpaymentObject)
//     const newconsultantpaymentData = new ConsultantPaymenDB(consultantpaymentObject)
//     const result = await newconsultantpaymentData.save()
//     return res.status(201).send({
//       message: 'Consultant payment has been added successfully',
//       result: result,
//     })

//   } catch (err) {

//     const request = req
//     Helper.writeErrorLog(request, err)
//     return res.status(500).send({
//       message: 'Error occurred, Please try again later',
//       error: err,
//     })
//   }
// }

// get consultantpayment data
exports.all = async (req, res, next) => {
  const { id } = req.params
  let { limit, page, search, start_date, end_date } = req.query
  if ([null, undefined, ''].includes(page)) {
    page = 1
  }
  if ([null, undefined, ''].includes(search)) {
    search = ''
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10
  }
  const option = {
    limit: limit,
    page: page,
  }
  const matchObject = {}
  matchObject.user_id = mongoose.Types.ObjectId(id)
  matchObject.flag = 1
  if (start_date && end_date) {
    matchObject.createdAt = {
      $gte: new Date(start_date),
      $lt: new Date(end_date),
    }
  }
  try {
    var resultAggregate = ConsultantPaymenDB.aggregate([
      { $sort: { createdAt: -1 } },

      { $match: matchObject },
      {
        $project: {
          userData: {
            first_name: 1,
            last_name: 1,
          },
          from_date: 1,
          to_date: 1,
          amount: 1,
        },
      },
    ])
    // }
    const result = await ConsultantPaymenDB.aggregatePaginate(
      resultAggregate,
      option
    )
    for (let i = 0; i < result.docs.length; i++) {
      const element = result.docs[i]
      element.member = await Helper.memberCount(result.docs[i])
    }
    return res.status(200).json({
      message: 'Consultant payment has been retrived',
      result: result,
    })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    })
  }
}

exports.adminAll = async (req, res) => {
  let { limit, page, search, user } = req.query
  if ([null, undefined, ''].includes(page)) {
    page = 1
  }
  if ([null, undefined, ''].includes(search)) {
    search = ''
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10
  }
  const option = {
    limit: limit,
    page: page,
  }
  const matchObject = {}
  if (user) matchObject.user_id = mongoose.Types.ObjectId(user)
  matchObject.flag = 1

  try {
    var resultAggregate = ConsultantPaymenDB.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'users',
        },
      },
      {
        $project: {
          id: 1,
          users: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            group_name: 1,
          },
          from_date: 1,
          to_date: 1,
          amount: 1,
          flag: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ])
    // }
    const result = await ConsultantPaymenDB.aggregatePaginate(
      resultAggregate,
      option
    )
    for (let i = 0; i < result.docs.length; i++) {
      const element = result.docs[i]
      element.member = await Helper.memberCount(result.docs[i])
    }
    return res.status(200).json({
      message: 'Consultant payment has been retrived',
      result: result,
    })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    })
  }
}
