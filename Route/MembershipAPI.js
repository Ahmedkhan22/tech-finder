const Memberships = require('../models/Memberships')
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

// Create Membership
app.post('/api/createMembership',(req,res)=>{
    let data = req.body
    Memberships.create(data,(err,doc)=>{
        if(err)return res.json(handleErr(err))
        else{
            return res.json(handleSuccess(doc))
        }
    })
})

//Get All Memberships
app.get('/api/getAllMemberships',(req,res)=>{
    Memberships.find({}).sort({membershipType:1}).exec((err,docs)=>{
        if(err)return res.json(handleErr(err))
        else{
            return res.json(handleSuccess(docs))
        }
    })
})
//Update membership plan
app.put('/api/updateMembership',(req,res)=>{
    if(req.body.id){
        let data = req.body
        Memberships.findByIdAndUpdate(data.id,data,{new:true},(err,doc)=>{
            if(err)return res.json(handleErr(err))
            else{
                return res.json(handleSuccess(doc))
            }
        })
    }else{
        return res.json(handleErr('Membership can not be null'))
    }
})

module.exports=app