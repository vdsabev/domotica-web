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
        $server.emit('create:user', { data: $scope.registration });
      };
    }],

    // Controller
    'controller.create': ['$scope', '$server', function ($scope, $server) {
      $scope.create = function () {
        $server.emit('create:controller', { data: $scope.controller }).then(function (controller) {
          $location.path('/controllers/' + controller._id);
        });
      };
    }],
    'controller.list': ['$scope', '$server', function ($scope, $server) {
      $server.emit('get:controllers', { select: ['_id', 'name'] }).then(function (controllers) {
        $scope.controllers = controllers;
      });
    }],
    'controller.view': ['$scope', '$routeParams', '$server', function ($scope, $routeParams, $server) {
      $server.emit('get:controller', {
        data: { _id: $routeParams.id },
        select: ['_id', 'name', 'description'],
        join: true
      }).then(function (controller) {
        $scope.controller = controller;
      });

      $server.on('controller:updated', function (controller) {
        _.extend($scope.controller, controller);
      });

      $scope.edit = function () {
        $scope.editor = _.omit($scope.controller, 'editable');
      };

      $scope.update = function () {
        var controller = _.pick($scope.editor, function (value, key) {
          return key === '_id' || !_.isEqual($scope.controller[key], value);
        });
        $server.emit('update:controller', { data: controller }).then(function () {
          _.extend($scope.controller, controller);
          $scope.editor = null;
        });
      };

      $scope.cancel = function () {
        $scope.editor = null;
      };
    }],

    // Converter
    'converter.create': ['$scope', '$server', function ($scope, $server) {
      $scope.create = function () {
        $server.emit('create:converter', { data: $scope.editor }).then(function (converter) {
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
      $server.emit('get:converter', {
        data: { _id: $routeParams.id },
        select: ['_id', 'name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue'],
        join: true
      }).then(function (converter) {
        $scope.converter = converter;
      });

      $server.on('converter:updated', function (converter) {
        _.extend($scope.converter, converter);
      });

      $scope.edit = function () {
        $scope.editor = _.omit($scope.converter, 'editable');
      };

      $scope.update = function () {
        var converter = _.pick($scope.editor, function (value, key) {
          return key === '_id' || !_.isEqual($scope.converter[key], value);
        });
        $server.emit('update:converter', { data: converter }).then(function () {
          _.extend($scope.converter, converter);
          $scope.editor = null;
        });
      };

      $scope.cancel = function () {
        $scope.editor = null;
      };
    }],

    // Device
    'device.create': ['$scope', '$server', '$location', '$i18n', function ($scope, $server, $location, $i18n) {
      $scope.deviceTypes = $i18n('deviceTypes');

      $scope.editor = {
        pins: []
      };

      $server.emit('get:converters', { select: ['_id', 'name'] }).then(function (converters) {
        $scope.converters = converters;
      });

      $server.emit('get:controllers', { select: ['_id', 'name'] }).then(function (controllers) {
        $scope.controllers = controllers;
      });

      $scope.create = function () {
        $server.emit('create:device', { data: $scope.editor }).then(function (device) {
          $location.path('/devices/' + device._id);
        });
      };
    }],
    'device.list': ['$scope', '$server', '$i18n', function ($scope, $server, $i18n) {
      $scope.deviceTypes = $i18n('deviceTypes');

      $server.emit('get:devices', { select: ['_id', 'name'] }).then(function (devices) {
        $scope.devices = devices;
      });
    }],
    'device.view': ['$scope', '$routeParams', '$server', '$i18n', function ($scope, $routeParams, $server, $i18n) {
      $scope.deviceTypes = $i18n('deviceTypes');

      $server.emit('get:device', {
        data: { _id: $routeParams.id },
        select: ['_id', 'name', 'description', 'controller', 'converter', 'type', 'pins', 'connection', 'interval', 'values'],
        join: true
      }).then(function (device) {
        $scope.$watch('device.converter', function (id) {
          if (_.isObject(id)) return;

          $server.emit('get:converter', {
            data: { _id: id },
            select: ['_id', 'name', 'unit', 'symbol', 'formula', 'minValue', 'maxValue']
          }).then(function (converter) {
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

        $scope.$watch('device.controller', function (id) {
          if (_.isObject(id)) return;

          $server.emit('get:controller', {
            data: { _id: id },
            select: ['_id', 'name']
          }).then(function (controller) {
            device.controller = controller;
          });
        });

        $scope.device = device;
      });
      $server.on('device:updated', function (device) {
        if (device.values) {
          if (_.isArray(_.first(device.values))) {
            _.each(device.values, function (value) {
              $scope.device.values.push(value);
              $scope.values.data.push([new Date(value[0]), value[1]]);
            });
          }
          else {
            $scope.device.values.push(device.values);
            $scope.values.data.push([new Date(device.values[0]), device.values[1]]);
          }
        }
        _.extend($scope.device, _.omit(device, 'values'));
      });

      $scope.edit = function () {
        if (!$scope.converters) {
          $server.emit('get:converters', { select: ['_id', 'name'] }).then(function (converters) {
            $scope.converters = converters;
          });
        }

        if (!$scope.controllers) {
          $server.emit('get:controllers', { select: ['_id', 'name'] }).then(function (controllers) {
            $scope.controllers = controllers;
          });
        }

        $scope.editor = _.defaults(_.cloneDeep(_.omit($scope.device, 'controller', 'converter', 'values', 'editable')), {
          converter: $scope.device.converter._id,
          controller: $scope.device.controller._id
        });
      };

      $scope.update = function () {
        var device = _.pick($scope.editor, function (value, key) {
          if (key === '_id') return true;

          var originalValue = $scope.device[key];
          if (key === 'converter' || key === 'controller') {
            originalValue = originalValue._id;
          }
          return !_.isEqual(originalValue, value);
        });
        $server.emit('update:device', { data: device }).then(function () {
          _.extend($scope.device, device);
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
      $server.emit('get:user', {
        data: { _id: $routeParams.id },
        select: ['_id', 'name', 'description'],
        join: true
      }).then(function (user) {
        $scope.user = user;
      });

      $server.on('user:updated', function (user) {
        _.extend($scope.user, user);
      });

      $scope.edit = function () {
        $scope.editor = _.omit($scope.user, 'editable');
      };

      $scope.update = function () {
        var user = _.pick($scope.editor, function (value, key) {
          return key === '_id' || !_.isEqual($scope.user[key], value);
        });
        $server.emit('update:user', { data: user }).then(function () {
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
