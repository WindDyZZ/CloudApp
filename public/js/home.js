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
            
            UpdateExpression: "set cart = list_append(cart, :pid)",
            ExpressionAttributeValues: {
                ":pid": [pid], 
            },
            ReturnValues: "ALL_NEW",
        });

        const response = await dynamoDB.send(command);
       
        return response.Attributes.cart;
        // return false;

    } catch (error) {
        console.error('Error updating item in DynamoDB:', error);
        throw error; 
    }
}


