const niv = require('node-input-validator')
const notificationDb = require('../models/notification')
const GroupMemberDB = require('../models/group_member')
const SubscriptionDB = require('../models/subscription')
const BlogDB = require('../models/blog')
const NewsDB = require('../models/news')
const UserDB = require('../models/user')
const Helper = require('../helper/index')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const moment = require('moment')
const fs = require('fs')
const TipDB = require('../models/tip')
// add notification data
exports.add = async (req, res) => {
  /**
   *  @use
   * type = 1 => news
   * type = 2 => tips
   * type = 3 => blog
   *  */
  try {
    const notifyObj = {}

    notifyObj.type = req.body.type
    notifyObj.user = req.body.type === 'news' ? null : req.userData._id
    notifyObj.refId = req.body.refId
    notifyObj.consultant = null

    //
    if (req.body.type === 'tips') {
      // save tips only group member
      let userData = await SubscriptionDB.find({
        group: req.userData._id,
        type: 1,
      })
      notifyObj.consultant = await userData.map((s) =>
        mongoose.Types.ObjectId(s.user)
      )
      const tipData = await TipDB.findById(req.body.refId)
      let notifyData = {
        title: 'Tip',
        description: tipData.description.substring(0, 50) + '...',
        id: req.body.refId,
        type: 2, // tips
      }

      let { android_list, ios_list } = await Helper.getFCMLIST(userData)

      await Helper.androidNotification(android_list, notifyData)
      await Helper.iosNotification(ios_list, notifyData)
    }

    //
    if (req.body.type === 'blog') {
      // save tips only follow member
      let userData = await GroupMemberDB.find({
        group: req.userData._id,
        type: 2,
      })
      notifyObj.consultant = await userData.map((s) =>
        mongoose.Types.ObjectId(s.user)
      )
      const BlogData = await BlogDB.findById(req.body.refId)
      let notifyData = {
        title: 'Blog',
        description: BlogData.name.substring(0, 50) + '...',
        id: req.body.refId,
        type: 3, // blog
      }

      let { android_list, ios_list } = await Helper.getFCMLIST(userData)

      await Helper.androidNotification(android_list, notifyData)
      await Helper.iosNotification(ios_list, notifyData)
    }
    if (req.body.type === 'news') {
      let NewsData = await NewsDB.findById(req.body.refId)

      let notifyData = {
        title: 'News',
        description: NewsData.news_title.substring(0, 50) + '...',
        id: req.body.refId,
        type: 1, // news
      }
      let userData = await UserDB.find({ flag: 1 })

      let { android_list, ios_list } = await Helper.getuserToken(userData)

      await Helper.androidNotification(android_list, notifyData)
      await Helper.iosNotification(ios_list, notifyData)
    }

    const saveNotify = new notificationDb(notifyObj)
    const result = await saveNotify.save()
    return res.status(201).send({
      message: 'notification has been added successfully',
      result: result,
    })
  } catch (err) {
    console.error(err)
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).send({
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
  const matchObj = {}

  matchObj.consultant = {
    $in: [mongoose.Types.ObjectId(req.userData._id), null],
  }
  matchObj.$or = [
    {
      $and: [
        { type: 'tips' },
        { 'subscriptions.status': 1 },
        {
          'tipsData.flag': 1,
        },
      ],
    },
    {
      $and: [
        { type: 'blog' },
        { 'groupMemberData.type': 2 },
        {
          'blogData.flag': 1,
        },
      ],
    },
    {
      $and: [
        { type: 'news' },
        {
          'newsData.flag': 1,
        },
      ],
    },
  ]

  try {
    const NotificationAggregate = notificationDb.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'blogs',
          localField: 'refId',
          foreignField: '_id',
          as: 'blogData',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
        },
      },

      {
        $lookup: {
          from: 'subscriptions',
          let: { consultant: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$user', mongoose.Types.ObjectId(req.userData._id)],
                    },
                    { $eq: ['$group', '$$consultant'] },
                  ],
                },
              },
            },
          ],
          as: 'subscriptions',
        },
      },
      {
        $lookup: {
          from: 'groupmembers',
          let: { consultant: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$user', mongoose.Types.ObjectId(req.userData._id)],
                    },
                    { $eq: ['$group', '$$consultant'] },
                  ],
                },
              },
            },
          ],
          as: 'groupMemberData',
        },
      },

      {
        $lookup: {
          from: 'tips',
          localField: 'refId',
          foreignField: '_id',
          as: 'tipsData',
        },
      },
      {
        $lookup: {
          from: 'news',
          localField: 'refId',
          foreignField: '_id',
          as: 'newsData',
        },
      },
      { $unwind: { path: '$newsData', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$tipsData', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
      {
        $unwind: {
          path: '$blogData',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: matchObj },
      {
        $project: {
          user: 1,
          userData: 1,
          type: 1,
          createdAt: 1,
          newsData: 1,
          blogData: 1,
          tipsData: 1,
        },
      },
    ])
    const result = await notificationDb.aggregatePaginate(
      NotificationAggregate,
      option
    )

    for (let i = 0; i < result.docs.length; i++) {
      const e = result.docs[i]
      if (e.userData) {
        e.userData.group_pic = await Helper.getValidImageUrl(
          e?.userData?.group_pic,
          'A'
        )
      } else {
        e.userData = {
          group_pic: await Helper.getValidImageUrl(e?.userData?.group_pic, 'A'),
        }
      }
      if (e.blogData) {
        e.blogData.image = await Helper.getValidImageUrl(e.blogData.image, 'A')
      }
      if (e.tipsData) {
        e.tipsData.image = await Helper.getValidImageUrl(e.tipsData.image, 'A')
      }
      if (e.newsData) {
        e.newsData.news_image = await Helper.getValidImageUrl(
          e.newsData.news_image,
          'A'
        )
      }

      e.createdAt = await moment(e.createdAt).fromNow()
    }
    return res
      .status(200)
      .json({ message: 'Notification has been retrieved ', result: result })
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
