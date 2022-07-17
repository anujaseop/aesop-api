const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dbConfig = require('./api/config/db');

const adminRoutes = require('./api/routes/admin');
const groupRoutes = require('./api/routes/group');
const userRoutes = require('./api/routes/user');
const blogRoutes = require('./api/routes/blog');
const tipRoutes = require('./api/routes/tip');
const adminuserRoutes = require('./api/routes/adminuser');
const CmsRoutes = require('./api/routes/cms');
const notificationRoutes = require('./api/routes/notification');
const payRoutes = require('./api/routes/payment');
const NewsRoutes = require('./api/routes/news');
const DematRoutes = require('./api/routes/demat');
const ConsultantPaymentRoutes = require('./api/routes/consultant_payment');
const FollowTipRoutes = require('./api/routes/followtip');
const portfolioRoutes = require('./api/routes/portfolio');
const contactRoutes = require('./api/routes/contact');
const cors = require('cors');
//const NewsRoutes = require('./api/routes/news')
//const DematRoutes = require('./api/routes/demat')
//const ConsultantPaymentRoutes = require('./api/routes/consultant_payment')

//const CategoryRoutes = require ('./api/routes/category')

mongoose.Promise = global.Promise;
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', '*');

//   if (req.method === 'OPTIONS') {
//     res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE');
//     return res.status(200).json({});
//   }
//   next();
// });

app.all('/*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/tip', tipRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/adminuser', adminuserRoutes);
app.use('/api/cms', CmsRoutes);
app.use('/api/news', NewsRoutes);
app.use('/api/demat', DematRoutes);
app.use('/api/consultant_payment', ConsultantPaymentRoutes);
app.use('/api', payRoutes);
app.use('/api/followtip', FollowTipRoutes);
app.use('/api/portfolio', portfolioRoutes);
//app.use('/api/category', CategoryRoutes)
app.use('/api/notification', notificationRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/contact', contactRoutes);

app.use('/cancel', (req, res) => {
  console.log('cancel');
  console.log(req);
});
app.use('/success', (req, res) => {
  console.log('success');
  console.log(req);
});

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    message: error.message,
  });
});

module.exports = app;
