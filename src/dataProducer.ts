import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient, AddPermissionCommand, SendMessageCommand } from "@aws-sdk/client-sqs";
import {
    PutCommand,
    DynamoDBDocumentClient,
    GetCommand,
    DeleteCommand
} from "@aws-sdk/lib-dynamodb";

const api = require('lambda-api')();

// Declare your Lambda handler
exports.handler = async (event:APIGatewayProxyEvent, context:Context ) => {
    return await api.run(event, context);
};

// Retrieve the table name from environment variable
const dynamoDBTableName = process.env.TABLE_NAME;
const dynamodb = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(dynamodb);

// Retrieve the queue name from environment variable
const queueUrl = process.env.QUEUE_URL;
const sqsClient = new SQSClient({});

// Create a Product
api.post('/product', async (req: any, res: any) => {
    let id = req.body.id;
    let product_name = req.body.product_name;
    const param = { TableName: dynamoDBTableName,Item: {'id': id, 'SK': id+'TS#', 'product_name':product_name} };
    //Publish message to DynamoDB
    await ddb.send(new PutCommand(param));

    // Send the same message to SQS
    console.log('queueUrl'+queueUrl);
    var queueParams = {
        DelaySeconds: 2,
        MessageBody: JSON.stringify(req.body),
        QueueUrl: queueUrl
      };
    const command = new SendMessageCommand(queueParams);
    await sqsClient.send(command);
    console.log('Message send to SQS');
    return res.status(200).json({"message":"product created"});
});

// Retrieve a product
api.get('/product/:id', async (req: any, res: any) => {
    let id = req.params.id;
    let params = {Key: {'id': id, 'SK':id+'TS#'}, TableName: dynamoDBTableName};
    console.log('Get Product param'+params);
    const data = await ddb.send(new GetCommand(params));
    console.log('Get Product Data'+data);

    let body;
    if (data.Item){
        body = data.Item;
    }else{
        return res.status(404).json({"message":"no data found for id"+id})
    }
    return res.status(200).json({"data": body});
});

// Delete a product 
// Retrieve a product
api.delete('/product/:id', async (req: any, res: any) => {
    let id = req.params.id;
    let params = {Key: {'id': id, 'SK':id+'TS#'}, TableName: dynamoDBTableName};
    console.log('Product param'+params);
    const data = await ddb.send(new DeleteCommand(params));
    console.log('Get Product Data'+data);
    return res.status(200).json({"message": "deleted"});
});