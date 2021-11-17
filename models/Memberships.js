const mongoose = require('mongoose');

const appleIAPSchema = new mongoose.Schema({
    name:{
        type:String
    },
    productId:{
        type:String
    }
})
const membershipSchema = new mongoose.Schema({
 title:{
     type:String,
     required:[true,'Membership Title is required']
 },
 price:{
     type:Number,
     required:[true,'Membership Price is required'],
     min:0
 },
 membershipType:{       //0: Monthly, 1: Quarterly, 2: Yearly
    type:Number,
    min:0
 },
 createdDate:{
     type:Date,
     default:Date.now()
 },
 appleIAPCreadentials:{
    type:appleIAPSchema
 }
});
module.exports = mongoose.model('memberships', membershipSchema);