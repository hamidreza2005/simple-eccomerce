let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Books = new Schema({
  title:String,
  description:String,
  view:{type:String,default:0},
  publisher:String,
  cover:String,
  price:Number,
  category:String
});

module.exports = mongoose.model('Books',Books);