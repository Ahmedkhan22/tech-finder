const Mechanic = require('../models/Mechanic')
const Order = require('../models/Order')
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;
const uid = require('uid')
const handleErr = require('../HandleFunction/HandleErr')
const handleSuccess = require('../HandleFunction/handleSuccess')
const sendNotification = require('../HandleFunction/SendNotification')
const jwt = require("jsonwebtoken");
const fs = require('fs')
const path = require('path')
var mime = require('mime');
const upload = require('../HandleFunction/UploadFile')
const Dispute = require('../models/Disputes')
const Disputes = require('../models/Disputes')
const Schedules = require('../models/Schedules')
const refreshTokens = require('../HandleFunction/JWT').refreshTokens
const refreshTokenKey = require('../constants/jwtpasswords').refreshTokenKey
const accessTokenKey = require('../constants/jwtpasswords').accessTokenKey
const auth = require('../HandleFunction/JWT').auth
const verifyToken = require('../HandleFunction/JWT').verifyToken

//Create Dispute
app.post('/api/createDispute',(req,res)=>{
    let {mechanic,customer,order,reason,raisedBy,customerFiles,mechanicFiles} = req.body
    if(mechanic && customer && order && reason && raisedBy){  
        if(raisedBy==='Customer'){
            let data = {
                mechanic,
                order,
                customer,
                reason,
                raisedBy,
                customerDescription:req.body.customerDescription,
                disuputeId:uid(6).toUpperCase(),
                customerFiles:customerFiles!==undefined?customerFiles:[]
            }
            Dispute.create(data,(err,doc)=>{
                if(err)return res.json(handleErr(err))
                else{
                    Dispute.populate(doc,[
                        {
                            path: 'customer',
                            model: 'users'
                        },
                        {
                            path: 'mechanic',
                            model: 'mechanics'
                        },
                        {
                            path: 'order',
                            model: 'orders'
                        }
                    ],(error,dispute)=>{
                        if(error)return res.json(handleErr(error))
                        else{
                            return res.json(handleSuccess(dispute))
                        }
                    })
                }
            })

        }else{
            let data = {
                mechanic,
                order,
                customer,
                reason,
                raisedBy,
                mechanicDescription:req.body.mechanicDescription,
                disuputeId:uid(6).toUpperCase(),
                mechanicFiles:mechanicFiles!==undefined?mechanicFiles:[]
            }
            Dispute.create(data,(err,doc)=>{
                if(err)return res.json(handleErr(err))
                else{
                    Dispute.populate(doc,[
                        {
                            path: 'customer',
                            model: 'users'
                        },
                        {
                            path: 'mechanic',
                            model: 'mechanics'
                        },
                        {
                            path: 'order',
                            model: 'orders'
                        }
                    ],(error,dispute)=>{
                        if(error)return res.json(handleErr(error))
                        else{
                            //Yahan email/notification bhejna hai
                            return res.json(handleSuccess(dispute))
                        }
                    })
                }
            })
        }
    }else{
        return res.json(handleErr('Dispute details are required'))
    }
})

//Get mechanic disputes
app.post('/api/mechanicDispites',(req,res)=>{
    if(req.body.mechanic){
        Disputes.find({
            mechanic:req.body.mechanic
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
                path: 'order',
                model: 'orders'
            }
        ]).sort({
            createdDate:-1
        }).exec((err,docs)=>{
            if(err)return res.json(handleErr(err))
            else{
                return res.json(handleSuccess(docs))
            }
        })
    }else{
        return res.json(handleErr('Mechanic is required'))
    }
})

//Get customer disputes
app.post('/api/customerDispites',(req,res)=>{
    if(req.body.customer){
        Disputes.find({
            customer:req.body.customer
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
                path: 'order',
                model: 'orders'
            }
        ]).sort({
            createdDate:-1
        }).exec((err,docs)=>{
            if(err)return res.json(handleErr(err))
            else{
                return res.json(handleSuccess(docs))
            }
        })
    }else{
        return res.json(handleErr('Mechanic is required'))
    }
})

//Submit response 
app.post('/api/submitDisputeResponse',(req,res)=>{
    if(req.body.id && req.body.raisedBy){
        if(req.body.raisedBy==='Customer'){
            //Mechanic response
            let {id,mechanicDescription,mechanicFiles} = req.body
            Dispute.findByIdAndUpdate(id,{
                mechanicDescription,
                mechanicFiles:mechanicFiles!==undefined?mechanicFiles:[],
                answered:true
            },{new:true}).populate([
                {
                    path: 'customer',
                    model: 'users'
                },
                {
                    path: 'mechanic',
                    model: 'mechanics'
                },
                {
                    path: 'order',
                    model: 'orders'
                }
            ]).exec((err,doc)=>{
                if(err)return res.json(handleErr(err))
                else{
                    return res.json(handleSuccess(doc))
                }
            })
        }else{
            //Customer response
            let {id,customerDescription,customerFiles} = req.body
            Dispute.findByIdAndUpdate(id,{
                customerDescription,
                customerFiles:customerFiles!==undefined?customerFiles:[],
                answered:true
            },{new:true}).populate([
                {
                    path: 'customer',
                    model: 'users'
                },
                {
                    path: 'mechanic',
                    model: 'mechanics'
                },
                {
                    path: 'order',
                    model: 'orders'
                }
            ]).exec((err,doc)=>{
                if(err)return res.json(handleErr(err))
                else{
                    return res.json(handleSuccess(doc))
                }
            })
        }
    }else{
        return res.json('Dispute can not be null')
    }
})



//Get all Disputes
app.post('/api/getAllDisputes:page', (req, res) => {
    var perPage = 20
    var page = req.params.page || 1
    Dispute.find({}).populate([
      {
        path: 'customer',
        model: 'users'
      },
      {
        path: 'mechanic',
        model: 'mechanics'
      },
      {
        path: 'order',
        model: 'orders'
      }
    ])
    .sort({createdDate:-1}).skip((perPage * page) - perPage).limit(perPage).exec((error, data) => {
        if (error) return res.json(handleErr(error))
        else Dispute.estimatedDocumentCount({ }).exec((err, count) => {
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

//Update Dispute Status
app.put('/api/updateDisputeStatus',(req,res)=>{
    if(req.body.id && req.body.status){
        let {id,status} = req.body
        Dispute.findByIdAndUpdate(id,{status},{new:true}).populate([
            {
                path: 'customer',
                model: 'users'
            },
            {
                path: 'mechanic',
                model: 'mechanics'
            },
            {
                path: 'order',
                model: 'orders'
            }
        ]).exec((err,doc)=>{
            if(err)return res.json(handleErr(err))
            else{
                let {mechanic} = doc
                        let {token} = mechanic
                        if(token!==undefined && token!==null){
                            let data = {
                                tokens: [token],
                                body: "Your dispute status has been updated by admin",
                                title: "Dispute Status"
                            }
                            sendNotification(data)
                        }
                        let {customer} = doc
                        let  customerToken = {token} = customer
                        if(token!==undefined && token!==null){
                            let data = {
                                tokens: [customerToken],
                                body: "Your dispute status has been updated by admin",
                                title: "Dispute Status"
                            }
                            sendNotification(data)
                        }
                return res.json(handleSuccess(doc))
            }
        })
    }else{
        return res.json(handleErr('Dispute and it\'s status is required'))
    }
})

//Get recend schedules
app.get('/api/getRecentDisputes',(req,res)=>{
    Dispute.find({}).sort({createdDate:-1}).limit(5)
    .populate('vehicle').populate('mechanic').populate('customer').exec((err,docs)=>{
        if(err)return res.json(handleErr(err))
        else{
            return res.json(handleSuccess(docs))
        }
    })
})

//Delete all disputes
app.post('/api/deleteDisputes',(req,res)=>{
    Dispute.deleteMany({}).exec((err,doc)=>{
        if(err)return res.json(handleErr(err))
        else{
            return res.json(handleSuccess(doc))
        }
    })
})
module.exports =app