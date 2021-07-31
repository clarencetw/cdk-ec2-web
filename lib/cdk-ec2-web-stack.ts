import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class CdkEc2WebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      natGateways: 1
    });

    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Allow ssh access to ec2 instances",
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      ec2.Peer.ipv4('114.114.192.168/32'),
      ec2.Port.tcp(22),
      "Allow ssh access from clarence"
    );

    const ec2Instance = new ec2.Instance(this, "Instance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: new ec2.AmazonLinuxImage(),
      securityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      keyName: "Clarence",
    });

    new cdk.CfnOutput(this, 'InstanceIP', {
      value: ec2Instance.instancePublicDnsName
    })
  }
}
