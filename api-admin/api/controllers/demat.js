const niv = require('node-input-validator');
const DematDB = require('../models/demat');
const Helper = require('../helper/index');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const fs = require('fs');

// add demat data
exports.add = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {
    demat_name: 'required',
  });

  const matched = await objValidation.check();
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors });
  }

  const { demat_name } = req.body;
  try {
    const dematObject = {};
    dematObject.demat_name = demat_name;

    const newdematData = new DematDB(dematObject);
    const result = await newdematData.save();
    return res.status(201).send({
      message: 'demat has been added successfully',
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

// get demat data
exports.get = async (req, res, next) => {
  let { limit, page, search, type } = req.query;
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
    let result;
    const matchObject = {};

    if (search) {
      matchObject.$or = [{ demat_name: { $regex: search, $options: 'i' } }];
    }
    if (Number(type) === 1) {
      result = await DematDB.find({ flag: 1 })
        .sort({ createdAt: -1 })
        .select('_id demat_name flag');

      result.forEach(function (item, i) {
        if (item.demat_name === 'No Demat') {
          result.splice(i, 1);
          result.unshift(item);
        }
      });
    } else {
      const resultAggregate = DematDB.aggregate([
        {
          $sort: { createdAt: -1 },
        },
        {
          $match: matchObject,
        },
        {
          $project: {
            _id: 1,
            demat_name: 1,
            flag: 1,
          },
        },
      ]);
      result = await DematDB.aggregatePaginate(resultAggregate, option);
    }

    return res.status(200).json({
      message: 'demat has been retrived..',
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
