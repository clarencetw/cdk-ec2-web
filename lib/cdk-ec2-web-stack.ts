import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';

export class CdkEc2WebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      natGateways: 1
    });

    const ec2Instance = new ec2.Instance(this, "Instance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: new ec2.AmazonLinuxImage(),
    });
    ec2Instance.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "ssmmessages:*",
          "ssm:UpdateInstanceInformation",
          "ec2messages:*",
        ],
        resources: ["*"],
      })
    );
    ec2Instance.addUserData(
      "yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm"
    );

    new cdk.CfnOutput(this, 'InstanceId', {
      value: ec2Instance.instanceId
    })
  }
}
