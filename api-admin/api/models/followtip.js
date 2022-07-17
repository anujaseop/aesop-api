const mongoose = require('mongoose')
let aggregatePaginate = require('mongoose-aggregate-paginate-v2')
let mongoosePaginate = require('mongoose-paginate-v2')
const FollowTipSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
    },
    tip_id: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
    },
  },
  { timestamps: true }
)
FollowTipSchema.plugin(aggregatePaginate)
FollowTipSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('followtip', FollowTipSchema)
