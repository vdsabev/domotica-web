(function (ng) {
  app.config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
      // Common
      .when('/', { controller: 'dashboard', templateUrl: '/views/common/dashboard.html' })
      // Controllers
      .when('/controllers', { controller: 'controller.list', templateUrl: '/views/controller/list.html' })
      .when('/controllers/:id', { controller: 'controller.view', templateUrl: '/views/controller/view.html' })
      // Converters
      .when('/converters', { controller: 'converter.list', templateUrl: '/views/converter/list.html' })
      .when('/converters/:id', { controller: 'converter.view', templateUrl: '/views/converter/view.html' })
      // Devices
      .when('/devices', { controller: 'device.list', templateUrl: '/views/device/list.html' })
      .when('/devices/:id', { controller: 'device.view', templateUrl: '/views/device/view.html' })
      // Users
      .when('/users', { controller: 'user.list', templateUrl: '/views/user/list.html' })
      .when('/users/:id', { controller: 'user.view', templateUrl: '/views/user/view.html' })
      // Otherwise
      .otherwise({ redirectTo: '/' });
  }]);
}(angular));
