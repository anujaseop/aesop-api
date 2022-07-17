const mongoose = require("mongoose")
let aggregatePaginate = require("mongoose-aggregate-paginate-v2")
let mongoosePaginate = require("mongoose-paginate-v2")
const groupSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    group_name: { type: String, required: true },
    group_pic: { type: String, required : true },
    flag: { type: Number, default: 1 }, //1=Active,2=Deactive,3=Delete
  },
  { timestamps: true }
)
groupSchema.plugin(aggregatePaginate)
groupSchema.plugin(mongoosePaginate)
module.exports = mongoose.model("Group", groupSchema)