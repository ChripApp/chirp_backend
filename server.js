var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;

var mongoose = require('mongoose');
var User = require("./models/User.js");
var Store = require("./models/Store.js");
var Customer = require("./models/Customer.js");
var Schema = mongoose.Schema;


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
      'owner':"57e0ea3f93df9c70a7a2299e",
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
app.get('/store/dequeue', function (req, res) {
	Store.update(
	   	{ _id: '57e0ee336ad25670ba65336d' },
	  	{
	  		$pull: {
	   			queue: {
	   				customer: '57e0f7561c99bf71094a00a5'
				}
	   		}
	   	}, function(err, store) {
	    if (err) throw err;
      
	    console.log(store);
	});    

});


// Put Customer to a Store's Queue::
// Input: Store ID, Customer Phone Number, Sitting Info
// Output: Success
app.get('/store/enqueue', function (req, res) {
   //Input: store id, phone number, sitting

   var newCustomer = new Customer({
   	  'store': '57e0ee336ad25670ba65336d',
      'phoneNumber': '949-' + Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10)
      + '-' + Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10)+ Math.floor(Math.random() * 10)+ Math.floor(Math.random() * 10),
      'sitting': 2 + Math.floor(Math.random() * 10),
   });

   var selector = {};
   selector['stores.' + '57e0ee336ad25670ba65336c'] = true;
   selector['phoneNumber'] = '949-331-8837';

   //We track visited stores for the future
   User.update(
	   	{ phoneNumber: '949-331-8837' },
	  	{
	  		$set: selector
	   	},
	   	{ upsert : true },
	   	function(err, user) {
	    if (err) throw err;
      
	    console.log(user);
   }); 
   newCustomer.save(function(err, customer){
     if (err){
        console.log(err);
     }else{
     	console.log(customer);
	     Store.update(
	   		{ _id: '57e0ee336ad25670ba65336d' },
	   		{
	   			$push: {
	   				queue: {
	   					$each: [ {time: Date.now(), customer: customer._id } ],
	   					$sort: { time: -1 }
	   				}
	   			}
	   		}, function(err, store) {
		    if (err) throw err;

		    console.log(store);
		}); 
     }
   });
});


// Get store::
// Input: Store ID
// Output: Store object
app.get('/user/getstore', function (req, res) {
   Store.findOne({ _id: '57e0ee336ad25670ba65336d' }, function(err, store) {
	    if (err) throw err;

	    console.log(store);
	});
});

// Get a Customer
// Input: Customer ID
// Output: Customer Object
app.get('/store/getcustomer', function (req, res) {
   Customer.findOne({ _id: '57e0f7541c99bf71094a00a3' }, function(err, customer) {
	    if (err) throw err;

	    console.log(customer);
	});
});

// Get My Stores
// Input: Owner ID
// Output: Store Objects
app.get('/user/mystore', function (req, res) {
   Store.find({ owner: '57e0ea3f93df9c70a7a2299e' }, function(err, stores) {
	    if (err) throw err;

	    console.log(stores);
	});
});

// Sign Up
// Input: Username, Password, First Name, Last Name, Phone Number
// Output: Success
app.get('/user/signup', function (req, res) {
   var newUser = new User({
      'username':"jun@usc.edu",
      'password': "123",
      'firstName': "Jun Suh",
      'lastName': "Lee",
   });
   newUser.save(function(err, user){
     if (err){
        console.log(err);
     }else{
        console.log(user);  
     }
   });

});

// Sign In
// Input: Username, Password
// Output: Success, User Object
app.get('/user/signin', function (req, res) {
   User.findOne({ username: 'jun@usc.edu' }, function(err, user) {
	    if (err) throw err;

	    // test a matching password
	    user.comparePassword('123', function(err, isMatch) {
	        if (err) throw err;
	        console.log('123:', isMatch); // -&gt; Password123: true
	    });

	    // test a failing password
	    user.comparePassword('1414', function(err, isMatch) {
	        if (err) throw err;
	        console.log('1414:', isMatch); // -&gt; 123Password: false
	    });
	});

});





var server = app.listen(8080, function() {
      var port = server.address().port;
      console.log("Started server at port", port);
      console.log("Started at ", new Date().toUTCString());
 });