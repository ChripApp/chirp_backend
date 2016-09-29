var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;

var mongoose = require('mongoose');
var User = require("./models/User.js");
var Store = require("./models/Store.js");
var Customer = require("./models/Customer.js");
var MessageService = require("./models/MessageService.js");
var Schema = mongoose.Schema;

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended':false}));


var client = require('twilio')('AC91d8f9bd5c59b01a1cd95ae6cadec297', 'b1ca6c55b41d871c09781a291160779b');


var jwt = require('jsonwebtoken');



mongoose.connect('mongodb://localhost:27017/test');
var db = mongoose.connection;
db.once('open', function() {
  // we're connected!
  console.log("Mongo Connected");
 
})






// Create(Register) a Store
// Input: Owner ID, Store Name, Store Description
// Output: Success
app.get('/store/create', function (req, res) {
   var newStore = new Store({
      'owner':"57e41abb2fb58e89482b3c29",
      'name': "Boiling Point",
      'description': "Stinky Tofu smells like shit, seriously",
   });

   newStore.save(function(err, user){
     if (err){
        console.log(err);
     }else{
        console.log(user);  
     }
   });

});

// Remove a Customer from a Store's Queue::
// Input: Store ID, Customer ID
// Output: Success
app.post('/store/dequeue', function (req, res) {
	Store.findOneAndUpdate(
      { _id: req.body.store },
      {
        $pull: {
          queue: {
            customer: req.body.customer
          }
        },
        $push: {
          doneQueue: {
            $each: [ {time: Date.now(), customer: req.body.customer } ],
            $sort: { time: 1 }
          }
        }
      }, function(err, store) {
      if (err){
        console.log(err);
        return;
      }
      client.sendMessage({
            to: req.body.phoneNumber,
            from: '+19493834024',
            body: 'from ' + store.name + ': Your turn',
        }, function(err, responseData) { 
      });

      //New service
      MessageService.findOne({ store: store._id, phoneNumber: req.body.phoneNumber }, function(err, service){
         console.log(service);
         if (err){
          console.log(err);
         }else if(service == null){
            console.log("here");
            MessageService.count({ phoneNumber: req.body.phoneNumber }, function(err, count) {
              if(err){
                console.log(err);
              }else{
                console.log("yo" + count);
                var newId = 'A' + count;
                var newService = new MessageService({
                  'phoneNumber': req.body.phoneNumber,
                  'id': newId,
                  'store': store._id,
                });
                newService.save(function(err, service){
                 if (err){
                  console.log(err);
                 }else{
                      client.sendMessage({
                          to: req.body.phoneNumber, 
                          from: '+19493834024',
                          body: 'Hey there! Thank you for visiting ' + store.name + '. Your ID is ' + service.id + '. If you want to reserve your seats remotely, please send ' + service.id + ' to me.',
                      }, function(err, responseData) { 
                      });
                 }
               });
              }
            });
         }
      });

      Store.findOne({ _id: req.body.store }, function(err, store) {
          if (err){
            console.log(err);
            return ;
          }
          res.json({
              success: true,
              store: store
          });
      });
  });    

});


// Put Customer to a Store's Queue::
// Input: Store ID, Customer Phone Number, Sitting Info
// Output: Success
app.post('/store/enqueue', function (req, res) {

   var newCustomer = new Customer({
      'store': req.body.store,
      'phoneNumber': req.body.phoneNumber,
      'seats': req.body.seats,
   });

    
   newCustomer.save(function(err, customer){
     if (err){
        console.log(err);
     }else{
      console.log(customer);
       Store.findOneAndUpdate(
        { _id: req.body.store },
        {
          $push: {
            queue: {
              $each: [ {time: Date.now(), customer: customer._id } ],
              $sort: { time: 1 }
            }
          }
        }, function(err, store) {
        if (err){
          return;
        }
        client.sendMessage({
              to: req.body.phoneNumber, 
              from: '+19493834024',
              body: 'Confirmation: [' + store.name + ": " + req.body.seats + " Seats]. There are " + store.queue.length + " groups remaining",
          }, function(err, responseData) { //this function is executed when a response is received from Twilio   
        });
        Store.findOne({ _id: req.body.store }, function(err, store) {
            if (err){
              console.log(err);
              return ;
            } 
            res.json({
                success: true,
                store: store
            });
        });
    }); 
     }
   });
});


// Get store::
// Input: Store ID
// Output: Store object
app.post('/store/getstore', function (req, res) {
   Store.findOne({ _id: req.body.store }, function(err, store) {
	    if (err){
        console.log(err);
        return ;
      }
      res.json({
          success: true,
          store: store
      });
	});
});

// Get a Customer
// Input: Customer ID
// Output: Customer Object
app.post('/store/getcustomer', function (req, res) {
   Customer.findOne({ _id: req.body.customer }, function(err, customer) {
	    if (err){
      }else{
        res.json({
          success: true,
          customer: customer
        });
      }
	});
});

// Get My Stores
// Input: Owner ID
// Output: Store Objects
app.post('/user/mystore', function (req, res) {
   Store.find({ owner: req.body.owner }, function(err, stores) {
	    if (err) throw err;
	    console.log(stores);
	    res.json({
	    	success: true,
	    	stores: stores
	    });
	});
});

// Sign Up
// Input: Username, Password, First Name, Last Name, Phone Number
// Output: Success
app.post('/user/signup', function (req, res) {
    var newUser = new User({
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
   });
   newUser.save(
   function(err, user) {
     if (err){
        console.log(err);
     }else{
        var newStore = new Store({
            'owner': user._id,
            'name': req.body.storeName
         });
         newStore.save(
           function(err, store) {
           if (err){
              console.log(err);
           }else{
              var token = jwt.sign(user, 'chirpBest');
              user.password = null;
              user._id = null;
              user.messageService = null;
              res.json({
                success: true,
                token: token,
                user: user,
                store: store
              });
           }
         });
        
     }
   });
   
});

// Sign In
// Input: Username, Password
// Output: Success, User Object
app.post('/user/signin', function (req, res) {
     User.findOne({ phoneNumber: req.body.phoneNumber }, function(err, user){
	    if (err || !user){
        res.status(500).send({
           error: "phoneNumberNotExist" 
        });
      }else{
        user.comparePassword(req.body.password, function(err, isMatch) {
            if (err){
                console.log(err);
                return;
            }
            Store.findOne({ owner: user._id }, function(err, store) {
              if (err){
                console.log(err);
              }else{
                  var token = jwt.sign(user, 'chirpBest');
                  user.password = null;
                  user._id = null;
                  user.messageService = null;
                  res.json({
                    success: true,
                    token: token,
                    user: user,
                    store: store
                  });
              }
            });
        });
      }
    });

});


app.post('/user/autoSignin', function (req, res) {
   jwt.verify(req.body.token, 'chirpBest', function(err, decoded) {
	    User.findOne({ phoneNumber: decoded._doc.phoneNumber }, function(err, user) {
        if (err){
            console.log(err);
            return;
        }
		    Store.findOne({ owner: user._id }, function(err, store) {
          if (err){
            console.log(err);
          }else{
              if(decoded._doc.password == user.password){
              var token = jwt.sign(user, 'chirpBest');
              user.password = null;
              user._id = null;
              user.messageService = null;
              res.json({
                success: true,
                token: token,
                user: user,
                store: store
              });
            }
          }
        });
		  });
   });
});
app.get('/message/newService', function (req, res) {
  // client.sendMessage({
  //     to: '+19497691177', 
  //     from: '+19493834024',
  //     body: 'Hey there! Thank you for visiting Boiling Point. Your ID is A1. If you want to reserve your seats remotely, please send 123 to me.',
  // }, function(err, responseData) { //this function is executed when a response is received from Twilio   
  //     res.json(err);
  // });
    var newService = new MessageService({
      'phoneNumber': '+19493318838',
      'id': 'A1',
      'store': '57e9a46ff9de89b6eb481600',
    });
    newService.save(function(err, service){
     if (err){
      console.log(err);
     }else{
        console.log(service);
        res.json({
          success: true
      });
     }
   });
});
app.post('/message/mailbox', function (req, res) {
   //console.log(req.body);
   var content = req.body.Body;
   var phoneNumber = req.body.From;
   if(!isNaN(content)){
      User.findOne({ phoneNumber: phoneNumber }, function(err, user) {
        if (err) throw err;
        var selector = {};
        Store.findOne({ _id: user.messageService.store }, function(err, store) {
              selector['messageService'] = {
                store: store._id,
                seats: content,
                status: 'ready'
               };
              User.update(
                { phoneNumber: phoneNumber },
                {
                  $set: selector
                },
                function(err, user) {
                client.sendMessage({
                      to: phoneNumber, 
                      from: '+19493834024',
                      body: '[' + store.name + '][' + content + ' Seats]. To confirm this seats, please send Y',
                  }, function(err, responseData) { //this function is executed when a response is received from Twilio   
                });
             }); 
        });
      });
   }else{

        switch(content){
          case 'Y':
          User.findOne({ phoneNumber: phoneNumber }, function(err, user) {
            if (err) throw err;
            if(user.messageService.status == 'ready'){
                var newCustomer = new Customer({
                    'store': user.messageService.store,
                    'phoneNumber': phoneNumber,
                    'seats': user.messageService.seats,
                 }); 
                 newCustomer.save(function(err, customer){
                   if (err){
                      console.log(err);
                   }else{
                     Store.findOneAndUpdate(
                      { _id: user.messageService.store },
                      {
                        $push: {
                          queue: {
                            $each: [ {time: Date.now(), customer: customer._id } ],
                            $sort: { time: 1 }
                          }
                        }
                      }, function(err, store) {
                      if (err){
                        console.log(err);
                        return;
                      }

                      client.sendMessage({
                            to: phoneNumber, 
                            from: '+19493834024',
                            body: 'Confirmation: [' + store.name + ": " + user.messageService.seats + " Seats]. There are " + store.queue.length + " groups remaining",
                        }, function(err, responseData) { 
                            if (!err) { 
                            }
                      });
                      
                  }); 
                   }
                 });
            }
          });
          break;
          default: 
          var selector = {};
          MessageService.findOne({ phoneNumber: phoneNumber, id: content }, function(err, service) {
              Store.findOne({ _id: service.store }, function(err, store) {
                  selector['messageService'] = {
                    store: store._id,
                    status: 'notReady'
                   };
                  User.update(
                    { phoneNumber: phoneNumber },
                    {
                      $set: selector
                    },
                    function(err, user) {
                    console.log(err);
                    var remaining = store.queue ? store.queue.length : 0;
                    client.sendMessage({
                          to: phoneNumber, 
                          from: '+19493834024',
                          body: 'Welcome back to ' + store.name + '! We have now ' + remaining + ' groups waiting. How many seats you want?',
                      }, function(err, responseData) { //this function is executed when a response is received from Twilio
                          if (!err) { // "err" is an error received during the request, if any
                          }
                    });

                 }); 
              });
              
          });
        }
      
   }
});




var server = app.listen(8080, function() {
      var port = server.address().port;
      console.log("Started server at port", port);
      console.log("Started at ", new Date().toUTCString());
 });