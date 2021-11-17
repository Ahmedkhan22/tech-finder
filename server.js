const express = require('express')
var http = require('http')
const app = express()
var server = http.createServer(app);
const process = require('process')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const uid = require('uid')
const mime = require('mime')
// const url = 'mongodb://devops_think:t3chf!nd3r@63.250.47.33:28183/techfinder'
const url = 'mongodb://techfinderusaAdminOdufg:mXNSheudbaWPma0DQmiX@209.145.51.153:25173/techfinderusa'
//Pr0j3ctUn!c0rn
const Order = require('./models/Order')

const diffMinutes = require('./HandleFunction/DiffMinutes')
const port = process.env.PORT || 5717
const cors = require('cors')
const bcrypt = require('bcrypt')
const salt = bcrypt.genSaltSync(10);
const cron = require('node-cron')
const client = require('socket.io').listen(server).sockets;
const upload = require('./HandleFunction/UploadFile')
const fs = require('fs');
app.use(bodyParser.json())  //Body Parser MiddleWare
app.use(express.json())
app.use(express.static('uploads'))
app.use(cors())
const OTP = require('./models/OTP')
const handleErr = require('./HandleFunction/HandleErr');
const handleSuccess = require('./HandleFunction/handleSuccess');
const Mechanic = require('./models/Mechanic');
const Schedules = require('./models/Schedules');
const deleteFile = require('./HandleFunction/DeleteFile');
const rateLimit = require("express-rate-limit");
const sendNotification = require('./HandleFunction/SendNotification');
const Referrals = require('./models/Referrals');
const User = require('./models/User');

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200 // limit each IP to 100 requests per windowMs
});

//  apply to all requests
app.use(limiter);
//qfphjzrsnlapyecw
const nodemailer = require('nodemailer'),
    transporter = nodemailer.createTransport({
        pool: true,
        host: "mail.thinksolutionz.org",
        port: 465,
        secure: true, // use TLS
        auth: {
          user: "hamzaali@thinksolutionz.org",
          pass: "gsmarena1",
        },
      }),
    EmailTemplate = require('email-templates').EmailTemplate,
    Promise = require('bluebird');

function sendEmail(obj) {
    return transporter.sendMail(obj);
}

function loadTemplate(templateName, contexts) {
    let template = new EmailTemplate(path.join(__dirname, 'templates', templateName));
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
function sendEmailTS(req, res, next) {
   if(req.body.fName && req.body.lName && req.body.emailAddress && req.body.phone!==undefined && req.body.messageText){
    let {fName, lName, emailAddress, phone,messageText} = req.body
    let message = fName+" " +lName +' with email address: '+emailAddress +', phone: ' +phone 
    +' just sent this message: '+"\n" +messageText 
    let users = [
        {
            email: 'hamxa1331@gmail.com',
            name: 'Think Solutionz',
            message: message
        }
    ]
    loadTemplate('otp', users).then((results) => {
        return Promise.all(results.map((result) => {
            console.log(result.email.html)
            sendEmail({
                to: result.context.email,
                from: 'Hamza Ali <hamzaali@thinksolutionz.org>',
                subject: "Think Solutionz Contact",
                html: result.email.html,
                text: result.email.text

            });
        }));
    }).then(() => {
        console.log('Done=>', message)
        next()
    });
   }
   else{
       return res.json(handleErr('Contact details are required'))
   }
}

//OTP Middleware
function sendOtp(req, res, next) {
    const randomNumber = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
    let request = req.body
    let message = 'Your verification code is: ' + randomNumber
    let users = [
        {
            email: request.email,
            name: request.name,
            message: message
        }
    ]
    loadTemplate('otp', users).then((results) => {
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
        console.log('Done=>', message)
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

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//APIs
app.use('', require('./Route/UserApi'))
app.use('', require('./Route/MechanicAPI'))
app.use('', require('./Route/MembershipAPI'))
app.use('', require('./Route/OrdersAPI'))
app.use('', require('./Route/AdminRoutes'))
app.use('', require('./Route/ScheduleAPI'))
app.use('', require('./Route/DisputesAPI'))
app.use('', require('./Route/FAQsAPI'))
app.use('', require('./Route/ContactAPI'))

//MongoDB connection
mongoose.connect(url, { useNewUrlParser: true }) //MongoDB connection using Mongoose
var db = mongoose.connection //Mongo Connection Instance

db.on('open', () => {
    console.log('database connected')
})

app.get('/', function (req, res) {  //HomePage for API
    res.json({ message: 'Welcome' })
})
client.on('connection', (socket) => {
    console.log('Client connected')
    client.emit('connecteddd', {
        message: "hello"
    })
    //Order sockets
    socket.on('orderRequest', (data) => {
        /*
         Required fields
         customer (id)
         mechanic (id)
         customerDescription
         longitude
         latitude
         vehicle
         mechanicLongitude
         mechanicLatitude
         */
        let { customer, mechanic, customerDescription, longitude, latitude, vehicle
            , mechanicLongitude, mechanicLatitude } = data
        if (customer && mechanic && customerDescription && longitude && latitude && vehicle && mechanicLongitude !== undefined && mechanicLatitude !== undefined) {
            //Check if mechanic has active order
            Order.find({
                mechanic: mechanic,
                status: { $nin: ["rejected", "completed", "cancelled", "pending", "noResponse"] }
            }).exec((err, docs) => {
                if (err) {
                    console.log('Error->', err)
                    let response = {
                        message: "Failed",
                        data: err,
                        customer
                    }
                    client.emit('createOrder', response)      //Send response to user that mechanic has an activ order
                }
                else {
                    if (docs.length > 0) {      //there is an order
                        let response = {
                            message: "Failed",
                            data: "Mechanic has an active order",
                            customer
                        }
                        client.emit('createOrder', response)      //Send response to user that mechanic has an activ order
                    } else {
                        let data = {
                            customer,
                            mechanic,
                            customerDescription,
                            customerLocation: {
                                type: "Point",
                                coordinates: [longitude, latitude]
                            },
                            vehicle,
                            orderId: uid(8),
                            mechanicStartLocation: {
                                type: "Point",
                                coordinates: [mechanicLongitude, mechanicLatitude]
                            }
                        }
                        Order.create(data, (error, doc) => {
                            if (error) {
                                console.log('error->', error)
                                let response = {
                                    message: "Failed",
                                    data: error
                                }
                                client.emit('createOrder', response)
                            } else {
                                Order.populate(doc, [
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
                                ], (er, order) => {
                                    if (er) {
                                        if (er) {
                                            console.log('error->', er)
                                            let response = {
                                                message: "Failed",
                                                data: er,
                                                customer
                                            }
                                            client.emit('createOrder', response)      //Send response to user that mechanic has an activ order
                                        }
                                    }
                                    else {
                                        let response = {
                                            message: "Success",
                                            data: order,
                                        }
                                        let { mechanic } = order
                                        let { token } = mechanic
                                        if (token !== undefined && token !== null) {
                                            let data = {
                                                tokens: [token],
                                                body: "You've new order request",
                                                title: "New Order Request"
                                            }
                                            sendNotification(data)
                                        }
                                        client.emit('createOrder', response) //Order created response for user 
                                        client.emit('newOrderRequest', response) //order request for driver
                                    }
                                })
                            }
                        })
                    }
                }
            })
        }
    })

    socket.on('acceptOrder', data => {
        let { id } = data
        if (id) {
            Order.findByIdAndUpdate(id, { status: "travelling" }, { new: true }).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err,
                        id
                    }
                    client.emit('orderAcceptance', response)
                }
                else {
                    let response = {
                        message: "Success",
                        data: doc,
                        id
                    }
                    let { customer } = doc
                    let { token } = customer
                    if (token !== undefined && token !== null) {
                        let data = {
                            tokens: [token],
                            body: "Mechanic has accepted order",
                            title: "Order Accepted!"
                        }
                        sendNotification(data)
                    }
                    client.emit('orderAcceptance', response)
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order can not be null"
            }
            client.emit('orderAcceptance', response)
        }
    })
    //Reject order
    socket.on('rejectOrder', data => {
        let { id } = data
        if (id) {
            Order.findByIdAndUpdate(id, { status: "rejected" }, { new: true }).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err,
                        id
                    }
                    client.emit('orderRejection', response)
                }
                else {
                    let response = {
                        message: "Success",
                        data: doc,
                        id
                    }
                    let { customer } = doc
                    let { token } = customer
                    if (token !== undefined && token !== null) {
                        let data = {
                            tokens: [token],
                            body: "Mechanic has rejected your order",
                            title: "Order Rejected!"
                        }
                        sendNotification(data)
                    }
                    client.emit('orderRejection', response)
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order can not be null"
            }
            client.emit('orderRejection', response)
        }
    })

    //Mechanic arrived at customer's location
    socket.on('arrived', data => {
        let { id } = data
        if (id) {
            Order.findByIdAndUpdate(id, { status: "arrived" }, { new: true }).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err,
                        id
                    }
                    client.emit('mechanicArrived', response)
                }
                else {
                    let response = {
                        message: "Success",
                        data: doc,
                        id
                    }
                    let { customer } = doc
                    let { token } = customer
                    if (token !== undefined && token !== null) {
                        let data = {
                            tokens: [token],
                            body: "Mechanic has arrived! Please confirm.",
                            title: "Mechanic arrived!"
                        }
                        sendNotification(data)
                    }
                    client.emit('mechanicArrived', response)
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order can not be null"
            }
            client.emit('mechanicArrived', response)
        }
    })
    //Customer approve arrival of mechanic
    socket.on('confirmArrival', data => {
        let { id } = data
        if (id) {
            Order.findByIdAndUpdate(id, { status: "progress" }, { new: true }).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err,
                        id
                    }
                    client.emit('arrivalConfirmed', response)
                }
                else {
                    let response = {
                        message: "Success",
                        data: doc,
                        id
                    }
                    let { mechanic } = doc
                    let { token } = mechanic
                    if (token !== undefined && token !== null) {
                        let data = {
                            tokens: [token],
                            body: "Your arrival has been confirmeed by customer. You may start working now!",
                            title: "Arrival confirmed!"
                        }
                        sendNotification(data)
                    }
                    client.emit('arrivalConfirmed', response)
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order can not be null"
            }
            client.emit('arrivalConfirmed', response)
        }
    })
    //Generate invoice
    socket.on('generateInvoice', data => {
        let { id, parts, cost, mechanicDescription, serviceFee } = data
        if (id && cost && parts !== undefined && mechanicDescription && serviceFee) {
            let uniqueString = uid(12)
            let shortCode = Math.floor(1000 + Math.random() * 9000)
            let obj = {
                id, parts, cost, mechanicDescription, serviceFee
            } = data
            obj.status = 'invoice'
            obj.uniqueString = uniqueString
            obj.shortCode = shortCode
            Order.findByIdAndUpdate(id, obj, { new: true }).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err,
                        id
                    }
                    client.emit('invoiceGenerated', response)
                }
                else {
                    let response = {
                        message: "Success",
                        data: doc,
                        id
                    }
                    let { customer } = doc
                    let { token } = customer
                    if (token !== undefined && token !== null) {
                        let data = {
                            tokens: [token],
                            body: "Mechanic has generated invoice for your Order. Please review receipt and pay",
                            title: "Invoice Generated!"
                        }
                        sendNotification(data)
                    }
                    client.emit('invoiceGenerated', response)
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order and required details can not be null"
            }
            client.emit('invoiceGenerated', response)
        }
    })
    //complete order
    socket.on('payment', data => {
        let { id, shortCode, uniqueString } = data
        if ((id && shortCode) || (id && uniqueString)) {
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err
                    }
                    client.emit('paymentSuccessful', response)
                } else {
                    if (doc !== null) {
                        if (shortCode) {          //if user enters short code
                            if (doc.shortCode === shortCode) {      //if short code matched
                                Order.findByIdAndUpdate(id, {
                                    status: "complete",
                                    $unset: { shortCode: "", uniqueString: "" }
                                }, { new: true }).populate([
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
                                ]).exec((err, doc) => {
                                    if (err) {
                                        let response = {
                                            message: "Failed",
                                            data: err,
                                            id
                                        }
                                        client.emit('paymentSuccessful', response)
                                    }
                                    else {
                                        let response = {
                                            message: "Success",
                                            data: doc,
                                            id
                                        }

                                        let { mechanic } = doc
                                        let { token } = mechanic
                                        if (token !== undefined && token !== null) {
                                            let data = {
                                                tokens: [token],
                                                body: "Payment has been received by customer. Your order is complete now!",
                                                title: "Payment Received!"
                                            }
                                            sendNotification(data)
                                        }
                                        let {customer} = doc
                                        if(customer.balance>5){
                                            User.findByIdAndUpdate(customer._id,{
                                                $inc:{balance:-5}
                                            },{
                                                new:true
                                            },(errr,user)=>{
                                                if(errr){
                                                    let response = {
                                                        message: "Failed",
                                                        data: errr,
                                                        id
                                                    }
                                                    client.emit('paymentSuccessful', response)
                                                }
                                                else client.emit('paymentSuccessful', response)
                                            })
                                        }
                                       else client.emit('paymentSuccessful', response)
                                    }
                                })
                            }
                            else {       //short code didn't match
                                let response = {
                                    message: "Failed",
                                    data: "Invalid short code",
                                    id
                                }
                                client.emit('paymentSuccessful', response)
                            }
                        } else if (uniqueString) {     //if user scans QR code
                            if (doc.uniqueString === uniqueString) {        //QR code string matched
                                Order.findByIdAndUpdate(id, {
                                    status: "complete",
                                    $unset: { shortCode: "", uniqueString: "" }
                                }, { new: true }).populate([
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
                                ]).exec((err, doc) => {
                                    if (err) {
                                        let response = {
                                            message: "Failed",
                                            data: err,
                                            id
                                        }
                                        client.emit('paymentSuccessful', response)
                                    }
                                    else {
                                        let response = {
                                            message: "Success",
                                            data: doc,
                                            id
                                        }
                                        let { mechanic } = doc
                                        let { token } = mechanic
                                        if (token !== undefined && token !== null) {
                                            let data = {
                                                tokens: [token],
                                                body: "Payment has been received by customer. Your order is complete now!",
                                                title: "Payment Received!"
                                            }
                                            sendNotification(data)
                                        }
                                        let {customer} = doc
                                        if(customer.balance>5){
                                            User.findByIdAndUpdate(customer._id,{
                                                $inc:{balance:-5}
                                            },{
                                                new:true
                                            },(errr,user)=>{
                                                if(errr){
                                                    let response = {
                                                        message: "Failed",
                                                        data: errr,
                                                        id
                                                    }
                                                    client.emit('paymentSuccessful', response)
                                                }
                                                else client.emit('paymentSuccessful', response)
                                            })
                                        }
                                      else  client.emit('paymentSuccessful', response)
                                    }
                                })
                            }
                            else {       //QR code not matched
                                let response = {
                                    message: "Failed",
                                    data: "QR code didn't match",
                                    id
                                }
                                client.emit('paymentSuccessful', response)
                            }
                        }
                    }
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order and required details can not be null"
            }
            client.emit('paymentSuccessful', response)
        }
    })
    //Update mechanic location
    socket.on('mechanicLocation', data => {
        let { id, longitude, latitude } = data
        if (id && longitude && latitude) {
            let location = {
                type: "Point",
                coordinates: [longitude, latitude]
            }
            console.log('location->',location)
            Mechanic.findByIdAndUpdate(id, { $set: { geometry: location } }, { new: true }).populate('membership')
                .populate('reviews.user').exec((err, doc) => {
                    if (err) {
                        let response = {
                            message: "Failed",
                            data: err,
                            id
                        }
                        client.emit('mechanicLocationUpdated', response)
                    }
                    else {
                        let response = {
                            message: "Success",
                            data: doc,
                            id
                        }
                        client.emit('mechanicLocationUpdated', response)
                    }
                })
        } else {
            let response = {
                message: "Failed",
                data: "Mechanic and other details can not be null"
            }
            client.emit('mechanicLocationUpdated', response)
        }
    })
    socket.on('message', (data) => {
        /**
         id   Order ID
         message:{
             messageSender String (Customer/Mechanic)
             text String (if messageType is 1)
             filePath String (if messageType is 1)
             messageType Number
         }
         */

        let { id, message } = data
        if (id && message.messageSender) {
            Order.findByIdAndUpdate(data.id, { $push: { messages: data.message } }, { new: true }).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    client.emit('sent', {
                        message: "Failed",
                        data: err
                    })
                } else {
                    if (message.messageSender === 'Customer') {
                        //Send notification to Mechanic
                        let { mechanic } = doc
                        let { token } = mechanic
                        if (token !== undefined && token !== null) {
                            let data = {
                                tokens: [token],
                                body: message.messageType === 0 ? message.text : "File",
                                title: "New message"
                            }
                            sendNotification(data)
                        }
                    } else if (message.messageSender === 'Mechanic') {
                        //Send notification to Customer
                        let { customer } = doc
                        let { token } = customer
                        if (token !== undefined && token !== null) {
                            let data = {
                                tokens: [token],
                                body: message.messageType === 0 ? message.text : "File",
                                title: "New message"
                            }
                            sendNotification(data)
                        }
                    }
                    client.emit('sent', {
                        message: "Success",
                        data: doc
                    })
                }
            })
        }
        else {
            client.emit('sent', {
                message: "Failed",
                data: "ID and nessage sender can not be null"
            })
        }
    })
    //Schedule Mesasges
    socket.on('scheduleMessage', (data) => {
        /**
         id   Order ID
         message:{
             messageSender String (Customer/Mechanic)
             text String (if messageType is 1)
             filePath String (if messageType is 1)
             messageType Number
         }
         */
        let { id, message } = data
        if (id && message.messageSender) {
            Schedules.findByIdAndUpdate(data.id, { $push: { messages: data.message } }, { new: true }).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    client.emit('scheduleSent', {
                        message: "Failed",
                        data: err
                    })
                } else {
                    if (message.messageSender === 'Customer') {
                        //Send notification to Mechanic
                        let { mechanic } = doc
                        let { token } = mechanic
                        if (token !== undefined && token !== null) {
                            let data = {
                                tokens: [token],
                                body: message.messageType === 0 ? message.text : "File",
                                title: "New message"
                            }
                            sendNotification(data)
                        }
                    } else if (message.messageSender === 'Mechanic') {
                        //Send notification to Customer
                        let { customer } = doc
                        let { token } = customer
                        if (token !== undefined && token !== null) {
                            let data = {
                                tokens: [token],
                                body: message.messageType === 0 ? message.text : "File",
                                title: "New message"
                            }
                            sendNotification(data)
                        }
                    }
                    client.emit('scheduleSent', {
                        message: "Success",
                        data: doc
                    })
                }
            })
        }
        else {
            client.emit('scheduleSent', {
                message: "Failed",
                data: "Schedule and nessage sender can not be null"
            })
        }
    })
    //Give Review for order
    socket.on('reviewOrder', data => {
        /**
         id     Mechanic _id
         order  Order _id
         text   String
         rating Number
         user   User _id
         */
        let { id, order, text, rating, user } = data
        if (id && order && rating && text && user) {
            let review = {
                order,
                text,
                rating,
                user
            }
            Mechanic.findByIdAndUpdate(id, { $push: { reviews: review } }, { new: true }).exec((err, mech) => {
                if (err) {        //error in review
                    let response = {
                        message: "Failed",
                        data: err
                    }
                    client.emit('review', response)
                }
                else {
                    Order.findByIdAndUpdate(order, { status: "completed" }, { new: true }).populate([
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
                    ]).exec((error, orderData) => {
                        if (err) {
                            let response = {
                                message: "Failed",
                                data: error,
                                id: order
                            }
                            client.emit('review', response)
                        }
                        else {
                            let response = {
                                message: "Success",
                                data: orderData,
                                id: order
                            }
                            let { customer } = orderData
                            let { referredId } = customer
                            if (referredId !== undefined && referredId !== null) {
                                Referrals.findById(referredId, (errr, referral) => {
                                    if (errr) {
                                        let response = {
                                            message: "Failed",
                                            data: errr,
                                            id: order
                                        }
                                        client.emit('review', response)
                                    } else {
                                        if (referral.status === 'accepted') {
                                            let ids = [referral.referring, referral.referredId]
                                            User.updateMany({
                                                _id: { $in: ids }
                                            },
                                                {
                                                    $inc: { balance: 5 }
                                                },
                                                (err, docs) => {
                                                    if (err) {
                                                        let response = {
                                                            message: "Failed",
                                                            data: err,
                                                            id: order
                                                        }
                                                        client.emit('review', response)
                                                    } else {
                                                        Referrals.findByIdAndUpdate(referredId, {
                                                            status: "completed"
                                                        }, {
                                                            new: true
                                                        }).exec((errRef, updatedRef) => {
                                                            if (errRef) {
                                                                let response = {
                                                                    message: "Failed",
                                                                    data: errRef,
                                                                    id: order
                                                                }
                                                                client.emit('review', response)
                                                            } else {
                                                                client.emit('review', response)
                                                            }
                                                        })
                                                    }
                                                }
                                            )
                                        }
                                        else client.emit('review', response)
                                    }
                                })
                            }
                            else client.emit('review', response)
                        }
                    })
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order and review can not be null"
            }
            client.emit('review', response)
        }
    })
    //cancel by user
    socket.on('cancelOrder', data => {
        let { id, cancellationReason, cancelledBy } = data
        if (id && cancellationReason && cancelledBy) {
            Order.findByIdAndUpdate(id, { status: "cancelled", cancellationReason, cancelledBy }, { new: true }).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err,
                        id
                    }
                    client.emit('orderCancelled', response)
                }
                else {
                    let response = {
                        message: "Success",
                        data: doc,
                        id
                    }
                    if (cancelledBy === 'Customer') {
                        //Send notification to Mechanic
                        let { mechanic } = doc
                        let { token } = mechanic
                        if (token !== undefined && token !== null) {
                            let data = {
                                tokens: [token],
                                body: 'Order has been cancelled by customer',
                                title: "Order Cancelled"
                            }
                            sendNotification(data)
                        }
                    } else if (cancelledBy === 'Mechanic') {
                        //Send notification to Customer
                        let { customer } = doc
                        let { token } = customer
                        if (token !== undefined && token !== null) {
                            let data = {
                                tokens: [token],
                                body: 'Order has been cancelled by mechanic',
                                title: "Order Cancelled"
                            }
                            sendNotification(data)
                        }
                    }
                    client.emit('orderCancelled', response)
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order and other detail can not be null"
            }
            client.emit('orderCancelled', response)
        }
    })
    //Set mechanic isOnline
    socket.on('mechanicIsOnline', data => {
        let { id, isOnline } = data
        if (id) {
            Mechanic.findByIdAndUpdate(id, { $set: { isOnline: isOnline } }, { new: true }).populate('membership')
                .populate('reviews.user').exec((err, doc) => {
                    if (err) {
                        let response = {
                            message: "Failed",
                            data: err,
                            id
                        }
                        client.emit('isOnline', response)
                    }
                    else {
                        let response = {
                            message: "Success",
                            data: doc,
                            id
                        }
                        client.emit('isOnline', response)
                    }
                })
        } else {
            let response = {
                message: "Failed",
                data: "Mechanic can not be null"
            }
            client.emit('isOnline', response)
        }
    })
    //No response by mechanic,, then user app must call this socket
    socket.on('noResponseUser', data => {
        let { id } = data
        if (id) {
            Order.findByIdAndUpdate(id, { status: "noResponse" }, { new: true }).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err,
                        id
                    }
                    client.emit('noresponse', response)
                }
                else {
                    let response = {
                        message: "Success",
                        data: doc,
                        id
                    }
                    client.emit('noresponse', response)
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order can not be null"
            }
            client.emit('noresponse', response)
        }
    })

    //Read message
    socket.on('readMessages', data => {
        let { id, messageSender } = data
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err
                    }
                    client.emit('messagesRead', response)
                }
                else {
                    let { messages } = doc
                    if (messages.length > 0) {
                        let newMessages = messages.map((message) => {
                            if (message.messageSender === messageSender) {
                                message.isRead = true
                                return message
                            } else return message
                        })
                        Order.findByIdAndUpdate(id, {
                            messages: newMessages
                        }, {
                            new: true
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
                                let response = {
                                    message: "Failed",
                                    data: error
                                }
                                client.emit('messagesRead', response)
                            }
                            else {
                                let response = {
                                    message: "Success",
                                    data: updated,
                                    id
                                }
                                client.emit('messagesRead', response)
                            }
                        })
                    }
                    else {
                        let response = {
                            message: "Success",
                            data: doc,
                            id
                        }
                        client.emit('messagesRead', response)
                    }
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Order and message sender can not be null"
            }
            client.emit('messagesRead', response)
        }
    })

    //Schedule Read message
    socket.on('readScheduleMessages', data => {
        let { id, messageSender } = data
        if (id && messageSender) {
            Schedules.findById(id).populate([
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
            ]).exec((err, doc) => {
                if (err) {
                    let response = {
                        message: "Failed",
                        data: err
                    }
                    client.emit('scheduleMessagesRead', response)
                }
                else {
                    let { messages } = doc
                    if (messages.length > 0) {
                        let newMessages = messages.map((message) => {
                            if (message.messageSender === messageSender) {
                                message.isRead = true
                                return message
                            } else return message
                        })
                        Schedules.findByIdAndUpdate(id, {
                            messages: newMessages
                        }, {
                            new: true
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
                                let response = {
                                    message: "Failed",
                                    data: error
                                }
                                client.emit('scheduleMessagesRead', response)
                            }
                            else {
                                let response = {
                                    message: "Success",
                                    data: updated,
                                    id
                                }
                                client.emit('scheduleMessagesRead', response)
                            }
                        })
                    }
                    else {
                        let response = {
                            message: "Success",
                            data: doc,
                            id
                        }
                        client.emit('scheduleMessagesRead', response)
                    }
                }
            })
        } else {
            let response = {
                message: "Failed",
                data: "Schedule and message sender can not be null"
            }
            client.emit('scheduleMessagesRead', response)
        }
    })
});

//Upload Audio/Image/File for message
app.post('/api/uploadFile', upload.single('fileData'), (req, res) => {    //tested
    //below code will read the data from the upload folder. Multer will automatically upload the file in that folder with an  autogenerated name
    fs.readFile(req.file.path, (err, contents) => {
        if (err) {
            return res.json(handleErr(err))
        } else {
            let response = {
                filePath: req.file.filename
            }
            return res.json(handleSuccess(response))
        }
    });
})

//Get File
app.get('/api/getFile:path', (req, res) => {
    try {
        var file = __dirname + '/../techfinderfiles/' + req.params.path;

        var filename = path.basename(file);
        var mimetype = mime.getType(file);

        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', mimetype);

        var filestream = fs.createReadStream(file);
        filestream.pipe(res);
    } catch (error) {
        return res.json(handleErr(error))
    }
})

//Delete a file
app.delete('/api/deleteFile', async (req, res) => {
    if (req.body.filename) {
        let { filename } = req.body
        try {
            deleteFile(filename)
            return res.json(handleSuccess('Done'))
        } catch (error) {
            return res.json(handleErr(error))
        }
    } else {
        return res.json(handleErr('File can not be null'))
    }
})

app.post('/api/sendOtp', sendOtp, (req, res) => {
    return res.json(handleSuccess(req.result))
})
//Verify OTP
app.post('/api/verifyOTP', (req, res) => {
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
//Cron job for new order on schedule
cron.schedule('0-59 * * * *', () => {
    //Find Schedule with status accepted and scheduled date greater or equal to current time.
    // console.log('every minute->', new Date())
    let data = {
        current: new Date().toISOString()
    }
    client.emit('currentTime', data)
    Schedules.find({
        status: "accepted",
        scheduledDate: { $gte: new Date().toISOString() }
    }).exec((err, docs) => {
        if (err) {
            console.log('err->', err)
        }
        else {
            if (docs.length > 0) {
                //iterate over orders and create orders
                console.log('docs->', docs.length)
                docs.forEach((schedule) => {
                    if (schedule.scheduledDate) {
                        let difference = diffMinutes(schedule.scheduledDate)
                        difference += 1
                        console.log('difference->', difference)
                        if (difference === 1) { //if difference is equals to 1, order is created
                            let obj = {
                                mechanic: schedule.mechanic,
                                customer: schedule.customer,
                                vehicle: schedule.vehicle,
                                customerDescription: schedule.customerDescription,
                                customerLocation: schedule.customerLocation,
                                status: "travelling",
                                orderId: uid(8)
                            }
                            Order.create(obj, (error, order) => {   //create order for schedule
                                if (error) {
                                    console.log('Error in order', error)
                                }
                                else {
                                    console.log('order created->', order)
                                    Order.populate(order, [
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
                                    ], (er, orderData) => {
                                        if (er) {
                                            let response = {
                                                message: "Failed",
                                                data: er,
                                                customer: schedule.customer
                                            }
                                            client.emit('scheduleOrderCreated', response)      //Send response to user that mechanic has an activ order
                                        }
                                        else {
                                            //Update schedule status to complete if order is created
                                            let id = schedule._id
                                            Schedules.findByIdAndUpdate(id, {
                                                status: "completed"
                                            },
                                                { new: true }
                                                , (errr, sch) => {
                                                    if (errr) {
                                                        console.log('could not complete schedule', errr)
                                                    } else {
                                                        //Status of schedule is updated and order is crewated then order data is sent by socket
                                                        let response = {
                                                            message: "Success",
                                                            data: orderData,
                                                        }
                                                        client.emit('scheduleOrderStarted', response) //Order created response for user 
                                                        client.emit('scheduleOrderCreated', response) //order request for driver

                                                        //Also send notification and email
                                                    }
                                                })
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
})

app.post('/api/sockkettt',(req,res)=>{
    if(req.body.longitude && req.body.latitude){
        let response = {
            longitude:req.body.longitude,
            latitude:req.body.latitude,
            messages:"Success"
        }
        console.log('values->',response)
        client.emit('newLocationReceived',response)
        return res.json(handleSuccess('sjdfs'))
    }else{
        let response = {
            messages:"Failed"
        }
        client.emit('newLocationReceived',response)
        return res.json(handleErr('fsodhf'))
    }
})

//Send email TS
app.post('/api/sendEmail',sendEmailTS,(req,res)=>{
    return res.json(handleSuccess('SENT'))
})

console.log('current->', new Date())
//Server
server.listen(port, () => {
    console.log('Server started on port: ', port)
})