# HLS Video Player Dashboard

A React-based dashboard for streaming HLS (HTTP Live Streaming) video content with dynamic AWS MediaPackage integration.

## Features

- **Dynamic HLS stream discovery**: Automatically fetches all MediaPackage channels from your AWS account
- **Multi-stream playback**: Display up to 6 concurrent HLS video streams
- **Real-time channel selection**: Dropdown menus populated with actual channel names from AWS
- **AWS MediaPackage integration**: Direct integration with AWS MediaPackage endpoints
- **Responsive grid layout**: Automatically adjusts video layout based on screen size
- **Cross-browser compatibility**: Uses hls.js for browsers without native HLS support
- **Error handling**: Built-in error logging for stream and API issues

## Technology Stack

- **React 18** with TypeScript
- **hls.js** for HLS video streaming
- **AWS Lambda** for MediaPackage API integration
- **AWS API Gateway** for secure API access
- **AWS SDK v3** for MediaPackage operations
- **Webpack** for bundling and development server

## AWS Architecture

```
React App → API Gateway → Lambda Function → MediaPackage API
```

- **API Gateway**: Provides CORS-enabled REST endpoint
- **Lambda Function**: Fetches channels and endpoints from MediaPackage
- **MediaPackage**: Serves HLS video streams

## Prerequisites

- Node.js (version 14 or higher)
- AWS Account with MediaPackage channels configured
- AWS CLI configured (for deployment)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-react-project
```

2. Install dependencies:
```bash
npm install
```

## AWS Setup

### 1. Deploy Lambda Function
```bash
cd lambda
npm install
zip -r mediapackage-lambda.zip .
```

Deploy using AWS CLI or upload via AWS Console.

### 2. Set up API Gateway
Follow the instructions in `lambda/api-gateway-gui-setup.md` to create:
- REST API with `/channels` resource
- GET method with Lambda proxy integration
- CORS configuration for browser access

### 3. Required IAM Permissions
Lambda execution role needs:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "mediapackage:ListChannels",
        "mediapackage:ListOriginEndpoints"
      ],
      "Resource": "*"
    }
  ]
}
```

## Usage

### Development

Start the development server:
```bash
npm start
```

The application will open at `http://localhost:8080` and automatically load your MediaPackage channels.

### Production Build

Create a production build:
```bash
npm run build
```

## Configuration

The app automatically discovers all HLS-enabled MediaPackage channels in your AWS account. No manual URL configuration required.

To change the AWS region, update the Lambda function in `lambda/index.js`:
```javascript
const client = new MediaPackageClient({ region: "your-region" });
```

## Project Structure

```
my-react-project/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.tsx            # Main application component
│   └── index.tsx          # Application entry point
├── lambda/
│   ├── index.js           # Lambda function code
│   ├── package.json       # Lambda dependencies
│   └── *.md              # Setup instructions
├── package.json           # Frontend dependencies
├── tsconfig.json          # TypeScript configuration
├── webpack.config.js      # Webpack configuration
└── README.md             # This file
```

## Features in Detail

### Dynamic Channel Discovery
- Automatically scans your AWS MediaPackage account
- Populates dropdowns with actual channel names
- Updates when new channels are added to MediaPackage

### Multi-Stream Management
- 6 independent video players
- Individual channel selection per player
- Real-time stream switching

### Error Handling
- API connection status indicators
- Stream health monitoring
- Detailed error logging in browser console

## Troubleshooting

### Common Issues

1. **"Loading channels from AWS..." persists**: Check Lambda function logs and IAM permissions
2. **CORS errors**: Verify API Gateway CORS configuration
3. **Videos not loading**: Ensure MediaPackage endpoints are accessible
4. **Empty dropdowns**: Check Lambda function has MediaPackage permissions

### Debugging Steps

1. Check browser developer console for errors
2. Verify API Gateway endpoint is accessible
3. Check Lambda function logs in CloudWatch
4. Confirm MediaPackage channels exist and have HLS endpoints

## Browser Support

- Chrome 34+
- Firefox 42+
- Safari 8+
- Edge 12+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test with your AWS MediaPackage setup
4. Submit a pull request

## License

[Add your license information here]

## Support

For AWS-related issues, check:
- Lambda function logs in CloudWatch
- API Gateway execution logs
- MediaPackage channel status

For application issues, check the browser developer console for detailed error information.
