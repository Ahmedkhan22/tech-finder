const Avatars = require('../models/Avatars')
const express = require('express')
const app = express()
const handleErr = require('../HandleFunction/HandleErr')
const handleSuccess = require('../HandleFunction/handleSuccess')
const jwt = require("jsonwebtoken");
const refreshTokens = require('../HandleFunction/JWT').refreshTokens
const sendNotification = require('../HandleFunction/SendNotification')
const refreshTokenKey = require('../constants/jwtpasswords').refreshTokenKey
const accessTokenKey = require('../constants/jwtpasswords').accessTokenKey
const auth = require('../HandleFunction/JWT').auth
const verifyToken = require('../HandleFunction/JWT').verifyToken
const upload = require('../HandleFunction/UploadFile')
const {cities} = require('../constants/Cities')
const fs = require('fs')
const Schedules = require('../models/Schedules')
const Order = require('../models/Order')
const User = require('../models/User')
const OTP = require('../models/OTP')
const path = require('path')
const Mechanic = require('../models/Mechanic')
const Vehicle = require('../models/Vehicles')
const crypto = require('crypto');
const bcrypt = require('bcrypt')
const salt = bcrypt.genSaltSync(10);
const emailKey = 'irif34$ifhf$josdjfifh-$f4r23#'
const passKey = 'ifh04fkf@jfisf_w9efh4#snEFjd3fis3edowe-0#!'
const Admin = require('../models/Admin')

const nodemailer = require('nodemailer'),
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'techfinderusa@gmail.com',
            pass: 'pgktvzarevqqmyiq',
        },
    }),
    EmailTemplate = require('email-templates').EmailTemplate,
    Promise = require('bluebird');

function sendEmail (obj) {
    return transporter.sendMail(obj);
}

function loadTemplate (templateName, contexts) {
    let template = new EmailTemplate(path.join(__dirname, '../templates', templateName));
    return Promise.all(contexts.map((context) => {
        return new Promise((resolve, reject) => {
            template.render(context, (err, result) => {
                if (err) reject(err);
                else resolve({
                    email: result,
                    context,
                });
            });
        });
    }));
}

//OTP Middleware
function sendEmails(req, res, next) { 
    /**
     message    String
     emails [{
         emailAddress   String
         name   String
     }]
     */
    let {message} = req.body
    let emails = req.body.emails.map((email)=>{
        return {
            email:email.emailAddress,
            name:email.name,
            message
        }
    })
        loadTemplate('otp', emails).then((results) => {
            return Promise.all(results.map((result) => {
                console.log(result.email.html)
                sendEmail({
                    to: result.context.email,
                    from: 'Tech Finder <techfinderusa@gmail.com>',
                    subject: result.email.subject,
                    html: result.email.html,
                    text: result.email.text
        
                });
            }));
        }).then(() => {
            next()
        });   
}

//OTP Middleware
function sendAdminOtp(req, res, next) {
    const randomNumber = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
    let request = req.body
    let message = 'Your verification code for password reset is: ' + randomNumber
        let users = [
            {
                email:request.email,
                name:request.name,
                message:message
            }
        ]
        loadTemplate('otp', users).then((results) => {
            return Promise.all(results.map((result) => {
                console.log(result.email.html)
                sendEmail({
                    to: "techfinderusa1@gmail.com",
                    from: 'Tech Finder <techfinderusa@gmail.com>',
                    subject: result.email.subject,
                    html: result.email.html,
                    text: result.email.text
        
                });
            }));
        }).then(() => {
            bcrypt.hash(randomNumber.toString(), salt, (err, hashed) => {
                if (err) {
                    return res.json(handleErr(err))
                }
                else {
                    let date = new Date(Date.now())
                    date.setHours(date.getHours() + 6)
                    let data = {
                        validTill: date
                    }
                    data.code = hashed
                    OTP.create(data, (error, doc) => {
                        if (error) return res.json(handleErr(error))
                        else {
                            let response = {
                                salt,
                                number: randomNumber,
                                doc
                            }
                            req.result = response
                            next()
                        }
                    })
                }
            })
        });   
}
//Create Avatar Category for vehicles
app.post('/api/createAvatarCategory',(req,res)=>{
    if(req.body.category){
        Avatars.create(req.body,(err,doc)=>{
            if(err)return res.json(handleErr(err))
            else{
                return res.json(handleSuccess(doc))
            }
        })
    }
    else{
        return res.json(handleErr('Category can not be null'))
    }
})

//Add Avatar file in Category
app.put('/api/uploadAvatarFile', upload.single('fileData'), (req, res) => {    //tested
    //below code will read the data from the upload folder. Multer will automatically upload the file in that folder with an  autogenerated name
    if(req.body.id){
        fs.readFile(req.file.path, (err, contents) => {
            if (err) {
                return res.json(handleErr(err))
            } else {
                Avatars.findByIdAndUpdate(req.body.id,{$push:{files:req.file.filename}},{new:true},(err,doc)=>{
                    if(err)return res.json(handleErr(err))
                    else{
                        return res.json(handleSuccess(doc))
                    }
                })
            }
        });
    }
    else{
        return res.json(handleErr('Avatar ID is required'))
    }
})


//Get files for particular category
app.post('/api/getAvatarFiles',(req,res)=>{
    if(req.body.category){
        let {category} = req.body
        Avatars.findOne({category},(err,doc)=>{
            if(err)return res.json(handleErr(err))
            else{
                return res.json(handleSuccess(doc))
            }
        })
    }
    else{
        return res.json(handleErr('Category can not be null'))
    }
})

//Search cities
app.post('/api/searchCities',(req,res)=>{
    if(req.body.text){
        let response = cities.filter((city)=>{
            if(city.indexOf(req.body.text)>-1)
            return city
        })
        return res.json(handleSuccess(response))
        
    }else{
        return res.json(handleErr('Text is required'))
    }
})

app.get('/api/getAllAvatarFiles',(req,res)=>{
    Avatars.find({}).exec((err,docs)=>{
        if(err)return res.json(handleErr(err))
        else{
        let files = []
        docs.forEach((doc)=>{
            files = files.concat(doc.files)
        })
        return res.json(handleSuccess(files))
        }
    })
})

//Get counts
app.post('/api/getCountsForAdmin',(req,res)=>{
    Schedules.countDocuments({},(err,schedules)=>{
        if(err)return res.json(handleErr(err))
        else{
            User.countDocuments({},(errr,users)=>{
                if(errr)return res.json(handleErr(errr))
                else{
                    Order.countDocuments({},(er,orders)=>{
                        if(er)return res.json(handleErr(er))
                        else{
                            Mechanic.countDocuments({},(error,mechanics)=>{
                                if(error)return res.json(handleErr(error))
                                else{
                                    let response =  {
                                        mechanics,
                                        users,
                                        orders,
                                        schedules
                                    }
                                    return res.json(handleSuccess(response))
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})
app.post('/api/sendEmails',sendEmails,(req,res)=>{
    return res.json(handleSuccess('Emails sent'))
})

//Create Admin
app.post('/api/adminLogin',(req, res)=>{
    if(req.body.email && req.body.password){
        if(req.body.email.length>0 && req.body.password.length>0){
            let data = req.body
    var mykey = crypto.createCipher('aes-128-cbc', emailKey);
    var newEmail = mykey.update(data.email, 'utf8', 'hex')
    newEmail += mykey.final('hex');
    var myPasskey = crypto.createCipher('aes-128-cbc', passKey);
    var newPassword = myPasskey.update(data.password, 'utf8', 'hex')
    newPassword += myPasskey.final('hex');
    Admin.findOne({
        email:newEmail,
        password:newPassword
    },(err, doc)=>{
        if(err)return res.json(handleErr(err))
        else{
            if(doc!== null)
            return res.json(handleSuccess(doc))
            else{
                return res.json(handleErr('Unauthorized login'))
            }
        }
    })
        }
        else{
            return res.json(handleErr('Email and Password are required'))
        }
    }
    else return res.json(handleErr('Email and Password are null'))
})

//Create Admin
// app.post('/api/createAdmin',(req,res)=>{
//     if(req.body.email && req.body.password){
//         let {email,password} = req.body
//         if(email.length>0 && password.length>0){
//             var mykey = crypto.createCipher('aes-128-cbc', emailKey);
//             var newEmail = mykey.update(email, 'utf8', 'hex')
//             newEmail += mykey.final('hex');
//             var myPasskey = crypto.createCipher('aes-128-cbc', passKey);
//             var newPassword = myPasskey.update(password, 'utf8', 'hex')
//             newPassword += myPasskey.final('hex');
//             console.log('email->',newEmail)
//             console.log('password->',newPassword)
//             let data = {
//                 email:newEmail,
//                 password:newPassword
//             }
//             Admin.create(data,(err,doc)=>{
//                 if(err)return res.json(handleErr(err))
//                 else{
//                     return res.json(handleSuccess(doc))
//                 }
//             })
//         }else{
//             return res.json(handleErr('Email and Password are required'))
//         }
//     }else{
//         return res.json(handleErr('Admin can not be null'))
//     }
// })


//Change admin password
app.post('/api/updateAdminPassword',(req,res)=>{
    if(req.body.email && req.body.password && req.body.newPass){
        let {email,password} = req.body
        if(email.length>0 && password.length>0){
            var mykey = crypto.createCipher('aes-128-cbc', emailKey);
            var newEmail = mykey.update(email, 'utf8', 'hex')
            newEmail += mykey.final('hex');
            var myPasskey = crypto.createCipher('aes-128-cbc', passKey);
            var newPassword = myPasskey.update(password, 'utf8', 'hex')
            newPassword += myPasskey.final('hex');
            let data = {
                email:newEmail,
                password:newPassword
            }
            Admin.findOne(data,(err,doc)=>{
                if(err)return res.json(handleErr(err))
                else{
                    if(doc!==null){
                        //Change password
                        let {newPass} = req.body
                        var myPasskey = crypto.createCipher('aes-128-cbc', passKey);
                        var updatedPassword = myPasskey.update(newPass, 'utf8', 'hex')
                        updatedPassword += myPasskey.final('hex');
                        Admin.findOneAndUpdate({
                            email:newEmail
                        },{
                            password:updatedPassword
                        },{
                            new:true
                        },(error,admin)=>{
                            if(error)return res.json(handleErr(error))
                            else{
                                return res.json(handleSuccess(admin))
                            }
                        })

                    }
                    else{
                        return res.json(handleErr('Unauthorized access'))
                    }
                }
            })
        }else{
            return res.json(handleErr('Email and Password are required'))
        }
    }else{
        return res.json(handleErr('Admin can not be null'))
    }
})

app.post('/api/sendAdminPasswordOtp',sendAdminOtp, (req, res) => {
    return res.json(handleSuccess(req.result))
})
//Verify OTP
app.post('/api/verifyAdminOTP', (req, res) => {
    /**
     id (OTP ObjectID)
     number (Number)
     */
    if (req.body.id) {
        let data = req.body
        OTP.findById(req.body.id, (err, doc) => {
            if (err) return res.json(handleErr(err))
            else {
                bcrypt.compare(data.number.toString(), doc.code, (error, result) => {
                    console.log(result)
                    if (result === false) return res.json(handleErr('Invalid OTP'))
                    else {
                        return res.json(handleSuccess(result))
                    }
                })
            }
        })
    }
})

//Set new password
app.post('/api/setAdminPassword',(req,res)=>{
    if(req.body.email && req.body.newPass){
        let {email,newPass} = req.body
        if(email.length>0 && newPass.length>0){
            var mykey = crypto.createCipher('aes-128-cbc', emailKey);
            var newEmail = mykey.update(email, 'utf8', 'hex')
            newEmail += mykey.final('hex');
            var myPasskey = crypto.createCipher('aes-128-cbc', passKey);
            var newPassword = myPasskey.update(newPass, 'utf8', 'hex')
            newPassword += myPasskey.final('hex');
            Admin.findOneAndUpdate({
                email:newEmail
            },{
                password:newPassword
            },{
                new:true
            },(error,admin)=>{
                if(error)return res.json(handleErr(error))
                else{
                    if(admin!==null){
                    return res.json(handleSuccess(admin))
                    }else{
                        return res.json(handleErr('Email not found'))
                    }
                }
            })
        }else{
            return res.json(handleErr('Email and Password are required'))
        }
    }else{
        return res.json(handleErr('Admin can not be null'))
    }
})

//Send Notifications by admin
app.post('/api/sendAdminNotifications',(req,res)=>{
    /**
     ids Array of _id

     */
    if(req.body.ids && req.body.userType && req.body.message){
        let {ids,userType,message} = req.body
        if(userType==='Customer'){
            User.find({
                _id:{$in:ids}
            }).exec((err,docs)=>{
                if(err)return res.json(handleErr(err))
                else{
                    if(docs.length>0){
                        let tokens = docs.map((user)=>{
                          return  user.token
                        })
                        let data = {
                            tokens: tokens,
                            body: message,
                            title: "Admin Notification"
                        }
                        sendNotification(data)
                        return res.json(handleSuccess('done'))
                    }else{
                        return res.json(handleErr('Users can not be empty'))
                    }
                }
            })
        }else if (userType==='Mechanic'){
            Mechanic.find({
                _id:{$in:ids}
            }).exec((err,docs)=>{
                if(err)return res.json(handleErr(err))
                else{
                    if(docs.length>0){
                        let tokens = docs.map((user)=>{
                            return  user.token
                          })
                        let data = {
                            tokens: tokens,
                            body: message,
                            title: "Admin Notification"
                        }
                        sendNotification(data)
                        return res.json(handleSuccess('done'))
                    }else{
                        return res.json(handleErr('Users can not be empty'))
                    }
                }
            })
        }
    }else{
        return res.json(handleErr('Users can not be null'))
    }
})

module.exports = app