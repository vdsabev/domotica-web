var fs = require('fs'),
    _ = require('lodash'),
    async = require('async'),
    less = require('less'),
    cssmin = require('cssmin').cssmin,
    uglify = require('uglify-js'),
    jade = require('jade'),
    program = require('commander'),
    wrench = require('wrench'),
    cfg;

build();

function build() {
  cfg = JSON.parse(fs.readFileSync('build.json'), 'utf8');
  if (!cfg.env) cfg.env = {};
  _.defaults(cfg.env, process.env, { VERSION: new Date().getTime() });

  program.version('0.0.1');
  var options = [
    { short: 'a', long: 'all', description: 'execute all tasks' },
    { short: 'c', long: 'css', description: 'build CSS' },
    { short: 's', long: 'js', description: 'build JavaScript' },
    { short: 'j', long: 'jade', description: 'build Jade' },
    { short: 'cd', long: 'copydir', description: 'copy directories' },
    { short: 'cf', long: 'copyfile', description: 'copy files' }
  ];
  options.forEach(function (option) {
    program.option('-' + option.short + ' --' + option.long, option.description);
  });
  program.parse(process.argv);
  _.extend(cfg, _.pick(program, _.pluck(options, 'long')));

  runTasks();
}

function runTasks() {
  console.log('Building project:');

  var tasks = [];
  cfg.tasks.forEach(function (task) {
    tasks.push(function (next) {
      if (!(cfg[task.type] || cfg.all)) {
        return next(null, 0); // Skip this task
      }

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

      console.log('Unknown task type: ' + task.type);
      return next(null, -1);
    });
  });
  async.series(tasks, function () {
    console.log('Finished building project');
  });
}

function runCssTask(task, cb) {
  var min = (task.minify == 'true' || task.minify == 'both');
  var full = (task.minify == 'false' || task.minify == 'both');

  var fx = [];
  task.files.forEach(function (f) {
    console.log(f);

    fx.push(function (cb) {
      var fp = fs.realpathSync(f).replace(/[\\\/]+/g, '/');
      var p = f.replace(/(\/[^\/]+)$/g, '/');

      var src = fs.readFileSync(fp, 'utf8');
      var parser = new (less.Parser)({
        paths: [p],
        filename: fp,
        compress: true
      });
      parser.parse(src, function (error, tree) {
        if (error) return cb(error, null);
        return cb(null, {
          file: f,
          css: tree.toCSS()
        });
      });
    });
  });
  async.series(fx, function (error, results) {
    if (error) throw error;

    var m = [];
    var f = [];

    if (results && results.length) {
      results.forEach(function (item) {
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
      m = m.join('');

      // Replace
      _.each(task.replace, function (newValue, oldValue) {
        m = m.replace(new RegExp(escapeRegex(oldValue), 'g'), newValue);
      });
    }
    if (full) {
      f = f.join('');

      // Replace
      _.each(task.replace, function (newValue, oldValue) {
        f = f.replace(new RegExp(escapeRegex(oldValue), 'g'), newValue);
      });
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

    console.log('\tFiles processed: ' + results.length + '\n');

    cb(null, 1);
  });
}

function runJsTask(task, cb) {
  var min = (task.minify == 'true' || task.minify == 'both');
  var full = (task.minify == 'false' || task.minify == 'both');

  var fx = [];
  task.files.forEach(function (f) {
    fx.push(function (cb) {
      console.log(f);
      var ret = { file: f };

      if (min) {
        ret.min = uglify.minify(f).code; // Get compressed output
      }
      if (full) {
        ret.full = fs.readFileSync(f, 'utf8'); // Read file
      }
      cb(null, ret);
    });
  });

  async.series(fx, function (error, results) {
    if (error) throw error;

    var m = [];
    var f = [];

    if (results && results.length) {
      results.forEach(function (item) {
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
      m = m.join('');

      // Replace
      _.each(task.replace, function (newValue, oldValue) {
        m = m.replace(new RegExp(escapeRegex(oldValue), 'g'), newValue);
      });
    }
    if (full) {
      f = f.join('');

      // Replace
      _.each(task.replace, function (newValue, oldValue) {
        f = f.replace(new RegExp(escapeRegex(oldValue), 'g'), newValue);
      });
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

    console.log('\tFiles processed: ' + results.length + '\n');

    cb(null, 2);
  });
}

function runJadeTask(task, cb) {
  var pretty = (task.pretty == 'true');
  var fx = [];
  task.files.forEach(function (file) {
    fx.push(function (cb) {
      console.log(file);
      var ret = { file: file };
      var template = fs.readFileSync(file, 'utf8');
      ret.full = jade.compile(template, { filename: file, pretty: pretty })(cfg.env);

      // Replace
      _.each(task.replace, function (newValue, oldValue) {
        ret.full = ret.full.replace(new RegExp(escapeRegex(oldValue), 'g'), newValue);
      });

      cb(null, ret);
    });
  });

  async.series(fx, function (error, results) {
    if (error) throw error;

    if (results && results.length) {
      results.forEach(function (item) {
        fs.writeFileSync(task.output + '.html', item.full, 'utf8');
        console.log('-> ' + task.output + '.html');
      });
    }

    console.log('\tFiles processed: ' + results.length + '\n');
    cb(null, 3);
  });
}

function runRemoveDirTask(task, cb) {
  wrench.rmdirSyncRecursive(task.target, true);
  cb(null, 4);
}

function runMakeDirTask(task, cb) {
  wrench.mkdirSyncRecursive(task.target);
  cb(null, 5);
}

function runCopyDirTask(task, cb) {
  wrench.copyDirSyncRecursive(task.source, task.target);
  cb(null, 6);
}

function runCopyFileTask(task, cb) {
  fs.createReadStream(task.source).pipe(fs.createWriteStream(task.target));
  cb(null, 7);
}

function escapeRegex(expression) {
  return (expression + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
}
