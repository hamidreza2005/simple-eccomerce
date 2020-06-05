let express = require('express');
let passport = require('passport');
let Account = require('../models/account');
let Books = require('../models/books');
let Categories = require('../models/categories');
let Comments = require('../models/comments');
let router = express.Router();

router.post('/add/:id',(req,res)=>{
  if (req.user){
      new Comments({sender:req.user.username,content:req.body.content,for:req.params.id,accepted:false}).save((err)=>{
      res.redirect(`/books/details/${req.params.id}?sendComment=true`)
    })
  }else{
    res.redirect('/')
  }
});

router.get('/delete/:id',(req,res)=>{
  if (req.user){
    Comments.deleteMany({_id:req.params.id},err=>{
      if (err) throw err;
      if (req.query.commentManagement){
        res.redirect('/profile/commentmanagement/noaccepted?deleted=true')
      }else{
        res.redirect('/profile/mycomments?deleted=true')
      }
    })
  }else{
    res.redirect('/');
  }
});

router.get('/edit/:id',(req,res)=>{
  if (req.user){
    let cats = Categories.find({}).exec();
    Comments.find({_id:req.params.id},(err,comments)=>{
      cats.then(c=>{
        res.render('Comments/edit',{user:req.user,title:"Edit Comment",categories:c,comment:comments,query:req.query})
      })
    })
  }else{
    res.redirect('/');
  }
});

router.post('/edit/:id',(req,res)=>{
  if (req.user){
    Comments.updateMany({_id:req.params.id},{content:req.body.content},err=>{
      if (err) throw err;
      if (req.query.commentManagement){
        res.redirect('/profile/commentmanagement/all?edited=true')
      }else{
        res.redirect('/profile/mycomments?edited=true')
      }
    })
  }else{
    res.redirect('/');
  }
});

module.exports = router;