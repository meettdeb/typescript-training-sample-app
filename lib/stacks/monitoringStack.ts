import { App, Aws, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { ApplicationStack } from './applicationStack';
import { GraphWidget, Dashboard, LogQueryWidget, TextWidget } from 'aws-cdk-lib/aws-cloudwatch';
import { Function } from 'aws-cdk-lib/aws-lambda';

export type MonitoringStackProps = {
    applicationStack: ApplicationStack
    dashboardName: string
} & StackProps

export class MonitoringStack  extends Stack {
    private dashboard: Dashboard
    private lambdaFunction: Function
    
    constructor(parent: App, name: string, props: MonitoringStackProps) {
        super(parent, name, props);
        this.createDashboard(props);

    }
    
    createDashboard(props: MonitoringStackProps){
        this.dashboard = new Dashboard(this, "SampleLambdaDashboard", {
            dashboardName: props.dashboardName
        })
        this.lambdaFunction = props.applicationStack.producerLambda;

        this.dashboard.addWidgets(new TextWidget({
            markdown: `# Dashboard: ${props.applicationStack.producerLambda.functionName}`,
            height: 1,
            width: 24
        }))

        // Create CloudWatch Dashboard Widgets: Errors, Invocations, Duration, Throttles
      this.dashboard.addWidgets(new GraphWidget({
        title: "Invocations",
        left: [props.applicationStack.producerLambda.metricInvocations()],
        width: 24
      }))
  
      this.dashboard.addWidgets(new GraphWidget({
        title: "Errors",
        left: [this.lambdaFunction.metricErrors()],
        width: 24
      }))
  
      this.dashboard.addWidgets(new GraphWidget({
        title: "Duration",
        left: [this.lambdaFunction.metricDuration()],
        width: 24
      }))
  
      this.dashboard.addWidgets(new GraphWidget({
        title: "Throttles",
        left: [this.lambdaFunction.metricThrottles()],
        width: 24
      }))
  
      // Create Widget to show last 20 Log Entries
      this.dashboard.addWidgets(new LogQueryWidget({
        logGroupNames: [this.lambdaFunction.logGroup.logGroupName],
        queryLines:[
          "fields @timestamp, @message",
          "sort @timestamp desc",
          "limit 20"],
        width: 24,
        }))

      // Generate Outputs
      const cloudwatchDashboardURL = `https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2.#dashboards:name=${props.dashboardName}`;
      new CfnOutput(this, 'DashboardOutput', {
        value: cloudwatchDashboardURL,
        description: 'URL of Sample CloudWatch Dashboard',
        exportName: 'SampleCloudWatchDashboardURL'
      });
      
    }
}