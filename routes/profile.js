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

router.get('/',(req,res)=>{
  if(req.user){
    let cats = Categories.find({}).exec();
    if (req.user.level == 'admin'){
      Books.find({},(err,books)=>{
        if (err) throw err;
        cats.then((d)=>{
          res.render('Profile/profile', {title:"Profile",user:req.user,books:books,categories:d});
        });
      })
    }else{
      cats.then((d)=>{
        res.render('Profile/profile', {title:"Profile",user:req.user,categories:d});
      });
    }
  }else{
    res.redirect('/')
  }
});

router.get('/favorites',(req,res)=>{
  if (req.user){
    let cats = Categories.find({}).exec();
    Books.find({},(err,books)=>{

      cats.then((d)=>{
        res.render('Profile/favorites',{title:"Favorites",categories:d,books:books,user:req.user})
      })

    });

  }else{
    res.redirect('/login?shouldLogin=true');
  }
});

router.get('/mycomments',(req,res)=>{
  if (req.user){
    let cats = Categories.find({}).exec();
    let books_data = Books.find({}).exec();

    Comments.find({sender:req.user.username},(err,data)=>{
      if (err) throw err;
      cats.then(c=>{
        books_data.then(b=>{
          res.render('Profile/mycomments',{user:req.user,title:'My Comments',books:b,categories:c,comments:data,query:req.query})
        })
      })
    })

  }else{
    res.redirect('/login?shouldLogin=true');
  }
});

router.get('/commentmanagement/all',(req,res)=>{
  if (req.user && req.user.level === 'admin'){
    let cats = Categories.find({}).exec();
    let books_data = Books.find({}).exec();
    Comments.find({},(err,data)=>{
      if (err) throw err;
      cats.then(c=>{
        books_data.then(b=>{
          res.render('Profile/comment_management',{user:req.user,title:'Comment Management-All',books:b,categories:c,comments:data,query:req.query})
        })
      })
    })
  }else{
    res.redirect('/profile');
  }
});

router.get('/commentmanagement/noaccepted',(req,res)=>{
  if (req.user && req.user.level === 'admin'){
    let cats = Categories.find({}).exec();
    let books_data = Books.find({}).exec();
    Comments.find({accepted:false},(err,data)=>{
      if (err) throw err;
      cats.then(c=>{
        books_data.then(b=>{
          res.render('Profile/comment_management',{user:req.user,title:'Comment Management-No Accepted',books:b,categories:c,comments:data,query:req.query})
        })
      })
    })
  }else{
    res.redirect('/profile');
  }
});

router.post('/commentmanagement/acceptall',(req,res)=>{
  if (req.user && req.user.level === 'admin'){
    Comments.updateMany({accepted:false},{accepted:true},err=>{
      if (err) throw err;
      res.redirect('/profile/commentmanagement/noaccepted?allAccepted=true')
    })
  }else{
    res.redirect('/profile');
  }
});

router.get('/resetpassword',(req,res)=>{
  if (req.user){
    let categories = Categories.find({}).exec();
    categories.then((c)=>{
      res.render('profile/resetpassword', {token: req.params.token,user:req.user,title:"reset",categories:c,error:req.flash('error'),success:req.flash('success')});
    });
  }else{
    res.redirect('/profile')
  }
});


router.post('/resetpassword', function(req, res) {
  async.waterfall([
    function(done) {
      Account.findOne({_id:req.user.id}, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/profile/resetpassword');
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
          return res.redirect('/profile/resetpassword');
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