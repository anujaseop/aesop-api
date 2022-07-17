const mongoose = require("mongoose");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
let mongoosePaginate = require("mongoose-paginate-v2");

const newsSchema = new mongoose.Schema(
  {
    news_title: {
      type: String,
      required: true,
    },
    news_image: {
      type: String,
      required: true,
    },
    news_content: {
      type: String,
      default: "",
    },
    
    flag: {
      type: Number,
      required: true,
      default: 1, // * 1 Actived 2 Deactived
    },
  },
  { timestamps: true }
);

newsSchema.plugin(aggregatePaginate);
newsSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("news", newsSchema);
