const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
module.exports = {
  entry: {
    home: './src/home.js',
    register: './src/register.js',
    normal: './src/normal.js',
    timelimit: './src/timelimit.js',
  },
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, 'dist/js'),
    publicPath: 'js/',
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['babel-preset-env']
        }
      }
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.(png|jpg|gif|svg|ttf|woff|eot)$/,
      use: ['url-loader']
    }]
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        // test: /\.min\.js$/i,
        parallel: true,
        uglifyOptions: {
          compress: true,
        }
      }),
    ],
  },
  mode: 'none'
}