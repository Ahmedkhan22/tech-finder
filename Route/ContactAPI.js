const Avatars = require('../models/Avatars')
const express = require('express')
const app = express()
const handleErr = require('../HandleFunction/HandleErr')
const handleSuccess = require('../HandleFunction/handleSuccess')
const jwt = require("jsonwebtoken");
const refreshTokens = require('../HandleFunction/JWT').refreshTokens
const refreshTokenKey = require('../constants/jwtpasswords').refreshTokenKey
const accessTokenKey = require('../constants/jwtpasswords').accessTokenKey
const auth = require('../HandleFunction/JWT').auth
const verifyToken = require('../HandleFunction/JWT').verifyToken
const upload = require('../HandleFunction/UploadFile')
const {cities} = require('../constants/Cities')
const fs = require('fs')
const Contact = require('../models/Contact')

//Add message
app.post('/api/addMessage',(req,res)=>{
    if(req.body.fName && req.body.email && req.body.message){
        let data = {fName,email,message} = req.body
        Contact.create(data,(err,doc)=>{
            if(err)return res.json(handleErr(err))
            else{
                return res.json(handleSuccess(doc))
            }
        })
    }else{
        return res.json(handleErr('Contact Details are required'))
    }
})

//Get all messages
app.post('/api/getAllContactMessages',(req,res)=>{
    Contact.find({}).sort({createdDate:-1}).exec((err,docs)=>{
        if(err)return res.json(handleErr(err))
        else{
            return res.json(handleSuccess(docs))
        }
    })
})

//Delete Message
app.delete('/api/deleteContactMessage',(req,res)=>{
    if(req.body.id){
        let {id} = req.body
        Contact.findByIdAndDelete(id,(err,doc)=>{
            if(err)return res.json(handleErr(err))
            else{
                return res.json(handleSuccess(doc))
            }
        })
    }else{
        return res.json(handleErr('Contact Form can not be null'))
    }
})
module.exports = app