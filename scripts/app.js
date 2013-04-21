(function (ng) {
  window.app = ng.module('app', ['ui.directives']);

  // Settings
  app.constant('settings', {
  });

  // Routing
  app.config(function ($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
    $routeProvider
      .when('/', { controller: 'HomeController', templateUrl: 'views/content/home.html' })
      .when('/users', { controller: 'UsersController', templateUrl: 'views/content/users.html' })
      .when('/systems', { controller: 'SystemsController', templateUrl: 'views/content/systems.html' })
      .otherwise({ redirectTo: '/' });
  });

  // Server
  app.factory('server', function ($rootScope, $q) {
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
        var deferred = $q.defer();
        socket.emit(eventName, data, function (error, result) {
          $rootScope.$apply(function () {
            if (error) {
              deferred.reject(error);
            }
            else {
              // Touch session
              if (eventName !== 'refresh:session' &&
                  eventName !== 'destroy:session') {
                $rootScope.session.timestamp = new Date().getTime();
              }
              deferred.resolve(result);
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
      maxLength: 60 * 60 * 1000, // 1 hour
      maxExtendedLength: 30 * 24 * 60 * 60 * 1000, // 30 days

      key: function (value) {
        if (value !== undefined) { // Set
          return this.data[this.keyField] = value;
        }
        return this.data[this.keyField]; // Get
      },

      // Persistence
      save: function () {
        return $.jStorage.set('session', _.pick(this, 'data', 'loggedIn'), { TTL: this.maxExtendedLength });
      },
      load: function () {
        return _.extend(this, $.jStorage.get('session', {}));
      },

      // Server operations
      create: function (credentials) {
        return server.emit('create:session', credentials).then(function (result) {
          $rootScope.session.loggedIn = true;
          $rootScope.session.data = result;
          $rootScope.session.save();
        });
      },
      destroy: function () {
        return server.emit('destroy:session').then(function (result) {
          $rootScope.session.loggedIn = false;
          $rootScope.session.data = {};
          $rootScope.session.save();
        });
      },
      refresh: function () {
        if (!this.key()) return; // Nothing to refresh

        // Logout if session hasn't been touched in a while
        if (new Date().getTime() - this.timestamp > this.maxLength) {
          return this.destroy();
        }

        var session = {};
        session[this.keyField] = this.key();
        return server.emit('refresh:session', session).then(function (key) {
          $rootScope.session.key(key);
          _.delay($rootScope.session.refresh, $rootScope.session.maxLength / 2);
        });
      }
    };
    $rootScope.session.load();

    // Establish connection
    var query = '';
    if ($rootScope.session.key()) {
      query = '?' + $rootScope.session.keyField + '=' + $rootScope.session.key();
    }
    socket = io.connect('//localhost:3000' + query);
    socket.on('connect', function () {
      if ($rootScope.session.loggedIn) {
        $rootScope.session.timestamp = new Date().getTime();
        $rootScope.session.refresh().then(function (key) {
          $rootScope.session.key(key);
        });
      }
    });
    socket.on('error', function (error) {
      alert(error); // TODO: Use a friendlier interface
    });

    return server;
  });

  // Start server
  app.run(function (server) {});
}(angular));
