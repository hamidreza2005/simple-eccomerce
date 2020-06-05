let express = require('express');
let router = express.Router();
let {check , validationResult}= require('express-validator');
let Category = require('../models/categories');
let Books = require('../models/books');

/* GET users listing. */

router.get('/details/:category',(req,res)=>{
  let cats = Category.find({}).exec();
  let category = req.params.category;
  Books.find({category:category},(err,books)=>{
    if (err) throw err;
    if (!books){
      res.redirect('/error')
    }else{
      cats.then((d)=>{ res.render('index',{books:books,user:req.user,title:category,categories:d})});
    }
  })
});

router.get('/add',(req,res)=>{
  if (req.user.level == 'admin') {
    let cats = Category.find({}).exec();
    cats.then((d)=>{ res.render('category/add', {user: req.user, title: "Add Category",categories:d}) })
  }else{
    res.redirect('/')
  }
});

router.post('/add',[check('name').not().isEmpty().withMessage('Category must have name.')],(req,res)=>{
  const errors = validationResult(req);
  if (!errors.isEmpty()){
    res.render('category/add',{user: req.user, title: "Add Category",error:errors.array()})
  }else {
    new Category({name:req.body.name}).save((err)=>{
      if (err)throw err;
      res.redirect('/profile')
    })
  }
});

router.get('/delete/:id',(req,res)=>{
  if (req.user.level == 'admin'){
    Category.deleteMany({_id:req.params.id},(err)=>{
      if (err) throw err;
      res.redirect('/profile')
    })
  }else{
    res.redirect('/')
  }
});

router.get('/edit/:id',(req,res)=>{
  if (req.user.level == 'admin') {
    let cats = Category.find({}).exec();
    cats.then((d)=>{ res.render('category/add', {user: req.user, title: "Edit Category" , id:req.params.id,categories:d}) })

  }else{
    res.redirect('/')
  }
});

router.post('/edit/:id',(req,res)=>{

  if (req.user.level == 'admin') {
    Category.findOneAndUpdate({_id:req.params.id},{name:req.body.name},(err,data)=>{
      if (err)throw err;
      Books.updateMany({category: data.name},{category:req.body.name},(err)=>{
        res.redirect('/profile')
      });
      console.log(data)
    })
  }else{
    res.redirect('/')
  }

});
module.exports = router;
