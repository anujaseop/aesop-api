const mongoose = require("mongoose")
const { Schema } = mongoose;
let aggregatePaginate = require('mongoose-aggregate-paginate-v2')
let mongoosePaginate = require('mongoose-paginate-v2')
const PaymentIntimateSchema = new Schema({
    user_id:{
        type:Schema.Types.ObjectId,require:true,},
    comment:{type:String,required: true,},

    flag:{
        type:Number, default: 1, require:true,  // 1 actived 2= deactived
     }

},{timestamps:true})

PaymentIntimateSchema.plugin(aggregatePaginate)
PaymentIntimateSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Paymentintimate', PaymentIntimateSchema)