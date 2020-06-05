// dependencies
let express = require('express');
let path = require('path');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let flash = require('connect-flash');
let session = require('express-session');
let Mongo_store = require('connect-mongodb-session')(session);

let categories_model = require('./models/categories');

let routes = require('./routes/index');
let books = require('./routes/books');
let categories = require('./routes/categories');
let cart = require('./routes/cart');
let profile_route = require('./routes/profile');
let comments = require('./routes/comments');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.locals={
  app_title:"My Ecommerce"
};

let store = new Mongo_store({
  uri: 'mongodb://localhost:27017/ecommerce',
  collection: 'mySessions'
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store:store,
  maxAge: Date.now() + (30 * 86400 * 1000)
}));
app.use(passport.initialize());
app.use(flash());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/',routes);
app.use('/books',books);
app.use('/categories',categories);
app.use('/cart',cart);
app.use('/profile',profile_route);
app.use('/comments',comments);

// passport config
let Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// mongoose
mongoose.connect('mongodb://localhost:27017/ecommerce',{useNewUrlParser: true,useUnifiedTopology: true});
mongoose.connection.on('error',()=>{console.log('Error in connect to mongodb')});
mongoose.connection.on('connection',()=>{console.log('mongodb connected :)')});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    let y = categories_model.find({}).exec();

    y.then((d)=>{

      res.render('error', {
        message: err.message,
        error: err,
        title:"ERROR :(",
        user:req.user,
        categories:d
      });

    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  let y = categories_model.find({}).exec();
  y.then((d)=>{

    res.render('error', {
      message: err.message,
      error: {},
      title:"Error :(",
      user:req.user,
      categories:d
    });

  });
});


module.exports = app;