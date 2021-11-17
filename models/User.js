const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicle:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"vehicles"
    },
    avatar:{
        type:String
    }
})
const addressSchema = new mongoose.Schema({
    address:{
        type:String,
        required:[true,'Address is required']
    },
    longitude:{
        type:Number,
        required:[true,'Longitude is required']
    },
    latitude:{
        type:Number,
        required:[true,'Latitude is required']
    }
})
const UserSchema = new mongoose.Schema({
  email:{
      type:String,
      required:[true,'Email is required'],
      unique:true
  },
  fName:{
      type:String,
      required:[true,'Full name is required']
  },
  token:{       //FCM token
      type:String
  },
  blocked:{
      type:Boolean,
      default:false
  },
  isLoggedIn:{
      type:Boolean,
      default:false
  },
  firebaseUID:{
      type:String,
      required:[true,'Firebase UID is required']
  },
  profilePic:{
      type:String
  },
  city:{
      type:String
  },
  phone:{
      type:String
  },
  loginMethod:{     //Custom, Google, Apple
      type:String,
      default:"Custom"
  },
  createdDate:{
      type:Date,
      default:Date.now()
  },
  addresses:[addressSchema],
  vehicles:[vehicleSchema],
  balance:{     //amount from referral will be saved here
      type:Number,
      default:0,
      min:0
  },
  referralId:{
      type:String
  },
  referredId:{      //referral _id if user was referred by other user 
    type:mongoose.Schema.Types.ObjectId,
    ref:"referrals"
  },
  favorites:[{
      type:mongoose.Schema.Types.ObjectId,
      ref:"mechanics"
  }]
});
UserSchema.index({name:'text','fName':"text"})
module.exports = mongoose.model('users', UserSchema);