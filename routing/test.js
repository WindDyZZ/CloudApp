// awsConfig.js
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: 'ASIAQOOHCLGLCH3WVQPY',
    secretAccessKey: '2A273dzDyfKVdo7B6hgvKLwqJHHF0QFs8qWcViDI',
    region: 'us-east-1',
});

module.exports = AWS.config;


// route1 >> /history.
router.get("/history", async (req, res) => {
    const status = req.query.stt;

    console.log("Status:", status);
    console.log("current user is", cur_userObj.username);
  
    try {
        let params;

        if (status === 'cancel' || status === 'purchased' || status === 'refund') {
            params = {
                TableName: 'order',
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
                TableName: 'order',
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
                TableName: 'order', 
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

        // const result = await dynamoDB.send(new ScanCommand(params));
        //console.log("DynamoDB Result:", result);
        // const products = result.Items; 

        // compare table order & product
        const orderResult = await dynamoDB.send(new ScanCommand(params));
        const orderItems = orderResult.Items;

        console.log("order item", orderItems);

        // Retrieve additional information from the product table for each order item
        const productItemsPromises = orderItems.map(async (orderItem) => {
            const productID = orderItem.productID; 
        
            const getProductParams = {
                TableName: 'product',
                Key: {
                    'productID': productID,
                },
            };

            console.log('DynamoDB Query Params:', getProductParams);

            // error
            try {
                const productResult = await dynamoDB.send(new GetCommand(getProductParams));
        
                // Check if productResult.Item is defined before returning
                if (productResult.Item) {
                    return productResult.Item;
                } else {
                    // Handle case where product is not found
                    console.error(`Product not found for productID: ${productID}`);
                    return null;
                }
            } catch (error) {
                // Handle DynamoDB errors
                console.error(`Error fetching product from DynamoDB for productID ${productID}:`, error);
                return null;
            }

        });

        // Wait for all product queries to complete
        const productItems = await Promise.all(productItemsPromises);

        // Combine order and product information
        const combinedData = orderItems.map((orderItem, index) => {
            return {
                ...orderItem,
                product: productItems[index],
            };
        });

        console.log(combinedData);
  
        res.render('history.ejs', { combinedData: combinedData });
    } catch (error) {
        console.error("Error fetching data from DynamoDB:", error);
        res.status(500).send("Internal Server Error");
    }
});


// ver 2

router.get("/history", async (req, res) => {
    const status = req.query.stt;

    console.log("Status:", status);
    console.log("current user is", cur_userObj.username);

    try {
        let params;

        if (status === 'cancel' || status === 'purchased' || status === 'refund') {
            params = {
                RequestItems: {
                    'order': {
                        Keys: [
                            {
                                'userID': cur_userObj.username,
                                'orderID': 'placeholder', // Replace 'placeholder' with the actual orderID values
                            },
                            // Add more keys as needed
                        ],
                        ProjectionExpression: 'userID, orderID, detail, name, price, productID, status, tp_cost',
                        FilterExpression: '#status = :status',
                        ExpressionAttributeNames: {
                            '#status': 'status',
                        },
                        ExpressionAttributeValues: {
                            ':status': status,
                        },
                    },
                    'product': {
                        Keys: [
                            // Replace 'placeholder' with the actual productID values from orderItems
                            { 'productID': 'placeholder' },
                            // Add more keys as needed
                        ],
                        ProjectionExpression: 'productID, description, img_path',
                    },
                },
            };

            console.log("status is click from button");
        } else if (status === undefined || status === 'all') {
            params = {
                RequestItems: {
                    'order': {
                        Keys: [
                            {
                                'userID': cur_userObj.username,
                                'orderID': 'orderID',
                            },
                           
                        ],
                        ProjectionExpression: 'userID, orderID, detail, name, price, productID, status, tp_cost',
                    },
                    'product': {
                        Keys: [
                           
                            { 'productID': 'productID' },
        
                        ],
                        ProjectionExpression: 'productID, description, img_path',
                    },
                },
            };
            console.log("status is undefined");
        } else {
            params = {
                RequestItems: {
                    'order': {
                        Keys: [
                            {
                                'userID': cur_userObj.username,
                                'orderID': 'orderID', 
                            },
                           
                        ],
                        ProjectionExpression: 'userID, orderID, detail, name, price, productID, status, tp_cost',
                        FilterExpression: '#status = :status OR attribute_not_exists(#status)',
                        ExpressionAttributeNames: {
                            '#status': 'status',
                        },
                        ExpressionAttributeValues: {
                            ':status': status,
                        },
                    },
                    'product': {
                        Keys: [
                            
                            { 'productID': 'productID' },
                            // Add more keys as needed
                        ],
                        ProjectionExpression: 'productID, description, img_path',
                    },
                },
            };
            console.log("else");
        }

        console.log("DynamoDB my Query Params:", params);

        const batchResult = await dynamoDB.send(new BatchGetItemCommand(params));

        const orderItems = batchResult.Responses.order;
        const productItems = batchResult.Responses.product;

        // Combine order and product information
        const combinedData = orderItems.map((orderItem) => {
            const correspondingProduct = productItems.find(product => product.productID === orderItem.productID);
            return {
                ...orderItem,
                product: correspondingProduct || null,
            };
        });

        console.log(combinedData);

        res.render('history.ejs', { combinedData: combinedData });
    } catch (error) {
        console.error("Error fetching data from DynamoDB:", error);
        res.status(500).send("Internal Server Error");
    }
});

// in history.js

// <!DOCTYPE html>
// <html lang="en">

// <head>
//     <title> OTOP | History </title>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <link rel="stylesheet" href="./style/style.css">
// </head>

// <body>
//     <div class="container">
//         <div class="top-banner"></div>
//         <div class="nav-bar">
//             <a class="logo" href="home">OTOP</a>
//             <div class="page-bar">
//                 <div class="cur-page"> > History </div>
//                 <div class="icon">
//                     <svg xmlns="http://www.w3.org/2000/svg" width="35" height="50" viewBox="0 0 512 512">
//                         <style>  svg { fill: #741D14 }  </style>
//                         <path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24H134.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24V256c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z" />
//                     </svg>
//                 </div>
//             </div>

//         </div>

//         <div class="his-bar">

//             <div class="bar-content">
//                 <nav id="history_nav">
//                     <a href="history?stt=all"> All </a>
//                     <a href="history?stt=purchased"> Purchased </a>
//                     <a href="history?stt=cancel"> Cancel Order </a>
//                     <a href="history?stt=refund"> Refunds/Returns </a>
//                 </nav>
//             </div>

//         </div>

//         <div class="content" style="padding-bottom: 20px;" >
//             <div class="his-content" >

//                 <!-- from DynamoDB -->
//                 <%= console.log(combinedData) %>

//                 <% combinedData.forEach(combinedItem => { %>
//                     <% console.log(combinedItem); %>

//                     <div class="product-name">
//                         <h4> <span> Suggested </span>
//                             <%= combinedItem.product && combinedItem.product.name %>
//                         </h4>
//                     </div>

//                     <hr>

//                     <div class="product-info">

//                         <!-- from s3 -->
//                         <!-- <img class="pd-img" src="img/ex-product.png" alt=""> -->
//                         <!-- <img class="pd-img" 
//                             src="https://otop-test.s3.amazonaws.com/image/product.webp" 
//                             alt=""> -->
//                         <img class="pd-img" src="<%= combinedItem.product && combinedItem.product.imageURL %>" alt="">

//                         <div class="product-text">
//                             <h4> details: <%= combinedItem.product && combinedItem.product.detail %> </h4>
//                             <h4> transportation cost : <%= combinedItem.product && combinedItem.product.tp_cost %>  </h4>
//                             <h4> product price : <%= combinedItem.product && combinedItem.product.price %> </h4>
//                             <h2> Total Price: 
//                                 <%= parseFloat(combinedItem.product && combinedItem.product.tp_cost) + parseFloat(combinedItem.product && combinedItem.product.price) %>
//                             </h2>
//                         </div>

//                     </div>
//                     <button class="button-1"> Buy Again </button>
//                     <% }); %>
//                 </div>
//         </div>

//     </div>

// </body>

// </html>

