const LoginVerificationDB = require('../models/login_verification');
const SubscriptionDB = require('../models/subscription');
const niv = require('node-input-validator');
const GroupDB = require('../models/group');
const Helper = require('../helper/index');
const UserDB = require('../models/user');
const Email = require('../helper/email');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const MemberDB = require('../models/group_member');
const UserTokenDB = require('../models/userToken.js');
const fs = require('fs');

exports.signup = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    first_name: 'required|maxLength:50',
    last_name: 'required|maxLength:50',
    email: 'required|maxLength:50',
    password: 'required|minLength:6',
    phone_number: 'required',
    role: 'required|in:1,2',
    investment_amount: 'requiredIf:role,2|integer',
    subscription_fee_limit: 'requiredIf:role,2',
    dmat_account_type: 'requiredIf:role,2',
    group_name: 'requiredIf:role,1|maxLength:50',
    sebi_registration_number: 'requiredIf:role,1|maxLength:50',
    pancard_number: 'requiredIf:role,1|maxLength:50',
    subscription: 'requiredIf:role,1|in:1,2',
    token: 'required|minLength:32',
  });
  const matched = await objValidation.check();

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }

  const {
    first_name,
    last_name,
    email,
    password,
    phone_number,
    role,
    investment_amount,
    subscription_fee_limit,
    dmat_account_type,
    group_name,
    sebi_registration_number,
    pancard_number,
    subscription,
    forOneYear = 0,
    forOneMonth = 0,
    forThreeMonth = 0,
    forSixMonth = 0,
    token,
  } = req.body;

  const validationErrorObject = {};
  validationErrorObject.message = 'Validation Error';
  validationErrorObject.error = {};

  if (role === '1') {
    if (!req.files.pancard_photo) {
      validationErrorObject.error.pancard_photo = {
        message: 'The pancard_photo field is mandatory.',
        rule: 'required',
      };
      return res.status(422).send(validationErrorObject);
    }

    if (!req.files.statement) {
      validationErrorObject.error.statement = {
        message: 'The statement field is mandatory.',
        rule: 'required',
      };
      return res.status(422).send(validationErrorObject);
    }

    if (!req.files.group_pic) {
      validationErrorObject.error.group_pic = {
        message: 'The group_pic field is mandatory.',
        rule: 'required',
      };
      return res.status(422).send(validationErrorObject);
    }
  }

  try {
    const verificationData = await LoginVerificationDB.findOne({
      phone_number: phone_number,
      token: token,
    });
    if (!verificationData) {
      return res.status(401).json({
        message: 'Token Mismatch',
      });
    }

    const emailData = await UserDB.find({ email: email });
    if (emailData.length > 0) {
      return res.status(409).json({
        message: 'Email exists',
      });
    }

    const mobileData = await UserDB.find({ phone_number: phone_number });
    if (mobileData.length > 0) {
      return res.status(409).json({
        message: 'Phone Number exists',
      });
    }

    const userObject = {};
    userObject.first_name = first_name;
    userObject.last_name = last_name;
    userObject.email = email;
    userObject.phone_number = phone_number;
    userObject.password = await bcrypt.hash(password, 10);
    userObject.role = parseInt(role);
    if (role === '2') {
      userObject.investment_amount = investment_amount;
      userObject.subscription_fee_limit = subscription_fee_limit;
      userObject.dmat_account_type = dmat_account_type;
    } else {
      userObject.sebi_registration_number = sebi_registration_number;
      userObject.pancard_number = pancard_number;
      userObject.subscription = parseInt(subscription);
      userObject.forOneYear = forOneYear;
      userObject.forOneMonth = forOneMonth;
      userObject.forThreeMonth = forThreeMonth;
      userObject.forSixMonth = forSixMonth;
      userObject.statement = req.files.statement[0].path;
      userObject.pancard_photo = req.files.pancard_photo[0].path;
      userObject.group_name = group_name;
      userObject.group_pic = req.files.group_pic[0].path;
      userObject.flag = 4;
    }
    const user = new UserDB(userObject);
    const result = await user.save();

    return res.status(201).json({
      message: 'Your profile has been successfully added',
      result: result,
    });
  } catch (err) {
    console.error(err);
    const request = req;
    Helper.writeErrorLog(request, err);
    res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

exports.login = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    type: 'required|in:1,2',
    email: 'requiredIf:type,1|email|maxLength:50',
    password: 'requiredIf:type,1|minLength:6',
    phone_number: 'requiredIf:type,2',
    token_id: 'requiredIf:type,2|minLength:32',
    role: 'required|in:1,2',
  });
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  const { type, email, password, phone_number, token_id, role } = req.body;

  try {
    let user = '';
    if (type == 1) {
      user = await UserDB.findOne({ email: email });
      if (user === null) {
        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }
      const passwordResult = await bcrypt.compare(password, user.password);
      if (passwordResult === false) {
        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }
    } else {
      const verificationData = await LoginVerificationDB.findOne({
        phone_number: phone_number,
        token: token_id,
      });

      if (!verificationData) {
        return res.status(401).json({
          message: 'Token Mismatch',
        });
      }

      user = await UserDB.findOne({ phone_number: phone_number });
      if (user === null) {
        return res.status(401).json({
          message: 'Invalid phone_number',
        });
      }
    }

    if (user && user.flag != 1) {
      return res.status(401).json({
        message: 'Your account is currently deactivated please contact admin',
      });
    }

    if (user && user.role != role) {
      return res.status(401).json({
        message: 'This email or phone_number is registered with different role',
      });
    }

    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
      },
      process.env.JWT_KEY,
      {
        expiresIn: '10d',
      }
    );

    user.pancard_photo = `${process.env.IMAGE_BASE_URL}/${user.pancard_photo}`;
    user.statement = `${process.env.IMAGE_BASE_URL}/${user.statement}`;
    user.image = `${process.env.IMAGE_BASE_URL}/${user.image}`;
    user.group_pic = `${process.env.IMAGE_BASE_URL}/${user.group_pic}`;

    return res.status(200).json({
      message: 'Auth Successfull',
      token: token,
      user: user,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

exports.detail = async (req, res, next) => {
  try {
    const result = await UserDB.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.userData._id) } },
    ]);
    const user = result[0];
    if (user.image) {
      user.image = await Helper.getValidImageUrl(user.image);
    } else {
      user.image = '';
    }
    if (user.statement)
      user.statement = await Helper.getValidImageUrl(user.statement);
    if (user.pancard_photo)
      user.pancard_photo = await Helper.getValidImageUrl(user.pancard_photo);
    if (user.group_pic)
      user.group_pic = await Helper.getValidImageUrl(user.group_pic);
    return res.status(200).json({
      message: 'Profile returned successfully',
      result: user,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

exports.edit = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    first_name: 'required|maxLength:50',
    last_name: 'required|maxLength:50',
    email: 'required|maxLength:50',
    role: 'required|in:1,2',
    investment_amount: 'requiredIf:role,2|integer',
    subscription_fee_limit: 'requiredIf:role,2',
    dmat_account_type: 'requiredIf:role,2',
    group_name: 'requiredIf:role,1|maxLength:50',
    sebi_registration_number: 'requiredIf:role,1|maxLength:50',
    pancard_number: 'requiredIf:role,1|maxLength:50',
    subscription: 'requiredIf:role,1|in:1,2',
  });
  const matched = await objValidation.check();

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }

  const {
    first_name,
    last_name,
    email,
    role,
    investment_amount,
    subscription_fee_limit,
    dmat_account_type,
    group_name,
    sebi_registration_number,
    pancard_number,
    subscription,
    password,
    tip_notification,
    news_notification,
    tag,
    category,
    expertise,
    about,
  } = req.body;
  const id = req.params.id;
  const emailData = await UserDB.find({ email: email, _id: { $ne: id } });
  if (emailData.length > 0) {
    return res.status(409).json({
      message: 'Email exists',
    });
  }
  try {
    const updateObj = {};
    updateObj.first_name = first_name;
    updateObj.last_name = last_name;
    updateObj.email = email;
    if (password) updateObj.password = await bcrypt.hash(password, 10);
    if (role == 1) {
      updateObj.sebi_registration_number = sebi_registration_number;
      updateObj.pancard_number = pancard_number;
      updateObj.subscription = parseInt(subscription);
      if (req.files.statement)
        updateObj.statement = req.files.statement[0].path;
      if (req.files.pancard_photo)
        updateObj.pancard_photo = req.files.pancard_photo[0].path;
      updateObj.group_name = group_name;
      if (req.files.group_pic)
        updateObj.group_pic = req.files.group_pic[0].path;
      if (tag) updateObj.tag = tag;
      if (category) updateObj.category = category;
      if (expertise) updateObj.expertise = expertise;
      if (about) updateObj.about = about;
    } else {
      updateObj.investment_amount = investment_amount;
      updateObj.subscription_fee_limit = subscription_fee_limit;
      updateObj.dmat_account_type = dmat_account_type;
    }
    if (req.files.image) updateObj.image = req.files.image[0].path;
    updateObj.tip_notification = tip_notification;
    updateObj.news_notification = news_notification;
    const result = await UserDB.updateOne({ _id: id }, { $set: updateObj });

    return res.status(202).json({
      message: 'Profile has been updated successfully',
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

exports.addToken = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {
    phone_number: 'required',
    token: 'required|minLength:32',
  });
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  try {
    const CheckToken = await LoginVerificationDB.findOne({
      phone_number: req.body.phone_number,
    });

    if (CheckToken) {
      await LoginVerificationDB.updateOne(
        { phone_number: req.body.phone_number },
        { $set: { token: req.body.token } }
      );
    } else {
      const result = new LoginVerificationDB({
        phone_number: req.body.phone_number,
        token: req.body.token,
      });
      await result.save();
    }
    return res
      .status(200)
      .json({ message: 'Token has been added successfully' });
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

exports.verifyMobile = async (req, res) => {
  const { id } = req.userData;
  validateObject = {
    phone_number: 'required|maxLength:14',
    phone_token: 'required|maxLength:34',
  };

  const objValidation = new niv.Validator(req.body, validateObject);
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors });
  }

  const { phone_number, phone_token } = req.body;

  if (phone_number) {
    const userDataPhone = await UserDB.find({
      phone_number: phone_number,
      flag: 1,
      _id: { $ne: id },
    });
    if (userDataPhone.length > 0) {
      return res.status(409).json({
        message: 'Phone already exists',
      });
    }
  }

  try {
    const updateObj = {};
    updateObj.phone_token = phone_token;
    result = await UserDB.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    );
    return res.status(202).json({
      message: 'Phone Token has been successfully updated',
      result: null,
    });
  } catch (err) {
    const request = req;
    const writeErrorRequest = Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

exports.editPhone = async (req, res) => {
  const { id } = req.userData;
  validateObject = {
    phone_number: 'required|maxLength:14',
    phone_token: 'required|maxLength:34',
  };

  const objValidation = new niv.Validator(req.body, validateObject);
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors });
  }

  const { phone_number, phone_token } = req.body;

  try {
    const userDataPhone = await UserDB.find({
      _id: id,
      phone_token: phone_token,
      flag: 1,
      // _id: { $ne: id },
    });
    console.log(
      '🚀 ~ file: user.js ~ line 515 ~ exports.editPhone= ~ userDataPhone',
      userDataPhone
    );
    if (userDataPhone.length === 0) {
      return res.status(422).json({
        message: 'Token Mismatch, Please try again.',
        result: null,
      });
    }
    const updateObj = {};
    updateObj.phone_number = phone_number;
    updateObj.phone_token = '';
    result = await UserDB.updateOne({ _id: id }, { $set: updateObj });
    return res.status(202).json({
      message: 'Phone Number has been successfully updated',
      result: null,
    });
  } catch (err) {
    const request = req;
    const writeErrorRequest = Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

// exports.editPhone = async (req, res, next) => {
//   const objValidation = new niv.Validator(req.body, {
//     phone_number: 'required|maxLength:50',
//     token: 'required|minLength:32',
//   });
//   const matched = await objValidation.check();

//   if (!matched) {
//     return res
//       .status(422)
//       .send({ message: 'Validation error', errors: objValidation.errors });
//   }

//   const { phone_number, token } = req.body;
//   const id = req.params.id;

//   const verificationData = await LoginVerificationDB.findOne({
//     phone_number: phone_number,
//     token: token,
//   });
//   if (!verificationData) {
//     return res.status(401).json({
//       message: 'Token Mismatch',
//     });
//   }

//   const phoneData = await UserDB.find({
//     phone_number: phone_number,
//     _id: { $ne: id },
//   });
//   if (phoneData.length > 0) {
//     return res.status(409).json({
//       message: 'Phone Number exists',
//     });
//   }
//   try {
//     const updateObj = {};
//     updateObj.phone_number = phone_number;
//     const result = await UserDB.updateOne({ _id: id }, { $set: updateObj });
//     return res.status(202).json({
//       message: 'Phone Number has been updated successfully',
//       result: result,
//     });
//   } catch (err) {
//     const request = req;
//     Helper.writeErrorLog(request, err);
//     return res.status(500).json({
//       message: 'Error occurred, Please try again later',
//     });
//   }
// };

exports.changePassword = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    old_password: 'required|minLength:6',
    password: 'required|minLength:6',
    confirm_password: 'required|same:password|minLength:6',
  });

  const matched = await objValidation.check();

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  const { old_password, password, confirm_password } = req.body;

  try {
    const id = req.userData._id;
    const userData = await UserDB.findOne({ _id: id, flag: 1 });
    if (!userData) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    const passwordResult = await bcrypt.compare(
      old_password,
      userData.password
    );
    if (passwordResult === false) {
      return res.status(401).json({
        message: 'Old password is invalid',
      });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await UserDB.updateOne(
      { _id: id },
      { $set: { password: hash } }
    );
    return res.status(202).json({
      message: 'Password has been changed successfully',
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

exports.forgetPassword = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    email: 'required|email|maxLength:50',
  });
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  const { email } = req.body;

  const userData = await UserDB.findOne({ email: email, flag: 1 });
  if (!userData) {
    return res.status(401).json({
      message: 'Email not found with our system',
    });
  }

  try {
    const reset_password_code = await Helper.generateRandomString(4, true);
    const result = await UserDB.updateOne(
      {
        email: email,
      },
      {
        reset_password_code: reset_password_code,
      }
    );
    let subject = 'Trading App - Password Reset';
    const emailSend = await Email.SendMail(
      email,
      subject,
      reset_password_code,
      2
    );
    return res.status(200).json({
      message: 'Please check your email to reset your password',
      result: result,
    });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

exports.verifyResetPasswordCode = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    email: 'required',
    reset_password_code: 'required',
  });
  const matched = await objValidation.check();

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  const { reset_password_code, email } = req.body;

  try {
    const userData = await UserDB.findOne({
      email: email,
      reset_password_code: reset_password_code,
      flag: 1,
    });
    if (!userData) {
      return res.status(401).json({
        message: 'Code has been expired',
      });
    }

    return res.status(200).json({
      message: 'Code has been verified',
      result: [],
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

exports.resetPassword = async (req, res, next) => {
  const objValidation = new niv.Validator(req.body, {
    reset_password_code: 'required',
    password: 'required|minLength:6',
    confirm_password: 'required|same:password|minLength:6',
  });

  const matched = await objValidation.check();

  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation error', errors: objValidation.errors });
  }
  const { reset_password_code, password, confirm_password } = req.body;

  try {
    const userData = await UserDB.findOne({
      reset_password_code: reset_password_code,
      flag: 1,
    });
    if (!userData) {
      return res.status(401).json({
        message: 'Link has been expired',
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await UserDB.updateOne(
      { reset_password_code: reset_password_code },
      { $set: { password: hash, reset_password_code: '' } }
    );
    return res.status(202).json({
      message: 'Password has been changed successfully',
      admin: result,
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

// get data
exports.get = async (req, res, next) => {
  let { limit, page, search, role, flag } = req.query;

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
    if (role) matchObject.role = parseInt(role);
    // flag 1 = Active , 2 Deactivated,  3 = New Register
    if (Number(flag) === 1) {
      matchObject.flag = { $in: [1] };
    } else if (Number(flag) === 2) {
      matchObject.flag = { $in: [2] };
    } else if (Number(flag) === 3) {
      matchObject.flag = { $in: [4] };
    } else {
      matchObject.flag = { $in: [1, 2, 4] };
    }
    if (search) {
      matchObject.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const resultAggregate = UserDB.aggregate([
      {
        $sort: { createdAt: -1 },
      },

      {
        $project: {
          full_name: { $concat: ['$first_name', ' ', '$last_name'] },
          first_name: 1,
          last_name: 1,
          email: 1,
          role: 1,
          flag: 1,
        },
      },
      {
        $match: matchObject,
      },
    ]);
    const result = await UserDB.aggregatePaginate(resultAggregate, option);
    return res.status(200).json({
      message: ' user has been retrived',
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
exports.changeStatus = async (req, res) => {
  const { id } = req.params;
  const objValidation = new niv.Validator(req.body, {
    flag: 'required|in:1,2',
  });
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .json({ message: 'Validation error', error: objValidation.errors });
  }

  try {
    let message = 'User has been successfully activated';
    if (req.body.flag == 2) message = 'User has been successfully deactivated';
    const result = await UserDB.findByIdAndUpdate(
      id,
      { $set: { flag: req.body.flag } },
      { new: true }
    );
    return res.status(202).json({ message: message, result: result });
  } catch (err) {
    const request = req;
    Helper.writeErrorLog(request, err);
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

exports.getMembers = async (req, res) => {
  let { limit, page, search, flag, start_date, end_date } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, ''].includes(search)) {
    search = '';
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10;
  }
  const options = {
    limit: limit,
    page: page,
  };
  const matchObject = {};
  const matObj = {};
  matchObject.group = req.userData._id;
  if (flag) {
    matObj.Active = parseInt(flag);
  }
  if (search) {
    matchObject.$or = [
      { 'userData.first_name': { $regex: search, $options: 'i' } },
      { 'userData.last_name': { $regex: search, $options: 'i' } },
    ];
  }

  if (start_date && end_date) {
    matchObject.createdAt = {
      $gte: new Date(start_date),
      $lt: new Date(end_date),
    };
  }

  const memberAggregation = SubscriptionDB.aggregate([
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
        from: 'followtips',
        localField: 'user',
        foreignField: 'user_id',
        as: 'tipData',
      },
    },
    { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
    { $match: matchObject },
    {
      $project: {
        userData: {
          first_name: 1,
          last_name: 1,
        },
        tip: { $size: '$tipData' },
        expiry_date: 1,
        Active: { $cond: [{ $gt: ['$expiry_date', new Date()] }, 1, 0] },
      },
    },
    { $match: matObj },
  ]);
  console.log(new Date());
  const result = await SubscriptionDB.aggregatePaginate(
    memberAggregation,
    options
  );

  return res.status(200).json({
    message: 'member has been retrived',
    result: result,
  });
};
exports.adminMember = async (req, res) => {
  let { id } = req.params;
  let { limit, page, search, flag } = req.query;
  if ([null, undefined, ''].includes(page)) {
    page = 1;
  }
  if ([null, undefined, ''].includes(search)) {
    search = '';
  }
  if ([null, undefined, '', 1].includes(limit)) {
    limit = 10;
  }
  const options = {
    limit: limit,
    page: page,
  };
  const matchObject = {};
  const matObj = {};
  matchObject.group = mongoose.Types.ObjectId(id);
  if (flag) {
    matObj.Active = parseInt(flag);
  }
  if (search) {
    matchObject.$or = [
      { 'userData.first_name': { $regex: search, $options: 'i' } },
      { 'userData.last_name': { $regex: search, $options: 'i' } },
    ];
  }

  const memberAggregation = SubscriptionDB.aggregate([
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
        from: 'followtips',
        localField: 'user',
        foreignField: 'user_id',
        as: 'tipData',
      },
    },
    { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
    { $match: matchObject },
    {
      $project: {
        userData: {
          first_name: 1,
          last_name: 1,
        },
        tip: { $size: '$tipData' },
        Active: { $cond: [{ $lt: ['$expiry_date', new Date()] }, 1, 0] },
      },
    },
    { $match: matObj },
  ]);

  const result = await SubscriptionDB.aggregatePaginate(
    memberAggregation,
    options
  );

  return res.status(200).json({
    message: 'member has been retrived',
    result: result,
  });
};

exports.userDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await UserDB.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(id) } },
    ]);
    const user = result[0];
    if (user.image) {
      user.image = await Helper.getValidImageUrl(user.image);
    } else {
      user.image = '';
    }
    if (user.statement)
      user.statement = await Helper.getValidImageUrl(user.statement);
    if (user.pancard_photo)
      user.pancard_photo = await Helper.getValidImageUrl(user.pancard_photo);
    if (user.group_pic)
      user.group_pic = await Helper.getValidImageUrl(user.group_pic);
    return res.status(200).json({
      message: 'Profile returned successfully',
      result: user,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    });
  }
};

// add Token
exports.fbToken = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {
    token: 'required',
    type: 'required|numeric|in:1,2',
  });
  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .json({ message: 'Validation error', error: objValidation.errors });
  }
  try {
    await UserTokenDB.deleteMany({
      user: req.userData._id,
      type: req.body.type,
    });

    const result = new UserTokenDB({
      user: req.userData._id,
      token: req.body.token,
      type: req.body.type,
    });
    await result.save();
    return res.status(200).json({
      message: 'user token has been added successfully',
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
