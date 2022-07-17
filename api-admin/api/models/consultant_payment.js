// const mongoose = require('mongoose')
// const { Schema } = mongoose;
// let aggregatePaginate = require("mongoose-aggregate-paginate-v2")
// let mongoosePaginate = require("mongoose-paginate-v2")
// const ConsultantPaymentSchema = new.Schema(
//   {
//     user_id:type:Schema.ObjectId,require:true,
//     from_date:{type: Date, require: true },
//     to_date:{type: Date, require: true },
//     amount:{type: Number, require: true },

//     flag: { type: Number, default: 1 }, // 1=active,2=Delete
//   },
//   { timestamps: true }
// )
// ConsultantPaymentSchema.plugin(aggregatePaginate)
// ConsultantPaymentSchema.plugin(mongoosePaginate)
// module.exports = mongoose.model('ConsultantpaymentSchema', ConsultantPaymentSchema)

const mongoose = require('mongoose')
const { Schema } = mongoose
let aggregatePaginate = require('mongoose-aggregate-paginate-v2')
let mongoosePaginate = require('mongoose-paginate-v2')
const ConsultantPaymentSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      require: true,
    },
    from_date: {
      type: Date,
      require: true,
    },
    to_date: {
      type: Date,
      require: true,
    },
    amount: {
      type: Number,
      require: true,
    },
    flag: {
      type: Number,
      default: 1,
      require: true, // 1 actived 2= deactivated
    },
  },
  { timestamps: true }
)

ConsultantPaymentSchema.plugin(aggregatePaginate)
ConsultantPaymentSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('consultant_payment', ConsultantPaymentSchema)
