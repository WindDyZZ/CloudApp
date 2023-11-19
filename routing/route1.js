// import requirment
const express = require('express');
const router = express.Router();
<<<<<<< HEAD
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
=======
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const {
  DynamoDBDocument, GetCommand, PutCommand, ScanCommand, QueryCommand
} = require('@aws-sdk/lib-dynamodb');
const {
  DynamoDBClient, 
} = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({region:'us-east-1'});
const dynamoDB = DynamoDBDocument.from(client);
router.use(bodyParser.urlencoded({extended:false}));
AWS.config.update({
  accessKeyId:'ASIAUXN3NFEEKRSSU763',
  secretAccessKey:'DvPPXNfd3BkWrv9I+3EjMZFwrBhAl0JQUnwt/od8',
  region:'us-east-1',

});
// assign global var username
let cur_username = '';
>>>>>>> test-ejs

router.get('/',(req,res)=>{
  res.render('login');
})

<<<<<<< HEAD
router.post("/",(req,res)=>{
    const username = req.body.login_username;
    const password = req.body.login_password;

    const get_data = async () => {
        const command = new GetItemCommand({
          TableName: "User",
=======
router.post("/",async (req,res)=>{
    const username = req.body.login_username.toLowerCase();
    const password = req.body.login_password;

    const get_data = async () => {
        const command = new GetCommand({
          TableName: "Users",
>>>>>>> test-ejs
          Key: {
            'username': username,
          },
        });
    
        try {
<<<<<<< HEAD
          const response = await client.send(command);
=======
          const response = await dynamoDB.send(command);
>>>>>>> test-ejs
          console.log(response);
          return response;
        } catch (error) {
          console.error('Error retrieving item from DynamoDB:', error);
          return null;
        }
      };

      const data =  get_data();

<<<<<<< HEAD
      if (data && data.Item && password === data.Item.password) {
        res.render('home');
      } else {
        res.render('login', { 'wrong_pass': true });
=======
      if (data && data.Item ) {
        if(password === data.Item.password){cur_username = username;res.redirect('/home');}
        else{res.render('login', { 'wrong_pass': true });}
        
      } else {
        cur_username = username;
        res.render('login', { 'wrong_pass':true });
>>>>>>> test-ejs
      }
    
})

<<<<<<< HEAD

router.get("/register",(req,res)=>{
=======
router.get("/register", (req, res) => {
>>>>>>> test-ejs
    res.render('register');
})

router.post("/register",(req,res)=>{
<<<<<<< HEAD
    const username = req.body.register_username;
=======
    const username = req.body.register_username.toLowerCase();
>>>>>>> test-ejs
    const email = req.body.register_Email;
    const password = req.body.login_password;
    const fname = req.body.register_firstName;
    const lname = req.body.register_lastName;
<<<<<<< HEAD
    
})


router.get("/index",(req,res)=>{
    res.render('index.ejs');
})

router.get("/home",(req,res)=>{
    res.render('home.ejs');
=======
    const address = req.body.register_address;

// Insert Input

const performPutOperation = async () => {
  const input = {
     TableName: "Users",
     Item: {
       email: email,
       username : username,
       password: password,
       firstName : fname,
       lastName : lname,
       address : address
     }
   };
   const command = await new PutCommand(input);
    try {
      const response = await dynamoDB.send(command);
      console.log("sucess",response);
      res.redirect('/home');
    } catch (error) {
      console.error('Error putting item into DynamoDB:', error);
      res.render('register',{'error3':true});
    }
    
};

  // Scan Username
  const scanUsername = async () => {
    const params_username = {
      TableName: 'Users',
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': { 'S': username },
      },
      ProjectionExpression: 'username',
    };

    const command_username = new ScanCommand(params_username);
      try {
          const responseUsername = await dynamoDB.send(command_username);
  
          if (responseUsername && responseUsername.Items && responseUsername.Items.length > 0) {
              res.render('register', { 'existed_username': true });
          } 
          
          else {
              // res.render('register', { 'success': true });
              cur_username = JSON.stringify(responseUsername.Items.username);
              performPutOperation();
          }
      } 
      
      catch (error) {
          console.error('Error getting item from DynamoDB:', error);
          res.render('register', { 'error2': true });
      }
  };

  // Scan email and all
  
  const scanRegister = async () => {
    const params_email = {
      TableName: 'Users',
      Key: {
          email: email,
      },
    };
  
    const command_email = new GetCommand(params_email);
      try {
          const responseEmail = await dynamoDB.send(command_email);
  
          if (responseEmail && responseEmail.Items) {
              res.render('register', { 'existed_email': true });
          } else {
            scanUsername();
          }
      } catch (error) {
          console.error('Error getting item from DynamoDB:', error);
          res.render('register', { 'error1': true });
      }
  };
  
  scanRegister();
  

    // const scanEmail = async () => {
    //   try{
    //     const responseEmail = await dynamoDB.send(command_email);
    //     if (responseEmail.Items && responseEmail.Items.length > 0) {
    //       res.render('register',{'existed_email':true});
    //     } else {
    //       const params_username = {
    //         TableName: 'Users',
    //         FilterExpression: 'username = :username',
    //         ProjectionExpression: 'username', 
    //         ExpressionAttributeValues: {
    //           ':username': { S: username },
    //         },
    //       };

    //       const command_username = new ScanCommand(params_username);
    //       const scanUsername = async () => {
    //         try{
    //           const responseUsername = await dynamoDB.send(command_username);
    //           if (responseUsername.Items && responseUsername.Items.length > 0) {
    //             res.render('register',{'existed_username':true});
    //           } else {
    //             const input = {
    //               TableName: "Users",
    //               Item: {
    //                 email: email,
    //                 username : username,
    //                 password: password,
    //                 firstName : fname,
    //                 lastName : lname
    //               }
    //             };

    //             const command =  new PutCommand(input);
    //             const performPutOperation = async () => {
    //               try {
    //                 const response = await dynamoDB.send(command);
    //                 console.log("sucess",response);
    //                 cur_username = 'success';
    //                 res.redirect('/home');
    //               } catch (error) {
    //                 console.error('Error putting item into DynamoDB:', error);
    //                 res.render('register',{'error1':true});
    //               }
                  
    //             };

    //             performPutOperation();
    //           }
    //         } catch (error) {
    //           console.error('Error scanning DynamoDB Username:', error);
    //           res.render('register',{'error2':true});
    //         }
    //       }

    //       scanUsername();

    //     }

    //   } catch (error){
    //     console.error('Error scanning DynamoDB Email:', error);
    //     res.render('register',{'error3':true});
    //   }
    // };

    // scanEmail();

})

router.get("/index", (req, res) => {
    const name = "Win";
    res.render('index.ejs', { name: name });
})

router.get("/home", (req, res) => {
  res.render('home.ejs', {'username':cur_username});
>>>>>>> test-ejs
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