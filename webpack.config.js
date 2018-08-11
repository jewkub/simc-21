const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
module.exports = {
  entry: {
    home: './src/home.js',
    register: './src/register.js',
    normal: './src/normal.js',
    timelimit: './src/timelimit.js',
    profile: './src/profile.js',
  },
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, 'dist'),
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
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader'
      ]
    }, {
      test: /\.(png|jpg|gif|svg|ttf|woff|eot|woff2)$/,
      use: ['url-loader']
    }]
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name]-bundle.css"
    })
  ],
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        // test: /\.min\.js$/i,
        parallel: true,
        uglifyOptions: {
          compress: true,
        }
      }),
      new OptimizeCSSAssetsPlugin({})
    ],
  },
  mode: 'production'
}