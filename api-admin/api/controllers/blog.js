const niv = require('node-input-validator')
const Helper = require('../helper/index')
const BlogDB = require('../models/blog')
const mongoose = require('mongoose')
const moment = require('moment')

exports.add = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    name: 'required|maxLength:500',
    description: 'required',
  })
  const matched = await objValidation.check()

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors })
  }

  const { name, description } = req.body

  const validationErrorObject = {}
  validationErrorObject.message = 'Validation Error'
  validationErrorObject.error = {}

  if (!req.file) {
    validationErrorObject.error.image = {
      message: 'The image field is mandatory.',
      rule: 'required',
    }
    return res.status(422).send(validationErrorObject)
  }

  try {
    const blogObject = {}
    blogObject.user = req.userData._id
    blogObject.name = name
    blogObject.description = description
    blogObject.image = req.file.path

    const blog = new BlogDB(blogObject)
    const result = await blog.save()

    return res.status(201).json({
      message: 'Blog has been successfully added',
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

exports.get = async (req, res) => {
  let { limit, page, search } = req.query

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
  matchObject.flag = 1
  if (search)
    matchObject.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]
  matchObject.user = mongoose.Types.ObjectId(req.userData._id)
  let user_id = mongoose.Types.ObjectId(req.userData._id)
  try {
    const resultAggregate = BlogDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          deleteBlog: {
            $cond: {
              if: { $eq: [user_id, '$user'] },
              then: 1,
              else: 0,
            },
          },
          name: 1,
          image: 1,
          description: 1,
          createdAt: 1,
        },
      },
    ])
    const result = await BlogDB.aggregatePaginate(resultAggregate, option)
    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i]
      element.image = await Helper.getValidImageUrl(element.image)
      element.createdAt = await moment(element.createdAt).format('DD MMMM YYYY')
    }
    return res.status(200).json({
      message: 'Blog has been retrived',
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
exports.getBlogConsultant = async (req, res) => {
  const blogs = await BlogDB.find({ user: req.params.id }).limit(5).sort({
    createdAt: -1,
  })
  for (var i = 0; i < blogs.length; i++) {
    const element = blogs[i]
    element.image = await Helper.getValidImageUrl(element.image)
    element.createdAt = await moment(element.createdAt).format('DD MMMM YYYY')
  }
  if (blogs) {
    return res.status(200).json({
      message: 'Consultant Blog has been retrived',
      result: blogs,
    })
  } else {
    res.status(404)
    throw new Error('Blog Not found')
  }
}

exports.getBlogById = async (req, res) => {
  const blog = await BlogDB.findById(req.params.id)
  createdAt = await moment(blog.createdAt).format('DD MMMM YYYY')
  image = await Helper.getValidImageUrl(blog.image)
  if (blog) {
    res.json({
      _id: blog._id,
      name: blog.name,
      image: `${process.env.IMAGE_BASE_URL}/${blog.image}`,
      date: createdAt,
      description: blog.description,
    })
  } else {
    res.status(404)
    throw new Error('Blog Not found')
  }
}

exports.getInvestorById = async (req, res) => {
  const blog = await BlogDB.findById(req.params.id)
  createdAt = await moment(blog?.createdAt).format('DD MMMM YYYY')
  image = await Helper.getValidImageUrl(blog.image)
  if (blog) {
    res.json({
      _id: blog._id,
      name: blog.name,
      image: image,
      date: createdAt,
      description: blog.description,
    })
  } else {
    res.status(404)
    throw new Error('Blog Not found')
  }
}

exports.getInvestor = async (req, res) => {
  let { limit, page, search } = req.query
  if ([null, undefined, ''].includes(page)) {
    page = 1
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10
  }
  if ([null, undefined, '', 1].includes(search)) {
    search = ''
  }

  const option = {
    limit: limit,
    page: page,
  }
  const matchObject = {}
  matchObject.flag = 1
  if (search)
    matchObject.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]
  const user = req.userData._id
  try {
    const followUser = await Helper.getFollowerData(user, 2)

    matchObject.user = { $in: followUser }
    const resultAggregate = BlogDB.aggregate([
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
          image: 1,
          status: 1,
          description: 1,
          createdAt: 1,
        },
      },
    ])
    const result = await BlogDB.aggregatePaginate(resultAggregate, option)

    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i]
      element.image = await Helper.getValidImageUrl(element.image)
      element.createdAt = await moment(element.createdAt).format('DD MMMM YYYY')
    }
    return res.status(200).json({
      message: 'Blog has been retrived',
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

exports.deleteBlog = async (req, res) => {
  const { id } = req.params
  try {
    const result = await BlogDB.findByIdAndUpdate(id, { $set: { flag: 3 } })
    return res
      .status(200)
      .json({ message: 'Blog has been deleted successfully' })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    })
  }
}
