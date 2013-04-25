// Include Libraries
// ------------------------------
var env = require('var'),
    http = require('http'),
    express = require('express'),
    $ = express(); // Express Application

// Configure Server
// ------------------------------
$.configure('development', function () {
  $.locals.pretty = true;
  $.set('view engine', 'jade');
});
$.configure('production', function () {
  $.engine('html', require('jade').__express);
  $.set('view engine', 'html');
});
$.set('views', __dirname + env.staticDirectory + '/views');

// Setup HTTP Pipeline
// ------------------------------
if (env.gzip) { // Compress files
  $.use(require('./middleware/gzip')({ minLength: env.minGzipLength }));
}
$.use(express.favicon(__dirname + env.staticDirectory + '/images/favicon.ico'));

$.configure('development', function () {
  $.use(express.logger('dev'));
  env.version = new Date().getTime(); // Update version string to serve the most recent files
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
$.use(express.static(__dirname + env.staticDirectory));

// Render HTML templates in development
$.configure('development', function () {
  $.use(function (req, res, next) {
    var suffix = '.html';
    if (req.url.indexOf(suffix, req.url.length - suffix.length) !== -1) {
      console.log('serving html:', req.url);
      return res.render(req.url.replace('/views/', '').replace(suffix, ''), env);
    }
    next();
  });
});

// Render main page
$.use(function (req, res, next) {
  return res.render('main', env);
});

// Error handling
$.use(function (error, req, res, next) {
  console.error(error);
  return res.json(error);
});

// Start Server
// ------------------------------
http.createServer($).listen(env.port, function () {
  console.log('Server started on port', env.port);
  if (env.logLevel > 1) {
    console.log(env);
  }
});
