let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let categories = new Schema({
  name:String
});

module.exports = mongoose.model('Categories',categories);