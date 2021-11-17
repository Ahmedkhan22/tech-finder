const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true
  },
  fName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  createdDate:{
    type:Date,
    default:Date.now()
  },
  message:{
      type:String,
    required: [true, 'Message is required'],
  }
});

module.exports = mongoose.model('contactus', mechanicSchema);
