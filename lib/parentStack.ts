import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationStack } from './stacks/applicationStack';
import { InfrastructureStack } from './stacks/InfrastructureStack';
import { MonitoringStack } from './stacks/monitoringStack';

/*export class parentStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);
    // Creates the VPC and associates
      const infrastack = new InfrastructureStack(this, "InfrastructureStack");
      
    //Creates the application Stack
      const applicationStack = new ApplicationStack(this, "ApplicationStack",infrastack.vpc);
    // Creates the monitoring stack
      const MonioringStack = new MonitoringStack(this,"MonitoringStack");          
    }
}*/