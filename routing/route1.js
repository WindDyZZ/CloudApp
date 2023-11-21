// import requirment
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

// Lib DB
const {
  DynamoDBDocument, GetCommand, PutCommand, ScanCommand, UpdateCommand, QueryCommand, DeleteCommand
} = require('@aws-sdk/lib-dynamodb');

// DB Client
const {
  DynamoDBClient,
} = require('@aws-sdk/client-dynamodb');

// DB configure
const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocument.from(client);

const { S3Client, ListBucketsCommand , PutObjectCommand, DeleteObjectCommand} = require("@aws-sdk/client-s3");
//S3 Client
const s3 = new S3Client({region:'us-east-1'})

const bucketName = "web-otop-jiji"

// const s3Url = `https://${bucketName}.s3.amazonaws.com/${uploadS3.Key}`;
const s3Url = `https://${bucketName}.s3.amazonaws.com/`;


// Router configure
router.use(bodyParser.urlencoded({ extended: false }));

// AWS configuration
// AWS.config.update({
//   accessKeyId:'ASIA3KOLCAFPAEBODSGK',
//   secretAccessKey:'UwjvnAHVjuP6q6tB7o22aeNIpOZRwmimUN6BAYtE',
//   region:'us-east-1',

// });

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Assign global var username
let cur_user = '';
let cur_userObj = {};
let default_userPic = './img/userprofile.png';


// Login -----------------------------------------------------
router.get('/', (req, res) => {
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
      cur_userObj = data.Item
      console.log(data.Item);
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
      email: email,
    },
  };

  const command_email = new GetCommand(params_email);

  try {
    const responseEmail = await dynamoDB.send(command_email);
    console.log('send --> email');

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
      console.log('send --> username');

      if (responseUsername.Count != 0) {
        res.render('register', { 'existed_username': true });
      } else {

        const uploadS3 = {
          "Bucket": bucketName,
          "Key": `profile-pictures/${uuidv4()}.jpg`,
          "Body": req.file.buffer,
          "ContentType": 'image/jpeg',
        };
        console.log('uploadS3');

        try {
          const command = new PutObjectCommand(uploadS3);
          const uploadResponse = await s3.send(command);

          // const s3Url = `https://web-otop-jiji.s3.amazonaws.com/${uploadS3.Key}`;

          const input = {
            TableName: "Users",
            Item: {
              email: email,
              username: username,
              password: password,
              firstName: fname,
              lastName: lname,
              address: address,
              profile_pic: s3Url+uploadS3.Key,
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
          }
          catch (error) { res.render('register', { 'error2': true }); }
          res.redirect('/');
        }
        catch (error) {
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
      // console.log(product_data);
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
    console.log('get profile');
    console.log('user profile pic', cur_userObj.profile_pic);
    if (cur_userObj.profile_pic) {
      default_userPic = cur_userObj.profile_pic;

    }
    res.render('profile', { 'profile_image': default_userPic, 'userData': cur_userObj });
  }
})

router.post("/profile", upload.single('profilePicUpdate'), async (req, res) => {
  console.log('post profile');
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
      console.log('send --> PutObjectCommand(uploadS3profile)');

      // const s3Url = `https://otop-test.s3.amazonaws.com/${uploadS3profile.Key}`;
    
      // console.log('current email: ',cur_userObj.email);
      const updatePic = {
        TableName: 'Users',
        Key: {
          'email': cur_userObj.email,
        },
        UpdateExpression: 'SET profile_pic = :val1, username = :val2, address = :val3, password = :val4, firstName = :val5, lastName = :val6',
        ExpressionAttributeValues: {
          ':val1': s3Url+uploadS3profile.Key,
          ':val2' : username,
          ':val3' : address,
          ':val4' : password,
          ':val5' : fname,
          ':val6' : lname,
        },
        ReturnValues: 'ALL_NEW'
      }

      try {
        const result = new UpdateCommand(updatePic);
        await dynamoDB.send(result)
          .then((response) => {
            console.log("Successfully updated the user profile");
            cur_userObj = response.Attributes;
            // default_userPic = response.profile_pic;
            console.log(cur_userObj);
            res.redirect('/profile');
          })
          .catch((error) => {
            console.log("Error updating the user pic");
          })
      } catch (error) { console.log('update dynamo error'); }
    } catch (error) { console.log("Error Sending Command", error); }
  }else if(!req.file){
    console.log('no profile pic update');
    try {
      
      const updateData = {
        TableName: 'Users',
        Key: {
          'email': cur_userObj.email,
        },
        UpdateExpression: 'SET password = :val1, username = :val2, address = :val3, lastName = :val4, firstName = :val5',
        ExpressionAttributeValues: {
          ':val1': password,
          ':val2' : username,
          ':val3' : address,
          ':val4' : lname,
          ':val5' : fname,
        },
        ReturnValues: 'ALL_NEW'
      }

      try {
        const result = new UpdateCommand(updateData);
        await dynamoDB.send(result)
          .then((response) => {
            console.log("Successfully updated the user data \n", response);
            cur_userObj = response.Attributes;
            res.redirect('/profile');
          })
          .catch((error) => {
            console.log("Error updating the user data", error);
          })
      } catch (error) { console.log('update dynamo error'); }
    } catch (error) { console.log("Error Sending Command", error); }
  }
  else{
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


    // Perform your deletion logic here

    // Assuming successful deletion, send a success response
    return res.json({ message: "Success" });
  } catch (error) {
    console.error('Error deleting products:', error);
    // Handle errors or send an error response
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

router.post("/add_product",upload.single('product_image'), async (req, res) => {
try {

  if (!cur_user) {
    console.log("User not authenticated");
    return res.redirect("/"); // Adjust the login route as needed
  }

  // Use cur_user data for the product
  const username = cur_user; // Adjust accordingly based on your data structure
  console.log('Username:', username);

  const productName = req.body.product_name;
  const price = parseInt(req.body.price);
  const productProvince = req.body.province;
  const productId = `${Date.now()}_${uuidv4()}`;
  console.log('Generated Product ID:', productId);
  console.log('productName', productName);
  console.log('price', price);
  console.log('productProvince', productProvince);
  console.log('productId', productId);
  // let s3Url = "";
  let uploadS3;
  if (req.file) {
    uploadS3 = {
      Bucket: bucketName,
      Key: `product-pictures/${uuidv4()}.jpg`,
      Body: req.file.buffer,
      ContentType: 'image/jpeg',
    };
    const command = new PutObjectCommand(uploadS3);
    const uploadResponse = await s3.send(command);
    // s3Url = `https://${bucketName}.s3.amazonaws.com/${uploadS3.Key}`;
  }
  
  // Now use the retrieved username as the userID in the Products table
  const input = {
    TableName: "Product",
    Item: {
      userID: username, // Using the retrieved username as the userID
      productID: productId,
      product_name: productName,
      price: price,
      province: productProvince,
      product_image: s3Url+uploadS3.Key
      // Add other product details as needed...
    },
  };

  const putCommand = new PutCommand(input);
  await dynamoDB.send(putCommand);

  // Redirect or respond as needed
  // res.render("add_product", { success: true, username: username, productId: productId });
  res.redirect('/myshop');

} catch (error) {
  console.error("Error adding product to DynamoDB:", error);
  res.render("add_product", { error: true });
}
});


// Add cart -----------------------------------------------------
router.get("/add_cart", async (req, res) => {
  const productToAdd = req.query.pid;
  console.log('productid: ',productToAdd);
});

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
  console.log(responseUsername);

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
// router.get("/history", (req, res) => {
//   const status = req.query.stt;
//   const user = {
//     firstName: 'Tim',
//     lastName: 'Cook',
//   }

//   if (status === 'purchased') {
//     var product =
//       [{
//         name: 'Purchased Product ',
//         detail: 'product detail ...',
//         tp_cost: 40,
//         total_price: 200
//       },
//       {
//         name: 'Purchased Product 2 ',
//         detail: 'product detail ...',
//         tp_cost: 40,
//         total_price: 200
//       },
//       ]

//   } else if (status === 'cancel') {
//     var product = [{
//       name: 'Canceled Product ',
//       detail: 'product detail ...',
//       tp_cost: 40,
//       total_price: 200
//     }]
//   } else {
//     var product =
//       [{
//         name: 'Refund Product ',
//         detail: 'product detail ...',
//         tp_cost: 40,
//         total_price: 200
//       },
//       {
//         name: 'Refund Product 2 ',
//         detail: 'product detail ...',
//         tp_cost: 40,
//         total_price: 200
//       },
//       ]
//   }
//   res.render('history.ejs', { product: product })
// })

router.get("/history", async (req, res) => {
  const status = req.query.stt;

  console.log("Status:", status);
  console.log("current user is", cur_userObj.username);

  try {
      let params;

      if (status === 'cancel' || status === 'purchased' || status === 'refund') {
          params = {
              TableName: 'Order',
              FilterExpression: '#status = :status AND #userID = :userID',
              ExpressionAttributeNames: {
                  '#status': 'status',
                  '#userID': 'userID',
              },
              ExpressionAttributeValues: {
                  ':status': status,
                  ':userID': cur_userObj.username,
              },
          };

          console.log("status is click from button");
      
      } else if (status === undefined || status === 'all') {
          params = {
              TableName: 'Order',
              FilterExpression: '#userID = :userID',
              ExpressionAttributeNames: {
                  '#userID': 'userID', 
              },
              ExpressionAttributeValues: {
                  ':userID': cur_userObj.username,
              },
          };
          console.log("status is undefined");

      } else {
          params = {
              TableName: 'Order', 
              FilterExpression: '#status = :status OR attribute_not_exists(#status)',
              ExpressionAttributeNames: {
                  '#status': 'status',
                  '#userID': 'userID',
              },
              ExpressionAttributeValues: {
                  ':status': status,
                  ':userID': cur_userObj.username,
              },
          };
          console.log("else");
      }

      console.log("DynamoDB my Query Params:", params);

      const result = await dynamoDB.send(new ScanCommand(params));
      //console.log("DynamoDB Result:", result);

      const products = result.Items; 
      console.log(products);

      res.render('history.ejs', { products: products });
  } catch (error) {
      console.error("Error fetching data from DynamoDB:", error);
      res.status(500).send("Internal Server Error");
  }
});


// Logout -----------------------------------------------------
router.get('/logout', (req, res) => {
  cur_user = '';
  cur_userObj = {};
  default_userPic = './img/userprofile.png';
  res.redirect('/');
})


module.exports = router