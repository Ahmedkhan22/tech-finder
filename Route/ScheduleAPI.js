const Mechanic = require('../models/Mechanic')
const Order = require('../models/Order')
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;
const handleErr = require('../HandleFunction/HandleErr')
const handleSuccess = require('../HandleFunction/handleSuccess')
const sendNotification = require('../HandleFunction/SendNotification')
const diffMinutesFunc = require('../HandleFunction/DiffMinutes')
const jwt = require("jsonwebtoken");
const fs = require('fs')
const path = require('path')
var mime = require('mime');
const upload = require('../HandleFunction/UploadFile')
const Schedules = require('../models/Schedules')
const refreshTokens = require('../HandleFunction/JWT').refreshTokens
const refreshTokenKey = require('../constants/jwtpasswords').refreshTokenKey
const accessTokenKey = require('../constants/jwtpasswords').accessTokenKey
const auth = require('../HandleFunction/JWT').auth
const verifyToken = require('../HandleFunction/JWT').verifyToken

//Create a schedule
app.post('/api/createSchedule', (req, res) => {
  console.log('body->', req.body)
  let { customer, mechanic, customerDescription, longitude, latitude, vehicle, scheduledDate } = req.body
  if (customer && mechanic && customerDescription && longitude !== undefined && latitude !== undefined && vehicle && scheduledDate) {
    if(diffMinutesFunc(scheduledDate)<91){
      Order.find({
        mechanic: mechanic,
        status: { $nin: ["rejected", "completed", "cancelled","payment","noResponse"] }
    }).populate('customer').populate('mechanic').populate('vehicle').sort({ createdDate: -1 })
    .exec((err, docs) => {
        if (err) return res.json(handleErr(err))
        else {
          if(docs.length>0){
            //Mechanic has current active order
            return res.json(handleErr('Mechanic is busy on another order'))
          }else{
            //No current order
            //Check schedule and create schedule
            Schedules.aggregate([
              { $match: { mechanic: new ObjectId(mechanic) } },
              {$match:{status:{$nin:["cancelled","rejected","pending"]}}},
              {
                $project: {
                  _id: 0,
                  hours: {
                    $trunc: {
                      $divide: [{ $subtract: ['$scheduledDate', new Date(scheduledDate)] }, 1000 * 60 * 60]
                    }
                  }
                }
              }
            ]).sort({'hours':1}).exec((err, docs) => {
              if (err) return res.json(handleErr(err))
              else {
                if (docs.length > 0) {
                  let check = docs.map((sc)=>{
                    if(sc.hours===1 || sc.hours===0){
                      return 'yes'
                    }
                    else return 'no'
                  })
                  if (check.indexOf('yes')>-1) {
                    return res.json(handleErr('Mechanic has another schedule, please change your time slot'))
                  }
                  else {
                    let data = {
                      customer, mechanic, customerDescription, vehicle, scheduledDate,
                      customerLocation: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                      },
                    }
                    Schedules.create(data, (error, doc) => {
                      if (error) return res.json(handleErr(error))
                      else {
                        Schedules.populate(doc, [
                          {
                            path: 'customer',
                            model: 'users'
                          },
                          {
                            path: 'mechanic',
                            model: 'mechanics'
                          },
                          {
                            path: 'vehicle',
                            model: 'vehicles'
                          }
                        ], (error, schedule) => {
                          if (error) return res.json(handleErr(error))
                          else {
                            let {mechanic} = schedule
                            let {token} = mechanic
                            if(token!==undefined || token!==null){
                                let data = {
                                    tokens: [token],
                                    body: "You've new scheduled order request",
                                    title: "New Schedule Request"
                                }
                                sendNotification(data)
                            }
                            return res.json(handleSuccess(schedule))
                          }
                        })
                      }
                    })
                  }
                } else {
                  let data = {
                    customer, mechanic, customerDescription, vehicle, scheduledDate,
                    customerLocation: {
                      type: "Point",
                      coordinates: [longitude, latitude]
                    },
                  }
                  Schedules.create(data, (error, doc) => {
                    if (error) return res.json(handleErr(error))
                    else {
                      Schedules.populate(doc, [
                        {
                          path: 'customer',
                          model: 'users'
                        },
                        {
                          path: 'mechanic',
                          model: 'mechanics'
                        },
                        {
                          path: 'vehicle',
                          model: 'vehicles'
                        }
                      ], (error, schedule) => {
                        if (error) return res.json(handleErr(error))
                        else {
                          return res.json(handleSuccess(schedule))
                        }
                      })
                    }
                  })
                }
              }
            })
          }
        }
    })
    }else{
      Schedules.aggregate([
        { $match: { mechanic: new ObjectId(mechanic) } },
        {$match:{status:{$nin:["cancelled","rejected","pending"]}}},
        {
          $project: {
            _id: 0,
            hours: {
              $trunc: {
                $divide: [{ $subtract: ['$scheduledDate', new Date(scheduledDate)] }, 1000 * 60 * 60]
              }
            }
          }
        }
      ]).sort({'hours':1}).exec((err, docs) => {
        if (err) return res.json(handleErr(err))
        else {
          if (docs.length > 0) {
            let check = docs.map((sc)=>{
              if(sc.hours===1 || sc.hours===0){
                return 'yes'
              }
              else return 'no'
            })
            if (check.indexOf('yes')>-1) {
              return res.json(handleErr('Mechanic has another schedule, please change your time slot'))
            }
            else {
              let data = {
                customer, mechanic, customerDescription, vehicle, scheduledDate,
                customerLocation: {
                  type: "Point",
                  coordinates: [longitude, latitude]
                },
              }
              Schedules.create(data, (error, doc) => {
                if (error) return res.json(handleErr(error))
                else {
                  Schedules.populate(doc, [
                    {
                      path: 'customer',
                      model: 'users'
                    },
                    {
                      path: 'mechanic',
                      model: 'mechanics'
                    },
                    {
                      path: 'vehicle',
                      model: 'vehicles'
                    }
                  ], (error, schedule) => {
                    if (error) return res.json(handleErr(error))
                    else {
                      let {mechanic} = schedule
                      let {token} = mechanic
                      if(token!==undefined || token!==null){
                          let data = {
                              tokens: [token],
                              body: "You've new scheduled order request",
                              title: "New Schedule Request"
                          }
                          sendNotification(data)
                      }
                      return res.json(handleSuccess(schedule))
                    }
                  })
                }
              })
            }
          } else {
            let data = {
              customer, mechanic, customerDescription, vehicle, scheduledDate,
              customerLocation: {
                type: "Point",
                coordinates: [longitude, latitude]
              },
            }
            Schedules.create(data, (error, doc) => {
              if (error) return res.json(handleErr(error))
              else {
                Schedules.populate(doc, [
                  {
                    path: 'customer',
                    model: 'users'
                  },
                  {
                    path: 'mechanic',
                    model: 'mechanics'
                  },
                  {
                    path: 'vehicle',
                    model: 'vehicles'
                  }
                ], (error, schedule) => {
                  if (error) return res.json(handleErr(error))
                  else {
                    return res.json(handleSuccess(schedule))
                  }
                })
              }
            })
          }
        }
      })
    }
  }
  else {
    return res.json(handleErr("Schedule details are incomplete"))
  }
})


//Get customer's schedule
app.post('/api/customerSchedules', (req, res) => {
  if (req.body.customer) {
    let date = new Date()
    let {customer} = req.body
    Schedules.find({
      customer,
      scheduledDate: { $gte: date }
    }).populate([
      {
        path: 'customer',
        model: 'users'
      },
      {
        path: 'mechanic',
        model: 'mechanics'
      },
      {
        path: 'vehicle',
        model: 'vehicles'
      }
    ]).exec((err, docs) => {
      if (err) return res.json(handleErr(err))
      else {
        return res.json(handleSuccess(docs))
      }
    })
  } else {
    return res.json(handleErr('Customer can not be null'))
  }
})

//Get mechanic's schedule
app.post('/api/schedulesByMechanic', (req, res) => {
  console.log('sijdfisj')
  if (req.body.mechanic) {
    let date = new Date()
    let {mechanic} = req.body
    console.log('mech->',mechanic)
    Schedules.find({
      mechanic,
      scheduledDate: { $gte: date }
    }).populate([
      {
        path: 'customer',
        model: 'users'
      },
      {
        path: 'mechanic',
        model: 'mechanics'
      },
      {
        path: 'vehicle',
        model: 'vehicles'
      }
    ]).exec((err, docs) => {
      if (err) return res.json(handleErr(err))
      else {
        return res.json(handleSuccess(docs))
      }
    })
  } else {
    return res.json(handleErr('Mechanic can not be null'))
  }
})

//Accept scheduled order
app.post('/api/mechanicAccept',(req,res)=>{
  if(req.body.id && req.body.customer && req.body.scheduledDate){
    let {id,customer,scheduledDate} = req.body
    Schedules.aggregate([
      { $match: { customer: new ObjectId(customer) } },
      {$match:{status:"accepted"}},
      {
        $project: {
          _id: 0,
          hours: {
            $trunc: {
              $divide: [{ $subtract: ['$scheduledDate', new Date(scheduledDate)] }, 1000 * 60 * 60]
            }
          }
        }
      }
    ]).sort({'hours':1}).exec((err, docs) => {
      if (err) return res.json(handleErr(err))
      else {
        if (docs.length > 0) {
          let check = docs.map((sc)=>{
            if(sc.hours===1 || sc.hours===0){
              return 'yes'
            }
            else return 'no'
          })
          if (check.indexOf('yes')>-1) {
            Schedules.findByIdAndDelete(id,(errr,doc)=>{
              if(errr)return res.json(handleErr(errr))
              else{
                return res.json(handleErr('Customer already have another schedule, this order is deleted now'))
              }
            })
          }
          else {
            Schedules.findByIdAndUpdate(id,{
              status:"accepted"
            },
            {new:true}
            ).populate([
              {
                path: 'customer',
                model: 'users'
              },
              {
                path: 'mechanic',
                model: 'mechanics'
              },
              {
                path: 'vehicle',
                model: 'vehicles'
              }
            ]).exec((err,doc)=>{
              if(err)return res.json(handleErr(err))
              else{
                return res.json(handleSuccess(doc))
              }
            })
          }
        } else {
          Schedules.findByIdAndUpdate(id,{
            status:"accepted"
          },
          {new:true}
          ).populate([
            {
              path: 'customer',
              model: 'users'
            },
            {
              path: 'mechanic',
              model: 'mechanics'
            },
            {
              path: 'vehicle',
              model: 'vehicles'
            }
          ]).exec((err,doc)=>{
            if(err)return res.json(handleErr(err))
            else{
              return res.json(handleSuccess(doc))
            }
          })
        }
      }
    })
    
  }else{
    return res.json(handleErr('Schedule and other details can not be null'))
  }
})

//Reject scheduled order
app.post('/api/mechanicReject',(req,res)=>{
  if(req.body.id){
    let {id} = req.body
    Schedules.findByIdAndUpdate(id,{
      status:"rejected"
    },
    {new:true}
    ).populate([
      {
        path: 'customer',
        model: 'users'
      },
      {
        path: 'mechanic',
        model: 'mechanics'
      },
      {
        path: 'vehicle',
        model: 'vehicles'
      }
    ]).exec((err,doc)=>{
      if(err)return res.json(handleErr(err))
      else{
        return res.json(handleSuccess(doc))
      }
    })
  }else{
    return res.json(handleErr('Schedule can not be null'))
  }
})

//Cancel schedule
app.put('/api/cancelSchedule',(req,res)=>{
  if(req.body.id){
    let {id} = req.body
    Schedules.findByIdAndUpdate(id,{
      status:"cancelled"
    },
    {new:true}
    ).populate([
      {
        path: 'customer',
        model: 'users'
      },
      {
        path: 'mechanic',
        model: 'mechanics'
      },
      {
        path: 'vehicle',
        model: 'vehicles'
      }
    ]).exec((err,doc)=>{
      if(err)return res.json(handleErr(err))
      else{
        return res.json(handleSuccess(doc))
      }
    }) 
  }
  else{
    return res.json(handleErr('Schedule can not be null'))
  }
})

//Reschedhule
app.put('/api/upateScheduledDate',(req,res)=>{
  if(req.body.id && req.body.scheduledDate && req.body.mechanic){
    let {id,scheduledDate,mechanic} = req.body
    Schedules.aggregate([
      { $match: { mechanic: new ObjectId(mechanic) } },
      {
        $project: {
          _id: 0,
          hours: {
            $trunc: {
              $divide: [{ $subtract: ['$scheduledDate', new Date(scheduledDate)] }, 1000 * 60 * 60]
            }
          }
        }
      }
    ]).exec((err, docs) => {
      if (err) return res.json(handleErr(err))
      else {
        if (docs.length > 0) {
          if (docs[0] === 1) {
            return res.json(handleErr('Mechanic has another schedule, please change your time slot'))
          }
          else {
            Schedules.findByIdAndUpdate(id,{
              scheduledDate
            },{
              new:true
            }).populate([
              {
                path: 'customer',
                model: 'users'
              },
              {
                path: 'mechanic',
                model: 'mechanics'
              },
              {
                path: 'vehicle',
                model: 'vehicles'
              }
            ]).exec((error,doc)=>{
              if(error)return res.json(handleErr(error))
              else{
                return res.json(handleSuccess(doc))
              }
            })
          }
        } else {
          Schedules.findByIdAndUpdate(id,{
            scheduledDate
          },{
            new:true
          }).populate([
            {
              path: 'customer',
              model: 'users'
            },
            {
              path: 'mechanic',
              model: 'mechanics'
            },
            {
              path: 'vehicle',
              model: 'vehicles'
            }
          ]).exec((error,doc)=>{
            if(error)return res.json(handleErr(error))
            else{
              return res.json(handleSuccess(doc))
            }
          })
        }
      }
    })
  }else{
    return res.json(handleErr('Schedule and it\'s detail can not be null'))
  }
})


//delete all schedules
app.post('/api/deleteAllSchedules',(req,res)=>{
  Schedules.deleteMany({},(err,docs)=>{
    if(err)return res.json(handleErr(err))
    else{
      return res.json(handleSuccess(docs))
    }
  })
})


//Get all schedules
app.post('/api/getAllSchedules:page', (req, res) => {
  var perPage = 20
  var page = req.params.page || 1
  Schedules.find({}).populate([
    {
      path: 'customer',
      model: 'users'
    },
    {
      path: 'mechanic',
      model: 'mechanics'
    },
    {
      path: 'vehicle',
      model: 'vehicles'
    }
  ])
  .sort({createdDate:-1}).skip((perPage * page) - perPage).limit(perPage).exec((error, data) => {
      if (error) return res.json(handleErr(error))
      else Schedules.estimatedDocumentCount({ }).exec((err, count) => {
          if (err) return res.json(handleErr(err))
         else{
             let response = {
              data,
              current: page,
              pages: Math.ceil(count / perPage),
              count
             }
             return res.json(handleSuccess(response))
         }
      })
  })
})
module.exports = app