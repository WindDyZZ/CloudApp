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

    res.render('home');
})

router.get("/profile",(req,res)=>{
    res.render('profile');
})

router.get("/myshop",(req,res)=>{
    res.render('myshop');
})

router.get("/add_product",(req,res)=>{
    res.render('add_product');
})

module.exports = router