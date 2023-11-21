const express = require('express');
const router = express.Router();
const path =  require('path');
const bodyParser = require('body-parser');
const {
  DynamoDBDocument, GetCommand
} = require('@aws-sdk/lib-dynamodb');

const {
  DynamoDBClient, GetItemCommand, DynamoDB
} = require('@aws-sdk/client-dynamodb');


const client = new DynamoDBClient({region:'us-east-1'});
const dynamoDB = DynamoDBDocument.from(client);


router.use(bodyParser.urlencoded({extended:false}));

router.get("/",(req,res)=>{
    res.render('login');
})

router.post("/",(req,res)=>{
    const username = req.body.login_username;
    const password = req.body.login_password;

    const get_data = async () => {
        const command = new GetItemCommand({
          TableName: "User",
          Key: {
            'username': username,
          },
        });
    
        try {
          const response = await client.send(command);
          console.log(response);
          return response;
        } catch (error) {
          console.error('Error retrieving item from DynamoDB:', error);
          return null;
        }
      };

      const data =  get_data();

      if (data && data.Item && password === data.Item.password) {
        res.render('home');
      } else {
        res.render('login', { 'wrong_pass': true });
      }
    
})


router.get("/register",(req,res)=>{
    res.render('register');
})

router.post("/register",(req,res)=>{
    const username = req.body.register_username;
    const email = req.body.register_Email;
    const password = req.body.login_password;
    const fname = req.body.register_firstName;
    const lname = req.body.register_lastName;
    
})


router.get("/index",(req,res)=>{
    res.render('index.ejs');
})

router.get("/home",(req,res)=>{
    res.render('home.ejs');
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

router.get("/cart",(req,res)=>{
    res.render('cart.ejs')
})

router.get("/history",(req,res)=>{
    res.render('history.ejs')
})


module.exports = router