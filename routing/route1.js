// import requirment
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Lib DB
const {
  DynamoDBDocument, GetCommand, BatchGetCommand, PutCommand, ScanCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

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
  accessKeyId:'ASIA3KOLCAFPJEBI5C5V',
  secretAccessKey:'4thF9kpiDIC8zsYqxG0w/d3+lsPrwHkLtwS6Ci7e',
  region:'us-east-1',
  
});

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: 'ASIA3KOLCAFPJEBI5C5V',
  secretAccessKey: '4thF9kpiDIC8zsYqxG0w/d3+lsPrwHkLtwS6Ci7e',
  region: 'us-east-1',
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
        cur_user = {
          username: data.Item.email,
          email: data.Item.username,
          password: data.Item.password,
          firstName: data.Item.firstName,
          lastName: data.Item.lastName,
          address: data.Item.address,
        };
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

router.post("/register", upload.single('profilePicture'), async (req, res) => {
  const username = req.body.register_username.toLowerCase();
  const email = req.body.register_Email;
  const password = req.body.register_password;
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
        FilterExpression: '#username =  :u',
        ExpressionAttributeNames: { '#username': 'username' },
        ExpressionAttributeValues: { ':u': username }
      };

      const command_username = new ScanCommand(params_username);
      const responseUsername = await dynamoDB.send(command_username);

      if (responseUsername.Count != 0) {
        res.render('register', { 'existed_username': true });
      } else {
        try {
          let profile_pic;  // Placeholder for the profile picture URL

          // Check if req.file is available before trying to access req.file.buffer
          if (req.file) {
            const uploadS3 = {
              Bucket: 'web-otop',
              Key: `profile-pictures/${uuidv4()}.jpg`,
              Body: req.file.buffer,
              ContentType: 'image/jpeg',
            };

            const uploadResponse = await s3.send(new PutCommand(uploadS3));
            profile_pic = `https://${uploadResponse.Bucket}.s3.${s3.config.region}.amazonaws.com/${uploadResponse.Key}`;
          }

          const input = {
            TableName: "Users",
            Item: {
              email: email,
              username: username,
              password: password,
              firstName: fname,
              lastName: lname,
              address: address,
              profile_pic: profile_pic,
            },
          };

          try {
            const putCommand = new PutCommand(input);
            await dynamoDB.send(putCommand);

            cur_user = {
              username: email,
              email: username,
              password: password,
              firstName: fname,
              lastName: lname,
              address: address,
            };

            res.redirect('/home');
          } catch (error) {
            res.render('register', { 'error2': true });
          }
        } catch (error) {
          res.render('register', { 'error3': true });
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

});


// Profile -----------------------------------------------------
router.get("/profile", (req, res) => {
  if (Object.keys(cur_user).length === 0) {
    res.redirect('/');
} else {
    res.render('profile', {'cur_user': cur_user });
}
})


//My Shop -----------------------------------------------------

router.get("/myshop", async (req, res) => {
  try {
    if (!cur_user) {
      console.log("User not authenticated");
      return res.redirect("/"); 
    }

    const username = cur_user.email; 

    const query = {
      TableName: "Product",
      KeyConditionExpression: "userID = :username",
      ExpressionAttributeValues: {
        ":username": username,
      },
    };

    const queryCommand = new QueryCommand(query);
    const result = await dynamoDB.send(queryCommand);

    const products = result.Items || [];

    res.render("myshop", { products, username });

  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("myshop", { error: true });
  }
});



// Add Product -----------------------------------------------------
router.get("/add_product", (req, res) => {
    res.render('add_product');
})

router.post("/add_product", async (req, res) => {
  try {

    if (!cur_user) {
      console.log("User not authenticated");
      return res.redirect("/"); // Adjust the login route as needed
    }

    // Use cur_user data for the product
    const username = cur_user.email; // Adjust accordingly based on your data structure
    console.log('Username:', username);

    const productName = req.body.product_name;
    const price = Number(req.body.price);
    const productProvince = req.body.province;
    const productId = `${Date.now()}_${uuidv4()}`;
    console.log('Generated Product ID:', productId);

    // Now use the retrieved username as the userID in the Products table
    const input = {
      TableName: "Product",
      Item: {
        userID: username, // Using the retrieved username as the userID
        productID: productId,
        product_name: productName,
        price: price,
        province: productProvince,
        // Add other product details as needed...
      },
    };

    const putCommand = new PutCommand(input);
    await dynamoDB.send(putCommand);

    // Redirect or respond as needed
    res.render("add_product", { success: true, username: username, productId: productId });

  } catch (error) {
    console.error("Error adding product to DynamoDB:", error);
    res.render("add_product", { error: true });
  }
});



// Cart -----------------------------------------------------
router.get("/cart", async (req, res) => {
  try {
    // Assuming cur_user contains the user information
    if (!cur_user) {
      console.log("User not authenticated");
      return res.redirect("/");
    }

    const username = cur_user.email;

    // Step 1: Query "Users" table to get the product IDs in the user's cart
    const userQuery = {
      TableName: "Users",
      KeyConditionExpression: "email = :username",
      ExpressionAttributeValues: {
        ":username": username,
      },
    };

    const userQueryCommand = new QueryCommand(userQuery);
    const userQueryResult = await dynamoDB.send(userQueryCommand);

    // Extract the cart attribute (assuming it's a string set)
    const cartProductIds = userQueryResult.Items[0]?.cart?.values || [];

    // Check if cartProductIds is an array
    if (!Array.isArray(cartProductIds) || cartProductIds.length === 0) {
      console.log("Cart is empty");
      return res.render('cart.ejs', { emptyCart: true, Products: [] });
    }

    console.log("Cart Product IDs:", cartProductIds);

    // Step 2: Use BatchGetCommand to retrieve details of each product in the cart
    const batchGetParams = {
      RequestItems: {
        "Product": {
          Keys: cartProductIds.map(productId => ({ productID: productId })),
        },
      },
    };

    const batchGetCommand = new BatchGetCommand(batchGetParams);
    const batchGetResult = await dynamoDB.send(batchGetCommand);

    console.log("Batch Get Result:", batchGetResult);

    // Extract product details from the batchGetResult
    const Products = batchGetResult.Responses.Product || [];

    console.log("Products:", Products);

    // Pass the product details to the cart.ejs template
    res.render('cart.ejs', { Products: Products });

  } catch (error) {
    console.error("Error fetching cart data:", error);

    // If there's an error, pass an empty array to Products
    res.render('cart.ejs', { Products: [] });
  }
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