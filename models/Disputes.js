const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
 customer:{       //User who is ordering
     type:mongoose.Schema.Types.ObjectId,
     ref:"users"
 },
 mechanic:{        
    type:mongoose.Schema.Types.ObjectId,
    ref:"mechanics"
 },
 status:{       //options: pending, rejected, accepted, reviewing,  resolved
     type:String,
     default:"pending"
 },
 createdDate:{
     type:Date,
     default:Date.now()
 },
 raisedBy:{      //User, Mechanic
     type:String
 },
 customerDescription:{    
     type:String
 },
 customerFiles:[String],
 mechanicDescription:{
     type:String
 },
 mechanicFiles:[String],
 order:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"orders"
 },
 disuputeId:{
     type:String,
     unique:true
 },
 reason:{
     type:String,
     required:[true,"Reason is required"]
 },
 answered:{
    type:Boolean,
    default:false
 }
});
module.exports = mongoose.model('disputes', disputeSchema);