import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as targets from "@aws-cdk/aws-elasticloadbalancingv2-targets";
import * as assets from '@aws-cdk/aws-s3-assets';
import * as path from 'path';

export class CdkEc2WebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true,
    });
    
    const asset = new assets.Asset(this, 'Asset', { path: path.join(__dirname, '../ec2-configure/configure.sh') });
    const instance = new ec2.Instance(this, "Instance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      keyName: "Clarence",
    });
    instance.connections.allowFrom(ec2.Peer.ipv4('114.114.192.168/32'), ec2.Port.tcp(22))
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(80))

    const localPath = instance.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    });
    instance.userData.addExecuteFileCommand({
      filePath: localPath,
      arguments: '--verbose -y'
    });
    asset.grantRead(instance.role);

    const lb = new elbv2.NetworkLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });
    const listener = lb.addListener('Listener', {
      port: 80,
    });
    listener.addTargets('Targets', {
      port: 80,
      targets: [new targets.InstanceTarget(instance)]
    });
    new cdk.CfnOutput(this, 'PHPInfo', {
      value: `http://${lb.loadBalancerDnsName}/phpinfo.php`
    })
  }
}
