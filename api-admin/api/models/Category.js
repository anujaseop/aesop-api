// const mongoose = require('mongoose')
// let aggregatePaginate = require("mongoose-aggregate-paginate-v2")
// let mongoosePaginate = require("mongoose-paginate-v2")
// const CategorySchema = mongoose.Schema(
//   {
//     category_name:{type: String, require: true },
    
//     flag: { type: Number, default: 1 }, // 1=active,2=Delete
//   },
//   { timestamps: true }
// )
// CategorySchema.plugin(aggregatePaginate)
// CategorySchema.plugin(mongoosePaginate)
// module.exports = mongoose.model('category', CategorySchema)