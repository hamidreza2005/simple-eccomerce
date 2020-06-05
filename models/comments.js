let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let date = new Date();

let comments = new Schema({
  sender:String,
  content:String,
  date:{type:String,default:`${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`},
  'for':String,
  accepted:Boolean
});


module.exports = mongoose.model('Comments',comments);