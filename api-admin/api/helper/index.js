const GroupMemberDB = require('../models/group_member')
const mongoose = require('mongoose')
const moment = require('moment')
const fs = require('fs')
const SubscriptionDB = require('../models/subscription')
const PortFolioDB = require('../models/portfolio')
const userTokenDB = require('../models/userToken')
const axios = require('axios')
const fb = require('../helper/firebase')
//
exports.generateRandomString = (length, isNumber = false) => {
  var result = ''
  if (isNumber) {
    var characters = '0123456789'
  } else {
    var characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  }
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

exports.getValidImageUrl = async (filename, name = 'SH') => {
  if (filename === '' || filename === undefined || filename === null) {
    filename =
      'https://ui-avatars.com/api/?name=' +
      name +
      '&rounded=true&background=c39a56&color=fff'
  } else {
    filename = `${process.env.IMAGE_BASE_URL}/${filename}`
  }
  return filename.replace(/\\/g, '/')
}

exports.writeErrorLog = async (req, error) => {
  const requestURL = req.protocol + '://' + req.get('host') + req.originalUrl
  const requestBody = JSON.stringify(req.body)
  const date = moment().format('MMMM Do YYYY, h:mm:ss a')
  fs.appendFileSync(
    'errorLog.log',
    'REQUEST DATE : ' +
      date +
      '\n' +
      'API URL : ' +
      requestURL +
      '\n' +
      'API PARAMETER : ' +
      requestBody +
      '\n' +
      'Error : ' +
      error +
      '\n\n'
  )
}

exports.addMemberIngroup = async (group, user, type) => {
  const groupMember = new GroupMemberDB({
    group,
    user,
    type,
  })
  const result = await groupMember.save()
  return result
}

exports.findMemberIngroup = async (group, user, type) => {
  const groupMember = new GroupMemberDB({
    group,
    user,
    type,
  })
  const result = await GroupMemberDB.findOne({
    user,
    group,
    type,
  })
  return result
}

exports.deleteMemberIngroup = async (group, user, type) => {
  // const groupMember = new GroupMemberDB({
  //   group,
  //   user,
  //   type,
  // })
  await GroupMemberDB.deleteOne({
    user: user,
    group: group,
  }).then((data) => {})
}

exports.getFollowerData = async (user, type) => {
  const followeArray = []
  const result = await GroupMemberDB.find({ user: user, type: type }).select(
    'group'
  )

  for (var i = 0; i < result.length; i++) {
    followeArray.push(mongoose.Types.ObjectId(result[i].group))
  }
  return followeArray
}

exports.getSlugName = (title) => {
  const titleLOwerCase = title.toLowerCase()
  const slug = titleLOwerCase.replace(/ /g, '-')
  return slug
}

exports.isExpired = (date) => {
  const today = new Date()
  if (today >= date) {
    return true
  }
  return false
}

exports.memberCount = async (data) => {
  let result = []
  let matchObject = {}
  if (data?.from_date && data?.to_date) {
    matchObject.date = {
      $gte: moment(data.from_date).format('yyyy-MM-DD'),
      $lte: moment(data.from_date).format('yyyy-MM-DD'),
    }
    result = await SubscriptionDB.aggregate([
      {
        $addFields: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        },
      },
      { $match: matchObject },
    ])
  }

  return result.length
}

exports.getAllPrice = async (id, type) => {
  let result = await PortFolioDB.find({
    user: id,
    order_from: type,
    status: { $in: [2] },
  })
    .select('price')
    .lean()
  let sum = 0
  for (var i = 0; i < result.length; i++) {
    sum += result[i].price
  }

  return sum
}

exports.getAllTipSize = async (id, type) => {
  let result = await PortFolioDB.find({ user: id, order_from: type }).count()
  return result
}

exports.getAllMarketPrice = async (id, type) => {
  let result = await PortFolioDB.find({ user: id, order_from: type })
  let realPricearr = []
  let amount = 0
  for (let i = 0; i < result.length; i++) {
    let ele = result[i].stock_symbol
    let realPrice = await axios.get(
      `https://api.twelvedata.com/price?symbol=${ele}&apikey=${process.env.Twelve_KEY}`
    )

    realPricearr.push(parseFloat(realPrice.data.price))
  }
  if (realPricearr.length)
    amount = realPricearr.reduce(
      (previousValue, currentValue) => previousValue + currentValue
    )
  return amount
}

exports.allMarketPrice = async (data) => {
  let totalPrice = []
  let amount = 0
  for (let i = 0; i < data.length; i++) {
    const val = data[i]

    if (val.order_from === 1) {
      totalPrice.push(val.ltp_price * parseInt(val.quantity))
    }
  }

  if (totalPrice.length)
    amount = totalPrice.reduce(
      (previousValue, currentValue) => previousValue + currentValue
    )
  return parseFloat(amount.toFixed(2))
}
exports.allMarketPriceTip = async (data) => {
  let totalPrice = []
  let amount = 0
  for (let i = 0; i < data.length; i++) {
    const e = data[i]
    if (e.order_from === 2) {
      totalPrice.push(e.ltp_price * parseInt(e.quantity))
    }
  }
  if (totalPrice.length)
    amount = totalPrice.reduce(
      (previousValue, currentValue) => previousValue + currentValue
    )
  return parseFloat(amount.toFixed(2))
}

exports.profileLossTip = (data) => {
  let totalPrice = []
  let amount = 0
  for (let i = 0; i < data.length; i++) {
    const e = data[i]
    let lst = e.ltp_price * parseInt(e.quantity)
    let lst1 = e.price * parseInt(e.quantity)
    if (e.order_from === 2) {
      totalPrice.push(lst - lst1)
    }
  }

  if (totalPrice.length)
    amount = totalPrice.reduce(
      (previousValue, currentValue) => previousValue + currentValue
    )
  return parseFloat(amount.toFixed(2))
}

exports.profileLoss = (data) => {
  let totalPrice = []
  let amount = 0
  for (let i = 0; i < data.length; i++) {
    const e = data[i]

    if (e.order_from === 1) {
      let lst = e.ltp_price * parseInt(e.quantity)
      let lst1 = e.price * parseInt(e.quantity)
      totalPrice.push(lst - lst1)
    }
  }

  if (totalPrice.length)
    amount = totalPrice.reduce(
      (previousValue, currentValue) => previousValue + currentValue
    )
  return parseFloat(amount.toFixed(2))
}

exports.singleProfileLoss = async (data) => {
  let lst = data.ltp_price * parseInt(data.quantity)
  let lst1 = data.price * parseInt(data.quantity)
  return lst - lst1
}
//
exports.getFCMLIST = async (userids) => {
  let userList = []
  const android_list = new Array()
  const ios_list = new Array()
  for (let i = 0; i < userids.length; i++) {
    const element = userids[i]
    let users = await userTokenDB.find({ user: element.user })
    for (let j = 0; j < users.length; j++) {
      const data = users[j]
      userList.push(data)
    }
  }

  userList.map(async (userToken) => {
    if (userToken.type === 1) {
      android_list.push(userToken.token)
    }
    if (userToken.type === 2) {
      ios_list.push(userToken.token)
    }
  })

  return { android_list, ios_list }
}

exports.getuserToken = async (userids) => {
  let userList = []
  const android_list = new Array()
  const ios_list = new Array()
  for (let i = 0; i < userids.length; i++) {
    const element = userids[i]
    let users = await userTokenDB.find({ user: element._id })
    for (let j = 0; j < users.length; j++) {
      const data = users[j]
      userList.push(data)
    }
  }
  userList.map(async (userToken) => {
    if (userToken.type === 1) {
      android_list.push(userToken.token)
    }
    if (userToken.type === 2) {
      ios_list.push(userToken.token)
    }
  })

  return { android_list, ios_list }
}
//
exports.androidNotification = async (tokens, message) => {
  let notificationData = {
    notification: {
      title: message.title,
      body: message.description,
    },
    tokens: tokens,
    data: {
      notification_type: String(message.type),
      id: String(message.id),
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
  }

  fb.messaging()
    .sendMulticast(notificationData)
    .then((res) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', res)
    })
    .catch((error) => {
      console.log('Error sending message:', error)
    })
}

exports.iosNotification = async (tokens, messages) => {
  try {
    const message = {
      notification: {
        title: messages.title,
        body: messages.description,
        type: String(messages.type),
      },
      tokens: tokens,
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      data: {
        id: String(messages.id),
      },
    }
    const result = await fb.messaging().sendMulticast(message)
    console.log(result)
  } catch (err) {
    console.error(err)
  }
}
