const mongoose = require('mongoose')
let aggregatePaginate = require('mongoose-aggregate-paginate-v2')
let mongoosePaginate = require('mongoose-paginate-v2')
const tipSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    stock_name: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    instrument_name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    tip_type: {
      type: Number, //  1=F&O ,2=Equity
      required: true,
    },
    stock_type: {
      type: Number, //1=Buy,2=Sell
      required: true,
    },
    stock_availabiltiy: {
      type: Number, //1= Intraday,2=log term
      required: true,
    },
    stock_market: {
      type: Number,
      required: true, //1=Buy,2=Sell
    },
    price: {
      type: Number,
      required: true,
    },
    stop_loss_type: {
      type: Number,
      default: 0, //1=Stop Loss,2=Trailing
    },
    amount: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    trail_percentage: {
      type: Number,
      default: 0,
    },
    trailing_Stop_Loss_Amount: {
      type: Number,
      default: 0,
    },
    stock_trail_stop_lose: {
      type: Number,
      default: 0,
    },
    trail_stop_lose: {
      type: Number,
      default: 0,
    },
    target_value: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    //role: { type: Number, default: 1 }, //1=Consultant,2=Investor
    status: {
      type: Number,
      default: 1, //1=Inactice,2=Active,3=Success,4=Failed 5= Cancel 6= success close 7= fail close
    },
    flag: {
      type: Number,
      default: 1, //1=Active,2=Deactive,3=Delete
    },
  },
  { timestamps: true }
)
tipSchema.plugin(aggregatePaginate)
tipSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Tip', tipSchema)
