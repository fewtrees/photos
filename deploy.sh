#!/bin/bash
set -e

# Configuration
APP_NAME="photosphere"
REGION="us-east-1"  # Change to your preferred AWS region
S3_BUCKET="$APP_NAME-deployment"
EB_APP_NAME="$APP_NAME-app"
EB_ENV_NAME="$APP_NAME-env"

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting deployment process for $APP_NAME...${NC}"

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Create deployment package
echo -e "${YELLOW}Creating deployment package...${NC}"
mkdir -p dist
cp -r package.json package-lock.json dist/
cp -r server dist/
cp -r shared dist/
# Ensure node_modules are not included to reduce size
rm -rf dist/node_modules

# Zip the package
echo -e "${YELLOW}Creating deployment zip...${NC}"
cd dist
zip -r ../$APP_NAME-deploy.zip .
cd ..

echo -e "${GREEN}Deployment package created: $APP_NAME-deploy.zip${NC}"

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}AWS CLI not found. Please install it to continue with automatic deployment.${NC}"
    echo -e "${YELLOW}Manual deployment: Upload $APP_NAME-deploy.zip to your AWS Elastic Beanstalk environment.${NC}"
    exit 0
fi

# AWS deployment (requires AWS CLI configured)
echo -e "${YELLOW}Starting AWS deployment...${NC}"

# Check if bucket exists, create if not
if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
    echo -e "${YELLOW}Creating S3 bucket for deployment...${NC}"
    aws s3 mb "s3://$S3_BUCKET" --region "$REGION"
fi

# Upload to S3
echo -e "${YELLOW}Uploading package to S3...${NC}"
aws s3 cp "$APP_NAME-deploy.zip" "s3://$S3_BUCKET/"

# Check if application exists in Elastic Beanstalk
if ! aws elasticbeanstalk describe-applications --application-names "$EB_APP_NAME" &> /dev/null; then
    echo -e "${YELLOW}Creating Elastic Beanstalk application...${NC}"
    aws elasticbeanstalk create-application --application-name "$EB_APP_NAME" --description "$APP_NAME web application"
fi

# Check if environment exists
if ! aws elasticbeanstalk describe-environments --application-name "$EB_APP_NAME" --environment-names "$EB_ENV_NAME" &> /dev/null; then
    echo -e "${YELLOW}Creating Elastic Beanstalk environment...${NC}"
    aws elasticbeanstalk create-environment \
        --application-name "$EB_APP_NAME" \
        --environment-name "$EB_ENV_NAME" \
        --solution-stack-name "64bit Amazon Linux 2 v5.8.0 running Node.js 18" \
        --option-settings file://ebconfig.json
else
    # Deploy new version
    echo -e "${YELLOW}Deploying new version to Elastic Beanstalk...${NC}"
    aws elasticbeanstalk create-application-version \
        --application-name "$EB_APP_NAME" \
        --version-label "v-$(date +%Y%m%d%H%M%S)" \
        --source-bundle S3Bucket="$S3_BUCKET",S3Key="$APP_NAME-deploy.zip"
    
    aws elasticbeanstalk update-environment \
        --application-name "$EB_APP_NAME" \
        --environment-name "$EB_ENV_NAME" \
        --version-label "v-$(date +%Y%m%d%H%M%S)"
fi

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${BLUE}Your application should be available soon at:${NC}"
echo -e "${BLUE}$(aws elasticbeanstalk describe-environments --environment-names "$EB_ENV_NAME" --query "Environments[0].CNAME" --output text)${NC}"