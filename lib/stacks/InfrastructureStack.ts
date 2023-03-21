import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { GatewayVpcEndpointAwsService, InterfaceVpcEndpointAwsService, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

//https://towardsaws.com/amazon-eventbridge-custom-event-bus-example-8f88ccb9766

export class InfrastructureStack extends Stack{
    public readonly vpc: Vpc;

    // Create a VPC
    constructor(scope: Construct, id: string, props?: StackProps){
        super(scope, id, props);
        this.vpc = new Vpc(this, "Vpc");
          this.vpc.addGatewayEndpoint('DynamoDB', { service: GatewayVpcEndpointAwsService.DYNAMODB });
          this.vpc.addGatewayEndpoint('S3', { service: GatewayVpcEndpointAwsService.S3 });
          this.vpc.addInterfaceEndpoint('CloudWatch', { service: InterfaceVpcEndpointAwsService.CLOUDWATCH});
          this.vpc.addInterfaceEndpoint('SQS', { service: InterfaceVpcEndpointAwsService.SQS });
    }
}