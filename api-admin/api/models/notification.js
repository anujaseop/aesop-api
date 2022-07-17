const mongoose = require('mongoose')
let aggregatePaginate = require('mongoose-aggregate-paginate-v2')
let mongoosePaginate = require('mongoose-paginate-v2')

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // consultant or admin id
      default: '',
      index: true,
    },
    type: {
      type: String,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    consultant: {
      type: Array, // user ids
    },
  },
  { timestamps: true }
)

notificationSchema.plugin(aggregatePaginate)
notificationSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('notification', notificationSchema)
