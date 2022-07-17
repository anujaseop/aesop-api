const niv = require('node-input-validator')
const Helper = require('../helper/index')
const mongoose = require('mongoose')
const CMSDB = require('../models/cms')
const moment = require('moment')

//************** GET All CMS ***********//
exports.get = async (req, res) => {
  let { limit, page } = req.query
  if ([null, undefined, ''].includes(page)) {
    page = 1
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10
  }

  const option = {
    limit: limit,
    page: page,
  }

  const matchObject = {}
  try {
    const cmsAggregate = CMSDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          banner_image: 1,
          content: 1,
          sub_title: 1,
          flag: 1,
        },
      },
    ])
    const result = await CMSDB.aggregatePaginate(cmsAggregate, option)
    for (i = 0; i < result.docs.length; i++) {
      const singleData = result.docs[i]
      if (singleData.banner_image)
        singleData.banner_image = await Helper.getValidImageUrl(
          singleData.banner_image
        )
    }
    return res.status(200).json({
      message: 'CMS has been retrived',
      result: result,
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

//************** Add CMS ***********//
exports.add = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    title: 'required|maxLength:500',
    content: 'required',
  })

  const matched = await objValidation.check()

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors })
  }
  const { title, sub_title, content } = req.body

  try {
    let file = ''
    if (req.file) {
      file = req.file.path
    }

    const slug = await Helper.getSlugName(title)

    const cms = new CMSDB({
      title: title,
      slug: slug,
      sub_title: sub_title,
      banner_image: file,
      content: content,
    })
    const result = await cms.save()

    return res.status(201).json({
      message: 'CMS has been created successfully',
      result: result,
    })
  } catch (err) {
    console.log(err)
    const request = req
    const writeErrorRequest = Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    })
  }
}

//************** Edit Media Detail***********//
exports.edit = async (req, res, next) => {
  const id = req.params.id
  const objValidation = new niv.Validator(req.body, {
    title: 'required|maxLength:500',
    content: 'required',
  })
  const matched = await objValidation.check()
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors })
  }
  try {
    const { title, sub_title, content } = req.body
    const slug = await Helper.getSlugName(title)
    const updateObject = {}
    updateObject.title = title
    updateObject.slug = slug
    if (sub_title) updateObject.sub_title = sub_title
    if (content) updateObject.content = content
    if (req.file) updateObject.banner_image = req.file.path
    const result = await CMSDB.updateOne({ _id: id }, updateObject)
    return res.status(200).json({
      message: 'CMS has been updated successfully',
      result: result,
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

//************** GET CMS Detail ***********//
exports.detail = async (req, res) => {
  const matchObject = {}
  matchObject._id = mongoose.Types.ObjectId(req.params.id)
  try {
    const result = await CMSDB.aggregate([
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          sub_title: 1,
          content: 1,
          banner_image: 1,
        },
      },
    ])

    if (result.length === 0) {
      return res.status(404).json({
        message: 'No data found',
        result: [],
      })
    }
    if (result[0].banner_image)
      result[0].banner_image = await Helper.getValidImageUrl(
        result[0].banner_image
      )
    return res.status(200).json({
      message: 'CMS has been retrived',
      result: result[0],
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

//************** CMS Change Status Detail***********//
exports.changeStatus = async (req, res, next) => {
  const { id } = req.params
  const { flag } = req.body
  try {
    const updateObject = {}
    updateObject.flag = flag

    let message = 'cms has been successfully enabled'
    if (flag == 2) {
      message = 'cms has been successfully disabled'
    }

    const result = await CMSDB.updateOne({ _id: id }, updateObject)
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

//************** GET All Media for Website***********//
exports.getWebsite = async (req, res) => {
  const matchObject = {}
  matchObject.slug = req.params.slug
  matchObject.flag = 1

  try {
    const result = await CMSDB.aggregate([
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          sub_title: 1,
          content: 1,
          banner_image: 1,
        },
      },
    ])
    if (result.length === 0) {
      return res.status(404).json({
        message: 'No data found',
        result: [],
      })
    }
    if (result[0].banner_image)
      result[0].banner_image = await Helper.getValidImageUrl(
        result[0].banner_image
      )
    return res.status(200).json({
      message: 'CMS has been retrived',
      result: result[0],
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

exports.delete = async (req, res) => {
  try {
    const id = req.params.id
    const result = await CMSDB.findById(id)

    if (result !== null) {
      await CMSDB.findByIdAndDelete(id)

      return res.status(200).json({
        message: 'CMS has been deleted successfully',
      })
    } else {
      return res.status(404).json({
        message: 'CMS not found',
      })
    }
  } catch (err) {
    const request = req
    const writeErrorRequest = Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    })
  }
}
