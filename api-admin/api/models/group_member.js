const mongoose = require("mongoose")
let aggregatePaginate = require("mongoose-aggregate-paginate-v2")
let mongoosePaginate = require("mongoose-paginate-v2")
const groupMemberSchema = mongoose.Schema(
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
    type: { type : Number, default: 1 }, //1=Member,2=Follow
    flag: { type: Number, default: 1 }, //1=Active,2=Deactive,3=Delete
  },
  { timestamps: true }
)
groupMemberSchema.plugin(aggregatePaginate)
groupMemberSchema.plugin(mongoosePaginate)
module.exports = mongoose.model("GroupMember", groupMemberSchema)