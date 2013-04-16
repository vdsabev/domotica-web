(function (ng) {
  var app = ng.module('domotica', []);

  app.config(function ($routeProvider) {
    $routeProvider
      .when('/', { controller: 'HomeController', template: 'home-template' })
      .when('/users', { controller: 'UsersController', template: 'users-template' })
      .when('/systems', { controller: 'SystemsController', template: 'systems-template' })
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
    UsersController: function ($scope) {
    },
    SystemsController: function ($scope) {
    }
  });
}(angular));
