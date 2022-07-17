const niv = require('node-input-validator')
const AdminUserDB = require('../models/adminuser')
const Helper = require('../helper/index')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const moment = require('moment')
const fs = require('fs')

// add data
exports.add = async (req, res) => {
const objValidation = new niv.Validator(req.body, {
  name: 'required',
  email: 'required',
  phoneNo: 'required',
  
})

const matched = await objValidation.check()
if (!matched) {
return res
  .status(422)
  .send({ message: 'Validation Error', errors: objValidation.errors })
}

const { name,email,phoneNo} = req.body
try {

const adminuserObject = {}
adminuserObject.name = name
adminuserObject.email = email
adminuserObject.phoneNo = phoneNo

 const newAdminUserData = new AdminUserDB(adminuserObject)
const result = await newAdminUserData.save()
return res.status(201).send({
  message: 'admin user has been added successfully',
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


// get data
exports.get = async (req, res, next) => {
  let { limit, page, search } = req.query
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

  try {
    const matchObject = {}
    
    if(search){
      matchObject.$or =  [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNo: { $regex: search, $options: "i" } },
        
      ] 
    }
    const resultAggregate = AdminUserDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phoneNo: 1,
          flag:1,
          
        },
      },
    ])
    const result = await AdminUserDB.aggregatePaginate(resultAggregate, option)
    return res.status(200).json({
      message: 'admin user has been retrived',
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


// update data
exports.edit = async (req, res, next) => {
  const { id } = req.params
  const objValidation = new niv.Validator(req.body, {
      name: 'required',
      email: 'required',
      phoneNo: 'required'
      
      
  })

  const matched = await objValidation.check()
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors })
  }
  const { name, email,phoneNo} = req.body
  try {
    const updateObject = {}
    updateObject.name= name
    updateObject.email = email
    updateObject.phoneNo = phoneNo
    
    
    const result = await AdminUserDB.updateOne({ _id: id}, updateObject)
    
    return res.status(202).json({
      
      message: 'admin user has been updated successfully',
      result: result,
    })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: res,
    })
  }
}





  // Delete Data

  exports.delete = async (req, res) => {
    const { id } = req.params
    try {
     
      result = await AdminUserDB.findByIdAndDelete(
        id
      )
      return res.status(200).json({
        message: 'admin user  has been successfully deleted',

      })
    } catch (err) {
      const request = req
      const writeErrorRequest = Helper.writeErrorLog(request, err)
      return res.status(500).json({
        message: 'Error occurred, Please try again later',
        error: err,
      })
    }
  }
  

  // enable/disable 
  exports.status = async (req, res, next) => {
    const { id } = req.params
    const {flag} = req.body
    try {
      const updateObject = {}
      updateObject.flag = flag
  
      let message = 'admin user has been sucessfully enabled'
      if(flag ==2){
        message = 'admin user has been sucessfully disabled'
      }
      
      const result = await AdminUserDB.updateOne({_id: id }, updateObject)
      return res.status(202).json({
        message: message,
        result: result,
      })
    } catch (err) {
      const request = req
      Helper.writeErrorLog(request, err)
      return res.status(500).json({
        message: 'Error occurred, Please try again later',
        error: res,
      })
    }
  }