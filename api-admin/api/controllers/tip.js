const niv = require('node-input-validator');
const Helper = require('../helper/index');
const TipDB = require('../models/tip');
const followTip = require('../models/followtip');
const mongoose = require('mongoose');
const axios = require('axios');
const fb = require('../helper/firebase');
const db = fb.firestore();

//
exports.add = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    stock_name: 'required|maxLength:50',
    stock_type: 'required|in:1,2',
    stock_availabiltiy: 'required|in:1,2',
    stock_market: 'required|in:1,2',
    price: 'required|integer',
    target_value: 'required|maxLength:50',
    description: 'required',
    tip_type: 'required|in:1,2', // 1=F&O ,2=Equity
  });
  const matched = await objValidation.check();

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }

  const {
    user,
    stock_name,
    symbol,
    instrument_name,
    stock_type,
    stock_availabiltiy,
    stock_market,
    price,
    target_value,
    description,
    stop_loss_type,
    amount,
    percentage,
    trail_percentage,
    trailing_Stop_Loss_Amount,
    stock_trail_stop_lose,
    trail_stop_lose,
    tip_type,
  } = req.body;
  const validationErrorObject = {};
  validationErrorObject.message = 'Validation Error';
  validationErrorObject.error = {};

  if (!req.file) {
    validationErrorObject.error.image = {
      message: 'The image field is mandatory.',
      rule: 'required',
    };
    return res.status(422).send(validationErrorObject);
  }

  try {
    const tipObject = {};
    tipObject.user = req.userData._id;
    tipObject.symbol = symbol;
    tipObject.instrument_name = instrument_name;
    tipObject.stock_name = stock_name;
    tipObject.stock_type = parseInt(stock_type);
    tipObject.stock_availabiltiy = parseInt(stock_availabiltiy);
    tipObject.stock_market = parseInt(stock_market);
    tipObject.price = parseFloat(price);
    tipObject.target_value = target_value;
    tipObject.description = description;
    tipObject.tip_type = tip_type;

    if (stop_loss_type) tipObject.stop_loss_type = parseInt(stop_loss_type);
    if (amount) tipObject.amount = parseFloat(amount);
    if (percentage) tipObject.percentage = percentage;
    if (trail_percentage) tipObject.trail_percentage = trail_percentage;
    if (trailing_Stop_Loss_Amount)
      tipObject.trailing_Stop_Loss_Amount = trailing_Stop_Loss_Amount;
    if (stock_trail_stop_lose)
      tipObject.stock_trail_stop_lose = stock_trail_stop_lose;
    if (trail_stop_lose) tipObject.trail_stop_lose = trail_stop_lose;

    tipObject.image = req.file.path;

    const tip = new TipDB(tipObject);
    const result = await tip.save();

    return res.status(201).json({
      message: 'Tips has been successfully added',
      result: result,
    });
  } catch (err) {
    console.log(err);
    const request = req;
    Helper.writeErrorLog(request, err);
    res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

exports.get = async (req, res) => {
  let { limit, page, search, status } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10;
  }

  const option = {
    limit: limit,
    page: page,
  };
  const matchObject = {};
  matchObject.flag = 1;
  if (search)
    matchObject.$or = [
      { stock_name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  if (status) matchObject.status = parseInt(status);
  matchObject.user = mongoose.Types.ObjectId(req.userData._id);
  try {
    const resultAggregate = TipDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          stock_name: 1,
          image: 1,
          description: 1,
          price: 1,
          status: 1,
          tip_type: 1,
        },
      },
    ]);
    const result = await TipDB.aggregatePaginate(resultAggregate, option);

    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i];
      element.image = await Helper.getValidImageUrl(element.image);
    }
    return res.status(200).json({
      message: 'Tips has been retrived',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

// admin
exports.adminGet = async (req, res) => {
  const { id } = req.params; // consultant id

  let { limit, page, search, status } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10;
  }

  const option = {
    limit: limit,
    page: page,
  };
  const matchObject = {};
  matchObject.flag = 1;
  if (search)
    matchObject.$or = [
      { stock_name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  if (status) matchObject.status = parseInt(status);
  matchObject.user = mongoose.Types.ObjectId(id);
  try {
    const resultAggregate = TipDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          stock_name: 1,
          image: 1,
          description: 1,
          price: 1,
          status: 1,
          tip_type: 1,
        },
      },
    ]);
    const result = await TipDB.aggregatePaginate(resultAggregate, option);
    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i];
      element.image = await Helper.getValidImageUrl(element.image);
    }
    return res.status(200).json({
      message: 'Tips has been retrived',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

exports.getTipsForAdmin = async (req, res) => {
  let { user } = req.query;

  try {
    const result = await followTip
      .find({
        user_id: mongoose.Types.ObjectId(user),
      })
      .count();

    return res.status(200).json({
      message: 'Tips has been retrived',
      result: result,
    });
  } catch (err) {
    console.error(err);
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    });
  }
};

exports.getInvestor = async (req, res) => {
  let { limit, page, search, status } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10;
  }

  const option = {
    limit: limit,
    page: page,
  };
  const matchObject = {};
  matchObject.flag = 1;
  if (search)
    matchObject.$or = [
      { stock_name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  if (status) matchObject.status = parseInt(status);
  const user = req.userData._id;
  try {
    const followUser = await Helper.getFollowerData(user, 2);
    matchObject.group = { $in: followUser };

    const resultAggregate = TipDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $lookup: {
          from: 'followtips',
          localField: '_id',
          foreignField: 'tip_id',
          as: 'TipData',
        },
      },
      {
        $project: {
          _id: 1,
          stock_name: 1,
          image: 1,
          description: 1,
          price: 1,
          status: 1,
          tip_type: 1,
          TipData: { $size: '$TipData' },
        },
      },
    ]);
    const result = await TipDB.aggregatePaginate(resultAggregate, option);
    console.log('🚀 ~ exports.getInvestor= ~ result', result);
    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i];
      element.image = await Helper.getValidImageUrl(element.image);
    }
    return res.status(200).json({
      message: 'Tips has been retrived',
      result: result,
    });
  } catch (err) {
    console.error(err);
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

/**
 * @use
 * get all user tips by user id
 */
exports.userTipGet = async (req, res, next) => {
  const { id } = req.params;

  let { limit, page, search } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, ''].includes(search)) {
    search = '';
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10;
  }
  const option = {
    limit: limit,
    page: page,
  };

  try {
    const matchObject = {};
    matchObject.user = mongoose.Types.ObjectId(id);

    const resultAggregate = await TipDB.aggregate([
      {
        $match: matchObject,
      },
    ]);

    const result = await TipDB.aggregatePaginate(resultAggregate, option);

    return res.status(200).json({
      message: ' role has been retrived',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
    });
  }
};

/**
 * @use
 * get all user tips by user id
 */
exports.userTipGet = async (req, res, next) => {
  const { id } = req.params;
  let { limit, page, search } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, ''].includes(search)) {
    search = '';
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10;
  }
  const option = {
    limit: limit,
    page: page,
  };

  try {
    const matchObject = {};
    matchObject.user = mongoose.Types.ObjectId(id);
    console.log(matchObject);

    const resultAggregate = await TipDB.aggregate([
      {
        $match: matchObject,
      },
    ]);

    const result = await TipDB.aggregatePaginate(resultAggregate, option);
    return res.status(200).json({
      message: ' role has been retrived',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

exports.cancelTipStatus = async (req, res) => {
  const id = req.params.id;

  try {
    const updateObj = {};
    // first condition is inactive = cancel
    // first condition is active and current price (db price) is then(<) real price = success close

    const data = await TipDB.findById(id);

    let realPrice = await axios.get(
      `https://api.twelvedata.com/price?symbol=${data.symbol}&apikey=${process.env.Twelve_KEY}`
    );
    if (data && data.status === 1) {
      updateObj.status = 5;
    }

    if (data && data.stock_type === 1) {
      // for success close
      if (
        data &&
        data.price < parseFloat(realPrice.data.price) &&
        data.status === 2
      ) {
        updateObj.status = 6;
      }
      // for success fail
      if (
        data &&
        data.price > parseFloat(realPrice.data.price) &&
        data.status === 2
      ) {
        updateObj.status = 7;
      }
    } else {
      // for success close for sell
      if (
        data &&
        parseFloat(realPrice.data.price) <= data.price &&
        data.status === 2
      ) {
        updateObj.status = 6;
      }
      // for success fail for sell
      if (
        data &&
        parseFloat(realPrice.data.price) >= data.price &&
        data.status === 2
      ) {
        updateObj.status = 7;
      }
    }
    // updateObj.status = 5 //
    db.collection('messages')
      .doc(data.user.toString())
      .collection(data.user.toString())
      .where('tip_id', '==', data._id.toString())
      .get()
      .then((snap) => {
        snap.docs.forEach((doc) => {
          let batch = db.batch();
          const ref = doc.ref;
          batch.update(ref, updateObj);
          return batch.commit();
        });
      });

    const result = await TipDB.updateOne({ _id: id }, { $set: updateObj });
    return res.status(202).json({
      message: 'Tip status has been updated successfully',
      result: result,
    });
  } catch (err) {
    console.error(err);
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'error occured please try again later',
    });
  }
};

exports.getTipConsultant = async (req, res) => {
  const { consultant } = req.query;
  try {
    const result = await TipDB.find({
      user: consultant,
      status: { $in: [1, 2] },
      tip_type: 2,
    })
      .select('_id symbol')
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ message: 'get all tip by Consultant', result: result });
  } catch (err) {
    console.error(err);
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    });
  }
};

//
exports.tipStatusChange = async (req, res) => {
  const { id } = req.params;
  const objValidation = new niv.Validator(req.body, {
    status: 'required',
  });

  const matched = await objValidation.check();

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  const { status } = req.body; //1=Inactice,2=Active,3=Success,4=Failed 5= Cancel 6= success close 7= fail close

  try {
    let message = '';
    const updateObj = {};
    updateObj.status = parseInt(status);

    //
    if (status == 2) {
      message = 'Tip has been successfully activated';
    }
    if (status == 3) {
      message = 'Tip has been successfully success';
    }
    if (status == 4) {
      message = 'Tip has been successfully failed';
    }
    if (status == 5) {
      message = 'Tip has been successfully cancel';
    }
    if (status == 6) {
      message = 'Tip has been successfully success close';
    }
    if (status == 7) {
      message = 'Tip has been successfully fail close';
    }

    //
    const data = await TipDB.findById(id);

    // firebase
    db.collection('messages')
      .doc(data.user.toString())
      .collection(data.user.toString())
      .where('tip_id', '==', data._id.toString())
      .get()
      .then((snap) => {
        snap.docs.forEach((doc) => {
          let batch = db.batch();
          const ref = doc.ref;
          batch.update(ref, updateObj);
          return batch.commit();
        });
      });
    //
    //
    const result = await TipDB.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    );

    return res.status(200).json({ message: message, result: result });
  } catch (err) {
    console.error(err);
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    });
  }
};
