var mongoose = require('mongoose');

var storeSchema = mongoose.Schema({
  owner:  {type: String, required: true},
  queue: [{ 
  	time: Number, 
  	customer: String }],
  name:   {type: String, required: true},
  description: String,
  cap: String
});

var Store = mongoose.model('Store', storeSchema);

module.exports = Store;