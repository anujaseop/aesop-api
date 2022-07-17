const mongoose = require('mongoose');
let aggregatePaginate = require('mongoose-aggregate-paginate-v2');
let mongoosePaginate = require('mongoose-paginate-v2');
const SubscriptionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    period: { type: String, required: true, default: 0 },
    transaction: { type: String }, // tra_id
    expiry_date: { type: Date, required: true },
    amount: { type: Number, required: true },

    transaction_detail: { type: String }, // tra_object
    status: { type: Number, default: 1 }, //1=success,2=cancel,3=fail 4 = unsubscribe
  },
  { timestamps: true }
);
SubscriptionSchema.plugin(aggregatePaginate);
SubscriptionSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Subscription', SubscriptionSchema);
