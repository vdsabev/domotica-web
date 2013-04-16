(function (ng) {
  var app = ng.module('Domotica', ['ui.directives']);

  // Settings
  app.value('settings', {
    domain: '//localhost:3000'
  });

  // Templates
  app.value('view', function (path) {
    return '/views/' + path + '.html';
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
  app.config(function ($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
  });

  app.config(function ($routeProvider) {
    $routeProvider
      .when('/', { controller: 'HomeController', templateUrl: '/views/content/home.html' })
      .when('/users', { controller: 'UsersController', templateUrl: '/views/content/users.html' })
      .when('/systems', { controller: 'SystemsController', templateUrl: '/views/content/systems.html' })
      .otherwise({ redirectTo: '/' });
  });

  // Controllers
  app.controller({
    NavigationController: function ($scope, $location) {
      $scope.items = {
        home: { icon: 'icon-home', text: 'Home', href: '/' },
        login: { icon: 'icon-key', text: 'Login', templateUrl: '/views/navigation/login.html' },
        register: { icon: 'icon-user', text: 'Register', templateUrl: '/views/navigation/register.html' },
        users: { icon: 'icon-group', text: 'Users', href: '/users' },
        systems: { icon: 'icon-tasks', text: 'Systems', href: '/systems' }
      };

      $scope.toggle = function (key) {
        if (key === 'home' || key === $scope.active) {
          $scope.active = null;
        }
        else {
          $scope.active = key;
        }
      };
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
}(angular));
