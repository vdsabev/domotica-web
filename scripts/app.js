(function (ng) {
  var app = ng.module('app', ['ui.directives']);

  // Settings
  app.constant('settings', {
    domain: '//localhost:3000'
  });

  // Templates
  app.constant('view', function (path) {
    return '/views/' + path + '.html';
  });

  // Server
  app.factory('server', function ($rootScope, $q, settings) {
    var server = io.connect(settings.domain);

    // Handle server errors
    server.on('error', function (error) {
      alert(error);
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
              deferred.resolve(result);
            }
          });
        });
        return deferred.promise;
      }
    };
  });

  // Session
  app.run(function ($rootScope, server) {
    $rootScope.session = {
      data: {},

      // Persistence
      save: function (data) {
        if (data !== undefined) $rootScope.session.data = data;
        $.jStorage.set('session', $rootScope.session.data, { TTL: 30 * 24 * 60 * 60 * 1000 }); // 30 days
      },
      load: function () {
        $rootScope.session.data = $.jStorage.get('session', {});
        $rootScope.session.loaded = true;
        return $rootScope.session.data;
      },

      // Server Operations
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
      }
    };
    $rootScope.session.load();
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
}(angular));
