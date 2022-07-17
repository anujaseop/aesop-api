const jsSHA = require('jssha');
const sha512 = require('js-sha512');
const Razorpay = require('razorpay');

const secret = {
  merchantKey: 'sOixO5Kv',
  merchantSalt: 'JDhIbyZwnM',
};

// add demat data
exports.payUMoneyPayment = async (req, res) => {
  var jsSHA = require('jssha');
  if (
    !req.body.txnid ||
    !req.body.amount ||
    !req.body.productinfo ||
    !req.body.firstname ||
    !req.body.email
  ) {
    res.send('Mandatory fields missing');
  } else {
    var pd = req.body;
    var hashString =
      'sOixO5Kv' + // Merchant Key
      '|' +
      pd.txnid +
      '|' +
      pd.amount +
      '|' +
      pd.productinfo +
      '|' +
      pd.firstname +
      '|' +
      pd.email +
      '|' +
      '||||||||||' +
      'JDhIbyZwnM'; // Your salt value
    var sha = new jsSHA('SHA-512', 'TEXT');
    sha.update(hashString);
    var hash = sha.getHash('HEX');
    res.send({ hash: hash });
  }
};

exports.payUMoneyPaymentResponse = function (req, res) {
  var pd = req.body;
  //Generate new Hash
  var hashString =
    '|' +
    pd.status +
    '||||||||||' +
    '|' +
    pd.email +
    '|' +
    pd.firstname +
    '|' +
    pd.productinfo +
    '|' +
    pd.amount +
    '|' +
    pd.txnid +
    '|';
  var sha = new jsSHA('SHA-512', 'TEXT');
  sha.update(hashString);
  var hash = sha.getHash('HEX');
  // Verify the new hash with the hash value in response
  if (pd.hash) {
    res.send({
      txnId: pd.txnid,
      transaction_detail: JSON.stringify(req.body),
      status: pd.txnStatus,
    });
  } else {
    res.send({ status: 'Error occured' });
  }
};

exports.payUMoney_CheckoutPro_Hash = function (request, response) {
  const hash = sha512(request.body['hash'] + secret.merchantSalt);
  if (hash) {
    response.send({
      status: 'hash code generated',
      hash: hash,
    });
  } else {
    res.send({ status: 'Error occured' });
  }
};

// ****************** Razor Pay ******************

exports.createOrder = async (req, res) => {
  const { amount, currency } = req.body;
  var instance = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID,
    key_secret: process.env.RAZOR_PAY_KEY_SECRET,
  });
  try {
    const result = await instance.orders.create({
      amount: amount * 100,
      currency: currency,
      receipt: 'receipt#1',
      // notes: {
      //   key1: 'value3',
      //   key2: 'value2',
      // },
    });

    if (result) {
      return res.status(200).send({
        message: 'success',
        result: result,
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: 'error',
      result: error,
    });
  }
};
