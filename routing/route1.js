// import requirment
const express = require('express');
const { stat } = require('fs');
const router = express.Router();
// const path = require('path');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const {
  DynamoDBDocument, GetCommand, PutCommand
} = require('@aws-sdk/lib-dynamodb');
const {
  DynamoDBClient, GetItemCommand, DynamoDB, PutItemCommand
} = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({region:'us-east-1'});
const dynamoDB = DynamoDBDocument.from(client);
// const dynamoTest = new DynamoDB({region:'us-east-1'});
// router configuration
router.use(bodyParser.urlencoded({extended:false}));
// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
AWS.config.update({
  accessKeyId:'ASIAUXN3NFEEKRSSU763',
  secretAccessKey:'DvPPXNfd3BkWrv9I+3EjMZFwrBhAl0JQUnwt/od8',
  region:'us-east-1',

});
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
        res.render('login', { 'wrong_pass':true });
      }
    
})

router.get("/register", (req, res) => {
    res.render('register');
})

router.post("/register",(req,res)=>{
    const username = req.body.register_username.toLowerCase();
    const email = req.body.register_Email;
    const password = req.body.login_password;
    const fname = req.body.register_firstName;
    const lname = req.body.register_lastName;



    const params = {
      TableName: 'Users',
      Key: {
        email: email, 
      },
    };
    
    const command = new GetItemCommand(params); 

    const scanOperation = async () => {
      try{
        const response = await dynamoDB.send(command)
        onsole.log("sucess",response);
        if(response.Item){
          res.render('register',{'existed_email':true});
        }
        else{
          const params1 = {
            TableName: 'Users',
            ProjectionExpression: '#username, #email, #password, #firstname, #lastname', 
            ExpressionAttributeNames: {
              '#username': 'username',
              '#email': 'email',
              '#password': 'password',
              '#firstname': 'firstname',
              '#lastname': 'lastname',
            },
            FilterExpression: '#username = :usernameValue',
            ExpressionAttributeValues: {
              ':usernameValue': username, 
            },
          };

          const command1 = new GetItemCommand(params1);
          const performScan = async () => {
            try{
              const response = await dynamoDB.send(command1);
              if(response.Item){
                res.render('register',{'existed_username':true});
              }
              else{
                const input = {
                  TableName: "Users",
                  Item: {
                    email: email,
                    username : username,
                    password: password,
                    firstName : fname,
                    lastName : lname
                  }
                };
                const command =  new PutCommand(input);
                const performPutOperation = async () => {
                  try {
                    // Use await to wait for the response
                    const response = await dynamoDB.send(command);
                    console.log("sucess",response);
                    cur_username = 'success';
                  } catch (error) {
                    console.error('Error putting item into DynamoDB:', error);
                    cur_username = 'error'; 
                  }
                  finally{
                    res.redirect('/home');
                  }
                  
                };
                performPutOperation();
              }
            }
            catch (error) {
              console.error('Error putting item into DynamoDB:', error);
            }
          };
          performScan();
          
        }
      }

      catch (error){
        console.error('Error putting item into DynamoDB:', error);
        cur_username = 'error';
      }
    }

    scanOperation();


   

    

  //   const emailCheckCommand = async () => {
  //       const command = new GetCommand({
  //         TableName: "Users",
  //         Key: {
  //           'email': email,
  //         },
  //       });
    
  //       try {
  //         const response = await dynamoDB.send(command);
  //         console.log(response);
  //         return response;
  //       } catch (error) {
  //         console.error('Error retrieving item from DynamoDB:', error);
  //         return null;
  //       }
  //     };

  //     const data =  emailCheckCommand();

  //     if (data && data.Item ) {
  //       res.render('register', { 'existed_email': true });
  //     } else {
  //       const usernameCheckCommand = async () => {
  //           const command = new GetCommand({
  //             TableName: "Users",
  //             Key: {
  //               'username': username,
  //             },
  //           });
        
  //           try {
  //             const response = await dynamoDB.send(command);
  //             console.log(response);
  //             return response;
  //           } catch (error) {
  //             console.error('Error retrieving item from DynamoDB:', error);
  //             return null;
  //           }
  //         };
    
  //         const data =  usernameCheckCommand();
    
  //         if (data && data.Item ) {
  //           res.render('register', { 'existed_username': true });
  //         } else {
  //           const  putItemCommand =  new PutCommand({
  //               TableName: 'Users',
  //               Item: {
  //                 'email': { S: email },
  //                 'username': { S: username },
  //                 'password': { S: password },
  //                 'firstname': { S: fname },
  //                 'lastname': { S: lname },
  //               },
  //             });

  //             try {
  //               const putItemResponse =  dynamoDB.send(putItemCommand);
  //               console.log('Item inserted successfully:', putItemResponse);
  //               cur_username = username;
  //               // res.render('home',{'username':cur_username}); // You can render a success page or redirect as needed
  //               res.redirect('/home');
  //             } catch (error) {
  //               console.error('Error inserting item into DynamoDB:', error);
  //               res.render('register',{'error':true}); // Render an error page or handle the error accordingly
  //             }
  //         }
          
  //     }
      
    
})

router.get("/index", (req, res) => {
    const name = "Win";
    res.render('index.ejs', { name: name });
})

router.get("/home", (req, res) => {
  // if(cur_username===''){res.redirect('/')}
  // else{
  //   const num = 10;
  //   const pnum = 2;
  //   res.render('home.ejs', { num: num, pnum: pnum ,'username':cur_username});
  // }
    
  res.render('home.ejs', {'username':cur_username});
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