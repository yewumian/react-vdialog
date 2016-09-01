var path = require('path');

module.exports = {
  context: __dirname + "/src",
  entry: "./react-vdialog",
  output: {
    path: __dirname + "/dist",
    filename: "vdialog.js"
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        presets: ['es2015','react', 'stage-0']
      }
    }]
  }
};