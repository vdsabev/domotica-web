(function () {
  window.app = angular.module('app', ['ui.directives']);

  // Define and load session
  app.run(function ($rootScope) {
    $rootScope.session = {
      data: {},

      // Persistence
      save: function (session) {
        if (session !== undefined) { // Set
          _.extend($rootScope.session, session);
        }
        $.jStorage.set('session', _.pick($rootScope.session, 'data', 'key'), { TTL: 30 * 24 * 60 * 60 * 1000 }); // 30 days
      },
      load: function () {
        _.extend($rootScope.session, $.jStorage.get('session', {}));
      }
    };
    $rootScope.session.load();
  });

  // Settings
  app.constant('settings', {
    domain: '//localhost:3000'
  });

  // Server
  app.factory('server', function ($rootScope, $q, settings) {
    var query = '';
    if ($rootScope.session.key) {
      query = '?key=' + $rootScope.session.key;
    }
    var server = io.connect(settings.domain + query);
    server.on('connect', function () {
      $rootScope.session.timestamp = new Date().getTime();
      $rootScope.session.refresh();
    });
    server.on('error', function (error) {
      debugger;
      alert(error); // TODO: Use a friendlier interface
    });

    return {
      on: function (eventName, callback) {
        server.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(server, args);
          });
        });
      },
      emit: function (eventName, data) {
        var deferred = $q.defer();
        server.emit(eventName, data, function (error, result) {
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
  });

  // Add create, destroy and refresh methods to session
  app.run(function ($rootScope, server) {
    _.extend($rootScope.session, {
      maxLength: 60 * 60 * 1000, // 1 hour
      create: function (credentials) {
        server.emit('create:session', credentials).then(function (result) {
          $rootScope.session.save(result);
          $rootScope.session.loggedIn = true;
        });
      },
      destroy: function () {
        server.emit('destroy:session').then(function (result) {
          $rootScope.session.save({});
          $rootScope.session.loggedIn = false;
        });
      },
      refresh: function () {
        // Logout if session hasn't been touched in a while
        if (new Date().getTime() - $rootScope.session.timestamp > $rootScope.session.maxLength) {
          return $rootScope.session.destroy();
        }

        server.emit('refresh:session').then(function (key) {
          $rootScope.session.key = key;
          $rootScope.session.save();
          _.delay($rootScope.session.refresh, $rootScope.session.maxLength / 2);
        });
      }
    });
  });

  // Templates
  app.constant('view', function (path) {
    return '/views/' + path + '.html';
  });

  // Routing
  app.config(function ($locationProvider, $routeProvider, view) {
    $locationProvider.html5Mode(true).hashPrefix('!');
    $routeProvider
      .when('/', { controller: 'HomeController', templateUrl: view('content/home') })
      .when('/users', { controller: 'UsersController', templateUrl: view('content/users') })
      .when('/systems', { controller: 'SystemsController', templateUrl: view('content/systems') })
      .otherwise({ redirectTo: '/' });
  });
}());
