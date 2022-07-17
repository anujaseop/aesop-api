const mongoose = require('mongoose')
let aggregatePaginate = require('mongoose-aggregate-paginate-v2')
let mongoosePaginate = require('mongoose-paginate-v2')
const PortfolioSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    stock_name: {
      type: String,
      required: true,
    },
    stock_symbol: {
      type: String,
      required: true,
    },
    stock_exchange: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    product_type: {
      type: Number, // 1 “NRML”(Long Term)  2 ” MIS” (intra day)
      required: true,
    },
    stop_loss: {
      type: Number,
      default: null,
    },
    trailing_stop_loss: {
      type: Number,
      default: null,
    },
    target_value: {
      type: Number,
      default: null,
    },

    total_price: {
      type: Number,
      default: null,
    },
    profit_loss: {
      type: Number,
      default: null,
    },
    order_from: {
      type: Number, // 1 paper 2 tips
      required: true,
    },
    order_type: {
      type: Number, // 1 buy 2 sell
      required: true,
    },
    ltp_price: {
      type: Number,
      default: null,
    },
    order_market_price: {
      type: Number,
      default: null, // 1 market price, 2 limit price
    },
    status: {
      type: Number,
      default: 1, // 1 padding 2 executed 3  order successful // 4 close // 5  square off
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
)

PortfolioSchema.plugin(aggregatePaginate)
PortfolioSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('portfolio', PortfolioSchema)
