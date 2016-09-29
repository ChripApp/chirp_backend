var mongoose = require('mongoose');

var customerSchema =  mongoose.Schema({
  store:  {type: String, required: true},
  phoneNumber:   {type: String, required: true},
  seats: {type: Number, required: true},
});

customerSchema.methods.enqueue = function(store, phoneNumber, seats) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

var Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;