const niv = require('node-input-validator')
const Helper = require('../helper/index')
const mongoose = require('mongoose')
const NewsDB = require('../models/news')
const moment = require('moment')

//************** Add news***********//
exports.add = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    news_title: 'required|maxLength:500',
    news_content: 'required',
  })
  const matched = await objValidation.check()

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors })
  }

  const { news_title, news_content } = req.body

  const validationErrorObject = {}
  validationErrorObject.message = 'Validation Error'
  validationErrorObject.error = {}

  if (!req.file) {
    validationErrorObject.error.news_image = {
      message: 'The news image field is mandatory.',
      rule: 'required',
    }
    return res.status(422).send(validationErrorObject)
  }

  try {
    const newsObject = {}
    newsObject.news_title = news_title
    newsObject.news_content = news_content

    newsObject.news_image = req.file.path

    const news = new NewsDB(newsObject)
    const result = await news.save()

    return res.status(201).json({
      message: 'news has been successfully added',
      result: result,
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

// get new data
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

    if (search) {
      matchObject.$or = [{ news_title: { $regex: search, $options: 'i' } }]
    }
    const resultAggregate = NewsDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          news_title: 1,
          news_image: 1,
          news_content: 1,
          flag: 1,
        },
      },
    ])
    const result = await NewsDB.aggregatePaginate(resultAggregate, option)
    return res.status(200).json({
      message: 'news user has been retrived',
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

// update news
exports.edit = async (req, res, next) => {
  const { id } = req.params
  const objValidation = new niv.Validator(req.body, {
    news_title: 'required|maxLength:500',
    news_content: 'required',
  })

  const matched = await objValidation.check()
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors })
  }
  const { news_title, news_content } = req.body
  try {
    const updateObject = {}
    updateObject.news_title = news_title
    updateObject.news_content = news_content

    if (req.file) {
      updateObject.news_image = req.file.path
    }

    const result = await NewsDB.updateOne({ _id: id }, updateObject)

    return res.status(202).json({
      message: 'news has been successfully updated',
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

// enable/disable  news
exports.status = async (req, res, next) => {
  const { id } = req.params
  const { flag } = req.body
  try {
    const updateObject = {}
    updateObject.flag = flag

    let message = 'news has been successfully enabled'
    if (flag == 2) {
      message = 'news has been successfully disabled'
    }

    const result = await NewsDB.updateOne({ _id: id }, updateObject)
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

// get new data
exports.getNewsForInvestor = async (req, res, next) => {
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
    matchObject.flag = 1
    if (search) {
      matchObject.$or = [{ news_title: { $regex: search, $options: 'i' } }]
    }
    const resultAggregate = NewsDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          news_title: 1,
          news_image: 1,
          news_content: 1,
          createdAt: 1,
          flag: 1,
        },
      },
    ])
    const result = await NewsDB.aggregatePaginate(resultAggregate, option)
    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i]
      element.image = await Helper.getValidImageUrl(element.image)
      element.news_image = await Helper.getValidImageUrl(element.news_image)
      element.createdAt = await moment(element.createdAt).format('DD MMMM YYYY')
    }

    return res.status(200).json({
      message: 'news user has been retrived',
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

exports.getNewsById = async (req, res) => {
  const news = await NewsDB.findById(req.params.id)
  createdAt = await moment(news.createdAt).format('DD MMMM YYYY')
  // news_image = await Helper.getValidImageUrl(news.news_image);

  if (news) {
    res.json({
      _id: news._id,
      news_title: news.news_title,
      news_image: `${process.env.IMAGE_BASE_URL}/${news.news_image}`,
      news_content: news.news_content,
      date: createdAt,
      flag: 1,
    })
  } else {
    res.status(404)
    throw new Error('News Not found')
  }
}

exports.delete = async (req, res) => {
  try {
    const id = req.params.id
    const result = await NewsDB.findById(id)

    if (result !== null) {
      await NewsDB.findByIdAndDelete(id)

      return res.status(200).json({
        message: 'News has been deleted successfully',
      })
    } else {
      return res.status(404).json({
        message: 'News not found',
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
