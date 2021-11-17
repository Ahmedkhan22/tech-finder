const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
 category:{
     type:String,
     required:[true,'Category name is required']
 },
 files:[String]

});
module.exports = mongoose.model('avatars', avatarSchema);