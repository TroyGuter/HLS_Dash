const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Load environment variables from .env file (for local development)
const fileEnv = dotenv.config().parsed || {};

// Merge file-based env with process.env (for Amplify)
const env = {
  ...fileEnv,
  ...process.env
};

// Convert env variables to webpack DefinePlugin format
// Only include variables that start with REACT_APP_
const envKeys = Object.keys(env)
  .filter(key => key.startsWith('REACT_APP_'))
  .reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);
    return prev;
  }, {});

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'
              ]
            }
          },
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new webpack.DefinePlugin(envKeys),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
    hot: true,
    historyApiFallback: true
  }
};
