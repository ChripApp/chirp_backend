var mongoose = require('mongoose');

var storeSchema = mongoose.Schema({
  owner:  {type: String, required: true},
  queue: [{ 
  	time: Number, 
  	customer: String }],
  doneQueue: [{ 
  	time: Number, 
  	customer: String }],
  name:   {type: String, required: true},
  description: String,
  cap: String,
  waiting: Number,
});

var Store = mongoose.model('Store', storeSchema);

module.exports = Store;