const express = require('express');
const { stat } = require('fs');
const router = express.Router();
const path = require('path');


router.get("/", (req, res) => {
    res.render('login');
})

router.get("/register", (req, res) => {
    res.render('register');
})

router.get("/index", (req, res) => {
    const name = "Win";
    res.render('index.ejs', { name: name });
})

router.get("/home", (req, res) => {
    const num = 10;
    const pnum = 2;
    res.render('home.ejs', { num: num, pnum: pnum });
})

router.get("/profile", (req, res) => {
    res.render('profile');
})

router.get("/myshop", (req, res) => {
    res.render('myshop');
})

router.get("/add_product", (req, res) => {
    res.render('add_product');
})

router.get("/cart", (req, res) => {
    const Products = [
        { product_name: "silk", image: "img/ex-product.png", price: 1000, description: "" },
        { product_name: "silk", image: "img/ex-product.png", price: 1000, description: "" }
    ];
    res.render('cart.ejs', { Products: Products });
});





router.get("/history", (req, res) => {
    const status = req.query.stt;
    const user = {
        firstName: 'Tim',
        lastName: 'Cook',
    }

    if (status === 'purchased') {
        var product = 
        [{
            name: 'purchased product ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        },
        {
            name: 'purchased product 2 ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        },
    ]
        
    }else if (status === 'cancel'){
        var product = [{
            name: 'cancel product ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        }]
    }else{
        var product = 
        [{
            name: 'refund product ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        },
        {
            name: 'refund product 2 ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        },
    ]
    }
    res.render('history.ejs', {product:product})
})


module.exports = router