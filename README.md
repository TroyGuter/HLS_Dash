HLS_Dash - LS-AMER LPV Dashboard

A real-time HLS livestream monitoring dashboard built with React and TypeScript, featuring multi-stream video playback and CloudWatch metrics integration.

Overview

HLS_Dash is a web-based dashboard for monitoring and viewing multiple AWS MediaPackage HLS livestreams simultaneously. The application provides flexible layout options, real-time CloudWatch metrics, and a responsive interface for operations teams.

Features
• Multi-Stream Video Playback: View 1, 2, 4, or 6 HLS streams simultaneously
• Flexible Layouts: Dynamic grid layouts with preset buttons for quick switching
• CloudWatch Metrics Integration: Real-time monitoring of stream health, bitrate, latency, and error rates
• Channel Selection: Dropdown selectors to switch between available MediaPackage channels
• Persistent Preferences: Layout preferences saved to browser localStorage
• Responsive Design: Adapts to different screen sizes and devices

AWS Architecture

Architecture Diagram

Components
AWS Amplify
• Purpose: Hosts and serves the React application
• Features:
• Continuous deployment from GitHub
• HTTPS with SSL certificate
• Environment variable management
• Build and deployment automation
• URL Format: https://main.d[id].amplifyapp.com
API Gateway
• Endpoint: https://[api-id].execute-api.us-east-2.amazonaws.com/prod
• Authentication: API Key (x-api-key header)
• Endpoints:
• GET /channels - Retrieves list of MediaPackage channels and endpoints
• POST /metrics - Fetches CloudWatch metrics for specified channel
• Features:
• CORS enabled for browser access
• IAM authentication configured
• Usage plan with API key management
AWS Lambda Functions

GetChannels Function
• Runtime: Node.js 20.x
• Purpose: Queries MediaPackage API to retrieve channel information
• Returns: Array of channels with descriptions and HLS endpoint URLs
• Permissions: MediaPackage read access

GetCloudWatchMetrics Function
• Runtime: Node.js 20.x
• Purpose: Fetches CloudWatch metrics for MediaPackage channels
• Metrics Retrieved:
• EgressBytes (bandwidth usage)
• EgressRequestCount (viewer requests)
• EgressResponseTime (latency)
• Error rates (4xx status codes)
• Permissions: CloudWatch read access (CloudWatchReadOnlyAccess policy)
AWS MediaPackage
• Region: us-east-2
• Purpose: Origin server for HLS livestreams
• Features:
• Multiple channels with unique endpoints
• HLS packaging and delivery
• CloudWatch metrics integration
Amazon CloudWatch
• Namespace: AWS/MediaPackage
• Metrics Collected:
• EgressBytes - Data delivered to viewers
• EgressRequestCount - Number of requests
• EgressResponseTime - Response latency
• IngressBytes - Data received from source
• Retention: 15 months
• Granularity: 1-minute intervals

Technology Stack

Frontend
• React 18.2.0 - UI framework
• TypeScript 4.9.5 - Type safety
• HLS.js 1.6.15 - HLS video playback
• Webpack 5 - Module bundler
• Babel 7 - JavaScript transpiler

AWS SDK
• @aws-sdk/client-cloudwatch 3.962.0 - CloudWatch API client
• @aws-sdk/credential-providers 3.962.0 - AWS authentication

Build Tools
• webpack-dev-server - Local development
• ts-loader - TypeScript compilation
• babel-loader - JavaScript transpilation
• html-webpack-plugin - HTML generation
• dotenv - Environment variable management

Project Structure

Setup Instructions

Prerequisites
• Node.js 18+ and npm
• AWS Account with appropriate permissions
• GitHub account (for Amplify deployment)

Local Development
Clone the repository
Install dependencies
Configure environment variables

Create a .env file in the project root:
Start development server

The app will open at http://localhost:3000
Build for production

Output will be in the dist/ directory

AWS Setup
MediaPackage Channels
• Create MediaPackage channels in us-east-2 region
• Configure HLS endpoints
• Note channel IDs and descriptions
Lambda Functions

GetChannels Lambda
• Runtime: Node.js 20.x
• Handler: index.handler
• Permissions: MediaPackage read access

GetCloudWatchMetrics Lambda
• Runtime: Node.js 20.x
• Handler: index.handler
• Permissions: CloudWatchReadOnlyAccess
API Gateway
Create REST API
Create resources: /channels and /metrics
Create methods:
• GET /channels → GetChannels Lambda
• POST /metrics → GetCloudWatchMetrics Lambda
Enable CORS on both endpoints
Create API key and usage plan
Deploy to prod stage
Amplify Deployment
Go to AWS Amplify console
Click "New app" → "Host web app"
Connect GitHub repository
Configure build settings:
Add environment variables:
• REACTAPPAPI_URL
• REACTAPPAPI_KEY
Deploy

Usage

Layout Selection
• Click preset buttons in the header: "1 Player", "2 Players", "4 Players", or "6 Players"
• Layout preference is automatically saved to browser localStorage

Channel Selection
• Use dropdown menus below each video player to switch between available channels
• Channel names are fetched from MediaPackage via API Gateway

CloudWatch Metrics
• Click the "← Metrics" button on the right side of the screen
• View real-time metrics for all active streams:
• Bitrate: Data transfer rate (Mbps)
• Requests: Number of viewer requests
• Latency: Average response time (ms)
• Error Rate: Percentage of failed requests
• Metrics auto-refresh every 60 seconds
• Toggle auto-refresh on/off as needed

Metrics Explained

Bitrate (Mbps)
• Calculated from EgressBytes over 5-minute periods
• Indicates stream quality and bandwidth usage
• Typical values:
• SD: 1-3 Mbps
• HD: 3-6 Mbps
• Full HD: 5-10 Mbps

Requests
• Total HTTP requests to MediaPackage endpoint
• Each viewer makes 6-30 requests/minute depending on segment duration
• Use to estimate viewer count

Latency (ms)
• Average response time from MediaPackage
• Performance indicators:
• Excellent:  500ms

Error Rate (%)
• Percentage of requests with 4xx/5xx status codes
• Health indicators:
• Excellent:  5%
• Critical: > 10%

Security
• API Key Authentication: All API Gateway requests require x-api-key header
• Environment Variables: Sensitive credentials stored in Amplify environment variables
• HTTPS Only: All traffic encrypted via SSL/TLS
• IAM Roles: Lambda functions use least-privilege IAM roles
• CORS Configuration: Restricted to necessary origins

Troubleshooting

Videos Not Loading
• Check MediaPackage channel status in AWS console
• Verify API Gateway endpoint is accessible
• Check browser console for CORS errors
• Confirm API key is valid and associated with usage plan

Metrics Not Displaying
• Verify Lambda function has CloudWatch read permissions
• Check Lambda logs in CloudWatch for errors
• Ensure /metrics endpoint is deployed in API Gateway
• Confirm channels have recent activity (metrics require data)

Build Failures
• Clear webpack cache: rm -rf dist
• Delete node_modules and reinstall: npm install
• Check for TypeScript errors: npx tsc --noEmit

Amplify Deployment Issues
• Verify environment variables are set in Amplify console
• Check build logs for errors
• Ensure baseDirectory: dist is correct in build settings
• Confirm index.html exists in dist folder after build

Contributing
Fork the repository
Create a feature branch: git checkout -b feature-name
Commit changes: git commit -m 'Add feature'
Push to branch: git push origin feature-name
Submit a pull request

License

This project is proprietary and confidential.

Support

For issues or questions, contact the LS-AMER LPV team.

Changelog

Version 1.0.0 (January 2026)
• Initial release
• Multi-stream HLS video playback
• Layout selector (1, 2, 4, 6 players)
• CloudWatch metrics integration
• API Gateway + Lambda backend
• AWS Amplify deployment
• Webpack 5 build system with environment variable support
