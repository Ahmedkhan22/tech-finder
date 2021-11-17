const Mechanic = require('../models/Mechanic')
const Order = require('../models/Order')
const express = require('express')
const app = express()
const handleErr = require('../HandleFunction/HandleErr')
const handleSuccess = require('../HandleFunction/handleSuccess')
const sendNotification = require('../HandleFunction/SendNotification')
const jwt = require("jsonwebtoken");
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
var mime = require('mime');
const uid = require('uid')
const upload = require('../HandleFunction/UploadFile')
const Schedules = require('../models/Schedules')
const refreshTokens = require('../HandleFunction/JWT').refreshTokens
const refreshTokenKey = require('../constants/jwtpasswords').refreshTokenKey
const accessTokenKey = require('../constants/jwtpasswords').accessTokenKey
const auth = require('../HandleFunction/JWT').auth
const verifyToken = require('../HandleFunction/JWT').verifyToken

//Check if user has active order
app.post('/api/checkOrder', (req, res) => {
    if (req.body.id) {
        Order.findOne({
            customer: req.body.id,
            status: { $nin: ["rejected", "completed", "cancelled","noResponse"] }
        }).populate('customer').populate('mechanic').populate('vehicle').exec((err, doc) => {
            if (err) return res.json(handleErr(err))
            else {
                if(doc===null){
                    return res.json(handleErr('No order'))
                }
                else return res.json(handleSuccess(doc))
            }
        })
    } else {
        return res.json(handleErr('User can not be null'))
    }
})

//Get mechanic's active orders
app.post('/api/mechanicCurrentOrders', (req, res) => {
    if (req.body.id) {
        Order.find({
            mechanic: req.body.id,
            status: { $nin: ["rejected", "completed", "cancelled","payment","noResponse"] }
        }).populate('customer').populate('mechanic').populate('vehicle').sort({ createdDate: -1 })
        .exec((err, docs) => {
            if (err) return res.json(handleErr(err))
            else {
                return res.json(handleSuccess(docs))
            }
        })
    } else {
        return res.json(handleErr('Mechanic can not be null'))
    }
})

//Get all orders for user
app.post('/api/getUserOrders', (req, res) => {
    if (req.body.id) {
        Order.find({
            customer: req.body.id,
            status: { $in: ["rejected", "completed", "cancelled"] }
        }).populate('customer').populate('mechanic').populate('vehicle').sort({ createdDate: -1 })
        .exec((err, docs) => {
            if (err) return res.json(handleErr(err))
            else {
                return res.json(handleSuccess(docs))
            }
        })
    } else {
        return res.json(handleErr('User can not be null'))
    }
})

//Get past orders for mechanic
app.post('/api/mechanicOrders', (req, res) => {
    if (req.body.id) {
        Order.find({
            mechanic: req.body.id,
            status: { $in: ["rejected", "completed", "cancelled",'payment'] }
        }).populate('customer').populate('mechanic').populate('vehicle').sort({ createdDate: -1 }
        ).exec((err, docs) => {
            if (err) return res.json(handleErr(err))
            else {
                return res.json(handleSuccess(docs))
            }
        })
    } else {
        return res.json(handleErr('Mechanic can not be null'))
    }
})


app.get('/api/DeleteAllOrders',(req,res)=>{
    Order.deleteMany({},(err,docs)=>{
        if(err)return res.json(handleErr(err))
        else{
            return res.json(handleSuccess(docs))
        }
    })
})

//Get all Orders
app.post('/api/getAllOrders:page', (req, res) => {
    var perPage = 20
    var page = req.params.page || 1
    Order.find({}).populate([
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
        else Order.estimatedDocumentCount({ }).exec((err, count) => {
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
//Get recend orders
app.get('/api/getRecentOrders',(req,res)=>{
    Order.find({}).sort({createdDate:-1}).limit(5)
    .populate('vehicle').populate('mechanic').populate('customer').exec((err,docs)=>{
        if(err)return res.json(handleErr(err))
        else{
            return res.json(handleSuccess(docs))
        }
    })
})
//Temporary route to create orders
app.post('/api/createOrder',(req,res)=>{
    let data = req.body
    data.orderId = uid(8)
    Order.create(data,(err,doc)=>{
        if(err)return res.json(handleErr(err))
        else{   
            // console.log('error->',err)
            // console.log('order->',doc)
            Order.populate(doc,[
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
              ],(error,order)=>{
                  if(error)return res.json(handleErr(error))
                  else{
                      return res.json(handleSuccess(order))
                  }
              })
        }
    })
})

//Read messages (mock route)
app.post('/api/readMessages',(req,res)=>{
    let { id, messageSender } = req.body
    if (id && messageSender) {
        Order.findById(id).populate([
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
                if(doc!==null){
                    let {messages} = doc
                    if(messages.length>0){
                        let newMessages = messages.map((message)=>{
                            if(message.messageSender===messageSender){
                                message.isRead = true
                                return message
                            }else return message
                        })
                        Order.findByIdAndUpdate(id,{
                            messages:newMessages
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
                            ]).exec((error, updated) => {
                                if (error) {
                                    return res.json(handleErr(error))
                                }
                                else {
                                    let response = {
                                        message: "Success",
                                        data: updated,
                                        id
                                    }
                                    return res.json(handleSuccess(response))
                                }
                            })
                    }
                    else{
                        return res.json(handleSuccess(doc))
                    }
                }else{
                    return res.json(handleErr('Doc is null'))
                }
            }
        })
    }
})

//Add test messsages
app.post('/api/addMessagesInOrder',(req,res)=>{
    let {id,message} = req.body
    Order.findByIdAndUpdate(id,{$push:{messages:message}},{new:true},(err,doc)=>{
        if(err)return res.json(handleErr(err))
        else{
            return res.json(handleSuccess(doc))
        }
    })
})
module.exports = app