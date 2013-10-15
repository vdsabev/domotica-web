(function (ng) {
  window.app = ng.module('app', ['ngAnimate', 'ngRoute']);

  // Settings
  app.constant('$settings', {
    delay: 200,
    animationDuration: 400
  });

  // Routing
  app.config(function ($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
      // Common
      .when('/', { controller: 'home', templateUrl: '/views/common/home.html' })
      // Converters
      .when('/converters', { controller: 'converters', templateUrl: '/views/converter/list.html' })
      .when('/converters/:id', { controller: 'converter', templateUrl: '/views/converter/view.html' })
      // Devices
      .when('/devices', { controller: 'devices', templateUrl: '/views/device/list.html' })
      .when('/devices/:id', { controller: 'device', templateUrl: '/views/device/view.html' })
      // Systems
      .when('/systems', { controller: 'systems', templateUrl: '/views/system/list.html' })
      .when('/systems/:id', { controller: 'system', templateUrl: '/views/system/view.html' })
      // Users
      .when('/users', { controller: 'users', templateUrl: '/views/user/list.html' })
      .when('/users/:id', { controller: 'user', templateUrl: '/views/user/view.html' })
      // Otherwise
      .otherwise({ redirectTo: '/' });
  });

  // Server
  app.factory('$server', function ($rootScope, $q, $route, $settings) {
    // Define socket and server proxy
    var socket;
    var server = {
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data) {
        var req = { data: data };

        // Add session key to the request
        var needsSessionKey = eventName !== 'destroy:session';
        if (needsSessionKey && $rootScope.session.loggedIn) {
          req[$rootScope.session.keyField] = $rootScope.session.key();
        }

        var deferred = $q.defer();
        socket.emit(eventName, req, function (error, res) {
          $rootScope.$apply(function () {
            if (error) {
              switch (error) {
                case 'UNAUTHORIZED':
                case 'SESSION_EXPIRED':
                  if ($rootScope.session.loggedIn) {
                    $rootScope.session.destroy();
                  }
                  break;
              }
              deferred.reject(error);
            }
            else {
              // Touch session
              if (needsSessionKey) {
                $rootScope.session.timestamp = new Date().getTime();
                $rootScope.session.key(res[$rootScope.session.keyField]);
              }
              deferred.resolve(res.data);
            }
          });
        });
        return deferred.promise;
      }
    };

    // Define and load session
    $rootScope.session = {
      data: {},

      // Server settings
      keyField: '_key',
      maxLength: 60 * 60e3, // 1 hour
      maxExtendedLength: 30 * 24 * 60 * 60e3, // 30 days

      key: function (value) {
        if (value !== undefined) { // Set
          return this[this.keyField] = value;
        }
        return this[this.keyField]; // Get
      },

      // Local persistence
      save: _.debounce(function () {
        var session = _.pick(this, 'data', 'loggedIn', 'timestamp', this.keyField);
        $.jStorage.set('session', session, { TTL: this.maxLength });
      }, $settings.delay),
      load: function () {
        return _.extend(this, $.jStorage.get('session', {}));
      },

      // Server operations
      create: function (credentials) {
        return server.emit('create:session', credentials).then(function (data) {
          $rootScope.session.loggedIn = true;
          $rootScope.session.data = data;
          $rootScope.session.save();
          $route.reload();
        });
      },
      destroy: function () {
        return server.emit('destroy:session').then(function () {
          $rootScope.session.loggedIn = false;
          $rootScope.session.data = {};
          $rootScope.session.save();
          $route.reload();
        });
      }
    };
    $rootScope.session.load();

    // Establish connection
    var query = '';
    if ($rootScope.session.key()) {
      query = '?' + $rootScope.session.keyField + '=' + $rootScope.session.key();
    }
    socket = io.connect('//localhost:3000' + query, { // TODO: Make more flexible
      'reconnection limit': 60e3,
      'max reconnection attempts': Infinity
    });
    socket.on('connect', function () {
      if ($rootScope.session.loggedIn) {
        $rootScope.session.timestamp = new Date().getTime();
        server.emit('refresh:session').then(function () {
          $rootScope.connected = true;
        });
      }
      else {
        $rootScope.$apply(function () {
          $rootScope.connected = true;
        });
      }
    });
    socket.on('disconnect', function () {
      $rootScope.$apply(function () {
        $rootScope.connected = false;
      });
    });
    socket.on('error', function (error) {
      console.error(error);
      alert(error && error.message || error); // TODO: Use a friendlier interface
    });

    $rootScope.connect = function () {
      socket.socket.connect();
    }

    return server;
  });

  app.factory('$session', function ($rootScope) {
    return $rootScope.session;
  });

  // Start server
  app.run(function ($server) {});
}(angular));
