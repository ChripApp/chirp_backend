var mongoose = require('mongoose');

var customerSchema =  mongoose.Schema({
  store:  {type: String, required: true},
  phoneNumber:   {type: String, required: true},
  sitting: {type: Number, required: true},
});

var Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;