const mongoose = require('mongoose')
let aggregatePaginate = require("mongoose-aggregate-paginate-v2")
let mongoosePaginate = require("mongoose-paginate-v2")
const DematSchema = mongoose.Schema(
  {
    demat_name:{type: String, require: true },
    
    flag: { type: Number, default: 1 }, // 1=active,2=Delete
  },
  { timestamps: true }
)
DematSchema.plugin(aggregatePaginate)
DematSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('demat', DematSchema)