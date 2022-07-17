const stripe = require('stripe')('sk_test_nL0FUtjHxCEwRYn9KqoGgt3j');
const SubscriptionDB = require('../models/subscription');
const GroupRatingDB = require('../models/group_rating');
const GroupMemberDB = require('../models/group_member');
const PaymentIntimateDB = require('../models/payment_intimate');
const niv = require('node-input-validator');
const Helper = require('../helper/index');
const UserDB = require('../models/user');
const mongoose = require('mongoose');
const moment = require('moment');
const PaymentInstigateDB = require('../models/payment_intimate');

//
exports.all = async (req, res) => {
  let { limit, page } = req.query;
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
  const groupMatchObj = {};
  matchObject.flag = 1;
  matchObject.role = 1;

  const user = req.userData._id;
  let matchGroup = {};
  matchGroup.GroupMatchSize = 0;
  matchGroup._id = { $ne: mongoose.Types.ObjectId(process.env.GROUP) };
  try {
    //
    const joinData = await Helper.getFollowerData(user, 1);
    matchObject._id = { $nin: joinData };

    const resultAggregate = UserDB.aggregate([
      // for follow and unfollow status check
      {
        $lookup: {
          from: 'groupmembers',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$id'] },
                    { $eq: ['$type', 2] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
          ],
          as: 'followData',
        },
      },
      // for rating
      {
        $lookup: {
          from: 'groupratings',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$group', '$$id'],
                },
              },
            },
          ],
          as: 'ratingData',
        },
      },
      // for group member size
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'group',
          as: 'GroupData',
        },
      },

      {
        $lookup: {
          from: 'subscriptions',
          let: { groupId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$groupId'] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                    { $eq: ['$status', 1] },
                  ],
                },
              },
            },
          ],
          as: 'GroupMatchData',
        },
      },
      {
        $unwind: { path: '$ratingData', preserveNullAndEmptyArrays: true },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          group_id: 1,
          group_name: 1,
          group_pic: 1,
          tag: 1,
          flag: 1,
          category: 1,
          expertise: 1,
          subscription: 1,
          forOneYear: 1,
          forOneMonth: 1,
          forThreeMonth: 1,
          forSixMonth: 1,
          about: 1,
          following: { $size: '$followData' },
          rating: { $ifNull: ['$ratingData.rating', 0] },
          groupSize: { $size: '$GroupData' },
          GroupMatchSize: { $size: '$GroupMatchData' },
        },
      },
      {
        $match: matchGroup,
      },
    ]);

    const result = await UserDB.aggregatePaginate(resultAggregate, option);

    //

    let checkUser = await SubscriptionDB.findOne({
      user: process.env.GROUP,
    });
    if (!checkUser) {
      let firstGroup = await getFirstGroup(user, 1);
      if (firstGroup) {
        const promise3 = new Promise(async (resolve, reject) => {
          result.docs.unshift(firstGroup);
          resolve();
        });
        Promise.all[promise3];
      }
    }

    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i];
      element.group_pic = await Helper.getValidImageUrl(element.group_pic);
    }

    return res.status(200).json({
      message: 'Group has been retrived',
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

exports.detail = async (req, res) => {
  const matchObject = {};
  matchObject._id = mongoose.Types.ObjectId(req.params.id);
  matchObject.flag = 1;
  matchObject.role = 1;
  const user = req.userData._id;
  try {
    const resultAggregate = await UserDB.aggregate([
      {
        $lookup: {
          from: 'groupmembers',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$id'] },
                    { $eq: ['$type', 2] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
          ],
          as: 'followData',
        },
      },
      {
        $lookup: {
          from: 'groupmembers',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$group', '$$id'] }, { $eq: ['$type', 2] }],
                },
              },
            },
          ],
          as: 'followerData',
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [{ $eq: ['$group', '$$id'] }],
                },
              },
            },
          ],
          as: 'memberData',
        },
      },

      {
        $lookup: {
          from: 'groupratings',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$group', '$$id'],
                  // { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                },
              },
            },
          ],
          as: 'ratingData',
        },
      },
      {
        $unwind: { path: '$ratingData', preserveNullAndEmptyArrays: true },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          group_id: 1,
          group_name: 1,
          group_pic: 1,
          tag: 1,
          experts: 1,
          about: 1,
          flag: 1,
          subscription: 1,
          forOneYear: 1,
          forOneMonth: 1,
          forThreeMonth: 1,
          forSixMonth: 1,
          following: { $size: '$followData' },
          followers: { $size: '$followerData' },
          members: { $size: '$memberData' },
          rating: { $ifNull: ['$ratingData.rating', 0] },
        },
      },
    ]);
    const result = resultAggregate[0];
    if (!result) {
      return res.status(404).json({
        message: 'Group not found',
        result: result,
      });
    }
    if (result && result.group_pic) {
      result.group_pic = await Helper.getValidImageUrl(result.group_pic);
    }
    return res.status(200).json({
      message: 'Group has been retrived',
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

exports.follow = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {
    group: 'required',
  });
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  const user = req.userData._id;
  const { group } = req.body;

  const findGroupResult = await Helper.findMemberIngroup(group, user, 2);

  if (findGroupResult === null) {
    try {
      const result = await Helper.addMemberIngroup(group, user, 2);
      return res.status(201).json({
        message: 'Successfully following',
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
  } else {
    try {
      const result = await Helper.deleteMemberIngroup(group, user, 2);
      return res.status(201).json({
        message: 'Successfully unfollowing',
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
  }
};

exports.join = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {
    group: 'required',
    amount: 'required',
    // token: 'required'
  });
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  const user = req.userData._id;
  const { group, amount, transaction, period, transaction_detail, status } =
    req.body;
  try {
    const groupData = await UserDB.findById(group);
    const checkGroup = await SubscriptionDB.findOne({
      user: user,
      group: group,
    });

    let result;
    let endDateMoment = moment(new Date());
    if (Number(amount) <= 0) {
      endDateMoment.add(14, 'years');
    } else if (period === '1Y' && groupData.forOneYear) {
      endDateMoment.add(365, 'days');
    } else if (period === '1M' && groupData.forOneMonth) {
      endDateMoment.add(1, 'M');
    } else if (period === '3M' && groupData.forThreeMonth) {
      endDateMoment.add(3, 'M');
    } else if (period === '6M' && groupData.forSixMonth) {
      endDateMoment.add(6, 'M');
    }

    if (checkGroup) {
      result = await SubscriptionDB.findByIdAndUpdate(
        checkGroup._id,
        {
          $set: {
            user: user,
            group: group,
            expiry_date: endDateMoment,
            period: period,
            transaction: transaction,
            transaction_detail: transaction_detail,
            amount: Number(amount),
            status: 1,
          },
        },
        { new: true }
      );
    } else {
      // const charge = await stripe.charges.create({
      //   amount: amount * 100,
      //   currency: 'usd',
      //   source: token,
      // })
      // await Helper.addMemberIngroup(group, user, 2)
      // await Helper.addMemberIngroup(group, user, 1);
      const subscription = new SubscriptionDB({
        user: user,
        group: group,
        expiry_date: endDateMoment,
        transaction: transaction,
        transaction_detail: transaction_detail,
        period: period,
        amount: Number(amount),
      });
      result = await subscription.save();
    }

    return res.status(200).json({
      message:
        'Congratulations, you have subscribed successfully and joined team',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err.message);
    return res.status(500).json({
      message: err.message,
      error: err,
    });
  }
};

exports.subscribe = async (req, res) => {
  let { limit, page } = req.query;
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
  const groupObj = {};
  matchObject.status = 1;
  // matchObject.type = 1;
  const user = req.userData._id;
  try {
    matchObject.user = mongoose.Types.ObjectId(user);
    groupObj.group_id = { $ne: mongoose.Types.ObjectId(process.env.GROUP) };
    matchObject['userData.flag'] = 1;

    const resultAggregate = SubscriptionDB.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'group',
          foreignField: '_id',

          as: 'userData',
        },
      },
      { $unwind: '$userData' },
      {
        $lookup: {
          from: 'groupratings',
          let: { id: '$group' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$id'] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
          ],
          as: 'ratingData',
        },
      },
      {
        $unwind: { path: '$ratingData', preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: 'subscriptions',
          let: { id: '$group' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$group', '$$id'] },
                    // { $eq: ['$group', '$$id'] },
                  ],
                },
              },
            },
          ],
          as: 'memberData',
        },
      },

      {
        $lookup: {
          from: 'subscriptions',
          let: { group: '$group' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$group'] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
            {
              $project: {
                expiry_date: 1,
                createdAt: 1,
                amount: 1,
                flag: 1,
                group: 1,
                period: 1,
              },
            },
          ],
          as: 'paymentData',
        },
      },
      {
        $lookup: {
          from: 'groupmembers',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$id'] },
                    { $eq: ['$type', 2] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
          ],
          as: 'followData',
        },
      },
      { $unwind: '$paymentData' },
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          flag: { $ifNull: ['$userData.flag', ''] },
          group_id: { $ifNull: ['$userData._id', ''] },
          group_name: { $ifNull: ['$userData.group_name', ''] },
          group_pic: { $ifNull: ['$userData.group_pic', ''] },
          category: { $ifNull: ['$userData.category', ''] },
          expertise: { $ifNull: ['$userData.expertise', ''] },
          tag: { $ifNull: ['$userData.tag', ''] },
          about: { $ifNull: ['$userData.about', ''] },
          subscription: { $ifNull: ['$userData.subscription', ''] },
          forOneYear: { $ifNull: ['$userData.forOneYear', ''] },
          forOneMonth: { $ifNull: ['$userData.forOneMonth', ''] },
          forThreeMonth: { $ifNull: ['$userData.forThreeMonth', ''] },
          forSixMonth: { $ifNull: ['$userData.forSixMonth', ''] },
          expiry_date: { $ifNull: ['$paymentData.expiry_date', ''] },
          period: { $ifNull: ['$paymentData.period', ''] },
          paid_date: { $ifNull: ['$paymentData.createdAt', ''] },
          amount: { $ifNull: ['$paymentData.amount', ''] },
          rating: { $ifNull: ['$ratingData.rating', 0] },
          following: { $size: '$followData' },
          memberSize: { $size: '$memberData' },
        },
      },
      {
        $match: groupObj,
      },
    ]);
    const result = await SubscriptionDB.aggregatePaginate(
      resultAggregate,
      option
    );

    let firstGroup = await getFirstGroup(user, 2);

    if (firstGroup) {
      result.docs.unshift(firstGroup);
    }

    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i];
      const planExpiredDate = element.expiry_date;
      element.group_pic = await Helper.getValidImageUrl(element.group_pic);
      element.expiry_date = await moment(element.expiry_date).format(
        'Do MMMM YYYY'
      );
      element.paid_date = await moment(element.paid_date).format(
        'Do MMMM YYYY'
      );
      element.isPlanExpired = Helper.isExpired(planExpiredDate);
    }
    return res.status(200).json({
      message: 'Group has been retrived',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    });
  }
};
exports.unsubscribe = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await SubscriptionDB.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 4,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      message: 'Group has been successfully unsubscribed',
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

exports.subscribeSingledata = async (req, res) => {
  const dataSubscribe = SubscriptionDB.findOne({ id: req.body.id });
  return res.status(200).json({
    message: 'subscribeSingledata has been retrived',
    result: dataSubscribe,
  });
};

exports.rating = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {
    group: 'required',
    rating: 'required|numeric',
  });
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  const user = req.userData._id;
  const { group, rating } = req.body;
  try {
    const existingRating = await GroupRatingDB.findOne({
      group: group,
      user: user,
    });
    if (existingRating) {
      await GroupRatingDB.findByIdAndUpdate(existingRating._id, {
        rating: rating,
      });
    } else {
      const groupRating = new GroupRatingDB({
        group: group,
        user: user,
        rating: rating,
      });
      await groupRating.save();
    }
    return res.status(201).json({
      message: 'Rating has been successfully added',
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err.message);
    return res.status(500).json({
      message: err.message,
      error: err,
    });
  }
};

exports.get = async (req, res) => {
  const { id } = req.params;
  let { limit, page } = req.query;
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

  try {
    const resultAggregate = GroupMemberDB.aggregate([
      {
        $match: {
          group: mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'usersData',
        },
      },
      {
        $project: {
          _id: 1,
          usersData: {
            first_name: 1,
            last_name: 1,
            flag: 1,
          },
        },
      },
    ]);

    const result = await GroupMemberDB.aggregatePaginate(
      resultAggregate,
      option
    );

    return res.status(200).json({
      message: 'Group member has been retrived',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    });
  }
};

// add payment intimate
exports.add = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {});

  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors });
  }

  const { user_id, comment } = req.body;
  try {
    const paymentintimateObject = {};

    paymentintimateObject.user_id = user_id;
    paymentintimateObject.comment = comment;

    //console.log(paymentintimateObject)
    const newpaymentintimateData = new PaymentIntimateDB(paymentintimateObject);
    const result = await newpaymentintimateData.save();
    return res.status(201).send({
      message: 'payment intimate has been added successfully',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).send({
      message: 'Error occurred, Please try again later',
      error: err.message,
    });
  }
};

// get group intimate
exports.intimate = async (req, res) => {
  const { id } = req.params;
  let { limit, page } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 50;
  }

  const option = {
    limit: limit,
    page: page,
  };

  try {
    const resultAggregate = UserDB.aggregate([
      {
        $project: {
          first_name: 1,
          last_name: 1,
          email: 1,
          createdAt: 1,
        },
      },

      {
        $lookup: {
          from: 'paymentintimates',
          localField: '_id',
          foreignField: 'user_id',
          as: 'PaymentCommentData',
        },
      },
    ]);

    const result = await UserDB.aggregatePaginate(resultAggregate, option);

    return res.status(200).json({
      message: 'Group  has been retrived',
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

// exports.getMembers = async (req, res) => {
//   const { id } = req.params;
//   let { limit, page } = req.query;
//   if ([null, undefined, ''].includes(page)) {
//     page = 1;
//   }
//   if ([null, undefined, '', 1].includes(limit)) {
//     limit = 10;
//   }

//   const option = {
//     limit: limit,
//     page: page,
//   };

//   try {
//     const resultAggregate = GroupMemberDB.aggregate([
//       {
//         $match: {
//           group: mongoose.Types.ObjectId(id),
//         },
//       },
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'user',
//           foreignField: '_id',
//           as: 'usersData',
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           usersData: {
//             first_name: 1,
//             last_name: 1,
//             flag: 1,
//           },
//         },
//       },
//     ]);

//     const result = await GroupMemberDB.aggregatePaginate(
//       resultAggregate,
//       option
//     );

//     return res.status(200).json({
//       message: 'Group member has been retrived..',
//       result: result,
//     });
//   } catch (err) {
//     console.error(err);
//     const request = req;
//     Helper.writeErrorLog(request, err);
//     return res.status(500).json({
//       message: 'Error occurred, Please try again later',
//       error: err.message,
//     });
//   }
// };

// add payment intimate

exports.getMembers = async (req, res) => {
  const { id } = req.params;
  let { limit, page } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 100;
  }

  const option = {
    limit: limit,
    page: page,
  };

  try {
    const result = await SubscriptionDB.aggregate([
      {
        $match: {
          group: mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $unwind: { path: '$userData', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          userData: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            image: 1,
            flag: 1,
          },
        },
      },
    ]);

    const getUser = await UserDB.find({ _id: mongoose.Types.ObjectId(id) });

    result.push({
      _id: getUser[0]._id,
      userData: {
        _id: getUser[0]._id,
        first_name: getUser[0].first_name,
        last_name: getUser[0].last_name,
        image: getUser[0].image,
        flag: getUser[0].flag,
      },
    });

    for (var i = 0; i < result.length; i++) {
      const element = result[i];

      if (element.userData.image) {
        element.userData.image = await Helper.getValidImageUrl(
          element.userData.image
        );
      } else {
        element.userData.image = '';
      }
    }

    return res.status(200).json({
      message: 'Group members has been retrived',
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

exports.add = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {});

  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors });
  }

  const { user_id, comment } = req.body;
  try {
    const paymentintimateObject = {};

    paymentintimateObject.user_id = user_id;
    paymentintimateObject.comment = comment;

    //console.log(paymentintimateObject)
    const newpaymentintimateData = new PaymentIntimateDB(paymentintimateObject);
    const result = await newpaymentintimateData.save();
    return res.status(201).send({
      message: 'paymentintimate has been added successfully',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).send({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

// get payment intimate
exports.intimate = async (req, res) => {
  const { id } = req.params;
  let { limit, page } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 50;
  }

  const option = {
    limit: limit,
    page: page,
  };

  try {
    const resultAggregate = UserDB.aggregate([
      {
        $project: {
          first_name: 1,
          last_name: 1,
          email: 1,
          createdAt: 1,
        },
      },

      {
        $lookup: {
          from: 'paymentintimates',
          localField: '_id',
          foreignField: 'user_id',
          as: 'PaymentCommentData',
        },
      },
    ]);

    const result = await UserDB.aggregatePaginate(resultAggregate, option);

    return res.status(200).json({
      message: 'Group  has been retrived',
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
exports.intimateAdmin = async (req, res) => {
  let { limit, page, user } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 50;
  }

  const option = {
    limit: limit,
    page: page,
  };
  const matchObj = {};
  if (user) {
    matchObj.user_id = mongoose.Types.ObjectId(user);
  }

  try {
    const resultAggregate = PaymentInstigateDB.aggregate([
      { $match: matchObj },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $unwind: { path: '$userData', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          comment: 1,
          userData: {
            first_name: 1,
            last_name: 1,
            email: 1,
          },
        },
      },
    ]);

    const result = await PaymentInstigateDB.aggregatePaginate(
      resultAggregate,
      option
    );

    return res.status(200).json({
      message: 'Group  has been retrived',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err.message,
    });
  }
};

exports.adminSubscribe = async (req, res) => {
  const { id } = req.params;
  let { limit, page } = req.query;
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
  matchObject.status = 1;

  const user = id;
  try {
    matchObject.user = mongoose.Types.ObjectId(id);
    const resultAggregate = SubscriptionDB.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'group',
          foreignField: '_id',
          as: 'userData',
        },
      },
      { $unwind: '$userData' },
      {
        $lookup: {
          from: 'groupratings',
          let: { id: '$group' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$id'] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
          ],
          as: 'ratingData',
        },
      },
      {
        $unwind: { path: '$ratingData', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'subscriptions',
          let: { group: '$group' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$group'] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
            {
              $project: {
                expiry_date: 1,
                createdAt: 1,
                amount: 1,
                group: 1,
              },
            },
          ],
          as: 'paymentData',
        },
      },
      {
        $lookup: {
          from: 'groupmembers',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$id'] },
                    { $eq: ['$type', 2] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
          ],
          as: 'followData',
        },
      },
      { $unwind: '$paymentData' },
      {
        $sort: { createdAt: -1 },
      },
      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          group_id: { $ifNull: ['$userData._id', ''] },
          group_name: { $ifNull: ['$userData.group_name', ''] },
          group_pic: { $ifNull: ['$userData.group_pic', ''] },
          category: { $ifNull: ['$userData.category', ''] },
          expertise: { $ifNull: ['$userData.expertise', ''] },
          tag: { $ifNull: ['$userData.tag', ''] },
          about: { $ifNull: ['$userData.about', ''] },
          subscription: { $ifNull: ['$userData.subscription', ''] },
          forOneYear: { $ifNull: ['$userData.forOneYear', ''] },
          forOneMonth: { $ifNull: ['$userData.forOneMonth', ''] },
          forThreeMonth: { $ifNull: ['$userData.forThreeMonth', ''] },
          forSixMonth: { $ifNull: ['$userData.forSixMonth', ''] },
          expiry_date: { $ifNull: ['$paymentData.expiry_date', ''] },
          paid_date: { $ifNull: ['$paymentData.createdAt', ''] },
          amount: { $ifNull: ['$paymentData.amount', ''] },
          rating: { $ifNull: ['$ratingData.rating', 0] },
          following: { $size: '$followData' },
        },
      },
    ]);
    const result = await SubscriptionDB.aggregatePaginate(
      resultAggregate,
      option
    );

    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i];
      const planExpiredDate = element.expiry_date;
      element.group_pic = await Helper.getValidImageUrl(element.group_pic);
      element.expiry_date = await moment(element.expiry_date).format(
        'Do MMMM YYYY'
      );
      element.paid_date = await moment(element.paid_date).format(
        'Do MMMM YYYY'
      );
      element.isPlanExpired = Helper.isExpired(planExpiredDate);
    }
    return res.status(200).json({
      message: 'Group has been retrived',
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

//
exports.adminSubscribeAll = async (req, res) => {
  const { id } = req.params;
  let { limit, page, user } = req.query;
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
  matchObject.status = 1;
  matchObject['userData.flag'] = 1;
  try {
    if (user) {
      matchObject['userData._id'] = mongoose.Types.ObjectId(user);
    }
    const resultAggregate = SubscriptionDB.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'group',
          foreignField: '_id',
          as: 'groupData',
        },
      },
      {
        $unwind: { path: '$groupData', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$userData', preserveNullAndEmptyArrays: true },
      },
      { $match: matchObject },
      {
        $project: {
          amount: 1,
          expiry_date: 1,
          userData: {
            fullName: {
              $concat: ['$userData.first_name', ' ', '$userData.last_name'],
            },
          },
          groupData: {
            group_name: 1,
            group_pic: 1,
          },
          createdAt: 1,
        },
      },
    ]);
    const result = await SubscriptionDB.aggregatePaginate(
      resultAggregate,
      option
    );

    for (var i = 0; i < result.docs.length; i++) {
      const element = result.docs[i];
      const planExpiredDate = element.expiry_date;
      element.groupData.group_pic = await Helper.getValidImageUrl(
        element.groupData.group_pic
      );
      element.expiry_date = await moment(element.expiry_date).format(
        'Do MMMM YYYY'
      );
      element.paid_date = await moment(element.createdAt).format(
        'Do MMMM YYYY'
      );
      element.isPlanExpired = Helper.isExpired(planExpiredDate);
      delete element.createdAt;
    }
    return res.status(200).json({
      message: 'Group has been retrived',
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
//

const getFirstGroup = async (user, type = 1, loginUser) => {
  let firstGroup;
  if (type === 1) {
    firstGroup = await UserDB.aggregate([
      {
        $lookup: {
          from: 'groupmembers',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$id'] },
                    { $eq: ['$type', 2] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
          ],
          as: 'followData',
        },
      },
      // for rating
      {
        $lookup: {
          from: 'groupratings',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$group', '$$id'],
                },
              },
            },
          ],
          as: 'ratingData',
        },
      },
      // for group member size
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'group',
          as: 'GroupData',
        },
      },

      {
        $lookup: {
          from: 'subscriptions',
          let: { groupId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$groupId'] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                    { $eq: ['$status', 1] },
                  ],
                },
              },
            },
          ],
          as: 'GroupMatchData',
        },
      },
      {
        $unwind: { path: '$ratingData', preserveNullAndEmptyArrays: true },
      },
      {
        $sort: { createdAt: -1 },
      },

      {
        $project: {
          _id: 1,
          group_id: 1,
          group_name: 1,
          group_pic: 1,
          tag: 1,
          category: 1,
          expertise: 1,
          subscription: 1,
          forOneYear: 1,
          forOneMonth: 1,
          forThreeMonth: 1,
          forSixMonth: 1,
          about: 1,
          following: { $size: '$followData' },
          rating: { $ifNull: ['$ratingData.rating', 0] },
          groupSize: { $size: '$GroupData' },
          GroupMatchSize: { $size: '$GroupMatchData' },
        },
      },
      { $match: { _id: mongoose.Types.ObjectId(process.env.GROUP) } },
    ]);
  } else {
    const matchObject = {};
    const matchGroup = {};
    matchObject.status = 1;
    // matchObject.type = 1;
    matchObject.user = mongoose.Types.ObjectId(user);
    matchGroup.group_id = mongoose.Types.ObjectId(process.env.GROUP);
    firstGroup = await SubscriptionDB.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'group',
          foreignField: '_id',
          as: 'userData',
        },
      },
      { $unwind: '$userData' },
      {
        $lookup: {
          from: 'groupratings',
          let: { id: '$group' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$id'] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
          ],
          as: 'ratingData',
        },
      },
      {
        $unwind: { path: '$ratingData', preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: 'subscriptions',
          let: { id: '$group' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [{ $eq: ['$group', '$$id'] }],
                },
              },
            },
          ],
          as: 'memberData',
        },
      },

      {
        $lookup: {
          from: 'subscriptions',
          let: { group: '$group' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$group'] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
            {
              $project: {
                expiry_date: 1,
                createdAt: 1,
                amount: 1,
                group: 1,
              },
            },
          ],
          as: 'paymentData',
        },
      },
      {
        $lookup: {
          from: 'groupmembers',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$group', '$$id'] },
                    { $eq: ['$type', 2] },
                    { $eq: ['$user', mongoose.Types.ObjectId(user)] },
                  ],
                },
              },
            },
          ],
          as: 'followData',
        },
      },
      { $unwind: '$paymentData' },
      {
        $sort: { createdAt: -1 },
      },

      {
        $match: matchObject,
      },
      {
        $project: {
          _id: 1,
          group_id: { $ifNull: ['$userData._id', ''] },
          group_name: { $ifNull: ['$userData.group_name', ''] },
          group_pic: { $ifNull: ['$userData.group_pic', ''] },
          category: { $ifNull: ['$userData.category', ''] },
          expertise: { $ifNull: ['$userData.expertise', ''] },
          tag: { $ifNull: ['$userData.tag', ''] },
          about: { $ifNull: ['$userData.about', ''] },
          subscription: { $ifNull: ['$userData.subscription', ''] },
          forOneYear: { $ifNull: ['$userData.forOneYear', ''] },
          forOneMonth: { $ifNull: ['$userData.forOneMonth', ''] },
          forThreeMonth: { $ifNull: ['$userData.forThreeMonth', ''] },
          forSixMonth: { $ifNull: ['$userData.forSixMonth', ''] },
          expiry_date: { $ifNull: ['$paymentData.expiry_date', ''] },
          paid_date: { $ifNull: ['$paymentData.createdAt', ''] },
          amount: { $ifNull: ['$paymentData.amount', ''] },
          rating: { $ifNull: ['$ratingData.rating', 0] },
          following: { $size: '$followData' },
          memberSize: { $size: '$memberData' },
        },
      },
      { $match: matchGroup },
    ]);
  }

  return firstGroup[0];
};
