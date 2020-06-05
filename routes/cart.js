let express = require('express');
let Books = require('../models/books');
let Categories = require('../models/categories');
let Account = require('../models/account');
let router = express.Router();

router.get('/',(req,res)=>{
  if (req.user) {
    let cats = Categories.find({}).exec();
    Books.find({},(err,books)=>{
      if (err) throw err;
      cats.then((d)=>{ res.render('cart', {user: req.user,title:"Cart",categories:d,products:books}) })
    });
  }else{
    let cats = Categories.find({}).exec();
    if(!req.session.cart)req.session.cart = [];
    Books.find({},(err,books)=>{
      cats.then((d)=>{
        res.render('cart', {user: req.user,title:"Cart",categories:d,products:books,cart:req.session.cart})
      })
    });
  }
});

router.get('/add/:id',(req,res)=>{
  if (req.user){
    Account.findOne({_id:req.user._id},(err,data)=>{
      if (err) throw err;
      data['cart'].push(req.params.id);
      Account.updateMany({_id:req.user._id},{cart:data['cart']},(err)=>{
        if (err) throw err;
        res.redirect('/cart') ;
      })
    });
  }else {
    if (req.session.cart){
      req.session.cart.push(req.params.id);
      res.redirect('/cart')
    }else{
      req.session.cart = [];
      req.session.cart.push(req.params.id);
      res.redirect('/cart')
    }
  }
});

router.get('/empty',(req,res)=>{
  if (req.user){
    Account.updateMany({_id : req.user._id},{cart:[]},(err)=>{
      if (err) throw err;
      res.redirect('/cart');
    })
  }else {
    req.session.cart = []
    res.redirect('/cart');
  }

});

router.get('/delete/:id',(req,res)=>{
  if (req.user){
    Account.findOne({_id:req.user._id},(err,data)=>{
      if (err) throw err;
      data['cart'].pop(req.params.id);
      Account.updateMany({_id:req.user._id},{cart:data['cart']},(err)=>{
        if (err) throw err;
        res.redirect('/cart') ;
      })
    })
  }else {
    if(req.session.cart.indexOf(req.params.id) >0){
      req.session.cart.pop(req.params.id);
      res.redirect('/cart')
    }else{
      res.redirect('/cart')
    }
  }
});
module.exports = router;