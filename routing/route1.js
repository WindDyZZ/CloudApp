// import requirment
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const { PutCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Lib DB
const {
  DynamoDBDocument, GetCommand, PutCommand, ScanCommand
} = require('@aws-sdk/lib-dynamodb');

// DB Client
const {
  DynamoDBClient, 
} = require('@aws-sdk/client-dynamodb');

// DB configure
const client = new DynamoDBClient({region:'us-east-1'});
const dynamoDB = DynamoDBDocument.from(client);

// Router configure
router.use(bodyParser.urlencoded({extended:false}));

// AWS configuration
AWS.config.update({
  accessKeyId:'ASIA3KOLCAFPAEBODSGK',
  secretAccessKey:'UwjvnAHVjuP6q6tB7o22aeNIpOZRwmimUN6BAYtE',
  region:'us-east-1',

});

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: 'your-access-key-id',
  secretAccessKey: 'your-secret-access-key',
  region: 'your-region',
});

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Assign global var username
let cur_user = '';



// Login -----------------------------------------------------
router.get('/',(req,res)=>{
  res.render('login');
})

router.post("/", async (req, res) => {
  const username = req.body.login_username.toLowerCase();
  const password = req.body.login_password;

  console.log('Entered username:', username);

  const get_data = async () => {
      const command = new GetCommand({
          TableName: "Users",
          Key: {
              'email': username,
          },
      });

      try {
          const response = await dynamoDB.send(command);
          return response;
      } catch (error) {
          console.error('Error retrieving item from DynamoDB:', error);
          return null;
      }
  };

  const data = await get_data();

  if (data && data.Item) {
      console.log('Stored password:', data.Item.password);
      if (password === data.Item.password.toLowerCase()) {
        cur_user = username;
          res.redirect('/home');
      } else {
          res.render('login', { 'wrong_pass': true });
      }
  } else {
      console.log('User not found in DynamoDB.');
      res.render('login', { 'wrong_pass': true });
  }
});

// Register -----------------------------------------------------

router.get("/register", (req, res) => {
    res.render('register');
})

router.post("/register",upload.single('profilePicture'), async (req, res) => {
  const username = req.body.register_username.toLowerCase();
  const email = req.body.register_Email;
  const password = req.body.login_password;
  const fname = req.body.register_firstName;
  const lname = req.body.register_lastName;
  const address = req.body.register_address;

  const params_email = {
      TableName: 'Users',
      Key: {
          email: email,
      },
  };

  const command_email = new GetCommand(params_email);

  try {
      const responseEmail = await dynamoDB.send(command_email);

      if (responseEmail && responseEmail.Item) {
          res.render('register', { 'existed_email': true });
      } else {
          const params_username = {
            TableName: 'Users',
            FilterExpression: '#username =  :u' ,
            ExpressionAttributeNames:{'#username' : 'username'},
            ExpressionAttributeValues: {':u' : username}
          };

          const command_username = new ScanCommand(params_username);
          const responseUsername = await dynamoDB.send(command_username);

          if ( responseUsername.Count != 0) {
              res.render('register', { 'existed_username': true });
          } else {

              const uploadS3 = {
                Bucket: 'web-otop',
                Key: `profile-pictures/${uuidv4()}.jpg`, 
                Body: req.file.buffer,
                ContentType: 'image/jpeg', 
              };

              try{
                const uploadResponse = await s3.send(new PutCommand(uploadS3));
                const s3Url = `https://${params.Bucket}.s3.${s3.config.region}.amazonaws.com/${params.Key}`;
                const input = {
                  TableName: "Users",
                  Item: {
                      email:    email,
                      username: username,
                      password: password,
                      firstName: fname,
                      lastName: lname,
                      address : address,
                      profile_pic: s3Url,
                  },
                };

                try{
                  const putCommand = new PutCommand(input);
                  await dynamoDB.send(putCommand);

                  cur_user = {
                    username:  email,
                    email:     username,
                    password:  password,
                    firstName: fname,
                    lastName:  lname,
                    address:   address,
                  };
                }
                catch(error){res.render('register',{'error2':true});}   
                res.redirect('/home');
              }
              catch(error){
                res.render('register',{'error3':true});
              }
          }
      }
  } catch (error) {
      console.error('Error getting item from DynamoDB:', error);
      res.render('register', { 'error1': true });
  }

});

// Index -----------------------------------------------------

router.get("/index", (req, res) => {
    const name = "Win";
    res.render('index.ejs', { name: name });
})

// Home -----------------------------------------------------

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


// Profile -----------------------------------------------------
router.get("/profile", (req, res) => {
  if (Object.keys(cur_user).length === 0) {
    res.redirect('/');
} else {
    res.render('profile', {'cur_user': cur_user });
}
})


// Shop -----------------------------------------------------
router.get("/myshop", (req, res) => {
  if (Object.keys(cur_user).length === 0) {
    res.redirect('/');
} else {
    res.render('myshop', {'cur_user': cur_user });
}
})


// Add Product -----------------------------------------------------
router.get("/add_product", (req, res) => {
    res.render('add_product');
})


// Cart -----------------------------------------------------
router.get("/cart", (req, res) => {
    const Products = [
        { product_name: "silk", image: "img/ex-product.png", price: 1000, description: "" },
        { product_name: "silk", image: "img/ex-product.png", price: 1000, description: "" }
    ];
    res.render('cart.ejs', { Products: Products });
});


// History -----------------------------------------------------
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


// Logout -----------------------------------------------------
router.get('/logout', (req,res)=>{
  cur_username = '';
  res.redirect('/');
})


module.exports = router