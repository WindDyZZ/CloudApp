const express = require('express');
const router = express.Router();
const path =  require('path');


router.get("/",(req,res)=>{
    res.render('login');
})

router.get("/register",(req,res)=>{
    res.render('register');
})

router.get("/index",(req,res)=>{
    const name = "Win";
    res.render('index.ejs',{name:name});
})

router.get("/home",(req,res)=>{
    const num = 10;
    const pnum = 2;
    res.render('home.ejs',{num: num, pnum:pnum});
})

router.get("/cart",(req,res)=>{
    res.render('cart.ejs')
})

router.get("/history",(req,res)=>{
    res.render('history.ejs')
})

router.get("/profile",(req,res)=>{
    res.render('profile.ejs')
})


module.exports = router