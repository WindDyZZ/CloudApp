// import requirment
require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const {
  DynamoDBDocument, GetCommand, PutCommand, ScanCommand
} = require('@aws-sdk/lib-dynamodb');
const {
  DynamoDBClient, 
} = require('@aws-sdk/client-dynamodb');
// const client = new DynamoDBClient({region:'us-east-1'});
// const dynamoDB = DynamoDBDocument.from(client);

const {ACCESS_KEY, SECRET_KEY, SESSION_TOKEN} = process.env;
console.log("key", ACCESS_KEY);
router.use(bodyParser.urlencoded({extended:false}));
AWS.config.update({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_KEY,
  sessionToken: SESSION_TOKEN,
  region:'us-east-1', 

});

const dynamoDB = new AWS.DynamoDB.DocumentClient({convertEmptyValues: true})
// assign global var username
let cur_user = '';

//-----------------------------------Start Login----------------------------------------------


router.get('/',(req,res)=>{
  res.render('login');
})

router.post("/", async (req, res) => {
//   const username = req.body.login_username.toLowerCase();
  const email = req.body.login_email;
  const password = req.body.login_password;

  console.log('Entered username:', email);

  const get_data = async () => {
    //   const command = new GetCommand({
    //       TableName: "Users",
    //       Key: {
    //           'email': email,
    //       },
    //   });

    const params = {
        TableName: 'Users',
        Key: {
            email,
        },
      };


      try {
          const response = await dynamoDB.get(params).promise();
          console.log(response)

          return response;
      } catch (error) {
          console.error('Error retrieving item from DynamoDB:', error);
          return null;
      }
  };

  const data = await get_data();

  if (Object.keys(data).length != 0) {
      console.log('Stored password:', data.Item.password);
      if (password === data.Item.password.toLowerCase()) {
        // cur_user = username;
        cur_user = email;
          res.redirect('/home');
      } else {
          res.render('login', { 'wrong_pass': true });
      }
  } else {
      console.log('User not found in DynamoDB.');
      res.render('login', { 'wrong_pass': true });
  }
});


//-----------------------------------End Login----------------------------------------------


//-----------------------------------Start Register----------------------------------------------

router.get("/register", (req, res) => {
    res.render('register');
})

router.post("/register", async (req, res) => {
  const username = req.body.register_username.toLowerCase();
  const email = req.body.register_Email;
  const password = req.body.register_Password;
  const fname = req.body.register_firstName;
  const lname = req.body.register_lastName;
  const address = req.body.register_address;

  const params_email = {
      TableName: 'Users',
      Key: {
          email: email,
      },
  };

//   const command_email = new GetCommand(params_email);

  try {
      const responseEmail = await dynamoDB.get(params_email).promise();

      if (Object.keys(responseEmail).length != 0) {
          res.render('register', { 'existed_email': true });
      } else {
          const params_username = {
            TableName: 'Users',
            // FilterExpression: '#username =  :u' ,
            // ExpressionAttributeNames:{'#username' : 'username'},
            // ExpressionAttributeValues: {':u' : username}
            Key: {
                email,
            },
          };

        //   const command_username = new ScanCommand(params_username);
          const responseUsername = await dynamoDB.get(params_username).promise();
          console.log('responseUsername', responseUsername)

          if ( Object.keys(responseUsername).length != 0) {
              res.render('register', { 'existed_username': true });
          } else {
              const input = {
                  TableName: "Users",
                  Item: {
                      email:    email,
                      username: username,
                      password: password,
                      firstName: fname,
                      lastName: lname,
                      address : address,
                  },
              };

            //   const putCommand = new PutCommand(input);
              await dynamoDB.put(input).promise();
              try{
                cur_user = {
                  username:  email,
                  email:     username,
                  password:  password,
                  firstName: fname,
                  lastName:  lname,
                  address:   address,
                };
              }
              catch(error){
                res.render('register',{'error2':true});
              }
              
              res.redirect('/');
          }
      }
  } catch (error) {
      console.error('Error getting item from DynamoDB:', error);
      res.render('register', { 'error1': true });
  }

});

//-----------------------------------End Register----------------------------------------------


router.get("/index", (req, res) => {
    const name = "Win";
    res.render('index.ejs', { name: name });
})

router.get("/home", (req, res) => {

  if (Object.keys(cur_user).length === 0) {
    res.redirect('/');
} else {
    res.render('home', {'cur_user': cur_user });
}
  // const username = cur_username;

  // // Fetch user data from DynamoDB using the username
  // const getUserData = async (username) => {
  //     const command = new GetCommand({
  //         TableName: "Users",
  //         Key: {
  //             'email': username,
  //         },
  //     });

  //     try {
  //         const response = await dynamoDB.send(command);
  //         return response.Item; // Return the user data
  //     } catch (error) {
  //         console.error('Error retrieving user data from DynamoDB:', error);
  //         return null;
  //     }
  // };

  // getUserData(username)
  //     .then(userData => {
  //         res.render('home.ejs', { 'username': cur_username, 'Item': userData });
  //     })
  //     .catch(error => {
  //         console.error('Error fetching user data:', error);
  //         res.render('home.ejs', { 'username': cur_username, 'Item': null });
  //     });
  
});

router.get("/profile", (req, res) => {
  if (Object.keys(cur_user).length === 0) {
    res.redirect('/');
} else {
    res.render('profile', {'cur_user': cur_user });
}
})

router.get("/myshop", (req, res) => {
  if (Object.keys(cur_user).length === 0) {
    res.redirect('/');
} else {
    res.render('myshop', {'cur_user': cur_user });
}
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