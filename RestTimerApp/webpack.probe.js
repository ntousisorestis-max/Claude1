const path = require('path');
const base = require('./webpack.config.js');
module.exports = { ...base, mode: 'development', devtool: false,
  entry: path.resolve(__dirname, 'src/__probe__/probe.web.js'),
  output: { ...base.output, path: path.resolve(__dirname, 'dist-probe') } };
