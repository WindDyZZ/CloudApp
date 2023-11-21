// import requirment
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const {
  DynamoDBDocument, GetCommand, PutCommand, ScanCommand, QueryCommand
} = require('@aws-sdk/lib-dynamodb');

const { S3Client, ListBucketsCommand , PutObjectCommand} = require("@aws-sdk/client-s3");
const {
  DynamoDBClient, 
} = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const client = new DynamoDBClient({region:'us-east-1'});
const dynamoDB = DynamoDBDocument.from(client);
router.use(bodyParser.urlencoded({extended:false}));


const s3 = new S3Client({region:'us-east-1'})

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Assign global var username
let cur_user = '';

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

// Register
router.get("/register", (req, res) => {
    res.render('register');
})

router.post("/register",upload.single('profilePictureInput'), async (req, res) => {
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

  const command_email = new GetCommand(params_email);

  try {
      const responseEmail = await dynamoDB.send(command_email);
      console.log("Send");

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
          console.log("Send2");

          if ( responseUsername.Count != 0) {
              res.render('register', { 'existed_username': true });
          } else {


              const uploadS3 = {
                "Bucket": 'web-otop',
                "Key": `profile-pictures/${uuidv4()}.jpg`, 
                "Body": req.file.buffer,
                "ContentType": 'image/jpeg', 
              };

              try{
                const command = new PutObjectCommand(uploadS3);
                const uploadResponse = await s3.send(command);
                // const uploadResponse = await s3.send(new PutCommand(uploadS3));
                // const s3Url = `https://${params.Bucket}.s3.${s3.config.region}.amazonaws.com/${params.Key}`;
                const s3Url = `https://web-otop.s3.amazonaws.com/${uploadS3.Key}`;
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
                    username:  username,
                    email:     email,
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
                console.log(error)
                res.render('register',{'error3':true});
              }
          }
      }
  } catch (error) {
      console.error('Error getting item from DynamoDB:', error);
      res.render('register', { 'error1': true });
  }

});


router.get("/index", (req, res) => {
    const name = "Win";
    res.render('index.ejs', { name: name });
})

router.get("/home", async (req, res) => {

  if (Object.keys(cur_user).length === 0) {
    res.redirect('/');
  } 

  const limit = 8;


  const scanParams = {
    TableName: 'Product',
    Limit: 30,
  };

  // const queryParam = {
  //   TableName: "Users",
  //   KeyConditionExpression: "email = :username",
  //   ExpressionAttributeValues: {
  //     ":username": username,
  //   },
  //   ProjectionExpression: "cart"
  // };

  const command = new ScanCommand(scanParams);

  try {
    const response = await dynamoDB.send(command);

    if (response.Items.length > 0) {
      product_data = response.Items;
      const plus = response.Items.length % limit !== 0;
      res.render('home', { 'cur_user': cur_user, 'limit': limit, 'product_data': product_data, 'plus': plus });
    } else {
      return res.render('home', { 'cur_user': cur_user, 'limit': limit, 'product_data': product_data, 'plus': false });
    }
  } catch (error) {
    res.redirect('/error');
  }
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


router.get("/cart", async (req, res) => {
  try {
      const queryParam = {
          TableName: 'Users',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: {
              ':email': cur_user.email,
          },
          ProjectionExpression: 'cart',
          Limit: 1
      };

      // Create the QueryCommand
      const queryCommand = new QueryCommand(queryParam);

      // Now you can use 'dynamoDB.send' to send the query command
      const response = await dynamoDB.send(queryCommand);
      console.log(response.Items);

      let obj = [];

      // Check if 'cart' attribute exists in the response
      if (response.Items.length > 0 && response.Items[0].cart) {
          // Loop through each item in the 'cart'
          for (const item of response.Items[0].cart) {
              const queryParam2 = {
                  TableName: 'Product',
                  KeyConditionExpression: 'productID = :pid',
                  ExpressionAttributeValues: {
                      ':pid': item,
                  },
                  Limit: 1
              };

              const queryCommand2 = new QueryCommand(queryParam2);

              try {
                  const response2 = await dynamoDB.send(queryCommand2);
                  console.log(response2.Items);

                  // Push the item to 'obj' array
                  obj.push(response2.Items);
              } catch (error) {
                  console.error('Error querying the Product table:', error);
                  res.redirect('/error');
              }
          }
      }
      

      res.render('cart', { 'obj': obj });
  } catch (error) {
      console.error('Error querying the Users table:', error);
      res.redirect('/error');
  }
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

router.post('/addToCart', async (req, res) => {
  const { productId } = req.query;

  // Use the AWS SDK to update the DynamoDB item
  const command = new UpdateCommand({
      TableName: 'Users',
      Key: {
          // Define your key attributes
          // For example, email as the partition key
          email: cur_user.email,
      },
      UpdateExpression: 'SET cart = list_append(if_not_exists(cart, :emptyList), :productId)',
      ExpressionAttributeValues: {
          ':productId': { SS: [productId] },
          ':emptyList': { SS: [] },
      },
      ReturnValues: 'ALL_NEW',
  });

  try {
      const response = await dynamoDB.send(command);
      res.json({ success: true, cart: response.Attributes.cart,cartCount: response.Attributes.cart.length });
  } catch (error) {
      console.error('Error updating item in DynamoDB:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router