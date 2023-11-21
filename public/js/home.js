const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { UpdateCommand, DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocument.from(client);

document.addEventListener('DOMContentLoaded',function(){
    alert('Hi!');
})


    let count = 0;

    testalert = () => {
        count++;
        alert(count);
    }

//     const button = document.querySelector('.btn-danger');

//     button.addEventListener('click', testalert);

//     async function redirectToCart(pid, email) {
//         try {
//             const command = new UpdateCommand({
//                 TableName: "Users",
//                 Key: {
//                     email: email,
//                 },
//                 UpdateExpression: "set cart = list_append(cart, :pid)",
//                 ExpressionAttributeValues: {
//                     ":pid": [pid],
//                 },
//                 ReturnValues: "ALL_NEW",
//             });

//             const response = await dynamoDB.send(command);

//             return response.Attributes.cart;
//         } catch (error) {
//             console.error('Error updating item in DynamoDB:', error);
//             throw error;
//         }
//     }

//     const user_email = document.getElementById('email');

//     const params_username = {
//         TableName: 'Users',
//         FilterExpression: 'email =  :u',
//         ExpressionAttributeNames: {
//             '#email': 'email',
//             '#cart': 'cart',
//         },
//         ExpressionAttributeValues: { ':u': user_email },
//         ProjectionExpression: "#cart"
//     };

//     try {
//         const responseUsername = await dynamoDB.send(new ScanCommand(params_username));

//         count = responseUsername.Items.length;
//     } catch (error) {
//         alert('error');
//     }



