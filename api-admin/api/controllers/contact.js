const ContactDB = require('../models/contact')
const niv = require('node-input-validator')
exports.addContact = async (req, res) => {
  const objValidation = new niv.Validator(req.body, {
    email: 'required',
    full_name: 'required',
    message: 'required',
  })
  const matched = await objValidation.check()
  if (!matched) {
    return res
      .status(422)
      .send({ message: 'Validation Error', errors: objValidation.errors })
  }

  try {
    const result = new ContactDB({
      email: req.body.email,
      full_name: req.body.full_name,
      message: req.body.message,
    })
    await result.save()
    return res
      .status(201)
      .json({ message: 'Contact has been successfully added' })
  } catch (err) {
    const request = req
    Helper.writeErrorLog(request, err)
    return res.status(500).json({
      message: 'Error occurred, Please try again later',
      error: err,
    })
  }
}
