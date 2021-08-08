import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as assets from '@aws-cdk/aws-s3-assets';
import * as path from 'path';

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
    
    const asset = new assets.Asset(this, 'Asset', { path: path.join(__dirname, '../ec2-configure/configure.sh') });
    const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      minCapacity: 3,
      maxCapacity: 5,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      keyName: "Clarence",
    });
    asg.connections.allowFrom(host, ec2.Port.tcp(22))

    const localPath = asg.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    });
    asg.userData.addExecuteFileCommand({
      filePath: localPath,
      arguments: '--verbose -y'
    });
    asset.grantRead(asg.role);

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });
    const listener = lb.addListener('Listener', {
      port: 80,
    });
    listener.addTargets('Targets', {
      port: 80,
      targets: [asg]
    });

    asg.scaleOnCpuUtilization('CpuUtilization', {
      targetUtilizationPercent: 50
    });
    asg.scaleOnIncomingBytes('IncomingBytes', {
      targetBytesPerSecond: 10 * 1024 * 1024
    });
    asg.scaleOnOutgoingBytes('OutgoingBytes', {
      targetBytesPerSecond: 10 * 1024 * 1024
    });
    asg.scaleOnRequestCount('RPS', {
      targetRequestsPerSecond: 1000
    });

    asg.scaleOnSchedule('PrescaleInTheMorning', {
      schedule: autoscaling.Schedule.cron({ hour: '8', minute: '0' }),
      minCapacity: 6,
    });
    asg.scaleOnSchedule('AllowDownscalingAtNight', {
      schedule: autoscaling.Schedule.cron({ hour: '20', minute: '0' }),
      minCapacity: 3
    });

    new cdk.CfnOutput(this, 'PHPInfo', {
      value: `http://${lb.loadBalancerDnsName}/phpinfo.php`
    })
  }
}
