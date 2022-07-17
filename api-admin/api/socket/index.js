const TipDB = require('../models/tip')
const PortFolioDB = require('../models/portfolio')
const UserDB = require('../models/user')
const fb = require('../helper/firebase')
const moment = require('moment')
const db = fb.firestore()

exports.changePrice = async (tipId, price) => {
  const data = await TipDB.findById(tipId)
  if (data) {
    // :for intraday stock
    let createDate = moment(data.createdAt)
    let todayDate = moment(new Date())
    if (
      data.stock_availabiltiy === 1 &&
      createDate.diff(todayDate, 'days') === 0
    ) {
      // :for stock buy
      if (data.stock_type === 1) {
        //
        // for active tip
        if (price >= data.price && data.status === 1) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 2 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 2 } })
        }

        // for success tip
        if (price >= parseInt(data.target_value) && data.status === 2) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 3 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 3 } })
        }
        //  for fail tip
        if (price <= parseInt(data.amount) && data.status === 2) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 4 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 4 } })
        }
      } else {
        if (price <= data.price && data.status === 1) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 2 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 2 } })
        }

        // for success tip for sell
        if (price <= parseInt(data.target_value) && data.status === 2) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 3 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 3 } })
        }
        //  for fail tip for sell
        if (price >= parseInt(data.amount) && data.status === 2) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 4 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 4 } })
        }
      }
    }

    if (data.stock_availabiltiy === 2) {
      // :for stock buy
      if (data.stock_type === 1) {
        //
        // for active tip
        if (price >= data.price && data.status === 1) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 2 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 2 } })
        }

        // for success tip
        if (price >= parseInt(data.target_value) && data.status === 2) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 3 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 3 } })
        }
        //  for fail tip
        if (price <= parseInt(data.amount) && data.status === 2) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 4 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 4 } })
        }
      } else {
        if (price <= data.price && data.status === 1) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 2 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 2 } })
        }

        // for success tip for sell
        if (price <= parseInt(data.target_value) && data.status === 2) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 3 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 3 } })
        }
        //  for fail tip for sell
        if (price >= parseInt(data.amount) && data.status === 2) {
          db.collection('messages')
            .doc(data.user.toString())
            .collection(data.user.toString())
            .where('tip_id', '==', data._id.toString())
            .get()
            .then((snap) => {
              snap.docs.forEach((doc) => {
                let batch = db.batch()
                const ref = doc.ref
                batch.update(ref, { status: 4 })
                return batch.commit()
              })
            })
          await TipDB.findByIdAndUpdate(tipId, { $set: { status: 4 } })
        }
      }
    }
  }
}

exports.portFolioStatusUpdate = async (data) => {
  try {
    let { stock_symbol, price, user } = data
    let result = await PortFolioDB.find({
      user: user,
      order_type: 1,
      stock_symbol: stock_symbol,
      status: 1, //1 = padding
    })
    for (let i = 0; i < result.length; i++) {
      const element = result[i]
      if (element.price >= price) {
        //
        let data = await PortFolioDB.findOne({
          user: user,
          stock_symbol: stock_symbol,
          status: 2, // 2 = execute
        })
        if (data) {
          let price = data.price * parseInt(data.quantity)
          let current_price = parseInt(element.quantity) * element.price
          let totalQyt = parseInt(data?.quantity) + parseInt(element.quantity)

          let totalPrice = data.price + element.price
          let newPrice = totalPrice / totalQyt
          await PortFolioDB.findByIdAndUpdate(data._id, {
            $set: {
              status: 2,
              price: newPrice,
              total_price: totalPrice,
              quantity: Number(totalQyt),
            },
          })
        } else {
          await PortFolioDB.findByIdAndUpdate(element._id, {
            $set: {
              status: 2,
              price: price,
              total_price: price,
              quantity: Number(element.quantity),
            },
          })
        }

        // await PortFolioDB.findByIdAndUpdate(element._id, {
        //   $set: { status: 3 }, // 3 = order successful
        // })
      }
    }
  } catch (err) {
    console.error(err)
  }
}

exports.portFolioPriceChange = async (data) => {
  let { stock_symbol, price, user } = data
  const result = await PortFolioDB.findOne({
    user: user,
    stock_symbol: stock_symbol,
    status: 2,
  })

  //

  //
  try {
    if (data?.stock_symbol && result) {
      let market_price = price * parseInt(result.quantity)
      let your_price = Number(result?.price) * parseInt(result?.quantity)
      let profit_loss = Number(market_price) - Number(your_price)
      await PortFolioDB.updateMany(
        { stock_symbol, stock_symbol, user: user },
        {
          $set: {
            ltp_price: parseFloat(price),
            profit_loss: parseFloat(profit_loss),
          },
        }
      )
    }
  } catch (err) {
    console.error(err)
  }
}

//
exports.portFolioSellStock = async (data) => {
  let { stock_symbol, price, user } = data

  const result = await PortFolioDB.find({
    user: user,
    stock_symbol: stock_symbol,
    status: 1,
    order_type: 2,
  })
  for (let i = 0; i < result.length; i++) {
    const element = result[i]
    if (price >= element.price) {
      // for get buy stock as same stock symbol
      let data = await PortFolioDB.findOne({
        user: user,
        stock_symbol: stock_symbol,
        order_type: 1,
        status: 2, // 2 = execute
      })
      const userBalance = await UserDB.findById(user)

      if (data) {
        let newQwt = Number(data?.quantity) - Number(element.quantity)
        let balance =
          Number(userBalance.balance) + Number(data?.quantity) * Number(price)
        let useBalance =
          Number(userBalance.used_balance) -
          Number(data?.quantity) * Number(price)

        let newTotalPrice = Number(data.totalPrice) - Number(element.totalPrice)
        // let totalPrice = newQwt * Number(data?.price)
        if (data?.quantity === element.quantity) {
          await PortFolioDB.findOneAndUpdate(
            { _id: element._id },
            {
              $set: {
                status: 4,
              },
            },
            { new: true }
          )
          await PortFolioDB.findByIdAndDelete(data._id)
        } else {
          await PortFolioDB.findOneAndUpdate(
            { _id: element._id },
            {
              $set: {
                status: 4,
              },
            },
            { new: true }
          )
          await PortFolioDB.findByIdAndUpdate(
            data._id,
            {
              $set: {
                price: newTotalPrice / newQwt,
                total_price: newTotalPrice,
                quantity: newQwt,
              },
            },
            { new: true }
          )
        }

        await UserDB.findByIdAndUpdate(
          user,
          {
            $set: {
              balance: balance,
              used_balance: useBalance <= 0 ? 0 : useBalance,
            },
          },
          { new: true }
        )
      } else {
        let balance =
          Number(userBalance.balance) +
          Number(element?.quantity) * Number(price)
        let useBalance =
          Number(userBalance.used_balance) -
          Number(element?.quantity) * Number(price)
        await PortFolioDB.findByIdAndUpdate(
          element._id,
          {
            $set: {
              quantity: Number(element.quantity),
              status: 2,
            },
          },
          { new: true }
        )
        await UserDB.findByIdAndUpdate(
          user,
          {
            $set: {
              balance: balance,
              used_balance: useBalance <= 0 ? 0 : useBalance,
            },
          },
          { new: true }
        )
      }
    }
  }
}
