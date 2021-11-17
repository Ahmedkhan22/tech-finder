const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  institution: {
    type: String,
  },
  issueDate: {
    //month/year
    type: String,
  },
  certificateID: {
    //Unique certificate id issued by institution...optional
    type: String,
  },
  image: {
    type: String,
  },
});
const reviewSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  //order bhi aaye ga
  createdDate: {
    type: Date,
    default: Date.now(),
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orders',
  },
});
const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    index: '2dsphere',
  },
});
const mechanicSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  fName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  token: {
    //FCM token
    type: String,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  isLoggedIn: {
    type: Boolean,
    default: false,
  },
  firebaseUID: {
    type: String,
    required: [true, 'Firebase UID is required'],
  },
  profilePic: {
    type: String,
  },
  city: {
    type: String,
  },
  phone: {
    type: String,
  },
  loginMethod: {
    //Custom, Google, Apple
    type: String,
    default: 'Custom',
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
  },
  ssn: {
    type: String,
  },
  introduction: {
    type: String,
  },
  certificates: [certificateSchema],
  carTags: [String], //Model of vehicles for matching
  geometry: {
    type: locationSchema,
  },
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'memberships',
  },
  membershipDate: {
    type: Date,
  },
  memberShipExpiry: {
    type: Date,
  },
  reviews: [reviewSchema],
  isOnline: {
    type: Boolean,
    default: false,
  },
  //orders add krne hain
  mechanicType: {
    //individual, shop
    type: String,
    default: 'individual',
  },
  zipCode: {
    type: String,
  },
  vehicleAvatar:{
    type:String
  }
});

mechanicSchema.index({ name: 'text', fName: 'text' });
mechanicSchema.index({ geometry: '2dsphere' });
module.exports = mongoose.model('mechanics', mechanicSchema);
