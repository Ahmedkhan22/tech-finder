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
const scheduleSchema = new mongoose.Schema({
    customer:{       //User who is ordering
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
    mechanic:{        
       type:mongoose.Schema.Types.ObjectId,
       ref:"mechanics"
    },
    status:{       //options: pending, accepted, rejected, cancelled, completed
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
    vehicle:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"vehicles"
     },
     customerLocation:locationSchema,
     scheduledDate:{
         type:Date,
         required:[true,'Schedule date is required']
     },
 messages:[MessageSchema],
 isRescheduled:{        //Check if order is already is already scheduled or not
     type:Boolean,
     default:false
 }
     
});
module.exports = mongoose.model('schedules', scheduleSchema);