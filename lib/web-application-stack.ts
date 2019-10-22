
import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import cloudfront = require('@aws-cdk/aws-cloudfront');
import iam = require('@aws-cdk/aws-iam');
import s3deploy = require('@aws-cdk/aws-s3-deployment');
import path = require('path');

export class WebApplicationStack extends cdk.Stack {
  constructor(app: cdk.App, id: string) {
    super(app, id);
    const webAppRoot = path.resolve(__dirname, '..', '..', 'web');
    // The code that defines your stack goes here
    
    const bucket = new s3.Bucket(this, "Bucket", {
      websiteIndexDocument: "index.html"
    });
    const origin = new cloudfront.CfnCloudFrontOriginAccessIdentity(this, "BucketOrigin", {
      cloudFrontOriginAccessIdentityConfig: {
        comment: "mythical-mysfits"
      }
    });
    bucket.grantRead(new iam.CanonicalUserPrincipal(
      origin.attrS3CanonicalUserId
    ));
    
    const cdn = new cloudfront.CloudFrontWebDistribution(this, "CloudFront", {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      originConfigs: [
        {
          behaviors: [
            {
              isDefaultBehavior: true,
              maxTtl: undefined,
              allowedMethods:
                cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS
            }
          ],
          originPath: `/web`,
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentityId: origin.ref
          }
        }
      ]
    });
    
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [
        s3deploy.Source.asset(webAppRoot)
      ],
      destinationKeyPrefix: "web/",
      destinationBucket: bucket,
      distribution: cdn,
      retainOnDelete: false
    });
    
    new cdk.CfnOutput(this, "CloudFrontURL", {
      description: "The CloudFront distribution URL",
      value: "https://" + cdn.domainName
    });
  }
}

