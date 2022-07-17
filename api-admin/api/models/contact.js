const mongoose = require('mongoose')
let aggregatePaginate = require('mongoose-aggregate-paginate-v2')
let mongoosePaginate = require('mongoose-paginate-v2')
const contactSchema = mongoose.Schema(
  {
    email: { type: String, require: true },
    full_name: { type: String, require: true },
    message: { type: String, require: true },
    flag: { type: Number, default: 1 }, // 1=active,2=Delete
  },
  { timestamps: true }
)
contactSchema.plugin(aggregatePaginate)
contactSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('contact', contactSchema)
