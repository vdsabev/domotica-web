var _ = require('lodash');
_.defaults(process.env, {
  NODE_ENV: 'development',
  TZ: 'UTC',
  port: 5000
});

var http = require('http'),
    path = require('path'),
    express = require('express'),
    $ = express(), // Express Application
    less = require('less-middleware');

// Configuration
$.configure('development', function () {
  $.locals.pretty = true;
  $.set('views', __dirname + '/views');
  $.set('view engine', 'jade');
  $.use(express.favicon(__dirname + '/images/favicon.ico'));
  $.use(express.logger('dev'));
});
$.configure('production', function () {
  $.set('views', path.join(__dirname, 'build'));
  $.engine('html', require('jade').__express);
  $.set('view engine', 'html');
  $.use(express.favicon(path.join(__dirname, 'build/images/favicon.ico')));
});

$.configure('development', function () { // Update version string to serve the most recent files
  $.use(function (req, res, next) {
    process.env.version = new Date().getTime();
    return next();
  });
});

// Compile Less in development
$.configure('development', function () {
  $.use(less({
    src: path.join(__dirname, 'less'),
    dest: path.join(__dirname, 'stylesheets'),
    prefix: '/stylesheets',
    compress: true
  }));
});

// Static File Server
$.configure('development', function () {
  $.use(express.static(__dirname));
});
$.configure('production', function () {
  $.use(express.static(path.join(__dirname, 'build')));
});

// Render main page
$.use(function (req, res, next) {
  return res.render('main', process.env);
});

// Error handling - still render the main page, the client will handle this
$.use(function (error, req, res, next) {
  return res.render('main', process.env);
});

// Start Server
http.createServer($).listen(process.env.port, function () {
  console.log('Express server listening on port ' + process.env.port);
});
