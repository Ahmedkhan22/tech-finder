const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
    text:{
        type:String
    },
    messageType:{           //0:text,1:Audio
        type:Number,
        default:0,
        min:0
    },
    createdDate:{
        type:Date,
        default:Date.now()
    },
    filePath:{          //If messageType is 1
        type:String
    },
    messageSender:{         //  Customer/Mechanic
        type:String,
        required:[true,'Message sender is required']
    },
    isPlay:{
        type:Boolean,
        default:false
    },
    isRead:{
        type:Boolean,
        default:false
    }
})
const locationSchema = new mongoose.Schema({
    type:{
        type:String,
        default:"Point"
    },
    coordinates:{
        type:[Number],
        index:'2dsphere'
    }
 })
const partSchema = new mongoose.Schema({
    name:{
        type:String
    },
    price:{
        type:Number
    },
    quantity:{
        type:Number
    }
})
const orderSchema = new mongoose.Schema({
 customer:{       //User who is ordering
     type:mongoose.Schema.Types.ObjectId,
     ref:"users"
 },
 mechanic:{        
    type:mongoose.Schema.Types.ObjectId,
    ref:"mechanics"
 },
 status:{       //options: pending, rejected, travelling (on the way), reached,  progress, invoice, completed, cancelled
     type:String,
     default:"pending"
 },
 createdDate:{
     type:Date,
     default:Date.now()
 },
 customerDescription:{
     type:String
 },
 cost:{     //entered by driver
    type:Number
 },
 mechanicDescription:{        //Description entered by mechanic
    type:String
 },
 parts:[partSchema],
 vehicle:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"vehicles"
 },
 customerLocation:locationSchema,
 shortCode:{
     type:String
 },
 uniqueString:{
     type:String
 },
 messages:[MessageSchema],
 serviceFee:{
     type:Number,
     min:0
 },
 cancellationReason:{
     type:String
 },
 cancelledBy:{      //User, Mechanic
     type:String
 },
 orderId:{
     type:String,
     unique:true
 },
 mechanicStartLocation:locationSchema
});
module.exports = mongoose.model('orders', orderSchema);