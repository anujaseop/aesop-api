const niv = require('node-input-validator')
const Helper = require('../helper/index')
const PortfolioDB = require('../models/portfolio')
const UserDB = require('../models/user')
const mongoose = require('mongoose')
const axios = require('axios')
const cron = require('node-cron')
const fb = require('../helper/firebase')
const firebase = fb.firestore()
//
exports.getAll = async (req, res) => {
  let { limit, page, search, order_from, status, profit_loss } = req.query
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

  const matchObj = new Object()

  if (order_from) matchObj.order_from = Number(order_from)
  if (status) matchObj.status = Number(status)
  if (search) {
    matchObj.$or = [
      { stock_name: { $regex: search, $options: 'i' } },
      { stock_symbol: { $regex: search, $options: 'i' } },
    ]
  }
  if (profit_loss == 1) {
    matchObj.profit_loss = { $gt: 0 }
  }
  if (profit_loss == 2) {
    matchObj.profit_loss = { $lt: 0 }
  }
  matchObj.user = mongoose.Types.ObjectId(req.userData._id)
  try {
    const resultAggregate = PortfolioDB.aggregate([
      { $match: matchObj },
      {
        $sort: { createdAt: -1 },
      },
    ])

    const result = await PortfolioDB.aggregatePaginate(resultAggregate, option)

    return res.status(200).json({
      message: 'Portfolio has been retrived',
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

exports.add = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {
    stock_name: 'required',
    stock_symbol: 'required',
    stock_exchange: 'required',
    quantity: 'required|integer',
    price: 'required|numeric',
    product_type: 'required|in:1,2',
    stop_loss: 'numeric',
    trailing_stop_loss: 'numeric',
    target_value: 'numeric',
    order_from: 'required|in:1,2',
    order_type: 'required|in:1,2',
    order_market_price: 'required|in:1,2',
  })
  const matched = await objValidation.check()
  if (!matched) {
    return res
      .status(422)
      .json({ message: 'Validation error ', error: objValidation.errors })
  }
  try {
    let realPrice = await axios.get(
      `https://api.twelvedata.com/price?symbol=${req.body.stock_symbol}&apikey=${process.env.Twelve_KEY}`
    )

    let newObj = new Object()
    newObj['user'] = req.userData._id
    newObj['stock_name'] = req.body.stock_name
    newObj['stock_symbol'] = req.body.stock_symbol
    newObj['stock_exchange'] = req.body.stock_exchange
    newObj['quantity'] = req.body.quantity
    newObj['price'] = req.body.price
    newObj['product_type'] = req.body.product_type
    newObj['order_from'] = req.body.order_from
    newObj['order_type'] = req.body.order_type
    newObj['stop_loss'] = req.body?.stop_loss
    newObj['trailing_stop_loss'] = req.body?.trailing_stop_loss
    newObj['target_value'] = req.body?.target_value
    newObj['ltp_price'] = realPrice.data.price
    newObj['order_market_price'] = req.body?.order_market_price
    let result
    let priceData = await UserDB.findById(req.userData._id)
    if (req.body.order_type == 1) {
      const findData = await PortfolioDB.findOne({
        user: req.userData._id,
        stock_symbol: req.body.stock_symbol,
        status: 2,
      })

      if (findData) {
        if (findData.price === Number(req.body.price)) {
          let qty = Number(findData.quantity) + Number(newObj.quantity)

          result = await PortfolioDB.findByIdAndUpdate(findData._id, {
            $set: { quantity: qty, ltp_price: realPrice.data.price },
          })
        } else {
          result = new PortfolioDB(newObj)
          await result.save()
        }
      }
      if (req.body.order_market_price === 1) {
        if (findData) {
          let qty = Number(findData.quantity) + Number(newObj.quantity)
          result = await PortfolioDB.findByIdAndUpdate(findData._id, {
            $set: { quantity: qty, ltp_price: realPrice.data.price },
          })
        } else {
          newObj.status = 2
          result = new PortfolioDB(newObj)
          await result.save()
        }
      }

      if (priceData) {
        let amount = Number(req.body.quantity) * Number(req.body.price)
        let balance = Number(priceData.balance) - Number(amount)

        let used_amount = Number(priceData.used_balance) + Number(amount)
        await UserDB.findByIdAndUpdate(priceData._id, {
          $set: { balance: balance, used_balance: used_amount },
        })
      }
    } else {
      const findData = await PortfolioDB.findOne({
        user: req.userData._id,
        stock_symbol: req.body.stock_symbol,
        order_type: 1,
        status: 2,
      })

      if (findData) {
        let newQwt = Number(findData?.quantity) - Number(req.body.quantity)
        let newTotalPrice =
          findData.quantity * findData.price -
          Number(req.body.quantity) * Number(req.body.price)

        await PortfolioDB.findByIdAndUpdate(findData._id, {
          $set: { total_price: newTotalPrice, quantity: newQwt },
        })
        if (findData?.quantity === Number(req.body.quantity)) {
          await PortfolioDB.findByIdAndDelete(findData._id)
        }
        if (req.body.order_market_price === 1) {
          newObj.status = 4
          result = new PortfolioDB(newObj)
          await result.save()
          let amount = Number(req.body.quantity) * Number(realPrice.data.price)
          let balance = Number(priceData.balance) + Number(amount)
          let used_amount = Number(priceData.used_balance) - Number(amount)
          await UserDB.findByIdAndUpdate(priceData._id, {
            $set: {
              balance: balance,
              used_balance: used_amount <= 0 ? 0 : used_amount,
            },
          })
        } else {
          result = new PortfolioDB(newObj)
          await result.save()
          let amount = req.body.quantity * req.body.price
          let balance = priceData.balance + amount
          let used_amount = priceData.used_balance - amount
          await UserDB.findByIdAndUpdate(priceData._id, {
            $set: {
              balance: balance,
              used_balance: used_amount <= 0 ? 0 : used_amount,
            },
          })
        }
      } else {
        result = new PortfolioDB(newObj)
        await result.save()
        let amount = req.body.quantity * req.body.price
        let balance = priceData.balance + amount
        let used_amount = priceData.used_balance - amount
        await UserDB.findByIdAndUpdate(priceData._id, {
          $set: {
            balance: balance,
            used_balance: used_amount <= 0 ? 0 : used_amount,
          },
        })
      }
    }

    if (req.body.tip_id) {
      firebase
        .collection('messages')
        .doc(req.body.groupId)
        .collection(req.body.groupId)
        .where('tip_id', '==', req.body.tip_id)
        .get()
        .then((snap) => {
          snap.docs.forEach((doc) => {
            let followUser = []
            let data = doc.data()
            if (data?.followUser) {
              followUser = doc.data().followUser((s) => s)
            }
            followUser.push(String(req.userData._id))

            let batch = firebase.batch()
            const ref = doc.ref
            batch.update(ref, { followUser: followUser })
            return batch.commit()
          })
        })
    }

    return res.status(200).json({
      message: 'Portfolio has been successfully added',
      result: result,
    })
  } catch (err) {
    console.error(err)
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    })
  }
}

exports.drop_down = async (req, res) => {
  try {
    const result = await PortfolioDB.find().select('stock_symbol  status')
    return res
      .status(200)
      .json({ message: 'Portfolio has been retrieved', result: result })
  } catch (er) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    })
  }
}

exports.detail = async (req, res) => {
  const { id } = req.params

  try {
    let result = await PortfolioDB.findById(id).select(
      'stock_name stock_symbol stock_exchange quantity price ltp_price product_type '
    )

    return res
      .status(200)
      .json({ message: 'Portfolio details', result: result })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    })
  }
}
//
exports.priceCalc = async (req, res) => {
  try {
    const result = await PortfolioDB.find({
      user: req.userData._id,
      status: { $in: [2] },
    })

    const tipData = await PortfolioDB.find({
      user: req.userData._id,
      status: { $in: [2] },
      order_from: 2,
    }).count()

    let marketPrice = await Helper.allMarketPrice(result)
    let profileLoss = await Helper.profileLoss(result)
    let marketPriceTip = await Helper.allMarketPriceTip(result)
    let profileLossTip = await Helper.profileLossTip(result)
    let finalData = {
      marketValue_paper: marketPrice,
      profileLoss_paper: profileLoss,
      marketValue_tip: marketPriceTip,
      profileLoss_tip: profileLossTip,
      tipSize: tipData,
    }

    return res
      .status(200)
      .json({ message: 'get all price portfolio price', result: finalData })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    })
  }
}

cron.schedule('0 16 * * *', async () => {
  /**
   *  -> cron is use for update only today purchase/buy stock
   *  -> update  only stock is pending and stock type is intra day by status 5 (square off )
   *
   */
  var start_date = new Date(new Date().setHours(0, 0, 0, 0))
  var end_date = new Date(new Date().setHours(24, 0, 0, 0))

  const result = await PortfolioDB.updateMany(
    {
      createdAt: { $gte: start_date, $lt: end_date },
      product_type: 2,
      status: { $in: [1] },
    },
    { $set: { status: 5 } }
  )
})
