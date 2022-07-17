const mongoose = require("mongoose")
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
let mongoosePaginate = require("mongoose-paginate-v2");
const adminSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, require: true },
    email: {
      type: String,
      required: true,
      
    },
    password: { type: String, required: true },
    image: { type: String, default: '' },
    flag: { type: Number, default: 0 },
    
  },
  { timestamps: true }
)
adminSchema.plugin(aggregatePaginate);
adminSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Admin", adminSchema)
