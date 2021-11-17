const mongoose = require('mongoose');


const vehicleSchema = new mongoose.Schema({
 Year:{
     type:Number,
     required:[true,'Year is required']
 },
 Make:{
     type:String,
     required:[true,'Make is required']
 },
 Model:{
     type:String,
     required:[true,'Model is required']
 },
 Category:{
    type:String,
    required:[true,'Category is required']
 },
 createdAt:{
     type:Date
 },
 updatedAt:{
    type:Date
 },
 completeVehicle:{
     type:String
 },
 id:{
     type:Number,
     min:0
 }
});
vehicleSchema.index({name:'text','Model':"text"})
module.exports = mongoose.model('vehicles', vehicleSchema);