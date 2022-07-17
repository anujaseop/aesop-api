const mongoose = require('mongoose')
require('dotenv').config()

module.exports = {
  url: 'mongodb+srv://dev-user:dxJyqOFYtg6rcwEA@cluster0.qffiq.mongodb.net/trading-app?retryWrites=true&w=majority',
  //Google Crediatials
  //url: 'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false',
  client_id:
    '393331954946-i460n7uogfhb6r6ql30ae64dkatmko2l.apps.googleusercontent.com',
  client_secret: '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',
  redrict_url: 'https://developers.google.com/oauthplayground',
  refresh_token:
    '1//04c8eKUTGGAHtCgYIARAAGAQSNwF-L9IrUKBWz92YvqKELQCk6kKXfqGGe21PrnUbm_7LpE8ia0aeJzd1vwVti5w7KjiUpmZM9F4',
  folder_id: '1SevYDeIdy2AtW4gvn1EWMRTad8UKagec',
  db_name: 'trading-app',
  //db_name: 'test'
}

mongoose
  .connect(`${process.env.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected!!')
  })
  .catch((err) => {
    console.log('Failed to connect to MongoDB', err)
  })

exports.mongoose
// final url
// mongodb+srv://${process.env.MONGO_UR}:${process.env.MONGO_PWD}@cluster0.qffiq.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority
