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

module.exports = router