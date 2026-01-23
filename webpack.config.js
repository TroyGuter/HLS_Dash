const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file (for local development)
const env = dotenv.config().parsed || {};

// Merge with process.env (for Amplify deployment)
const envKeys = Object.keys(process.env)
  .filter(key => key.startsWith('REACT_APP_'))
  .reduce((prev, key) => {
    prev[`process.env.${key}`] = JSON.stringify(process.env[key]);
    return prev;
  }, {});

// Also include .env file variables (for local dev)
Object.keys(env).forEach(key => {
  if (!envKeys[`process.env.${key}`]) {
    envKeys[`process.env.${key}`] = JSON.stringify(env[key]);
  }
});

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.DefinePlugin(envKeys),
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
  mode: process.env.NODE_ENV || 'development',
};
