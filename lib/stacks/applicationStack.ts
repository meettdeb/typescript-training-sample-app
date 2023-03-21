import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode,Table }from 'aws-cdk-lib/aws-dynamodb';
import { Duration, NestedStack, Stack, StackProps } from 'aws-cdk-lib';
import { Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Queue } from 'aws-cdk-lib/aws-sqs';

export class ApplicationStack extends Stack {
    public readonly table : Table;
    public readonly producerLambda : Function; 
    public readonly apiGateway : LambdaRestApi;
    private readonly lambdaRole : Role;
    public readonly transferQueue : Queue;

    constructor(scope: Construct, id: string, vpc: Vpc, props?: StackProps) {
        super(scope, id, props);
        this.table = this.createTable();
        this.transferQueue = this.createQueue();
        this.lambdaRole = this.createRoleforLambda(this.transferQueue.queueArn);
        this.producerLambda = this.createProducerLambda(vpc);
        this.apiGateway = this.createApiGateway();   
    }
    
    /**
     * Creates a DynamoDB table with a primary key and sort key
     * @returns Table
     */
    private createTable = (): Table => {
        return new Table(this, 'Table', { 
            partitionKey: { name: 'id', type: AttributeType.STRING }, 
            sortKey: {
                name: 'SK',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PAY_PER_REQUEST, 
            pointInTimeRecovery: true,
          });      
    }

    private createQueue() : Queue{
        return new Queue(this, 'TransferStatusQueue', {
            visibilityTimeout: Duration.seconds(10),
            queueName: 'TransferStatusQueue'
          });
    }

    /**
     * Create Role for Lambda with least permissives permissions
     * Allow ReadOnly role to the table created
     * Allow Policies for xRay and CloudWatch
     */
    private createRoleforLambda(queueArn : string): Role{
        const tableIAMActions = [
            'dynamodb:BatchGetItem',
            'dynamodb:PutItem',
            'dynamodb:DescribeTable',
            'dynamodb:GetItem',
            'dynamodb:Scan',
            'dynamodb:Query',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
        ]
        const policyDocument = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    sid: 'AllowTableReadWrite',
                    effect: Effect.ALLOW,
                    actions: tableIAMActions,
                    resources: [this.table.tableArn,`${this.table.tableArn}/index/*`],
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['cloudwatch:PutMetricData', 'cloudwatch:PutMetricAlarm', 'logs:*'],
                    resources: ['*'],
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                    resources: ['*'],
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['cloudwatch:PutMetricData', 'cloudwatch:PutMetricAlarm', 'logs:*'],
                    resources: ['*'],
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['ec2:DescribeNetworkInterfaces', 'ec2:CreateNetworkInterface', 'ec2:DeleteNetworkInterface','ec2:DescribeInstances','ec2:AttachNetworkInterface'],
                    resources: ['*'],
                  }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                      'sqs:ChangeMessageVisibility',
                      'sqs:DeleteMessage',
                      'sqs:GetQueueAttributes',
                      'sqs:GetQueueUrl',
                      'sqs:ReceiveMessage',
                      'sqs:SendMessage'
                    ],
                    resources: [queueArn],
                  }),
            ],
        }) 
        return new Role(this, 'LambdaRole',{
            roleName: 'LambdaRole',
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: { policyDocument },
        })
    }
    
    /**
     * L2 CDK construct to create the Lambda Function
     * Passing the least permissive role and other environment variables
     * @returns Lambda Function
     */
    private createProducerLambda(vpc: Vpc): NodejsFunction {
        return new NodejsFunction(this, 'DataProducerHandler', {
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `../../src/dataProducer.ts`),
            handler: 'handler',
            role: this.lambdaRole,
            vpc: vpc,
            environment: {
                TABLE_NAME: this.table.tableName,
                QUEUE_URL: this.transferQueue.queueUrl
            }
         });
    }

    /** create an LambdaRestApi L3 which associates the API Gateway to Lambda*/
    private createApiGateway = (): LambdaRestApi => {
        return new LambdaRestApi(this, 'Endpoint',{
            handler: this.producerLambda
        })
    }

    //Exercise 
    //Create a Lambda that reads messages from the Queue
    

}