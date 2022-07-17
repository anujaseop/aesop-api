var fb = require('firebase-admin')

var serviceAccount = require('../../trading-app-d20c1-firebase-adminsdk-czcwj-0005cf2e88.json')

fb.initializeApp({
  credential: fb.credential.cert(serviceAccount),
  databaseURL: 'https://trading-app-d20c1-default-rtdb.firebaseio.com',
})
module.exports = fb
