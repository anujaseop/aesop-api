const mongoose = require("mongoose");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
let mongoosePaginate = require("mongoose-paginate-v2");

const cmsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    sub_title: {
      type: String,
      default: "",
    },
    banner_image: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    flag: {
      type: Number,
      required: true,
      default: 1, // * 1 Actived 2 Deactived
    },
  },
  { timestamps: true }
);

cmsSchema.plugin(aggregatePaginate);
cmsSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("cms", cmsSchema);
