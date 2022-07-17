const mongoose = require('mongoose')
let aggregatePaginate = require("mongoose-aggregate-paginate-v2")
let mongoosePaginate = require("mongoose-paginate-v2")
const AdminUserDataSchema = mongoose.Schema(
  {
    name:{type: String, require: true },
    email: {type:String, require:true},
    phoneNo: {type:String, require:true},
    flag: { type: Number, default: 1 }, // 1=active,2=Delete
  },
  { timestamps: true }
)
AdminUserDataSchema.plugin(aggregatePaginate)
AdminUserDataSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('AdminUserData', AdminUserDataSchema)