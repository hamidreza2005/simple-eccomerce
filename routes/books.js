let express = require('express');
let router = express.Router();
let Books = require('../models/books');
let category = require('../models/categories');
let comments = require('../models/comments');
let multer = require('multer');
let upload = multer({dest:"./public/images"});
let {check , validationResult}= require('express-validator');
let Account = require('../models/account');
let fs = require('fs');
/* GET users listing. */

router.get('/details/:id',(req,res)=>{
  let cats = category.find({}).exec();
  Books.find({_id : req.params.id},(err,books)=>{
    if (err) throw err;
    if (!books){
      res.redirect('/error')
    }else{
      Books.updateMany({_id:req.params.id},{view:parseInt(books[0].view)+1},(err)=>{
        if (err) throw err;

        if (req.user){
          if(req.user.lastViewed.length === 5){
            if (req.user.lastViewed.indexOf(req.params.id) === -1){
              req.user.lastViewed.reverse().pop();
              req.user.lastViewed.push(req.params.id);
            }else{
              req.user.lastViewed.reverse().pop(req.params.id);
              req.user.lastViewed.push(req.params.id);
            }
            Account.updateMany({_id:req.user.id},{lastViewed:req.user.lastViewed}).exec();
          }else{
            if (req.user.lastViewed.indexOf(req.params.id) === -1){
              req.user.lastViewed.push(req.params.id);
            }else{
              req.user.lastViewed.reverse().pop(req.params.id);
              req.user.lastViewed.push(req.params.id);
            }
            Account.updateMany({_id:req.user.id},{lastViewed:req.user.lastViewed}).exec();
          }

        }

        comments.find({'for':req.params.id,accepted:true},(err,comment)=>{
          if (err)throw err;
          cats.then((d)=>{ res.render('book/details',{books:books,user:req.user,title:books[0].title,categories:d,comments:comment,query:req.query}) });
        });

      });
    }

  });
});

router.get('/add',(req,res)=>{
  if (req.user.level === 'admin') {
    let cats = category.find({}).exec();
    cats.then((d)=>{ res.render('book/add', {user: req.user, title: "Add Book",categories:d}) });

  }else{
    res.redirect('/')
  }
});


let validation = [check('title').notEmpty().withMessage('Title is Empty') , check('publisher').notEmpty().withMessage('Publisher is Empty') , check('description').notEmpty().withMessage('Description is Empty'),check('price').notEmpty().withMessage('Price is Empty').isNumeric().withMessage('Price must be Numbric'),check('category').notEmpty().withMessage("Category is Empty")];

// Add Book
router.post('/add',upload.single('cover'),validation,(req,res)=>{
  let cover = 0;
  //Image Control
  if (req.file.mimetype === 'image/png'){
    let name = `${req.file.filename}.${req.file.mimetype.substr(6)}`;
    fs.renameSync(`./public/images/${req.file.filename}`,`./public/images/${req.file.filename}.${req.file.mimetype.substr(6)}`);
    cover = name;
  }else if (req.file.mimetype === 'image/jpeg'){
    let name = `${req.file.filename}.${req.file.mimetype.substr(6)}`;
    fs.renameSync(`./public/images/${req.file.filename}`,`./public/images/${req.file.filename}.${req.file.mimetype.substr(6)}`);
    cover = name;
  }else{
    res.render('book/add',{user: req.user, title: "Add Book",error:[{msg:'Please Upload Picture'}]})
  }


  const errors = validationResult(req);
  if (!errors.isEmpty()){
    let cats = category.find({}).exec();
    cats.then((d)=>{ res.render('book/add',{user: req.user, title: "Add Book",error:errors.array(),categoreis:d}) });

  }else {
    new Books({title:req.body.title,publisher:req.body.publisher,description:req.body.description,price:req.body.price,category:req.body.category,cover:cover}).save((err)=>{
      if (err)throw err;
      res.redirect('/profile')
    })
  }
});

router.get('/delete/:id',(req,res)=>{
  if (req.user.level == 'admin'){
    Books.findOne({_id:req.params.id},(err,data)=>{
      if (err){
        throw err;
      }
      Books.deleteMany({_id:req.params.id},(err)=>{
        // if (err){
        //   // res.render('error',{message:"It Seems You have Error please go to support Page",user:req.user,title:"Error",categories:[]})
        //   req.flash('info','It Seems You have Error please go to support Page');
        //   res.render("/error");
        //   // throw err;
        // }
        try{
          fs.unlinkSync(`./public/images/${data.cover}`);
          res.redirect('/profile')
        }catch (error) {
            res.render('error',{message:"It Seems You have Error please go to support Page",user:req.user,title:"Error",categories:[]})
        }

      });
    })
  }else{
    res.redirect('/')
  }
});

router.get('/edit/:id',(req,res)=>{
  if (req.user.level == 'admin'){
    let cats = category.find({}).exec();
    Books.find({_id:req.params.id},(err,book)=>{
      if (err) throw err;
      cats.then((d)=>{ res.render('book/add', {user: req.user,title: `Edit Book: ${book[0].title}`,book:book,categories:d}); });
    });
  }else{
    res.redirect('/')
  }
});

router.post('/edit/:id',upload.single('cover'),(req,res)=>{
  if (req.user){
    if (req.file) {
      if (req.file.mimetype === 'image/png') {
        let name = `${req.file.filename}.${req.file.mimetype.substr(6)}`;
        fs.renameSync(`./public/images/${req.file.filename}`, `./public/images/${req.file.filename}.${req.file.mimetype.substr(6)}`);
        cover = name;
      } else if (req.file.mimetype === 'image/jpeg') {
        let name = `${req.file.filename}.${req.file.mimetype.substr(6)}`;
        fs.renameSync(`./public/images/${req.file.filename}`, `./public/images/${req.file.filename}.${req.file.mimetype.substr(6)}`);
        cover = name;
      } else {
        res.render('book/add', {user: req.user, title: "Add Book", error: [{msg: 'Please Upload Picture'}]})
      }

      Books.updateOne({_id: req.params.id}, {
        title: req.body.title,
        publisher: req.body.publisher,
        price: req.body.price,
        description: req.body.description,
        category: req.body.category,
        cover: cover
      }, (err) => {
        if (err) throw err;
        res.redirect('/profile')
      })
    }else{
      Books.find({_id:req.params.id},(err,book)=>{
        if (err) throw err;
        let cats = category.find({}).exec();
        cats.then((d)=>{ res.render('book/add', {user: req.user, title: `Edit Book: ${book[0].title}` , book:book,error:[{msg:"You Should Upload a image"}],categories:d}); });
      });
    }
  }else{
    res.redirect('/')
  }
});
module.exports = router;
