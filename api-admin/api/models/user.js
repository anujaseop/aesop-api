const mongoose = require('mongoose')
let aggregatePaginate = require('mongoose-aggregate-paginate-v2')
let mongoosePaginate = require('mongoose-paginate-v2')
const userSchema = mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phone_number: { type: String, reuired: true },
    investment_amount: { type: Number, default: 0 },
    subscription_fee_limit: { type: String, default: '' },
    dmat_account_type: { type: String, default: '' }, //1=5 Paisa,2=Abstox,3=HDFC securities,4=ICIC direct,5=Airtel Money,6=Bason
    sebi_registration_number: { type: String, default: '' },
    pancard_number: { type: String, default: '' },
    pancard_photo: { type: String, default: '' },
    statement: { type: String, default: '' },
    subscription: { type: Number, default: 0 }, //1=Free,2=Paid
    forOneYear: { type: Number, default: 0 },
    forOneMonth: { type: Number, default: 0 },
    forThreeMonth: { type: Number, default: 0 },
    phone_token: {
      type: String,
      default: '',
    },
    forSixMonth: { type: Number, default: 0 },
    image: { type: String, default: '' },
    reset_password_code: { type: String, default: '' },
    group_name: { type: String, default: '' },
    group_pic: { type: String, default: '' },
    tag: { type: String, default: '' },
    category: { type: String, default: '' },
    expertise: { type: String, default: '' },
    about: { type: String, default: '' },
    role: { type: Number, default: 1 }, //1=Consultant,2=Investor
    tip_notification: { type: Number, default: 0 }, //0=Off,1=On
    news_notification: { type: Number, default: 0 }, //0=Off,1=On
    flag: { type: Number, default: 1 }, //1=Active,2=Deactive,3=Delete 4= Enable user
    balance: {
      type: Number,
      default: 100000,
    },
    used_balance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)
userSchema.plugin(aggregatePaginate)
userSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('User', userSchema)
