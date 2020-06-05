let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let passportLocalMongoose = require('passport-local-mongoose');

let Account = new Schema({
    username: String,
    password: String,
    level:String,
    cart:Array,
    address:String,
    favorite:Array,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastViewed:Array
});

Account.plugin(passportLocalMongoose);


module.exports = mongoose.model('accounts', Account);