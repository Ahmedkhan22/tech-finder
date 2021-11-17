const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question:{
      type:String,
      required:[true,"Question is required"]
  },
  answer:{
    type:String,
    required:[true,"Answer is required"]
  },
  createdDate:{
      type:Date,
      default:Date.now()
  },
  lastUpdated:{
      type:Date,
      default:Date.now()
  }
});
module.exports = mongoose.model('faqs', faqSchema);