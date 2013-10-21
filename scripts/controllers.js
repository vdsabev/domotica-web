(function (ng) {
  app.controller({
    // Common
    navigation: ['$scope', '$settings', function ($scope, $settings) {
      $scope.languages = $settings.languages;
      $scope.toggle = function (item) {
        $scope.active = (item === $scope.active ? null : item);
      };
    }],
    dashboard: ['$scope', '$session', function ($scope, $session) {
    }],
    'session.create': ['$scope', '$session', function ($scope, $session) {
      $scope.credentials = { remember: true };

      $scope.login = function () {
        $session.create($scope.credentials).then(function () {
          $scope.credentials = _.pick($scope.credentials, 'remember'); // Clear login form
        });
      };
    }],
    'registration.create': ['$scope', '$server', function ($scope, $server) {
      $scope.register = function () {
        $server.emit('create:user', $scope.registration);
      };
    }],

    // Converter
    'converter.create': ['$scope', '$server', function ($scope, $server) {
      $scope.create = function () {
        $server.emit('create:converter', $scope.editor).then(function (converter) {
          $location.path('/converters/' + converter._id);
        });
      };
    }],
    'converter.list': ['$scope', '$server', function ($scope, $server) {
      $server.emit('get:converters', { select: ['_id', 'name'] }).then(function (converters) {
        $scope.converters = converters;
      });
    }],
    'converter.view': ['$scope', '$routeParams', '$server', function ($scope, $routeParams, $server) {
      $server.emit('get:converter', { _id: $routeParams.id, select: ['_id', 'name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue'] }).then(function (converter) {
        $scope.converter = converter;
      });

      $scope.edit = function () {
        $scope.editor = _.omit($scope.converter, 'editable');
      };

      $scope.update = function () {
        var converter = _.pick($scope.editor, function (value, key) {
          return key === '_id' || !_.isEqual($scope.converter[key], value);
        });
        $server.emit('update:converter', converter).then(function () {
          _.extend($scope.converter, converter);
          $scope.editor = null;
        });
      };

      $scope.cancel = function () {
        $scope.editor = null;
      };
    }],

    // Device
    'device.create': ['$scope', '$server', '$location', function ($scope, $server, $location) {
      $scope.editor = {
        pins: []
      };

      $server.emit('get:converters', { select: ['_id', 'name'] }).then(function (converters) {
        $scope.converters = converters;
      });

      $server.emit('get:systems', { select: ['_id', 'name'] }).then(function (systems) {
        $scope.systems = systems;
      });

      $scope.create = function () {
        $server.emit('create:device', $scope.editor).then(function (device) {
          $location.path('/devices/' + device._id);
        });
      };
    }],
    'device.list': ['$scope', '$server', function ($scope, $server) {
      $server.emit('get:devices', { select: ['_id', 'name'] }).then(function (devices) {
        $scope.devices = devices;
      });
    }],
    'device.view': ['$scope', '$routeParams', '$server', function ($scope, $routeParams, $server) {
      $server.emit('get:device', { _id: $routeParams.id, select: ['_id', 'name', 'description', 'converter', 'system', 'pins', 'connection', 'interval', 'values'] }).then(function (device) {
        $scope.$watch('device.converter', function (id) {
          if (_.isObject(id)) return;

          $server.emit('get:converter', { _id: id, select: ['_id', 'name', 'unit', 'symbol', 'formula', 'minValue', 'maxValue'] }).then(function (converter) {
            device.converter = converter;

            $scope.values = {
              data: _.map(device.values, function (value) { return [new Date(value[0]), value[1]] }),
              options: {
                xaxis: {
                  span: 60e3
                },
                yaxis: {
                  min: device.converter.minValue,
                  max: device.converter.maxValue
                }
              }
            };

            // setInterval(function () {
            //   $scope.$apply(function () {
            //     var data = $scope.values.data;
            //     data.push([new Date(), Math.round(10 * Math.random())]);
            //     while (_.first(data)[0].getTime() < _.last(data)[0] - $scope.values.options.xaxis.span) {
            //       data.shift();
            //     }
            //   });
            // }, device.interval);
          });
        });

        $scope.$watch('device.system', function (id) {
          if (_.isObject(id)) return;

          $server.emit('get:system', { _id: id, select: ['_id', 'name'] }).then(function (system) {
            device.system = system;
          });
        });

        $scope.device = device;
      });

      $scope.edit = function () {
        if (!$scope.converters) {
          $server.emit('get:converters', { select: ['_id', 'name'] }).then(function (converters) {
            $scope.converters = converters;
          });
        }

        if (!$scope.systems) {
          $server.emit('get:systems', { select: ['_id', 'name'] }).then(function (systems) {
            $scope.systems = systems;
          });
        }

        $scope.editor = _.defaults(_.cloneDeep(_.omit($scope.device), 'converter', 'system', 'values', 'editable'), {
          converter: $scope.device.converter._id,
          system: $scope.device.system._id
        });
      };

      $scope.update = function () {
        var device = _.pick($scope.editor, function (value, key) {
          if (key === '_id') return true;

          var originalValue = $scope.device[key];
          if (key === 'converter' || key === 'system') {
            originalValue = originalValue._id;
          }
          return !_.isEqual(originalValue, value);
        });
        $server.emit('update:device', device).then(function () {
          _.extend($scope.device, device);
          $scope.editor = null;
        });
      };

      $scope.cancel = function () {
        $scope.editor = null;
      };
    }],

    // System
    'system.create': ['$scope', '$server', function ($scope, $server) {
      $scope.create = function () {
        $server.emit('create:system', $scope.system).then(function (system) {
          $location.path('/systems/' + system._id);
        });
      };
    }],
    'system.list': ['$scope', '$server', function ($scope, $server) {
      $server.emit('get:systems', { select: ['_id', 'name'] }).then(function (systems) {
        $scope.systems = systems;
      });
    }],
    'system.view': ['$scope', '$routeParams', '$server', function ($scope, $routeParams, $server) {
      $server.emit('get:system', { _id: $routeParams.id, select: ['_id', 'name', 'description'] }).then(function (system) {
        $scope.system = system;
      });

      $scope.edit = function () {
        $scope.editor = _.omit($scope.system, 'editable');
      };

      $scope.update = function () {
        var system = _.pick($scope.editor, function (value, key) {
          return key === '_id' || !_.isEqual($scope.system[key], value);
        });
        $server.emit('update:system', system).then(function () {
          _.extend($scope.system, system);
          $scope.editor = null;
        });
      };

      $scope.cancel = function () {
        $scope.editor = null;
      };
    }],

    // User
    'user.list': ['$scope', '$server', function ($scope, $server) {
      $server.emit('get:users', { select: ['_id', 'name', 'description'] }).then(function (users) {
        $scope.users = users;
      });
    }],
    'user.view': ['$scope', '$routeParams', '$server', function ($scope, $routeParams, $server) {
      $server.emit('get:user', { _id: $routeParams.id, select: ['_id', 'name', 'description'] }).then(function (user) {
        $scope.user = user;
      });

      $scope.edit = function () {
        $scope.editor = _.omit($scope.user, 'editable');
      };

      $scope.update = function () {
        var user = _.pick($scope.editor, function (value, key) {
          return key === '_id' || !_.isEqual($scope.user[key], value);
        });
        $server.emit('update:user', user).then(function () {
          _.extend($scope.user, user);
          $scope.editor = null;
        });
      };

      $scope.cancel = function () {
        $scope.editor = null;
      };
    }]
  });
}(angular));
