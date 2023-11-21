// import requirment
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { S3Client, ListBucketsCommand , PutObjectCommand} = require("@aws-sdk/client-s3");

// Lib DB
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { S3Client, ListBucketsCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

// Lib DB
const {
  DynamoDBDocument, GetCommand, PutCommand, ScanCommand, UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

// DB Client
const {
  DynamoDBClient,
} = require('@aws-sdk/client-dynamodb');

// DB configure
const client = new DynamoDBClient({region:'us-east-1'});
const dynamoDB = DynamoDBDocument.from(client);

// AWS S3 configuration
const s3 = new S3Client({region:'us-east-1'})

// Router configure
router.use(bodyParser.urlencoded({extended:false}));
const bucketName = "web-otop"

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Assign global var username
let cur_user = '';
let default_userPic = './img/userprofile.png';


// Login -----------------------------------------------------
router.get('/', (req, res) => {
  res.render('login');
})

router.post("/", async (req, res) => {
  const username = req.body.login_username.toLowerCase();
  const password = req.body.login_password;

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
      if (password === data.Item.password.toLowerCase()) {
        cur_user = {
          username: data.Item.username,
          email: data.Item.email,
          password: data.Item.password,
          firstName: data.Item.firstName,
          lastName: data.Item.lastName,
          address: data.Item.address,
          profile_pic: data.Item.profile_pic,
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

router.post("/register", upload.single('profilePictureInput'), async (req, res) => {
  const username = req.body.register_username.toLowerCase();
  const email = req.body.register_Email;
  const password = req.body.register_Password;
  const fname = req.body.register_firstName;
  const lname = req.body.register_lastName;
  const address = req.body.register_address;

  const params_email = {
      TableName: 'Users',
      Key: {
          'email': email,
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

        const uploadS3 = {
          "Bucket": bucketName,
          "Key": `profile-pictures/${uuidv4()}.jpg`,
          "Body": req.file.buffer,
          "ContentType": 'image/jpeg',
        };

              try{
                const command = new PutObjectCommand(uploadS3);
                const uploadResponse = await s3.send(command);
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
       
          try {
            const putCommand = new PutCommand(input);
            await dynamoDB.send(putCommand);

                  cur_user = {
                    username:  username,
                    email:     email,
                    password:  password,
                    firstName: fname,
                    lastName:  lname,
                    address:   address,
                    profile_pic: s3Url
                  };
                }
                catch(error){res.render('register',{'error2':true});}   
                res.redirect('/');
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

// Home -----------------------------------------------------

router.get("/home", async (req, res) => {

  if (Object.keys(cur_user).length === 0) {
    res.redirect('/');
  } 

  const limit = 8;


  const scanParams = {
    TableName: 'Product',
    Limit: 30,
  };

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


// Profile -----------------------------------------------------
router.get("/profile", (req, res) => {
  if (Object.keys(cur_user).length === 0) {
    res.redirect('/');
  } else {
    if (cur_user.profile_pic) {
      default_userPic = cur_user.profile_pic;

    }
    res.render('profile', { 'profile_image': default_userPic, 'userData': cur_user});
  }
})

router.post("/profile", upload.single('profilePicUpdate'), async (req, res) => {
  const username = req.body.username.toLowerCase();
  // const email = req.body.email; //email is key may be cannot update?
  const password = req.body.password;
  const fname = req.body.fname;
  const lname = req.body.lname;
  const address = req.body.Address;

  if(req.file){
      uploadS3profile = {
        "Bucket": bucketName,
        "Key": `profile-pictures/${uuidv4()}.jpg`,
        "Body": req.file.buffer,
        "ContentType": 'image/jpeg',
      };
    

    try {
      const command = new PutObjectCommand(uploadS3profile);
      await s3.send(command);

      const s3Url = `https://web-otop.s3.amazonaws.com/${uploadS3.Key}`;
    
      // console.log('current email: ',cur_userObj.email);
      const updatePic = {
        TableName: 'Users',
        Key: {
          'email': cur_user.email,
        },
        UpdateExpression: 'SET profile_pic = :val1, username = :val2, address = :val3, password = :val4, firstName = :val5, lastName = :val6',
        ExpressionAttributeValues: {
          ':val1': s3Url,
          ':val2': username,
          ':val3': address,
          ':val4': password,
          ':val5': fname,
          ':val6': lname,
        },
        ReturnValues: 'ALL_NEW'
      }

      try {
        const result = new UpdateCommand(updatePic);
        await dynamoDB.send(result)
          .then((response) => {
            cur_user = response.Attributes;
            
            res.redirect('/profile');
          })
          .catch((error) => {
            console.log("Error updating the user pic");
          })
      } catch (error) { console.log('update dynamo error'); }
    } catch (error) { console.log("Error Sending Command", error); }
  } else if (!req.file) {
    console.log('no profile pic update');
    try {

      const updateData = {
        TableName: 'Users',
        Key: {
          'email': cur_user.email,
        },
        UpdateExpression: 'SET password = :val1, username = :val2, address = :val3, lastName = :val4, firstName = :val5',
        ExpressionAttributeValues: {
          ':val1': password,
          ':val2': username,
          ':val3': address,
          ':val4': lname,
          ':val5': fname,
        },
        ReturnValues: 'ALL_NEW'
      }

      try {
        const result = new UpdateCommand(updateData);
        await dynamoDB.send(result)
          .then((response) => {
            console.log("Successfully updated the user data \n", response);
            cur_user = response.Attributes;
            res.redirect('/profile');
          })
          .catch((error) => {
            console.log("Error updating the user data", error);
          })
      } catch (error) { console.log('update dynamo error'); }
    } catch (error) { console.log("Error Sending Command", error); }
  }
  else {
    console.log(error);
    res.redirect('/profile');
  }
})


// MyShop -----------------------------------------------------
router.get("/myshop", async (req, res) => {
  try {
    if (!cur_user) {
      console.log("User not authenticated");
      return res.redirect("/"); 
    }

    const username = cur_user; 
    console.log('username',username);

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
    console.log('products',products);

    res.render("myshop", { products, username });

  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("myshop", { error: true });
  }
});


// Myshop Delete Product -----------------------------------------------------
router.post("/myshop/delete", async (req, res) => {
  try {
    if (!cur_user) {
      console.log("User not authenticated");
      return res.redirect("/");
    }

    const productIdsToDelete = req.body.productIds; // Use "productIds" instead of "productId"
    console.log(productIdsToDelete);
    for (let i = 0; i < productIdsToDelete.length; i++){
      console.log(productIdsToDelete[i].split(','))
      const data = productIdsToDelete[i].split(',')
      const username = data[0];
      const productId = data[1];
      const picKey = data[2];
      const parts = picKey.split('/');
      const imageName = parts[parts.length- 1];
      const s3Key = "product-pictures/" + imageName
      const query = {
        TableName: "Product",
        Key: {
          "userID": username,
          "productID": productId
         }
      
    }
    const deleteCommand = new DeleteCommand(query);
    const result = await dynamoDB.send(deleteCommand);

    const input = {
      "Bucket": bucketName,
      "Key": s3Key
    };
    const command = new DeleteObjectCommand(input);
    await s3.send(command);


    };

    return res.json({ message: "Success" });
  } catch (error) {
    console.error('Error deleting products:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.post("/myshop/delete", async (req, res) => {
//   // try {
//     if (!cur_user) {
//       console.log("User not authenticated");
//       // res.redirect("/"); // Adjust the login route as needed
//       res.redirect("not");
//     }

//     const productIdsToDelete = req.body; // Use "productIds" instead of "productId"
//     console.log(productIdsToDelete)

//     return("Success");
    

  //   // Log the value of productIdsToDelete
  //   console.log('productIdsToDelete:', productIdsToDelete);

  //   // Ensure productIdsToDelete is an array
  //   const productIdsArray = [].concat(productIdsToDelete);

  //   for (const productIdToDelete of productIdsArray) {
  //     console.log('Deleting product with ID:', productIdToDelete);
      
  //     // Split the productId into username and productID
  //     const [userID, productID] = productIdToDelete.split(',');

  //     console.log('Deleting product with userID and productID:', userID, productID);

  //     const deleteParams = {
  //       TableName: "Product",
  //       Key: {
  //         userID: { S: userID }, // Assuming userID is of type String
  //         productID: { S: productID }, // Assuming productID is of type String
  //       },
  //     };

  //     const deleteCommand = new DeleteCommand(deleteParams);
  //     await dynamoDB.send(deleteCommand);

  //     console.log('Product deleted successfully');
  //   }

  //   res.redirect("/myshop");
  // } catch (error) {
  //   console.error("Error deleting product:", error);
  //   res.render("error", { error: true });
  // }
// });


// Add Product -----------------------------------------------------
router.get("/add_product", (req, res) => {
  res.render('add_product');
})


// Cart -----------------------------------------------------

router.get("/cart", async (req, res) => {
  try {
    const get_data = async () => {
      const command = new GetCommand({
          TableName: "Users",
          Key: {
              'email': cur_user.email,
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

  const responseUsername = await get_data();

    if (responseUsername.Count !== 0) {
      const cartItems = responseUsername.Item.cart;

      

      const scanParams = {
        TableName: 'Product',
        Select:"ALL_ATTRIBUTES",
        FilterExpression: 'productID IN (:values1,:values2)',
        ExpressionAttributeValues: {
          ':values1': '1',
          ':values2': '2',
        },
      };

      const scanCommand = new ScanCommand(scanParams);
      const response2 = await dynamoDB.send(scanCommand);

      if (response2.Items) {
        res.render('cart', { 'cur_user': cur_user, obj: response2.Items });
      } else {
        console.error('Error querying the Product table. No Items property in the response.');
        res.redirect('/error');
      }
    } else {
      console.error('Error querying the Users table. No cart property in the response.');
      res.redirect('/error');
    }
  } catch (error) {
    console.error('Error in the /cart endpoint:', error);
    res.status(500).send('Internal Server Error');
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

  } else if (status === 'cancel') {
    var product = [{
      name: 'Canceled Product ',
      detail: 'product detail ...',
      tp_cost: 40,
      total_price: 200
    }]
  } else {
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
  res.render('history.ejs', { product: product })
})


// Logout -----------------------------------------------------
router.get('/logout', (req, res) => {
  cur_user = '';
  default_userPic = './img/userprofile.png';
  res.redirect('/');
})

// router.post('/addToCart', async (req, res) => {
//   const { productId } = req.query;

//   // Use the AWS SDK to update the DynamoDB item
//   const command = new UpdateCommand({
//       TableName: 'Users',
//       Key: {
//           // Define your key attributes
//           // For example, email as the partition key
//           email: cur_user.email,
//       },
//       UpdateExpression: 'SET cart = list_append(if_not_exists(cart, :emptyList), :productId)',
//       ExpressionAttributeValues: {
//           ':productId': { SS: [productId] },
//           ':emptyList': { SS: [] },
//       },
//       ReturnValues: 'ALL_NEW',
//   });

//   try {
//       const response = await dynamoDB.send(command);
//       res.json({ success: true, cart: response.Attributes.cart,cartCount: response.Attributes.cart.length });
//   } catch (error) {
//       console.error('Error updating item in DynamoDB:', error);
//       res.status(500).json({ success: false, error: 'Internal Server Error' });
//   }
// });

router.get('/error', (req,res)=> {
  res.render('error');
})

module.exports = router