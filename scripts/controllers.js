(function (ng) {
  app.controller({
    // Main
    navigation: function ($scope) {
      $scope.toggle = function (item) {
        $scope.active = (item === $scope.active ? null : item);
      };
    },
    home: function ($scope) {
    },
    'create.session': function ($scope, $session) {
      $scope.credentials = { remember: true };

      $scope.login = function () {
        $session.create($scope.credentials).then(function () {
          $scope.credentials = {}; // Clear login form
        });
      };
    },
    'create.registration': function ($scope, $server) {
      $scope.register = function () {
        $server.emit('create:user', $scope.registration);
      };
    },

    // Converter
    converters: function ($scope, $server) {
      $server.emit('get:converters', { select: ['_id', 'name', 'description', 'unit', 'symbol', 'formula'] }).then(function (data) {
        $scope.converters = data;
      });
    },
    converter: function ($scope, $routeParams, $server) {
      $scope.original = {};

      $scope.revert = function (key) {
        $scope[key] = _.clone($scope.original[key]);
      };

      $server.emit('get:converter', { _id: $routeParams.id, select: ['_id', 'name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue'] }).then(function (data) {
        $scope.converter = data;
        $scope.original.converter = _.clone(data);
      });

      $scope.update = function () {
        $scope.edit = false;
        $server.emit('update:converter', $scope.converter).catch(function (error) {
          $scope.revert('converter');
          $scope.edit = true;
        });
      };

      $scope.cancel = function () {
        $scope.revert('converter');
        $scope.edit = false;
      }
    },
    'create.converter': function ($scope, $server) {
      $scope.create = function () {
        $server.emit('create:converter', $scope.converter);
      };
    },

    // Device
    devices: function ($scope, $server) {
      $server.emit('get:devices', { select: ['_id', 'name'] }).then(function (data) {
        $scope.devices = data;
      });

      $server.emit('get:converters', { select: ['_id', 'name'] }).then(function (data) {
        $scope.converters = data;
      });

      $server.emit('get:systems', { select: ['_id', 'name'] }).then(function (data) {
        $scope.systems = data;
      });
    },
    device: function ($scope, $routeParams, $server) {
      $scope.original = {};

      $scope.revert = function (key) {
        $scope[key] = _.clone($scope.original[key]);
      };

      $server.emit('get:device', { _id: $routeParams.id, select: ['_id', 'name', 'description', 'converter', 'system', 'interval', 'values'] }).then(function (device) {
        $scope.device = device;
        $scope.original.device = _.clone(_.omit(device, 'values'));
        // for (var i = 0; i < 10; i++) {
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
        // }

        // setInterval(function () {
        //   $scope.$apply(function () {
        //     for (var i = 0; i < 10; i++) {
        //       var data = $scope['values' + i].data;
        //       data.push([new Date(), Math.round(10 * Math.random())]);
        //       while (_.first(data)[0].getTime() < _.last(data)[0] - $scope['values' + i].options.xaxis.span) {
        //         data.shift();
        //       }
        //     }
        //   });
        // }, device.interval);
      });

      $scope.update = function () {
        $scope.edit = false;
        $server.emit('update:device', $scope.device).catch(function (error) {
          $scope.revert('device');
          $scope.edit = true;
        });
      };

      $scope.cancel = function () {
        $scope.revert('device');
        $scope.edit = false;
      }
    },
    'create.device': function ($scope, $server) {
      $scope.create = function () {
        $server.emit('create:device', $scope.device);
      };
    },

    // System
    systems: function ($scope, $server) {
      $server.emit('get:systems', { select: ['_id', 'name'] }).then(function (data) {
        $scope.systems = data;
      });
    },
    system: function ($scope, $routeParams, $server) {
      $scope.original = {};

      $scope.revert = function (key) {
        $scope[key] = _.clone($scope.original[key]);
      };

      $server.emit('get:system', { _id: $routeParams.id, select: ['_id', 'name', 'description', 'created'] }).then(function (data) {
        $scope.system = data;
        $scope.original.system = _.clone(data);
      });

      $scope.update = function () {
        $scope.edit = false;
        $server.emit('update:system', $scope.system).catch(function (error) {
          $scope.revert('system');
          $scope.edit = true;
        });
      };

      $scope.cancel = function () {
        $scope.revert('system');
        $scope.edit = false;
      }
    },
    'create.system': function ($scope, $server) {
      $scope.create = function () {
        $server.emit('create:system', $scope.system);
      };
    },

    // User
    users: function ($scope, $server) {
      $server.emit('get:users', { select: ['_id', 'name'] }).then(function (data) {
        $scope.users = data;
      });
    },
    user: function ($scope, $routeParams, $server) {
      $scope.original = {};

      $scope.revert = function (key) {
        $scope[key] = _.clone($scope.original[key]);
      };

      $server.emit('get:user', { _id: $routeParams.id, select: ['_id', 'name', 'description', 'created'] }).then(function (data) {
        $scope.user = data;
        $scope.original.user = _.clone(data);
      });

      $scope.update = function () {
        $scope.edit = false;
        $server.emit('update:user', $scope.user).catch(function (error) {
          $scope.revert('user');
          $scope.edit = true;
        });
      };

      $scope.cancel = function () {
        $scope.revert('user');
        $scope.edit = false;
      }
    }
  });
}(angular));
