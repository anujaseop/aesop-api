const mongoose = require("mongoose")
let aggregatePaginate = require("mongoose-aggregate-paginate-v2")
let mongoosePaginate = require("mongoose-paginate-v2")
const groupRatingSchema = mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    rating: { type : Number, default: 0 },
    flag: { type: Number, default: 1 }, //1=Active,2=Deactive,3=Delete
  },
  { timestamps: true }
)
groupRatingSchema.plugin(aggregatePaginate)
groupRatingSchema.plugin(mongoosePaginate)
module.exports = mongoose.model("GroupRating", groupRatingSchema)