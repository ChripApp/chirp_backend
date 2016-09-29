var mongoose = require('mongoose');

var messageServiceSchema =  mongoose.Schema({
  phoneNumber:  {type: String, required: true},
  id:   {type: String, required: true},
  store: {type: String, required: true},
});

var MessageService = mongoose.model('MessageService', messageServiceSchema);

module.exports = MessageService;