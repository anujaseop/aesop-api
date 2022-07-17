const mongoose = require('mongoose')
const LoginVerificationSchema = mongoose.Schema(
  {
    phone_number: { type: String, require: true },
    token: { type: String, default: '' },
  },
  { timestamps: true }
)
module.exports = mongoose.model('LoginVerification', LoginVerificationSchema)
