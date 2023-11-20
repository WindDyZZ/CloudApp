const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { UpdateCommand, DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocument.from(client);

async function redirectToCart(pid, email) {
    try {
        const command = new UpdateCommand({
            TableName: "Users",
            Key: {
                email: email,
            },
            // Use list_append to add the new item to the existing list
            UpdateExpression: "set cart = list_append(cart, :pid)",
            ExpressionAttributeValues: {
                ":pid": [pid], // Wrap pid in an array to make it a list
            },
            ReturnValues: "ALL_NEW",
        });

        const response = await dynamoDB.send(command);
        console.log(response.Attributes.cart); // Log the updated cart

        // You can return the updated cart or any other information you need
        return response.Attributes.cart;
    } catch (error) {
        console.error('Error updating item in DynamoDB:', error);
        throw error; // Throw the error so the caller can handle it
    }
}


