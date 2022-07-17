const mongoose = require('mongoose')

//
const userTokenSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: Number,
      enum: [1, 2], // 1 android 2 ios
      required: true,
    },
  },
  { timestamps: true }
)
module.exports = mongoose.model('userToken', userTokenSchema)
