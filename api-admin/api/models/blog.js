const mongoose = require("mongoose")
let aggregatePaginate = require("mongoose-aggregate-paginate-v2")
let mongoosePaginate = require("mongoose-paginate-v2")
const BlogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    description: { type:String, required: true },
    flag: { type: Number, default: 1 }, //1=Active,2=Deactive,3=Delete
  },
  { timestamps: true }
)
BlogSchema.plugin(aggregatePaginate)
BlogSchema.plugin(mongoosePaginate)
module.exports = mongoose.model("Blog", BlogSchema)