var mongoose = require('mongoose'),
	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10;


var userSchema = mongoose.Schema({
  firstName:  {type: String, required: true},
  lastName:   {type: String, required: true},
  password:  {type: String, required: true},
  phoneNumber: {type: String, required: true, index: { unique: true }},
  username: {type: String},
  messageService: {
  	store: String,
  	seats: Number,
  	status: String,
  },
  stores: mongoose.Schema.Types.Mixed
});

userSchema.pre('save', function(next) {
    var user = this;

// only hash the password if it has been modified (or is new)
if (!user.isModified('password')) return next();

// generate a salt
bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) return next(err);

        // override the cleartext password with the hashed one
        user.password = hash;
        next();
    });
});


});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

var User = mongoose.model('User', userSchema);

module.exports = User;