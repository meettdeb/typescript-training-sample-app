import * as cdk from 'aws-cdk-lib';
import { ApplicationStack } from '../lib/stacks/applicationStack';
import { InfrastructureStack } from '../lib/stacks/InfrastructureStack';
import { MonitoringStack } from '../lib/stacks/monitoringStack';

const app = new cdk.App();

// Creates the VPC and associates
const infrastack = new InfrastructureStack(app, "InfrastructureStack");
      
//Creates the application Stack
const applicationStack = new ApplicationStack(app, "ApplicationStack",infrastack.vpc);

// Creates the monitoring stack
const monitoringStack = new MonitoringStack(app,"MonitoringStack",{
    applicationStack: applicationStack,
    dashboardName: 'MonitoringDashboard'
});       