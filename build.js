var fs = require('fs'),
    env = require('var'),
    _ = require('lodash'),
    async = require('async'),
    less = require('less'),
    cssmin = require('cssmin').cssmin,
    uglify = require('uglify-js'),
    jade = require('jade'),
    program = require('commander'),
    wrench = require('wrench'),
    config;

build();

function build() {
  config = JSON.parse(fs.readFileSync('build.json'), 'utf8');
  if (!config.env) config.env = {};
  _.defaults(config.env, env, { version: require('./package.json').version });

  program.version(config.env.version);
  program.option('-e --NODE_ENV <env> set environment');
  var options = [
    { short: 'a', long: 'all', description: 'execute all tasks' },
    { short: 'c', long: 'css', description: 'build CSS' },
    { short: 's', long: 'js', description: 'build JavaScript' },
    { short: 'j', long: 'jade', description: 'build Jade' },
    { short: 'cd', long: 'copydir', description: 'copy directories' },
    { short: 'cf', long: 'copyfile', description: 'copy files' },
  ];
  _.each(options, function (option) {
    program.option('-' + option.short + ' --' + option.long, option.description);
  });

  program.parse(process.argv);
  _.extend(config.env, _.pick(program, 'NODE_ENV'));
  _.extend(config, _.pick(program, _.pluck(options, 'long')));

  runTasks();
}

function runTasks() {
  console.log('STARTED BUILDING PROJECT');
  console.log('ENVIRONMENT:', config.env.NODE_ENV);
  async.series(_.map(config.tasks, function (task) {
    return function (next) {
      if (!(config[task.type] || config.all)) return next(); // Skip this task

      switch (task.type) {
        case 'css':
          return runCssTask(task, next);
        case 'js':
          return runJsTask(task, next);
        case 'jade':
          return runJadeTask(task, next);
        case 'rmdir':
          return runRemoveDirTask(task, next);
        case 'mkdir':
          return runMakeDirTask(task, next);
        case 'copydir':
          return runCopyDirTask(task, next);
        case 'copyfile':
          return runCopyFileTask(task, next);
      }

      return next('UNKNOWN TASK TYPE: ' + task.type);
    };
  }), function (error) {
    if (error) throw error;
    console.log('FINISHED BUILDING PROJECT');
  });
}

// Tasks
function runCssTask(task, next) {
  var min = (task.minify === 'true' || task.minify === 'both');
  var full = (task.minify === 'false' || task.minify === 'both');

  async.series(_.map(task.files, function (file) {
    return function (next) {
      console.log(file);
      var filename = fs.realpathSync(file).replace(/[\\\/]+/g, '/');
      var path = file.replace(/(\/[^\/]+)$/g, '/');

      var src = fs.readFileSync(filename, 'utf8');
      var parser = new less.Parser({ paths: [path], filename: filename, compress: true });
      parser.parse(src, function (error, tree) {
        return next(error, error ? null : { file: file, css: tree.toCSS() });
      });
    };
  }), function (error, results) {
    if (error) return next(error);

    var m = [];
    var f = [];

    if (results && results.length) {
      _.each(results, function (item) {
        if (min) {
          m.push('/*' + item.file + '*/\r\n');
          m.push(cssmin(item.css));
          m.push('\r\n\r\n');
        }
        if (full) {
          f.push('/*' + item.file + '*/\r\n');
          f.push(item.css);
          f.push('\r\n\r\n');
        }
      });
    }

    if (min) {
      m = replace(task.replace, m.join(''));
    }
    if (full) {
      f = replace(task.replace, f.join(''));
    }

    // Write files
    if (min) {
      fs.writeFileSync(task.output + '.css', m, 'utf8');
      console.log('-> ' + task.output + '.css');
    }
    if (full) {
      fs.writeFileSync(task.output + '.css', f, 'utf8');
      console.log('-> ' + task.output + '.css');
    }

    console.log('\tFILES PROCESSED: ' + results.length + '\n');

    return next();
  });
}

function runJsTask(task, next) {
  var min = (task.minify == 'true' || task.minify == 'both');
  var full = (task.minify == 'false' || task.minify == 'both');

  async.series(_.map(task.files, function (file) {
    return function (next) {
      console.log(file);
      var ret = { file: file };

      if (min) {
        ret.min = uglify.minify(file).code; // Get compressed output
      }
      if (full) {
        ret.full = fs.readFileSync(file, 'utf8'); // Read file
      }

      return next(null, ret);
    };
  }), function (error, results) {
    if (error) throw error;

    var m = [];
    var f = [];

    if (results && results.length) {
      _.each(results, function (item) {
        if (min) {
          m.push(';/*' + item.file + '*/\r\n');
          m.push(item.min);
          m.push('\r\n\r\n');
        }
        if (full) {
          f.push(';/*' + item.file + '*/\r\n');
          f.push(item.full);
          f.push('\r\n\r\n');
        }
      });
    }

    if (min) {
      m = replace(task.replace, m.join(''));
    }
    if (full) {
      f = replace(task.replace, f.join(''));
    }

    // Write files
    if (min) {
      fs.writeFileSync(task.output + '.js', m, 'utf8');
      console.log('-> ' + task.output + '.js');
    }
    if (full) {
      fs.writeFileSync(task.output + '.js', f, 'utf8');
      console.log('-> ' + task.output + '.js');
    }

    console.log('\tFILES PROCESSED: ' + results.length + '\n');

    return next();
  });
}

function runJadeTask(task, next) {
  var pretty = (task.pretty === 'true');

  if (task.directory) {
    wrench.copyDirSyncRecursive(task.directory, task.output);
    var files = wrench.readdirSyncRecursive(task.output);
    _.each(files, function (file) {
      file = task.output + '/' + file;
      if (fs.statSync(file).isFile()) { // Not a directory
        compile(file, file.replace(/\.jade$/g, '.html'));
        fs.unlinkSync(file);
      }
    });
  }
  else if (task.file) {
    compile(task.file, task.output + '.html');
  }

  function compile(file, output) {
    console.log(file);
    var template = fs.readFileSync(file, 'utf8');
    var compiled = jade.compile(template, { filename: file, pretty: pretty })(config.env);
    compiled = replace(task.replace, compiled);

    fs.writeFileSync(output, compiled, 'utf8');
    console.log('-> ' + output + '.html');
  }

  return next();
}

function runRemoveDirTask(task, next) {
  wrench.rmdirSyncRecursive(task.target, true);
  return next();
}

function runMakeDirTask(task, next) {
  wrench.mkdirSyncRecursive(task.target);
  return next();
}

function runCopyDirTask(task, next) {
  wrench.copyDirSyncRecursive(task.source, task.target);
  return next();
}

function runCopyFileTask(task, next) {
  fs.createReadStream(task.source).pipe(fs.createWriteStream(task.target));
  return next();
}

// Utils
function escapeRegex(expression) {
  return (expression + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
}

function replace(settings, text) {
  _.each(settings, function (replace) {
    if (_.isObject(replace.with)) { // Conditional replacement
      replace.with = replace.with[config.env.NODE_ENV];
    }
    if (replace.type === 'function') { // Replace with an expression
      replace.with = eval(replace.with);
    }
    console.log('REPLACING "' + replace.string + '" -> "' + replace.with + '"');
    text = text.replace(new RegExp(escapeRegex(replace.string), 'g'), replace.with);
  });
  return text;
}
