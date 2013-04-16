var _ = require('lodash');
_.defaults(process.env, {
  NODE_ENV: 'development',
  PORT: 5000,
  TZ: 'UTC',
  VERSION: new Date().getTime()
});
process.env.staticDirectory = (process.env.NODE_ENV === 'production' ? '/build' : '');

var http = require('http'),
    express = require('express'),
    $ = express(); // Express Application

// Configuration
$.configure('development', function () {
  $.locals.pretty = true;
  $.set('views', __dirname + '/views');
  $.set('view engine', 'jade');
  $.use(express.favicon(__dirname + '/images/favicon.ico'));
  $.use(express.logger('dev'));
});
$.configure('production', function () {
  $.set('views', __dirname + process.env.staticDirectory + '/views');
  $.engine('html', require('jade').__express);
  $.set('view engine', 'html');
  $.use(express.favicon(__dirname + process.env.staticDirectory + '/images/favicon.ico'));
});

$.configure('development', function () { // Setup versioning under development
  $.use(require('./middleware/version')(process.env, 'VERSION')); // Update version string to serve the most recent files
});

// Compile Less in development
$.configure('development', function () {
  $.use(require('less-middleware')({
    src: __dirname + '/less',
    dest: __dirname + '/stylesheets',
    prefix: '/stylesheets',
    compress: true
  }));
});

// Static File Server
$.use(express.static(__dirname + process.env.staticDirectory));

// Render main page
$.use(function (req, res, next) {
  return res.render('main', process.env);
});

// Error handling
$.use(function (error, req, res, next) {
  return res.json(error);
});

// Start Server
http.createServer($).listen(process.env.PORT, function () {
  console.log('Express server listening on port ' + process.env.PORT);
});
