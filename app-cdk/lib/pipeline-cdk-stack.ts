import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_codeconnections as codeconnections } from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';

export class PipelineCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const SourceConnection = new codeconnections.CfnConnection(this, 'CICD_Workshop_Connection', {
        connectionName: 'CICD_Workshop_Connection',
        providerType: 'GitHub',
    });

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false,
      pipelineType: codepipeline.PipelineType.V2,
      executionMode: codepipeline.ExecutionMode.QUEUED,
    });

    const codeBuild = new codebuild.PipelineProject( this, 'CodeBuild', {
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          privileged: true,
          computeType: codebuild.ComputeType.LARGE,
        },
        buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec_test.yml'),
      }
    );

    const sourceOutput = new codepipeline.Artifact();
    const unitTestOutput = new codepipeline.Artifact();

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeStarConnectionsSourceAction({
          actionName: 'GitHub',
          owner: 'aryanamoh',
          repo: 'CICD_Workshop',
          output: sourceOutput,
          branch: 'main',
          connectionArn: 'arn:aws:codeconnections:us-west-2:350134814777:connection/15d805fa-17cd-43f7-8df2-8770f82a6d74',
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Code-Quality-Testing',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Unit-Test',
          project: codeBuild,
          input: sourceOutput,
          outputs: [unitTestOutput],
        }),
      ],
    });

    new CfnOutput(this, 'SourceConnectionArn', {
        value: SourceConnection.attrConnectionArn,
    });

    new CfnOutput(this, 'SourceConnectionStatus', {
        value: SourceConnection.attrConnectionStatus,
    });
  }
}