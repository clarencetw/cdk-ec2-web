import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class CdkEc2WebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true,
    });

    const host = new ec2.BastionHostLinux(this, "BastionHost", {
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
    });
    host.allowSshAccessFrom(ec2.Peer.ipv4('114.114.192.168/32'));
    
    const ec2Instance = new ec2.Instance(this, "Instance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: new ec2.AmazonLinuxImage(),
      keyName: "Clarence",
    });
    ec2Instance.connections.allowFrom(host, ec2.Port.tcp(22))

    new cdk.CfnOutput(this, 'PublicDnsName', {
      value: ec2Instance.instancePublicDnsName
    })
  }
}
