let express = require('express');
let passport = require('passport');
let Account = require('../models/account');
let Books = require('../models/books');
let Categories = require('../models/categories');
let Comments = require('../models/comments');
let async = require('async');
let nodemailer = require('nodemailer');
let crypto = require('crypto');
let router = express.Router();


router.get('/', function (req, res) {
  let categories = Categories.find({}).exec();
  Books.find({},null,{sort:{view:'desc'}},(err,data)=>{
    if (err) throw err;
    categories.then((d)=>{
      res.render('index',{books:data,user:req.user,title:'My Ecommerce',categories:d})
    });
  })
});

router.get('/register', function(req, res) {
    if(!req.user){
      let cats = Categories.find({}).exec();
        cats.then((d)=>{
          res.render('register', {title:"Register",categories:d});
        });
    }else{
        res.redirect('/')
    }
});

router.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username , level:'member' , cart:[] , address:req.body.address ,email:req.body.email }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { account : account , title:"Register" , error:err});
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/adduser', function(req, res) {
  if(req.user){
    let cats = Categories.find({}).exec();
    cats.then((d)=>{
      res.render('register', {title:"Add User",categories:d});
    });
  }else{
    res.redirect('/')
  }
});

router.post('/adduser', function(req, res) {
  Account.register(new Account({ username : req.body.username , level:'admin' , cart:[] , address:req.body.address , email:req.body.email}), req.body.password, function(err, account) {
    if (err) {
      return res.render('register', { account : account , title:"Add User" , error:err});
    }

    passport.authenticate('local')(req, res, function () {
      res.redirect('/');
    });
  });
});

router.get('/login', function(req, res) {
    if(!req.user){
        let cats = Categories.find({}).exec();
        cats.then((d)=>{
          res.render('login', { user : req.user, message : req.flash('error') , title:"Login",categories:d,query:req.query});
        });
    }else{
        res.redirect('/')
    }
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function(req, res) {
    res.redirect('/');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/search',(req,res)=>{
  let categories = Categories.find({}).exec();
  Books.find({title:`/${req.query.q}/i`},(err,data)=>{
    if (err)throw err;
    categories.then((d)=>{
      res.render('index',{books:data,user:req.user,title:`Search Results for ${req.query.q}`,categories:d})
    });
  })
});

router.get('/addfavorite/:id',(req,res)=>{
  if (req.user){
    for(let favo of req.user.favorite){
      if (favo == req.params.id){
        res.redirect(`/books/details/${req.params.id}`)
      }
    }
    req.user.favorite.push(req.params.id);
    Account.updateMany({_id:req.user.id},{favorite:req.user.favorite},(err)=>{
      if (err) throw err;
      res.redirect(`/books/details/${req.params.id}?addfavorite=true`)
    })
  }else{
    res.redirect('/login?shouldLogin=true')
  }
});

router.get('/removefavorite/:id',(req,res)=>{
  if (req.user){
    try {
      req.user.favorite.pop(req.params.id);
    }catch (e) {
     res.redirect(`/books/details/${req.params.id}`)
    }
    Account.updateMany({_id:req.user.id},{favorite:req.user.favorite},(err)=>{
      if (err) throw err;

      if (req.query.favoriteList){
        res.redirect(`/profile/favorites`)
      }else{
        res.redirect(`/books/details/${req.params.id}?removefavorite=true`)
      }
    })
  }else{
    res.redirect('/login?shouldLogin=true')
  }
});

router.get('/forgot',(req,res)=>{
  let categories = Categories.find({}).exec();
  categories.then((c)=>{
    res.render('forgot',{user:req.user,title:"Forgot Password",categories:c,error:req.flash('error'),success:req.flash('success')})
  })
});

router.post('/forgot',(req,res)=>{
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      Account.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        host:"smtp.gmail.com",
        auth: {
          user: 'h.r.hassani2005@gmail.com',
          pass: 'Faslfasl2005'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'h.r.hassani2005@gmail.com',
        subject: `My Eccomerce Password Reset`,
        html: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            // `http://' + req.headers.host + '/reset/' + token + '\n\n` +
            `<a href="http://${req.headers.host}/reset/${token}">Click Here</a>\n\n` +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) throw err;
    res.redirect('/forgot');
  });
});


router.get('/reset/:token', function(req, res) {
  Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    let categories = Categories.find({}).exec();
    categories.then((c)=>{
      res.render('reset', {token: req.params.token,user:req.user,title:"reset",categories:c,error:req.flash('error'),success:req.flash('success')});
    });
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      Account.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
          req.flash("error", "Passwords do not match.");
          return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        host:"smtp.gmail.com",
        auth: {
          user: 'h.r.hassani2005@gmail.com',
          pass: 'Faslfasl2005'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'h.r.hassani2005@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

module.exports = router;