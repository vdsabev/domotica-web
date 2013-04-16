(function (ng) {
  var app = ng.module('Domotica', []);

  app.value('settings', {
    domain: '//localhost:3000'
  });

  // Server Routes
  app.factory('route', function route(settings) {
    return function (path) {
      return function (params) {
        return settings.domain + path + (params ? '/' + params : '');
      };
    };
  });

  app.factory('server', function (route) {
    return {
      login: route('/login'),
      logout: route('/logout'),
      register: route('/register')
    };
  });

  app.factory('session', function ($http, server) {
    return {
      data: {},
      save: function () {
        $.jStorage.set('session', session.data, { TTL: 30 * 24 * 60 * 60 * 1000 }); // 30 days
      },
      load: function () {
        session.data = $.jStorage.get('session', {});
        session.loaded = true;
        return session.data;
      },

      login: function (credentials) {
        return $http.post(server.login(), credentials);
      },
      logout: function () {
        return $http.post(server.logout());
      }
    };
  });

  // Client Routes
  app.config(function ($routeProvider) {
    $routeProvider
      .when('/', { controller: 'HomeController', template: document.getElementById('home-template').innerHTML })
      .when('/users', { controller: 'UsersController', template: document.getElementById('users-template').innerHTML })
      .when('/systems', { controller: 'SystemsController', template: document.getElementById('systems-template').innerHTML })
      .otherwise({ redirectTo: '/' });
  });

  app.config(function ($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
  });

  app.controller({
    NavigationController: function ($scope, $location) {
      $scope.items = [
        { href: '/', text: 'Home' },
        { href: '/users', text: 'Users' },
        { href: '/systems', text: 'Systems' }
      ];
    },

    HomeController: function ($scope) {
    },

    LoginController: function ($scope, session) {
      $scope.login = function () {
        session.login($scope.credentials);
      };
    },
    RegisterController: function ($scope, $http, server) {
      $scope.register = function () {
        $http.post(server.register($scope.registration));
      };
    },

    UsersController: function ($scope) {
    },
    SystemsController: function ($scope) {
    }
  });

  app.directive('whenActive', function ($location) {
    return {
      scope: true,
      link: function (scope, element, attrs) {
        scope.$on('$routeChangeSuccess', function () {
          element.toggleClass('active', $location.path() === element.attr('href'));
        });
      }
    };
  });
}(angular));
