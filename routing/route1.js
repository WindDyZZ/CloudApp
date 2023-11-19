// import requirment
const express = require('express');
const { stat } = require('fs');
const router = express.Router();
// const path = require('path');
const bodyParser = require('body-parser');
const {
  DynamoDBDocument, GetCommand, PutCommand
} = require('@aws-sdk/lib-dynamodb');
const {
  DynamoDBClient, GetItemCommand, DynamoDB, PutItemCommand
} = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({region:'us-east-1'});
const dynamoDB = DynamoDBDocument.from(client);
// router configuration
router.use(bodyParser.urlencoded({extended:false}));

// assign global var username
let cur_username = '';

router.get('/',(req,res)=>{
  res.render('login');
})

router.post("/",async (req,res)=>{
    const username = req.body.login_username.toLowerCase();
    const password = req.body.login_password;

    const get_data = async () => {
        const command = new GetCommand({
          TableName: "Users",
          Key: {
            'username': username,
          },
        });
    
        try {
          const response = await dynamoDB.send(command);
          console.log(response);
          return response;
        } catch (error) {
          console.error('Error retrieving item from DynamoDB:', error);
          return null;
        }
      };

      const data =  get_data();

      if (data && data.Item ) {
        if(password === data.Item.password){cur_username = username;res.redirect('/home');}
        else{res.render('login', { 'wrong_pass': true });}
        
      } else {
        cur_username = username;
        res.render('login', { 'user_not_existed':true });
      }
    
})

router.get("/register", (req, res) => {
    res.render('register');
})

router.post("/register",(req,res)=>{
  console.log('post register');
    const username = req.body.register_username.toLowerCase();
    const email = req.body.register_Email;
    const password = req.body.login_password;
    const fname = req.body.register_firstName;
    const lname = req.body.register_lastName;

    const emailCheckCommand = async () => {
        const command = new GetCommand({
          TableName: "Users",
          Key: {
            'email': email,
          },
        });
    
        try {
          const response = await dynamoDB.send(command);
          console.log(response);
          return response;
        } catch (error) {
          console.error('Error retrieving item from DynamoDB:', error);
          return null;
        }
      };

      const data =  emailCheckCommand();

      if (data && data.Item ) {
        res.render('register', { 'existed_email': true });
      } else {
        const usernameCheckCommand = async () => {
            const command = new GetCommand({
              TableName: "Users",
              Key: {
                'username': username,
              },
            });
        
            try {
              const response = await dynamoDB.send(command);
              console.log(response);
              return response;
            } catch (error) {
              console.error('Error retrieving item from DynamoDB:', error);
              return null;
            }
          };
    
          const data =  usernameCheckCommand();
    
          if (data && data.Item ) {
            res.render('register', { 'existed_username': true });
          } else {
            const  putItemCommand =  new PutCommand({
                TableName: 'Users',
                Item: {
                  'email': { S: email },
                  'username': { S: username },
                  'password': { S: password },
                  'firstname': { S: fname },
                  'lastname': { S: lname },
                },
              });

              try {
                const putItemResponse =  dynamoDB.send(putItemCommand);
                console.log('Item inserted successfully:', putItemResponse);
                cur_username = username;
                // res.render('home',{'username':cur_username}); // You can render a success page or redirect as needed
                res.redirect('/home');
              } catch (error) {
                console.error('Error inserting item into DynamoDB:', error);
                res.render('register',{'error':true}); // Render an error page or handle the error accordingly
              }
          }
          
      }
      cur_username = 'error';
      res.redirect('/home');
    
})

router.get("/index", (req, res) => {
    const name = "Win";
    res.render('index.ejs', { name: name });
})

router.get("/home", (req, res) => {
  if(cur_username===''){res.redirect('/')}
  else{
    const num = 10;
    const pnum = 2;
    res.render('home.ejs', { num: num, pnum: pnum ,'username':cur_username});
  }
    
})

router.get("/profile", (req, res) => {
    res.render('profile',{'username':cur_username});
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
            name: 'Purchased Product ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        },
        {
            name: 'Purchased Product 2 ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        },
    ]
        
    }else if (status === 'cancel'){
        var product = [{
            name: 'Canceled Product ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        }]
    }else{
        var product = 
        [{
            name: 'Refund Product ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        },
        {
            name: 'Refund Product 2 ',
            detail: 'product detail ...',
            tp_cost: 40,
            total_price: 200
        },
    ]
    }
    res.render('history.ejs', {product:product})
})

router.get('/logout', (req,res)=>{
  cur_username = '';
  res.redirect('/');
})


module.exports = router