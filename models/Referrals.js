const mongoose = require('mongoose');


const referralSchema = new mongoose.Schema({
 referredId:{       //User who is referred
     type:mongoose.Schema.Types.ObjectId,
     ref:"users"
 },
 referring:{        //User who is referring
    type:mongoose.Schema.Types.ObjectId,
    ref:"users"
 },
 status:{       //options: accepted, completed
     type:String,
     default:"accepted"
 },
 createdDate:{
     type:Date,
     default:Date.now()
 }
});
module.exports = mongoose.model('referrals', referralSchema);