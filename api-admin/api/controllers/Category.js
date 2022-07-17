// const niv = require('node-input-validator')
// const CategoryDB = require('../models/category')
// const Helper = require('../helper/index')
// const mongoose = require('mongoose')
// const jwt = require('jsonwebtoken')
// const bcrypt = require('bcryptjs')
// const moment = require('moment')
// const fs = require('fs')

// // add category data
// exports.add = async (req, res) => {
// const objValidation = new niv.Validator(req.body, {
//   category_name: 'required',
  
  
// })

// const matched = await objValidation.check()
// if (!matched) {
// return res
//   .status(422)
//   .send({ message: 'Validation Error', errors: objValidation.errors })
// }

// const {category_name} = req.body
// try {

// const categoryObject = {}
// categoryObject.category_name = category_name

//  const newcategoryData = new CategoryDB(categoryObject)
// const result = await newcategoryData.save()
// return res.status(201).send({
//   message: 'category has been added successfully',
//   result: result,
// })

// } catch (err) {
  
// const request = req
// Helper.writeErrorLog(request, err)
// return res.status(500).send({
//   message: 'Error occurred, Please try again later',
//   error: err,
// })
// }
// }